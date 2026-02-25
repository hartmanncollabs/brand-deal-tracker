// Seed data migration script
// Run with: npx ts-node --esm scripts/seed-data.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vksjktgbakctisuumtzp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc2prdGdiYWtjdGlzdXVtdHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgxNTczMywiZXhwIjoyMDg3MzkxNzMzfQ.2Xe7JdMBPh3HLf9-WPOxD2Zb0AAv4mb-KFyQCpUgNQ0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const deals = [
  {
    brand: 'Aqara',
    slug: 'aqara',
    stage: 'contract',
    priority: 'medium',
    value: '$1,500',
    contact_name: 'Mariah Zingarelli',
    contact_email: 'misslizdidit@socialmediacollabs.com',
    contact_source: 'Picking Daisies Media',
    last_contact: '2026-01-28',
    next_action: 'Follow up on revised contract',
    next_action_date: '2026-02-26',
    follow_up_count: 0,
    waiting_on: 'brand',
    notes: 'Smart home cameras collaboration - Camera Hub G350 + Doorbell G400.\n\nDeliverables: 1 Reel (IG + TikTok crosspost), Organic usage for 5 years.\n\nContract Notes: Payment terms ambiguous, need PayPal fee reimbursement confirmation.',
    archived: false,
  },
  {
    brand: 'Bark',
    slug: 'bark',
    stage: 'content',
    priority: 'medium',
    value: 'Reimbursement + fee',
    contact_name: 'Mariah Zingarelli',
    contact_email: 'info@pickingdaisiesmedia.com',
    contact_source: 'Picking Daisies Media',
    last_contact: '2026-02-25',
    next_action: 'Complete Word on the Block signup (FB was down)',
    next_action_date: '2026-02-26',
    follow_up_count: 0,
    waiting_on: 'us',
    notes: 'Pet products campaign - products purchased for reimbursement.\n\nProducts purchased, receipt sent 2/20. Need to set up Word on the Block account.',
    archived: false,
  },
  {
    brand: 'BHG x Walmart',
    slug: 'bhg-walmart',
    stage: 'outreach',
    priority: 'medium',
    value: 'TBD',
    contact_name: 'Claire (BHG Collective)',
    contact_email: 'bhgcollective@people.inc',
    contact_source: 'Inbound',
    last_contact: '2026-02-23',
    next_action: 'Follow up if no response by EOW',
    next_action_date: '2026-02-28',
    follow_up_count: 0,
    waiting_on: 'brand',
    notes: 'Outdoor living furniture campaign for spring.\n\nProposed content featuring outdoor furniture creating "extended living space" with texture/layers through planters, lights, rugs, pillows, furniture.',
    archived: false,
  },
  {
    brand: 'Cove Smart',
    slug: 'cove-smart',
    stage: 'agreed',
    priority: 'medium',
    value: '$600 + $350 product',
    contact_name: 'Mariah Zingarelli',
    contact_email: 'misslizdidit@socialmediacollabs.com',
    contact_source: 'Picking Daisies Media',
    last_contact: '2026-02-16',
    next_action: 'Await contract from Mariah',
    next_action_date: '2026-02-26',
    follow_up_count: 0,
    waiting_on: 'brand',
    notes: 'Home security system collaboration.\n\nDeliverables: 1 Reel (IG + TikTok crosspost), 3 Stories.\n\nValue: $600 cash, $350 equipment, 3 months free monitoring ($30/mo).',
    archived: false,
  },
  {
    brand: 'ECOVACS',
    slug: 'ecovacs',
    stage: 'approval',
    priority: 'high',
    value: 'TBD',
    contact_name: 'Nadya Yao',
    contact_email: 'nadya.yao@leaderstar.co',
    contact_source: 'Leaderstar Agency',
    last_contact: '2026-02-25',
    next_action: 'Await approval feedback on submitted draft',
    next_action_date: '2026-02-27',
    follow_up_count: 0,
    waiting_on: 'brand',
    notes: 'X9S PRO robot vacuum - content collaboration.\n\nDraft video submitted to Nadya. Product: ECOVACS X9S PRO (upgraded from X9 PRO).',
    archived: false,
  },
  {
    brand: 'HelloFresh',
    slug: 'hellofresh',
    stage: 'negotiation',
    priority: 'medium',
    value: '$3,000',
    contact_name: 'Hana Crnoja',
    contact_email: 'hana@gotaskmetas.com',
    contact_source: 'Taskmetas Agency',
    last_contact: '2026-02-05',
    next_action: 'Follow up on brand decision',
    next_action_date: '2026-02-26',
    follow_up_count: 0,
    waiting_on: 'brand',
    notes: 'Paid partnership for meal kit content.\n\nProposed rate: $3,000. Media kit sent.',
    archived: false,
  },
  {
    brand: 'JLab',
    slug: 'jlab',
    stage: 'content',
    priority: 'high',
    value: '$2,000',
    contact_name: 'Mariah Zingarelli',
    contact_email: 'misslizdidit@socialmediacollabs.com',
    contact_source: 'Picking Daisies Media',
    last_contact: '2026-02-25',
    next_action: 'Create content (Feb-Apr window)',
    next_action_date: '2026-03-01',
    follow_up_count: 0,
    waiting_on: 'us',
    notes: 'Audio products campaign - headphones and earbuds. 4 payments of $2000 across Feb-Apr 2026.\n\nProducts: Lux Headphones (Mauve x2), Epic Lab Edition Earbuds, JBuds Pods, JBuds Mini.\n\nUsage: 30 days per piece, launching with 90 days from post date.',
    archived: false,
  },
  {
    brand: "Ollie's Bargain Outlet",
    slug: 'ollies',
    stage: 'content',
    priority: 'high',
    value: 'Paid UGC',
    contact_name: "Ollie's Team",
    contact_email: 'ollies@brandmail.co',
    contact_source: 'Platform invite',
    last_contact: '2026-02-17',
    next_action: 'Submit draft content',
    next_action_date: '2026-03-02',
    follow_up_count: 0,
    waiting_on: 'us',
    notes: '6-month UGC program - March campaign confirmed.\n\nDraft due: March 2, 2026. Need to submit store visit details and filming permissions.',
    archived: false,
  },
  {
    brand: 'Ruvati',
    slug: 'ruvati',
    stage: 'content',
    priority: 'high',
    value: 'Gift + exposure',
    contact_name: 'Teena',
    contact_email: 'teena@ruvati.com',
    contact_source: 'Direct outreach',
    last_contact: '2026-02-20',
    next_action: 'Create and post content',
    next_action_date: '2026-03-09',
    follow_up_count: 0,
    waiting_on: 'us',
    notes: 'Kitchen accessories for renovation project.\n\nPosting date: March 9, 2026. Products received: RVA2445ACA, RVA1288, RVA1377, RVA1217CR.',
    archived: false,
  },
  {
    brand: 'Whisker (Litter-Robot)',
    slug: 'whisker',
    stage: 'agreed',
    priority: 'high',
    value: 'TBD (gift + paid)',
    contact_name: 'Cheyenne Mabey',
    contact_email: 'cmabey@whisker.com',
    contact_source: 'Direct outreach',
    last_contact: '2026-02-25',
    next_action: 'Review contract when received',
    next_action_date: '2026-02-25',
    follow_up_count: 0,
    waiting_on: 'brand',
    notes: 'Litter-Robot 5 Pro collaboration. Gift + paid partnership.\n\nProduct: Litter-Robot 5 Pro (White). Contract coming today.',
    archived: false,
  },
];

const activities: Record<string, { date: string; note: string }[]> = {
  aqara: [
    { date: '2026-01-28', note: 'Kenny reviewed contract, requested payment term clarification. Mariah said she\'d follow up with brand.' },
    { date: '2026-01-27', note: 'Contract received - $1,500 for 1 Reel + TikTok crosspost.' },
    { date: '2026-01-21', note: 'Initial offer received from Mariah.' },
  ],
  bark: [
    { date: '2026-02-25', note: 'Liz tried to create WOB account but FB was down. Used email: liz@misslizdidit.com. Need to retry IG connection.' },
    { date: '2026-02-23', note: 'Mariah sent WOB signup link for reimbursement.' },
    { date: '2026-02-20', note: 'Liz sent receipt for purchased products.' },
  ],
  'bhg-walmart': [
    { date: '2026-02-23', note: 'Liz sent pitch and rate. Proposed serene backyard oasis concept.' },
    { date: '2026-02-23', note: 'Received invitation from Claire at BHG Collective. Brief attached with 2026 outdoor furniture collection.' },
  ],
  'cove-smart': [
    { date: '2026-02-16', note: 'Liz confirmed interest. Requested professional install option. Brief shared via Canva.' },
    { date: '2026-02-12', note: 'Liz asked about $350 product bundle details. Interested in promo bundle + extra cameras.' },
    { date: '2026-02-12', note: 'Mariah sent final terms: $600 + product + 3mo monitoring.' },
  ],
  ecovacs: [
    { date: '2026-02-25', note: 'Draft video submitted to Nadya. Link: https://drive.google.com/drive/folders/1gCpWDxt7kJOFG2hKFxAZ1UlWDKE4FUkb' },
    { date: '2026-02-25', note: 'Nadya followed up asking for draft this week. Liz confirmed content filmed, editing today.' },
    { date: '2026-02-13', note: 'Liz confirmed receipt of product info.' },
  ],
  hellofresh: [
    { date: '2026-02-05', note: 'Hana confirmed she received media kit. Syncing with brand, will follow up.' },
    { date: '2026-02-04', note: 'Liz sent media kit link.' },
    { date: '2026-02-02', note: 'Liz proposed $3,000 rate.' },
  ],
  jlab: [
    { date: '2026-02-25', note: 'Liz messaged asking about timeline for Feb content.' },
    { date: '2026-02-19', note: 'Products shipped.' },
    { date: '2026-02-18', note: 'Contract finalized with edits (typo fixed, 3-day review window confirmed). Product selections sent. Kenny approved contract.' },
    { date: '2026-02-16', note: 'Initial contract and guidelines received from Mariah.' },
  ],
  ollies: [
    { date: '2026-02-17', note: 'Confirmed for March campaign. Need to submit filming permissions and store visit details.' },
    { date: '2026-02-03', note: 'Received invitation to apply for 6-month paid UGC program.' },
  ],
  ruvati: [
    { date: '2026-02-20', note: 'Confirmed March 9 posting date with Teena.' },
    { date: '2026-02-04', note: 'Products shipped via FedEx. Liz confirmed February posting (now March 9).' },
    { date: '2026-02-04', note: 'Sumit (Business Ops Manager) sent tracking numbers. Delayed due to ice storm.' },
  ],
  whisker: [
    { date: '2026-02-25', note: 'Cheyenne confirmed contract coming TODAY. Kenny followed up to check on timing.' },
    { date: '2026-02-18', note: 'Selected White Litter-Robot 5 Pro. Liz\'s full name provided for contract (Elizabeth Hartmann). Shipping address provided.' },
  ],
};

async function main() {
  console.log('Starting data migration...\n');

  for (const deal of deals) {
    console.log(`Processing: ${deal.brand}`);

    // Check if deal already exists
    const { data: existing } = await supabase
      .from('deals')
      .select('id')
      .eq('slug', deal.slug)
      .single();

    if (existing) {
      console.log(`  - Already exists, skipping\n`);
      continue;
    }

    // Insert deal
    const { data: insertedDeal, error: dealError } = await supabase
      .from('deals')
      .insert(deal)
      .select()
      .single();

    if (dealError) {
      console.error(`  - Error inserting deal:`, dealError.message);
      continue;
    }

    console.log(`  - Created deal with ID: ${insertedDeal.id}`);

    // Insert activities
    const dealActivities = activities[deal.slug] || [];
    if (dealActivities.length > 0) {
      const { error: actError } = await supabase.from('deal_activities').insert(
        dealActivities.map((a) => ({
          deal_id: insertedDeal.id,
          date: a.date,
          note: a.note,
        }))
      );

      if (actError) {
        console.error(`  - Error inserting activities:`, actError.message);
      } else {
        console.log(`  - Added ${dealActivities.length} activity entries`);
      }
    }

    console.log('');
  }

  console.log('Migration complete!');
}

main().catch(console.error);
