import { NextResponse } from 'next/server';

const DEFAULT_PROVIDER = 'external';

// POST /api/brandi/run-now — launch the currently configured Brandi runner
export async function POST() {
  const launchUrl = process.env.BRANDI_RUN_TRIGGER_URL;
  const provider = process.env.BRANDI_RUN_TRIGGER_PROVIDER || DEFAULT_PROVIDER;

  if (!launchUrl) {
    return NextResponse.json(
      {
        error: 'BRANDI_RUN_TRIGGER_URL is not configured',
        provider,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    provider,
    mode: 'external_launch',
    launchUrl,
  });
}
