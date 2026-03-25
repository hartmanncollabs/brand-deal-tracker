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
  outreach: 'bg-slate-100 border-slate-300',
  pitched: 'bg-blue-50 border-blue-300',
  negotiation: 'bg-amber-50 border-amber-300',
  agreed: 'bg-lime-50 border-lime-300',
  contract: 'bg-yellow-50 border-yellow-300',
  content: 'bg-orange-50 border-orange-300',
  approval: 'bg-purple-50 border-purple-300',
  scheduled: 'bg-cyan-50 border-cyan-300',
  delivered: 'bg-teal-50 border-teal-300',
  invoiced: 'bg-indigo-50 border-indigo-300',
  paid: 'bg-emerald-50 border-emerald-300',
  complete: 'bg-green-50 border-green-300',
  paused: 'bg-gray-100 border-gray-400',
};
