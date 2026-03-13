import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMultiMonthColumns() {
  console.log('Adding multi-month columns to deals table...');

  // Add columns one by one to handle existing table
  const columns = [
    { name: 'is_multi_month', sql: 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_multi_month BOOLEAN DEFAULT false' },
    { name: 'total_months', sql: 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS total_months INTEGER' },
    { name: 'monthly_value', sql: 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_value DECIMAL(10,2)' },
    { name: 'parent_deal_id', sql: 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS parent_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL' },
    { name: 'month_number', sql: 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS month_number INTEGER' },
  ];

  for (const col of columns) {
    console.log(`  Adding column: ${col.name}`);
    const { error } = await supabase.rpc('exec_sql', { sql: col.sql });
    if (error) {
      console.log(`  Note: ${col.name} - ${error.message}`);
    } else {
      console.log(`  ✓ ${col.name} added`);
    }
  }

  // Add index for parent_deal_id lookups
  console.log('Adding index for parent_deal_id...');
  await supabase.rpc('exec_sql', {
    sql: 'CREATE INDEX IF NOT EXISTS idx_deals_parent_deal_id ON deals(parent_deal_id)'
  });

  console.log('\nMigration complete!');
}

async function markExistingMultiMonthDeals() {
  console.log('\nMarking existing multi-month deals...');
  
  // Known multi-month deals
  const multiMonthDeals = [
    { brand: "Ollie's Bargain Outlet", total_months: 6, monthly_value: 875.00 },
    { brand: "JLab", total_months: null, monthly_value: null }, // We don't know the exact months
    { brand: "Flexsteel", total_months: null, monthly_value: null },
  ];

  for (const deal of multiMonthDeals) {
    const { data, error } = await supabase
      .from('deals')
      .update({
        is_multi_month: true,
        total_months: deal.total_months,
        monthly_value: deal.monthly_value,
      })
      .ilike('brand', `%${deal.brand}%`)
      .select();

    if (error) {
      console.log(`  Error updating ${deal.brand}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`  ✓ Updated ${deal.brand} (${data.length} record(s))`);
    } else {
      console.log(`  - ${deal.brand} not found`);
    }
  }

  console.log('\nDone marking existing deals!');
}

async function main() {
  await addMultiMonthColumns();
  await markExistingMultiMonthDeals();
}

main().catch(console.error);
