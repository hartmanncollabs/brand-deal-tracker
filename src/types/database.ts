export type DealStage =
  | 'pitch'
  | 'outreach'
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
  'pitch',
  'outreach',
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
  pitch: 'Pitch',
  outreach: 'Outreach',
  negotiation: 'Negotiation',
  agreed: 'Agreed',
  contract: 'Contract',
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
  pitch: 'bg-slate-100 border-slate-300',
  outreach: 'bg-blue-50 border-blue-300',
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
