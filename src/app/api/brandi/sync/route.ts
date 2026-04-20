import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

interface PendingDeal {
  action: 'create' | 'update';
  brand: string;
  slug?: string;
  stage?: string;
  value?: string;
  contact_name?: string;
  contact_email?: string;
  contact_source?: string;
  notes?: string;
  activity_note?: string;
  deal_type?: string;
  priority?: string;
  waiting_on?: string;
  next_action?: string;
  next_action_date?: string;
  last_contact?: string;
}

interface PendingUpdate {
  run_summary: {
    summary: string;
    emails_scanned: number;
    deals_created: number;
    deals_updated: number;
    suggestions?: { type: string; brand: string; message: string }[];
  };
  deals: PendingDeal[];
  activities: { deal_brand: string; note: string }[];
}

// GET /api/brandi/sync — Process pending updates from Brandi's file
export async function GET() {
  try {
    const filePath = join(process.cwd(), 'brandi', 'pending-updates.json');
    const raw = readFileSync(filePath, 'utf-8');
    const pending: PendingUpdate[] = JSON.parse(raw);

    if (!pending || pending.length === 0) {
      return NextResponse.json({ message: 'No pending updates' });
    }

    const results = { synced: 0, errors: 0, details: [] as string[] };

    for (const update of pending) {
      // Post run summary
      if (update.run_summary) {
        const { error } = await supabaseAdmin
          .from('brandi_runs')
          .insert({
            summary: update.run_summary.summary,
            emails_scanned: update.run_summary.emails_scanned,
            deals_created: update.run_summary.deals_created,
            deals_updated: update.run_summary.deals_updated,
            suggestions: update.run_summary.suggestions || [],
          });
        if (error) {
          results.errors++;
          results.details.push(`Run summary error: ${error.message}`);
        } else {
          results.synced++;
          results.details.push('Run summary posted');
        }
      }

      // Process deals
      for (const deal of (update.deals || [])) {
        if (deal.action === 'create') {
          const slug = deal.slug || deal.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

          // Check if already exists
          const { data: existing } = await supabaseAdmin
            .from('deals')
            .select('id')
            .ilike('brand', `%${deal.brand}%`)
            .limit(1);

          if (existing && existing.length > 0) {
            results.details.push(`${deal.brand}: already exists, skipped`);
            continue;
          }

          const { data, error } = await supabaseAdmin
            .from('deals')
            .insert({
              brand: deal.brand,
              slug,
              stage: deal.stage || 'negotiation',
              priority: deal.priority || 'medium',
              value: deal.value || null,
              contact_name: deal.contact_name || null,
              contact_email: deal.contact_email || null,
              contact_source: deal.contact_source || 'Email (Brandi)',
              waiting_on: deal.waiting_on || 'us',
              next_action: deal.next_action || null,
              next_action_date: deal.next_action_date || null,
              follow_up_count: 0,
              notes: deal.notes || null,
              archived: false,
              deal_type: deal.deal_type || 'posted',
              stage_changed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            results.errors++;
            results.details.push(`${deal.brand} create error: ${error.message}`);
          } else if (data && deal.activity_note) {
            await supabaseAdmin.from('deal_activities').insert({
              deal_id: data.id,
              date: new Date().toISOString().split('T')[0],
              note: deal.activity_note,
              actor: 'brandi',
            });
            results.synced++;
            results.details.push(`${deal.brand}: created`);
          }
        } else if (deal.action === 'update') {
          const { data: existing } = await supabaseAdmin
            .from('deals')
            .select('id, brand')
            .ilike('brand', `%${deal.brand}%`)
            .limit(1);

          if (!existing || existing.length === 0) {
            results.details.push(`${deal.brand}: not found, skipped update`);
            continue;
          }

          // Fetch full deal to cross-check current state
          const { data: fullDeal } = await supabaseAdmin
            .from('deals')
            .select('notes, stage, waiting_on, next_action, next_action_date, last_contact, value, contact_name, contact_email')
            .eq('id', existing[0].id)
            .single();

          const updates: Record<string, unknown> = {};
          const changes: string[] = [];

          // Only update fields that are actually different from current state
          if (deal.value && deal.value !== fullDeal?.value) { updates.value = deal.value; changes.push('value'); }
          if (deal.contact_name && deal.contact_name !== fullDeal?.contact_name) { updates.contact_name = deal.contact_name; changes.push('contact'); }
          if (deal.contact_email && deal.contact_email !== fullDeal?.contact_email) { updates.contact_email = deal.contact_email; changes.push('email'); }
          if (deal.waiting_on && deal.waiting_on !== fullDeal?.waiting_on) { updates.waiting_on = deal.waiting_on; changes.push('waiting_on'); }
          if (deal.next_action && deal.next_action !== fullDeal?.next_action) { updates.next_action = deal.next_action; changes.push('next_action'); }
          if (deal.next_action_date && deal.next_action_date !== fullDeal?.next_action_date) { updates.next_action_date = deal.next_action_date; changes.push('next_action_date'); }
          if (deal.last_contact && deal.last_contact !== fullDeal?.last_contact) { updates.last_contact = deal.last_contact; changes.push('last_contact'); }
          // Stage change — only FORWARD moves allowed (never backward)
          if (deal.stage && deal.stage !== fullDeal?.stage) {
            const stageOrder = ['outreach', 'pitched', 'negotiation', 'agreed', 'contract', 'content', 'approval', 'scheduled', 'delivered', 'invoiced', 'paid', 'complete'];
            const currentIdx = stageOrder.indexOf(fullDeal?.stage || '');
            const newIdx = stageOrder.indexOf(deal.stage);
            if (newIdx > currentIdx) {
              updates.stage = deal.stage;
              updates.stage_changed_at = new Date().toISOString();
              changes.push(`stage → ${deal.stage}`);
            } else {
              results.details.push(`${deal.brand}: blocked backward move ${fullDeal?.stage} → ${deal.stage}`);
            }
          }
          // Prepend new notes (always add context even if other fields unchanged)
          if (deal.notes) {
            const existing_notes = fullDeal?.notes || '';
            // Check if this note was already prepended (avoid duplicates)
            if (!existing_notes.startsWith(deal.notes.substring(0, 30))) {
              updates.notes = existing_notes
                ? `${deal.notes}\n\n---\n\n${existing_notes}`
                : deal.notes;
              changes.push('notes');
            }
          }

          // Skip if nothing actually changed (user already handled it)
          if (Object.keys(updates).length === 0) {
            results.details.push(`${deal.brand}: already up to date, skipped`);
            continue;
          }

          updates.updated_at = new Date().toISOString();
          await supabaseAdmin
            .from('deals')
            .update(updates)
            .eq('id', existing[0].id);

          if (deal.activity_note) {
            await supabaseAdmin.from('deal_activities').insert({
              deal_id: existing[0].id,
              date: new Date().toISOString().split('T')[0],
              note: deal.activity_note,
              actor: 'brandi',
            });
          }
          results.synced++;
          results.details.push(`${deal.brand}: updated (${changes.join(', ')})`);
        }
      }

      // Process standalone activities
      for (const activity of (update.activities || [])) {
        const { data: deal } = await supabaseAdmin
          .from('deals')
          .select('id')
          .ilike('brand', `%${activity.deal_brand}%`)
          .limit(1);

        if (deal && deal.length > 0) {
          await supabaseAdmin.from('deal_activities').insert({
            deal_id: deal[0].id,
            date: new Date().toISOString().split('T')[0],
            note: activity.note,
            actor: 'brandi',
          });
          results.synced++;
        }
      }
    }

    return NextResponse.json({ message: 'Sync complete', ...results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('ENOENT') || message.includes('no such file')) {
      return NextResponse.json({ message: 'No pending updates file' });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
