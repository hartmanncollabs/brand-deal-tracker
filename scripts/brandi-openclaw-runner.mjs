#!/usr/bin/env node
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const brandiDir = join(projectRoot, 'brandi');
const runsDir = join(brandiDir, 'runs');

mkdirSync(runsDir, { recursive: true });

const port = Number(process.env.BRANDI_TRIGGER_PORT || 8787);
const token = process.env.BRANDI_TRIGGER_TOKEN;
const appUrl = process.env.BRANDI_APP_URL || 'https://misslizdidit-brand-tracker.vercel.app';
const codexBin = process.env.BRANDI_CODEX_BIN || 'codex';
const apiKey = process.env.BRANDI_API_KEY;

if (!token) {
  console.error('Missing BRANDI_TRIGGER_TOKEN');
  process.exit(1);
}

if (!apiKey) {
  console.error('Missing BRANDI_API_KEY');
  process.exit(1);
}

let activeRun = null;

function html(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'text/html; charset=utf-8' },
    body,
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body, null, 2),
  };
}

function buildPrompt(runId) {
  return `You are Brandi, the Brand Deal Tracker agent for ${projectRoot}.

Goal: run one safe Brandi scan through OpenAI Codex, using the existing Brand Deal Tracker APIs and current rules.

Required files to read first:
- ${join(projectRoot, 'brandi', 'AGENT.md')}
- ${join(projectRoot, 'src', 'app', 'api', 'brandi', 'gmail', 'route.ts')}
- ${join(projectRoot, 'src', 'app', 'api', 'brandi', 'sync', 'route.ts')}
- ${join(projectRoot, 'src', 'app', 'api', 'deals', 'route.ts')}

Environment you may use:
- BRANDI_APP_URL=${appUrl}
- BRANDI_API_KEY is available in env

Hard requirements:
- Stay surgical. No broad app rewrite.
- Do not ask for OAuth changes.
- Respect manual updates exactly as documented.
- Prefer using the existing file-based flow: write ${join(projectRoot, 'brandi', 'pending-updates.json')} then call /api/brandi/sync.
- If there are no relevant updates, write [] to pending-updates.json and do not create a run summary.
- Use existing APIs instead of direct schema changes.

Suggested execution flow:
1. Read Brandi instructions.
2. Fetch Brandi feedback from ${appUrl}/api/brandi/feedback with x-api-key.
3. Gather relevant Gmail threads through ${appUrl}/api/brandi/gmail using x-api-key.
4. Inspect current deals using local project context and any safe API or Supabase access already available in this repo.
5. Produce pending-updates.json in the format expected by /api/brandi/sync.
6. If pending-updates.json contains updates, call ${appUrl}/api/brandi/sync and verify success.
7. Print a short final summary including whether sync ran.

Run id: ${runId}
`;
}

function startRun() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = join(runsDir, `${runId}.log`);
  const promptPath = join(runsDir, `${runId}.prompt.md`);
  const prompt = buildPrompt(runId);
  writeFileSync(promptPath, prompt);

  const child = spawn(
    codexBin,
    ['exec', '--full-auto', prompt],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        BRANDI_APP_URL: appUrl,
        BRANDI_API_KEY: apiKey,
      },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  activeRun = { runId, logPath, promptPath, pid: child.pid, startedAt: new Date().toISOString() };

  child.stdout.on('data', (chunk) => {
    writeFileSync(logPath, chunk, { flag: 'a' });
  });

  child.stderr.on('data', (chunk) => {
    writeFileSync(logPath, chunk, { flag: 'a' });
  });

  child.on('exit', (code, signal) => {
    writeFileSync(
      logPath,
      `\n\n[runner] exited code=${code ?? 'null'} signal=${signal ?? 'null'} at=${new Date().toISOString()}\n`,
      { flag: 'a' }
    );
    activeRun = null;
  });

  return activeRun;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);

  let response;

  if (url.pathname === '/health') {
    response = json(200, { ok: true, activeRun });
  } else if (url.pathname === '/run') {
    if (url.searchParams.get('token') !== token) {
      response = html(401, '<h1>Unauthorized</h1>');
    } else if (activeRun) {
      response = html(409, `<h1>Brandi is already running</h1><p>Run ID: ${activeRun.runId}</p><p>Log: ${activeRun.logPath}</p>`);
    } else {
      const run = startRun();
      response = html(202, `<h1>Brandi started</h1><p>Run ID: ${run.runId}</p><p>PID: ${run.pid}</p><p>Log: ${run.logPath}</p>`);
    }
  } else {
    response = html(404, '<h1>Not found</h1>');
  }

  res.writeHead(response.statusCode, response.headers);
  res.end(response.body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Brandi runner listening on http://127.0.0.1:${port}`);
});
