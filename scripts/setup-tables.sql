-- Brand Deal Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_archived ON deals(archived);
CREATE INDEX IF NOT EXISTS idx_deals_slug ON deals(slug);

-- Create deal_activities table
CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for activities
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_date ON deal_activities(date);

-- Enable Row Level Security (RLS)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your auth setup)
CREATE POLICY "Allow all operations on deals" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on deal_activities" ON deal_activities FOR ALL USING (true) WITH CHECK (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
