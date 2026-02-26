#!/usr/bin/env node
/**
 * Import completed/paid brands back into pipeline for re-engagement
 * 
 * Logic:
 * - Last contact > 6 months ago → "pitch" (fresh outreach)
 * - Last contact 3-6 months ago → "paused" (circle back soon)
 * - Last contact < 3 months → skip (too recent, probably still fresh)
 */

import { createClient } from '@supabase/supabase-js';

const CLICKUP_API_KEY = 'pk_61383668_Y1NFFRWO7KW0ZHTM3XEAJ957JBJOQ7VD';
const CLICKUP_LIST_ID = '110102862';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vksjktgbakctisuumtzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchCompletedTasks() {
  const url = `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task?archived=false&include_closed=true&subtasks=false`;
  
  const res = await fetch(url, {
    headers: { Authorization: CLICKUP_API_KEY }
  });
  
  if (!res.ok) {
    throw new Error(`ClickUp API error: ${res.status}`);
  }
  
  const data = await res.json();
  
  // Filter to completed and payment received only
  return (data.tasks || []).filter(t => 
    t.status.status === 'completed' || t.status.status === 'payment received'
  );
}

function extractRate(customFields) {
  if (!customFields) return null;
  const rateField = customFields.find(f => f.name === 'Rate');
  if (rateField && rateField.value) {
    return `$${Number(rateField.value).toLocaleString()}`;
  }
  return null;
}

function determineStage(lastUpdatedMs) {
  const now = Date.now();
  const age = now - lastUpdatedMs;
  
  if (age > SIX_MONTHS_MS) {
    return 'pitch'; // Cold - needs fresh outreach
  } else if (age > THREE_MONTHS_MS) {
    return 'paused'; // Warm - circle back
  } else {
    return null; // Too recent - skip
  }
}

function formatAge(ms) {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days > 365) return `${Math.floor(days / 365)} years`;
  if (days > 30) return `${Math.floor(days / 30)} months`;
  return `${days} days`;
}

async function importCompleted(dryRun = false) {
  console.log('Fetching completed/paid tasks from ClickUp...');
  const tasks = await fetchCompletedTasks();
  console.log(`Found ${tasks.length} completed/paid brands\n`);
  
  // Get existing deals from Supabase
  const { data: existingDeals } = await supabase
    .from('deals')
    .select('slug, id, stage');
  
  const existingBySlug = new Map(existingDeals?.map(d => [d.slug, d]) || []);
  
  const toPitch = [];
  const toCircleBack = [];
  const tooRecent = [];
  const now = Date.now();
  
  for (const task of tasks) {
    const lastUpdatedMs = Number(task.date_updated);
    const stage = determineStage(lastUpdatedMs);
    const age = now - lastUpdatedMs;
    const ageStr = formatAge(age);
    const slug = slugify(task.name);
    const rate = extractRate(task.custom_fields);
    
    // Check if already exists with active stage
    const existing = existingBySlug.get(slug);
    if (existing && !['complete', 'paid', 'paused'].includes(existing.stage)) {
      console.log(`  ⏭️  ${task.name} - already active in ${existing.stage}`);
      continue;
    }
    
    if (stage === 'pitch') {
      toPitch.push({ task, slug, rate, ageStr, lastUpdatedMs });
    } else if (stage === 'paused') {
      toCircleBack.push({ task, slug, rate, ageStr, lastUpdatedMs });
    } else {
      tooRecent.push({ task, slug, rate, ageStr });
    }
  }
  
  console.log('\n📊 Analysis:');
  console.log(`  🎯 To Pitch (>6 months): ${toPitch.length}`);
  console.log(`  ⏸️  Circle Back (3-6 months): ${toCircleBack.length}`);
  console.log(`  ⏭️  Too Recent (<3 months): ${tooRecent.length}`);
  
  if (toPitch.length > 0) {
    console.log('\n🎯 PITCH (cold - need fresh outreach):');
    toPitch.forEach(({ task, ageStr, rate }) => {
      console.log(`  - ${task.name} (${ageStr} ago)${rate ? ` - was ${rate}` : ''}`);
    });
  }
  
  if (toCircleBack.length > 0) {
    console.log('\n⏸️  CIRCLE BACK (warm - reconnect):');
    toCircleBack.forEach(({ task, ageStr, rate }) => {
      console.log(`  - ${task.name} (${ageStr} ago)${rate ? ` - was ${rate}` : ''}`);
    });
  }
  
  if (tooRecent.length > 0) {
    console.log('\n⏭️  SKIPPED (too recent):');
    tooRecent.forEach(({ task, ageStr }) => {
      console.log(`  - ${task.name} (${ageStr} ago)`);
    });
  }
  
  if (dryRun) {
    console.log('\n[DRY RUN] No changes made. Run without --dry-run to import.');
    return;
  }
  
  // Insert/update deals
  console.log('\n📝 Importing to Supabase...');
  
  const allToImport = [
    ...toPitch.map(d => ({ ...d, stage: 'pitch' })),
    ...toCircleBack.map(d => ({ ...d, stage: 'paused' })),
  ];
  
  let created = 0;
  let updated = 0;
  
  for (const { task, slug, rate, stage, lastUpdatedMs } of allToImport) {
    const deal = {
      brand: task.name,
      slug: slug + '-reengagement',
      stage,
      priority: 'medium',
      value: rate,
      contact_name: null,
      contact_email: null,
      contact_source: 'Previous Client',
      last_contact: new Date(lastUpdatedMs).toISOString().split('T')[0],
      next_action: stage === 'pitch' ? 'Reach out for new opportunity' : 'Circle back when relevant',
      next_action_date: null,
      waiting_on: 'us',
      follow_up_count: 0,
      notes: `Previously worked together. Original deal value: ${rate || 'unknown'}`,
      archived: false,
    };
    
    const existing = existingBySlug.get(slug);
    
    if (existing) {
      // Update existing deal
      const { error } = await supabase
        .from('deals')
        .update({ stage, waiting_on: 'us', next_action: deal.next_action, archived: false })
        .eq('id', existing.id);
      
      if (!error) {
        updated++;
      }
    } else {
      // Check if reengagement slug exists
      const { data: existingReeng } = await supabase
        .from('deals')
        .select('id')
        .eq('slug', deal.slug)
        .single();
      
      if (existingReeng) {
        // Update it
        const { error } = await supabase
          .from('deals')
          .update({ stage, waiting_on: 'us', next_action: deal.next_action, archived: false })
          .eq('id', existingReeng.id);
        if (!error) updated++;
      } else {
        // Insert new
        const { error } = await supabase.from('deals').insert(deal);
        if (!error) created++;
      }
    }
  }
  
  console.log(`\n✓ Created ${created} new re-engagement deals`);
  console.log(`✓ Updated ${updated} existing deals`);
}

const dryRun = process.argv.includes('--dry-run');
importCompleted(dryRun).catch(console.error);
