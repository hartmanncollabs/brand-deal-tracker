export type DealStage =
  | 'outreach'
  | 'pitched'
  | 'negotiation'
  | 'agreed'
  | 'contract'
  | 'content'
  | 'approval'
  | 'scheduled'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'complete'
  | 'paused';

export type WaitingOn = 'brand' | 'us' | null;

export type Priority = 'low' | 'medium' | 'high';

export type DealType = 'ugc' | 'posted' | 'hybrid';

export interface Deal {
  id: string;
  brand: string;
  slug: string;
  stage: DealStage;
  priority: Priority;
  value: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_source: string | null;
  last_contact: string | null;
  next_action: string | null;
  next_action_date: string | null;
  waiting_on: WaitingOn;
  follow_up_count: number;
  notes: string | null;
  archived: boolean;
  is_repeat_brand: boolean;
  past_history: string | null; // Summary of past campaigns, value, deliverables
  sort_order: number | null; // Position within stage for drag-and-drop reordering
  deal_type: DealType; // ugc = brand posts (skip scheduled/delivered), posted = Liz posts (full pipeline)
  // Multi-month deal fields
  is_multi_month: boolean;
  total_months: number | null;
  monthly_value: number | null;
  parent_deal_id: string | null;
  month_number: number | null;
  // Attachment fields
  brief_url: string | null;
  contract_url: string | null;
  other_attachments: { name: string; url: string }[] | null;
  // Computed fields (populated by queries)
  children?: Deal[];
  parent?: Deal;
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  date: string;
  note: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: Deal;
        Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>>;
      };
      deal_activities: {
        Row: DealActivity;
        Insert: Omit<DealActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<DealActivity, 'id' | 'created_at'>>;
      };
    };
  };
}

export const STAGES: DealStage[] = [
  'outreach',
  'pitched',
  'negotiation',
  'agreed',
  'contract',
  'content',
  'approval',
  'scheduled',
  'delivered',
  'invoiced',
  'paid',
  'complete',
  'paused',
];

export const STAGE_LABELS: Record<DealStage, string> = {
  outreach: 'Outreach',
  pitched: 'Pitched',
  negotiation: 'Negotiation',
  agreed: 'Agreed',
  contract: 'Contract Review',
  content: 'Content',
  approval: 'Approval',
  scheduled: 'Scheduled',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
  complete: 'Complete',
  paused: 'Paused',
};

export const STAGE_COLORS: Record<DealStage, string> = {
  // Pitch/Outreach: Blues
  outreach: 'bg-blue-100 border-blue-400',
  pitched: 'bg-sky-100 border-sky-400',
  // Negotiation flow: Orange → Yellow
  negotiation: 'bg-orange-100 border-orange-400',
  agreed: 'bg-amber-100 border-amber-400',
  contract: 'bg-yellow-100 border-yellow-400',
  // Content → Delivery: Light green → Green
  content: 'bg-lime-100 border-lime-400',
  approval: 'bg-green-100 border-green-400',
  scheduled: 'bg-emerald-100 border-emerald-500',
  delivered: 'bg-teal-100 border-teal-500',
  // Payment: Green-blue → Bright green
  invoiced: 'bg-cyan-100 border-cyan-500',
  paid: 'bg-green-200 border-green-500',
  // Finished/Paused: Grays
  complete: 'bg-gray-100 border-gray-400',
  paused: 'bg-gray-50 border-gray-300',
};
