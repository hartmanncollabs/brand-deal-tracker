# Brand Deal Tracker

## Project
Next.js 14 + TypeScript + Supabase + Tailwind CSS kanban board for tracking brand partnerships from pitch to payment. Deployed on Vercel.

## Key Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type check
- `npx supabase db push` — apply migrations to live DB

## Architecture
- **Frontend:** `src/components/` — KanbanBoard, DealModal, Dashboard, CalendarView
- **API Routes:** `src/app/api/deals/` — POST/PATCH for programmatic deal management (used by Brandi agent)
- **Types:** `src/types/database.ts` — Deal, DealActivity, stages, colors
- **Supabase:** `src/lib/supabase.ts` — public + admin clients
- **Migrations:** `supabase/migrations/` — applied via `npx supabase db push`

## Live Data
Supabase contains real deal data. NEVER drop tables, delete data, or make destructive schema changes without explicit approval.

## Deployment
Push to `main` → Vercel auto-deploys. Always run `npx tsc --noEmit` before committing.

## Brandi (AI Agent)
Brandi is a scheduled Claude Code agent that scans Liz's Gmail for brand deal opportunities and creates/updates deals via the API. See `brandi/` folder for her instructions, personality, and feedback log. All her activity is tagged with `actor: 'brandi'` in deal_activities.

## Auth
Supabase Auth with email/password. All authenticated users share the same board. RLS requires authentication.
