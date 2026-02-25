import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DealFrontmatter {
  brand: string;
  slug: string;
  stage: string;
  priority: string;
  value: string;
  contact_name: string;
  contact_email: string;
  contact_source: string;
  last_contact: string;
  next_action: string;
  next_action_date: string;
  follow_up_count: number;
  waiting_on: string;
  created: string;
}

interface ActivityEntry {
  date: string;
  note: string;
}

function parseDealFile(content: string): { frontmatter: DealFrontmatter; activities: ActivityEntry[]; notes: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    throw new Error('No frontmatter found');
  }

  const frontmatterStr = frontmatterMatch[1];
  const frontmatter: Record<string, string | number> = {};

  frontmatterStr.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      
      // Handle numbers
      if (key === 'follow_up_count') {
        frontmatter[key] = parseInt(value, 10) || 0;
      } else {
        frontmatter[key] = value;
      }
    }
  });

  // Extract activity log
  const activities: ActivityEntry[] = [];
  const activityLogMatch = content.match(/## Activity Log\n([\s\S]*?)(?=\n##|$)/);
  
  if (activityLogMatch) {
    const activitySection = activityLogMatch[1];
    let currentDate = '';
    let currentNotes: string[] = [];

    activitySection.split('\n').forEach((line) => {
      const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        if (currentDate && currentNotes.length > 0) {
          activities.push({
            date: currentDate,
            note: currentNotes.join('\n'),
          });
        }
        currentDate = dateMatch[1];
        currentNotes = [];
      } else if (line.startsWith('- ')) {
        currentNotes.push(line.slice(2));
      }
    });

    if (currentDate && currentNotes.length > 0) {
      activities.push({
        date: currentDate,
        note: currentNotes.join('\n'),
      });
    }
  }

  // Extract summary/notes section
  const summaryMatch = content.match(/## Summary\n([\s\S]*?)(?=\n##|$)/);
  const notes = summaryMatch ? summaryMatch[1].trim() : '';

  return {
    frontmatter: frontmatter as unknown as DealFrontmatter,
    activities,
    notes,
  };
}

async function createTables() {
  console.log('Creating tables...');

  // Create deals table
  const { error: dealsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        stage TEXT NOT NULL DEFAULT 'pitch',
        priority TEXT NOT NULL DEFAULT 'medium',
        value TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_source TEXT,
        last_contact DATE,
        next_action TEXT,
        next_action_date DATE,
        waiting_on TEXT,
        follow_up_count INTEGER DEFAULT 0,
        notes TEXT,
        archived BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
      CREATE INDEX IF NOT EXISTS idx_deals_archived ON deals(archived);
    `
  });

  if (dealsError) {
    console.log('Deals table may already exist or RPC not available, trying direct insert...');
  }

  // Create deal_activities table
  const { error: activitiesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS deal_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
    `
  });

  if (activitiesError) {
    console.log('Activities table may already exist or RPC not available');
  }

  console.log('Tables ready');
}

async function migrateDeals() {
  const dealsDir = path.join(process.env.HOME!, 'clawd/brands/deals');
  const files = fs.readdirSync(dealsDir).filter((f) => f.endsWith('.md'));

  console.log(`Found ${files.length} deal files to migrate`);

  for (const file of files) {
    const content = fs.readFileSync(path.join(dealsDir, file), 'utf-8');
    const { frontmatter, activities, notes } = parseDealFile(content);

    console.log(`Processing: ${frontmatter.brand}`);

    // Check if deal already exists
    const { data: existing } = await supabase
      .from('deals')
      .select('id')
      .eq('slug', frontmatter.slug)
      .single();

    if (existing) {
      console.log(`  - Already exists, skipping`);
      continue;
    }

    // Insert deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        brand: frontmatter.brand,
        slug: frontmatter.slug,
        stage: frontmatter.stage,
        priority: frontmatter.priority || 'medium',
        value: frontmatter.value || null,
        contact_name: frontmatter.contact_name || null,
        contact_email: frontmatter.contact_email || null,
        contact_source: frontmatter.contact_source || null,
        last_contact: frontmatter.last_contact || null,
        next_action: frontmatter.next_action || null,
        next_action_date: frontmatter.next_action_date || null,
        waiting_on: frontmatter.waiting_on || null,
        follow_up_count: frontmatter.follow_up_count || 0,
        notes: notes || null,
        archived: false,
      })
      .select()
      .single();

    if (dealError) {
      console.error(`  - Error inserting deal:`, dealError);
      continue;
    }

    console.log(`  - Created deal with ID: ${deal.id}`);

    // Insert activities
    if (activities.length > 0 && deal) {
      const { error: actError } = await supabase.from('deal_activities').insert(
        activities.map((a) => ({
          deal_id: deal.id,
          date: a.date,
          note: a.note,
        }))
      );

      if (actError) {
        console.error(`  - Error inserting activities:`, actError);
      } else {
        console.log(`  - Added ${activities.length} activity entries`);
      }
    }
  }

  console.log('\nMigration complete!');
}

async function main() {
  await createTables();
  await migrateDeals();
}

main().catch(console.error);
