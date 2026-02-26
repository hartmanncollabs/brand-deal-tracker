#!/usr/bin/env node
/**
 * Sync ClickUp Content Pipeline → Supabase deals table
 * 
 * Maps ClickUp statuses to our deal stages:
 * - "brands to pitch" → pitch
 * - "dm/pitch sent" → outreach
 * - "circle back" → paused
 * - "in negotiations" → negotiation
 * - "agreed in principle" → agreed
 * - "contract review" → contract
 * - "content creation" → content
 * - "client approval" → approval
 * - "scheduled" → scheduled
 * - "content delivered" → delivered
 * - "invoice submitted" → invoiced
 * - "payment received" → paid
 * - "completed" → complete
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

// Map ClickUp status → our stage
const STATUS_MAP = {
  'brands to pitch': 'pitch',
  'dm/pitch sent': 'outreach',
  'circle back': 'paused',
  'in negotiations': 'negotiation',
  'agreed in principle': 'agreed',
  'contract review': 'contract',
  'content creation': 'content',
  'client approval': 'approval',
  'scheduled': 'scheduled',
  'content delivered': 'delivered',
  'invoice submitted': 'invoiced',
  'payment received': 'paid',
  'completed': 'complete',
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchClickUpTasks() {
  // Don't include subtasks - they're usually reminders like "Response Received?"
  const url = `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task?archived=false&include_closed=true&subtasks=false`;
  
  const res = await fetch(url, {
    headers: { Authorization: CLICKUP_API_KEY }
  });
  
  if (!res.ok) {
    throw new Error(`ClickUp API error: ${res.status}`);
  }
  
  const data = await res.json();
  // Filter out tasks that look like reminders/subtasks (contain "?")
  return (data.tasks || []).filter(t => !t.name.includes('?'));
}

function extractRate(customFields) {
  if (!customFields) return null;
  const rateField = customFields.find(f => f.name === 'Rate');
  if (rateField && rateField.value) {
    return `$${Number(rateField.value).toLocaleString()}`;
  }
  return null;
}

function mapTaskToDeal(task) {
  const stage = STATUS_MAP[task.status.status] || 'pitch';
  const slug = slugify(task.name);
  const rate = extractRate(task.custom_fields);
  
  // Determine waiting_on based on stage
  let waiting_on = null;
  if (['outreach', 'negotiation', 'contract', 'approval'].includes(stage)) {
    waiting_on = 'brand';
  } else if (['content', 'delivered', 'invoiced'].includes(stage)) {
    waiting_on = 'us';
  }
  
  return {
    brand: task.name,
    slug,
    stage,
    priority: 'medium',
    value: rate,
    contact_name: null,
    contact_email: null,
    contact_source: 'ClickUp Import',
    last_contact: task.date_updated ? new Date(Number(task.date_updated)).toISOString().split('T')[0] : null,
    next_action: null,
    next_action_date: task.due_date ? new Date(Number(task.due_date)).toISOString().split('T')[0] : null,
    waiting_on,
    follow_up_count: 0,
    notes: task.description ? task.description.substring(0, 500) : null,
    archived: stage === 'complete' || stage === 'paused',
  };
}

async function syncDeals(dryRun = false) {
  console.log('Fetching ClickUp tasks...');
  const tasks = await fetchClickUpTasks();
  console.log(`Found ${tasks.length} tasks in ClickUp`);
  
  // Get existing deals from Supabase
  const { data: existingDeals, error: fetchError } = await supabase
    .from('deals')
    .select('slug, id');
  
  if (fetchError) {
    console.error('Error fetching existing deals:', fetchError);
    return;
  }
  
  const existingSlugs = new Set(existingDeals?.map(d => d.slug) || []);
  console.log(`Found ${existingSlugs.size} existing deals in Supabase`);
  
  const toInsert = [];
  const toUpdate = [];
  const usedSlugs = new Set(existingSlugs);
  
  for (const task of tasks) {
    const deal = mapTaskToDeal(task);
    
    // Skip if slug conflicts with existing (different brand)
    if (existingSlugs.has(deal.slug)) {
      // Check if it's the same brand - if so, update
      const existing = existingDeals.find(d => d.slug === deal.slug);
      if (existing) {
        toUpdate.push({ ...deal, id: existing.id });
      }
    } else if (usedSlugs.has(deal.slug)) {
      // Duplicate slug in this batch - append a number
      let i = 2;
      while (usedSlugs.has(`${deal.slug}-${i}`)) i++;
      deal.slug = `${deal.slug}-${i}`;
      usedSlugs.add(deal.slug);
      toInsert.push(deal);
    } else {
      usedSlugs.add(deal.slug);
      toInsert.push(deal);
    }
  }
  
  console.log(`\nTo insert: ${toInsert.length} new deals`);
  console.log(`To update: ${toUpdate.length} existing deals`);
  
  if (dryRun) {
    console.log('\n[DRY RUN] Would insert:');
    toInsert.slice(0, 10).forEach(d => console.log(`  - ${d.brand} (${d.stage})`));
    if (toInsert.length > 10) console.log(`  ... and ${toInsert.length - 10} more`);
    return;
  }
  
  // Insert new deals
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('deals')
      .insert(toInsert);
    
    if (insertError) {
      console.error('Error inserting deals:', insertError);
    } else {
      console.log(`✓ Inserted ${toInsert.length} new deals`);
    }
  }
  
  // Update existing deals (stage only, preserve our edits)
  for (const deal of toUpdate) {
    const { error: updateError } = await supabase
      .from('deals')
      .update({ stage: deal.stage, archived: deal.archived })
      .eq('id', deal.id);
    
    if (updateError) {
      console.error(`Error updating ${deal.brand}:`, updateError);
    }
  }
  
  if (toUpdate.length > 0) {
    console.log(`✓ Updated ${toUpdate.length} existing deals`);
  }
  
  // Summary by stage
  console.log('\n📊 Deals by Stage:');
  const byStage = {};
  for (const task of tasks) {
    const stage = STATUS_MAP[task.status.status] || 'pitch';
    byStage[stage] = (byStage[stage] || 0) + 1;
  }
  Object.entries(byStage).sort((a, b) => b[1] - a[1]).forEach(([stage, count]) => {
    console.log(`  ${stage}: ${count}`);
  });
}

// Run
const dryRun = process.argv.includes('--dry-run');
syncDeals(dryRun).catch(console.error);
