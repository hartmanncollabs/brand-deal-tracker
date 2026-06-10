#!/usr/bin/env node
// Gmail re-auth helper — generates a fresh GMAIL_REFRESH_TOKEN for Brandi.
// Usage: node scripts/gmail-reauth.mjs
// Reads GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET from .env.local, runs the OAuth
// consent flow in your browser (sign in as LIZ's account), prints the new
// refresh token, and offers the exact next steps.

import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(projectRoot, '.env.local');

const env = {};
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const clientId = env.GMAIL_CLIENT_ID;
const clientSecret = env.GMAIL_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in .env.local');
  process.exit(1);
}

const PORT = 8788;
const redirectUri = `http://localhost:${PORT}/oauth2callback`;
const scope = 'https://www.googleapis.com/auth/gmail.readonly';

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent', // force a NEW refresh token even if previously granted
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error || !code) {
    res.end(`OAuth error: ${error || 'no code returned'}. Check the terminal.`);
    console.error('OAuth error:', error || 'no code returned');
    server.close();
    process.exit(1);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();

  if (!tokens.refresh_token) {
    res.end('No refresh token returned. Check the terminal.');
    console.error('\nNo refresh_token in response:', JSON.stringify(tokens, null, 2));
    server.close();
    process.exit(1);
  }

  // Verify the token works and we authed the right account
  const accessRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await accessRes.json();

  res.end('Done! You can close this tab and return to the terminal.');
  server.close();

  console.log('\n✅ New refresh token issued for:', profile.emailAddress || '(unknown)');
  console.log('\nGMAIL_REFRESH_TOKEN=' + tokens.refresh_token);

  // Update .env.local in place
  const updated = readFileSync(envPath, 'utf-8').replace(
    /^GMAIL_REFRESH_TOKEN=.*$/m,
    'GMAIL_REFRESH_TOKEN=' + tokens.refresh_token
  );
  writeFileSync(envPath, updated);
  console.log('\n✅ .env.local updated.');
  console.log('\nNext steps:');
  console.log('  1. Update the same value in Vercel:');
  console.log('     npx vercel env rm GMAIL_REFRESH_TOKEN production -y');
  console.log('     npx vercel env add GMAIL_REFRESH_TOKEN production   (paste the token)');
  console.log('     npx vercel --prod   (or just push to main to redeploy)');
  console.log('  2. Test: curl -H "x-api-key: $BRANDI_API_KEY" \\');
  console.log('     "https://misslizdidit-brand-tracker.vercel.app/api/brandi/gmail?action=search&q=newer_than:1d"');
  process.exit(0);
});

server.listen(PORT, () => {
  console.log('Opening Google consent screen — sign in as LIZ’s Gmail account.');
  console.log('If the browser doesn’t open, visit:\n\n' + authUrl + '\n');
  exec(`open "${authUrl}"`);
});
