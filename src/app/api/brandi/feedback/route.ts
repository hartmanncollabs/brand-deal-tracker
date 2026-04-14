import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/brandi/feedback — Brandi fetches her feedback (API key auth)
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.BRANDI_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('brandi_feedback')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data });
}
