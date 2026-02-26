#!/usr/bin/env node
/**
 * Sync brands/deals/*.md files → Supabase deals table
 * 
 * This syncs the manual updates I make from email monitoring
 * to the Supabase database so they show in the webapp.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vksjktgbakctisuumtzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEALS_DIR = process.env.DEALS_DIR || '/Users/melodi/clawd/brands/deals';

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse YAML frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const yaml = match[1];
  const data = {};
  
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    
    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Handle numbers
    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }
    
    // Handle null
    if (value === 'null' || value === '') {
      value = null;
    }
    
    data[key] = value;
  }
  
  return data;
}

// Map our file fields to database fields
function mapToDeal(frontmatter, slug) {
  return {
    brand: frontmatter.brand,
    slug: frontmatter.slug || slug,
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
    notes: null, // Could extract from content if needed
    archived: frontmatter.stage === 'complete' || frontmatter.stage === 'paused',
  };
}

async function syncDeals() {
  console.log(`Reading deal files from ${DEALS_DIR}...`);
  
  const files = readdirSync(DEALS_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} deal files`);
  
  let updated = 0;
  let created = 0;
  let errors = 0;
  
  for (const file of files) {
    const slug = file.replace('.md', '');
    const content = readFileSync(join(DEALS_DIR, file), 'utf-8');
    const frontmatter = parseFrontmatter(content);
    
    if (!frontmatter || !frontmatter.brand) {
      console.log(`  ⚠️  Skipping ${file}: no valid frontmatter`);
      continue;
    }
    
    const deal = mapToDeal(frontmatter, slug);
    
    // Check if deal exists
    const { data: existing } = await supabase
      .from('deals')
      .select('id')
      .eq('slug', deal.slug)
      .single();
    
    if (existing) {
      // Update existing deal
      const { error } = await supabase
        .from('deals')
        .update(deal)
        .eq('id', existing.id);
      
      if (error) {
        console.log(`  ❌ Error updating ${deal.brand}: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✓ Updated ${deal.brand}`);
        updated++;
      }
    } else {
      // Insert new deal
      const { error } = await supabase
        .from('deals')
        .insert(deal);
      
      if (error) {
        console.log(`  ❌ Error creating ${deal.brand}: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✓ Created ${deal.brand}`);
        created++;
      }
    }
  }
  
  console.log(`\n📊 Summary: ${updated} updated, ${created} created, ${errors} errors`);
}

syncDeals().catch(console.error);
