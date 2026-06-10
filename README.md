# Brand Deal Tracker

Next.js + TypeScript + Supabase tracker for Liz's brand deals.

## Local app

```bash
npm install
npm run dev
```

## OpenClaw Brandi trigger

This repo now includes a small local trigger target that can launch Brandi through an OpenAI Codex run from Kenny's OpenClaw machine.

Start it:

```bash
cd /Users/melodi/clawd/projects/brand-deal-tracker
export BRANDI_API_KEY=...
export BRANDI_TRIGGER_TOKEN=choose-a-long-random-token
export BRANDI_APP_URL=https://misslizdidit-brand-tracker.vercel.app
npm run brandi:runner
```

Default listener:

```text
http://127.0.0.1:8787/run?token=YOUR_TOKEN
```

Recommended Brand Deal Tracker env:

```text
BRANDI_RUN_TRIGGER_URL=http://127.0.0.1:8787/run?token=YOUR_TOKEN
BRANDI_RUN_TRIGGER_PROVIDER=openclaw-codex
```

What it does:

1. Receives the browser-triggered `/run` request.
2. Spawns a local `codex exec --full-auto` run in this repo.
3. Instructs Codex to act as Brandi, use the existing Gmail/feedback/sync APIs, and write `brandi/pending-updates.json`.
4. Tells Codex to call `/api/brandi/sync` so the current run history and UI polling keep working.

## Current limitation

This is a launch-safe local trigger target, not a full always-on OpenClaw service yet.

You still need:

- `codex` installed and authenticated on the machine running the trigger
- the runner process kept alive locally
- the tracker UI opened on a machine that can reach `127.0.0.1:8787`, or a tunnel/reverse proxy if you want the deployed app to open a remote machine target
