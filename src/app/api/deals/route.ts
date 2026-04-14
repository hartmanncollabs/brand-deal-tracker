import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Verify API key from request headers
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.BRANDI_API_KEY;
  if (!expectedKey) {
    console.error('BRANDI_API_KEY not configured');
    return false;
  }
  return apiKey === expectedKey;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// POST /api/deals — Create a new deal (used by Brandi agent)
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.brand) {
    return NextResponse.json({ error: 'brand is required' }, { status: 400 });
  }

  // Auto-generate slug
  const baseSlug = slugify(body.brand);
  const { data: existing } = await supabaseAdmin
    .from('deals')
    .select('slug')
    .like('slug', `${baseSlug}%`);
  const slug = existing && existing.length > 0 ? `${baseSlug}-${existing.length + 1}` : baseSlug;

  const deal = {
    brand: body.brand,
    slug,
    stage: body.stage || 'negotiation',
    priority: body.priority || 'medium',
    value: body.value || null,
    contact_name: body.contact_name || null,
    contact_email: body.contact_email || null,
    contact_source: body.contact_source || 'Email (Brandi)',
    last_contact: body.last_contact || new Date().toISOString().split('T')[0],
    next_action: body.next_action || null,
    next_action_date: body.next_action_date || null,
    waiting_on: body.waiting_on || 'us',
    follow_up_count: 0,
    notes: body.notes || null,
    archived: false,
    deal_type: body.deal_type || 'posted',
    is_repeat_brand: body.is_repeat_brand || false,
    past_history: body.past_history || null,
    stage_changed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('deals')
    .insert(deal)
    .select()
    .single();

  if (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity as Brandi
  await supabaseAdmin.from('deal_activities').insert({
    deal_id: data.id,
    date: new Date().toISOString().split('T')[0],
    note: body.activity_note || `New deal created from email by Brandi`,
    actor: 'brandi',
  });

  return NextResponse.json({ deal: data }, { status: 201 });
}

// PATCH /api/deals — Update an existing deal (used by Brandi agent)
export async function PATCH(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id && !body.slug && !body.brand) {
    return NextResponse.json(
      { error: 'Provide id, slug, or brand to identify the deal' },
      { status: 400 }
    );
  }

  // Find the deal
  let query = supabaseAdmin.from('deals').select('*');
  if (body.id) {
    query = query.eq('id', body.id);
  } else if (body.slug) {
    query = query.eq('slug', body.slug);
  } else {
    query = query.ilike('brand', body.brand);
  }

  const { data: deals, error: findError } = await query;

  if (findError || !deals || deals.length === 0) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  const deal = deals[0];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const changes: string[] = [];

  // Track what changed for activity log
  const trackable: [string, string][] = [
    ['stage', 'Stage'],
    ['value', 'Value'],
    ['priority', 'Priority'],
    ['waiting_on', 'Waiting on'],
    ['contact_name', 'Contact'],
    ['contact_email', 'Email'],
    ['next_action', 'Next action'],
    ['next_action_date', 'Action date'],
    ['notes', 'Notes'],
  ];

  for (const [field, label] of trackable) {
    if (body[field] !== undefined && body[field] !== deal[field]) {
      updates[field] = body[field];
      changes.push(`${label}: ${deal[field] || 'none'} → ${body[field] || 'none'}`);
    }
  }

  if (body.stage && body.stage !== deal.stage) {
    updates.stage_changed_at = new Date().toISOString();
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ message: 'No changes detected', deal });
  }

  const { error: updateError } = await supabaseAdmin
    .from('deals')
    .update(updates)
    .eq('id', deal.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log activity as Brandi
  await supabaseAdmin.from('deal_activities').insert({
    deal_id: deal.id,
    date: new Date().toISOString().split('T')[0],
    note: body.activity_note || changes.join(' | '),
    actor: 'brandi',
  });

  return NextResponse.json({ deal: { ...deal, ...updates }, changes });
}
