import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/brandi/runs — Brandi posts her run summary
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.BRANDI_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('brandi_runs')
    .insert({
      summary: body.summary || 'No summary provided',
      deals_created: body.deals_created || 0,
      deals_updated: body.deals_updated || 0,
      emails_scanned: body.emails_scanned || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ run: data }, { status: 201 });
}
