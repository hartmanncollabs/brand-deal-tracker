import { NextRequest, NextResponse } from 'next/server';

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to refresh Gmail token');
  return data.access_token;
}

// GET /api/brandi/gmail?action=search&q=...&maxResults=...
// GET /api/brandi/gmail?action=message&id=...
// GET /api/brandi/gmail?action=thread&id=...
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.BRANDI_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const accessToken = await getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };

    if (action === 'search') {
      const q = searchParams.get('q') || '';
      const maxResults = searchParams.get('maxResults') || '10';
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=${maxResults}`,
        { headers }
      );
      const data = await res.json();

      // Fetch snippet for each message
      const messages = await Promise.all(
        (data.messages || []).map(async (m: { id: string }) => {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers }
          );
          const msg = await msgRes.json();
          const getHeader = (name: string) =>
            msg.payload?.headers?.find((h: { name: string; value: string }) => h.name === name)?.value || '';
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            date: getHeader('Date'),
            snippet: msg.snippet,
          };
        })
      );

      return NextResponse.json({ resultCount: data.resultSizeEstimate || 0, messages });
    }

    if (action === 'message') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers }
      );
      const msg = await res.json();

      const getHeader = (name: string) =>
        msg.payload?.headers?.find((h: { name: string; value: string }) => h.name === name)?.value || '';

      // Extract body text
      let body = '';
      const extractText = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64url').toString('utf-8');
        }
        if (part.parts) {
          return (part.parts as typeof part[]).map(extractText).join('\n');
        }
        return '';
      };
      body = extractText(msg.payload || {});

      return NextResponse.json({
        id: msg.id,
        threadId: msg.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        snippet: msg.snippet,
        body: body.substring(0, 5000), // Cap at 5k chars
      });
    }

    if (action === 'thread') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers }
      );
      const thread = await res.json();

      const messages = (thread.messages || []).map((msg: { id: string; snippet: string; payload?: { headers?: { name: string; value: string }[] } }) => {
        const getHeader = (name: string) =>
          msg.payload?.headers?.find((h) => h.name === name)?.value || '';
        return {
          id: msg.id,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          date: getHeader('Date'),
          snippet: msg.snippet,
        };
      });

      return NextResponse.json({ threadId: thread.id, messages });
    }

    return NextResponse.json({ error: 'Invalid action. Use: search, message, thread' }, { status: 400 });
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json({ error: 'Gmail API error' }, { status: 500 });
  }
}
