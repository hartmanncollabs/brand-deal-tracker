import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function authorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  return !!apiKey && apiKey === process.env.BRANDI_API_KEY;
}

// GET /api/brandi/requests — pending per-deal update requests with deal context (for Brandi runs)
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('brandi_requests')
    .select('id, deal_id, requested_at, deals(brand, slug, stage, contact_name, contact_email, waiting_on, next_action, next_action_date, last_contact)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

// PATCH /api/brandi/requests — mark a request done: { id }
export async function PATCH(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('brandi_requests')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
