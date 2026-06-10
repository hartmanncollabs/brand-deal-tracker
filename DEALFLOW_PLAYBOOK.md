# DealFlow Product Playbook

> Complete playbook for launching DealFlow (multi-tenant SaaS) and DealFlow Mobile (iOS/Android) from the existing Brand Deal Tracker codebase. Every task is checkpoint-structured and actionable for Claude Code.

**Template project:** `/Users/melodi/clawd/projects/brand-deal-tracker`
**Brandi agent:** `/Users/melodi/clawd/agents/brandi`
**Created:** 2026-04-14

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Checkpoint 0: Project Setup & Scaffolding](#checkpoint-0-project-setup--scaffolding)
3. [Checkpoint 1: Multi-Tenant Database Schema](#checkpoint-1-multi-tenant-database-schema)
4. [Checkpoint 2: Authentication & Workspace Management](#checkpoint-2-authentication--workspace-management)
5. [Checkpoint 3: Core Kanban Pipeline (Web)](#checkpoint-3-core-kanban-pipeline-web)
6. [Checkpoint 4: Deal Management & Auto-Save](#checkpoint-4-deal-management--auto-save)
7. [Checkpoint 5: Dashboard & Analytics](#checkpoint-5-dashboard--analytics)
8. [Checkpoint 6: AI Agent System (Brandi per Workspace)](#checkpoint-6-ai-agent-system-brandi-per-workspace)
9. [Checkpoint 7: Gmail Integration & OAuth per Tenant](#checkpoint-7-gmail-integration--oauth-per-tenant)
10. [Checkpoint 8: Billing & Subscription Management](#checkpoint-8-billing--subscription-management)
11. [Checkpoint 9: Team Roles & Permissions](#checkpoint-9-team-roles--permissions)
12. [Checkpoint 10: Calendar View & File Uploads](#checkpoint-10-calendar-view--file-uploads)
13. [Checkpoint 11: Mobile App Foundation (Expo/React Native)](#checkpoint-11-mobile-app-foundation-exporeact-native)
14. [Checkpoint 12: Mobile Kanban & Deal Management](#checkpoint-12-mobile-kanban--deal-management)
15. [Checkpoint 13: Mobile Push Notifications & Offline](#checkpoint-13-mobile-push-notifications--offline)
16. [Checkpoint 14: Testing & QA](#checkpoint-14-testing--qa)
17. [Checkpoint 15: Deployment & Infrastructure](#checkpoint-15-deployment--infrastructure)
18. [Checkpoint 16: Landing Page & Marketing Site](#checkpoint-16-landing-page--marketing-site)
19. [Checkpoint 17: Launch Preparation](#checkpoint-17-launch-preparation)
20. [Checkpoint 18: Post-Launch & Iteration](#checkpoint-18-post-launch--iteration)
21. [Pricing Model](#pricing-model)
22. [Multi-Tenant Architecture (Detailed)](#multi-tenant-architecture-detailed)
23. [Mobile App Architecture (Detailed)](#mobile-app-architecture-detailed)
24. [Marketing Agent Brief](#marketing-agent-brief)
25. [Researcher Agent Brief](#researcher-agent-brief)
26. [Feature Planning Agent Brief](#feature-planning-agent-brief)

---

## Architecture Overview

### Current State (Brand Deal Tracker)

```
Stack: Next.js 14 + TypeScript + Supabase + Tailwind CSS + dnd-kit
Auth: Supabase Auth (email/password), 3 users sharing one board
DB: Supabase PostgreSQL with RLS (auth.role() = 'authenticated')
Storage: Supabase Storage (deal-attachments bucket)
AI Agent: Claude Code scheduled trigger -> Gmail API -> pending-updates.json -> /api/brandi/sync
Deploy: Vercel (auto-deploy on push to main)
```

**Key files and what they do:**

| File | Purpose | Lines | Patterns to reuse |
|------|---------|-------|-------------------|
| `src/components/KanbanBoard.tsx` | Main board with DndContext, drag handlers, deal CRUD, search, archive filter | ~878 | Custom collision detection, optimistic updates, sort order management |
| `src/components/DealModal.tsx` | Deal editor with auto-save on blur, file uploads, multi-month support, activity tab | ~827 | Auto-save pattern (`autoSave` helper), FileUploadSection sub-component |
| `src/components/Dashboard.tsx` | Sticky top bar with metrics, value breakdowns, tier/goal collapsibles, Brandi button | ~475 | DealDropdown pattern, UserMenu, parseValue helper |
| `src/components/BrandiFeedback.tsx` | AI agent panel with Focus/Runs/Feedback tabs, overdue/stale detection, run polling | ~417 | Focus item computation, run polling with interval, chat-style feedback |
| `src/components/Column.tsx` | Droppable column with SortableContext, value totals, hover indicators | ~97 | useDroppable, column-level DnD integration |
| `src/components/DealCard.tsx` | Sortable deal card with priority borders, overdue badges, multi-month indicators | ~198 | useSortable, date comparison for urgency, child/parent styling |
| `src/components/CalendarView.tsx` | Monthly calendar grid with deal dots, deal-without-dates section | ~521 | date-fns calendar generation, dealsByDate grouping |
| `src/components/AuthProvider.tsx` | Auth context, session management, LoginForm | ~136 | Context pattern, auth state listener |
| `src/types/database.ts` | All types: Deal, DealActivity, DealStage, stages/labels/colors | ~139 | 13 stages, stage colors, type definitions |
| `src/lib/supabase.ts` | Public client + admin client (service key) | ~17 | Dual client pattern |
| `src/app/api/deals/route.ts` | POST (create) + PATCH (update) with API key auth, activity logging | ~169 | API key verification, change tracking, activity auto-logging |
| `src/app/api/brandi/gmail/route.ts` | Gmail API proxy: search, message, thread actions | ~137 | OAuth2 token refresh, message body extraction |
| `src/app/api/brandi/sync/route.ts` | File-to-DB sync for pending agent updates | ~212 | Batch processing, duplicate detection, note prepending |
| `src/app/api/brandi/feedback/route.ts` | Feedback retrieval with API key auth | ~23 | Simple authenticated GET |
| `src/app/api/brandi/runs/route.ts` | Run summary posting with API key auth | ~31 | Simple authenticated POST |
| `brandi/AGENT.md` | Agent personality, pipeline playbook, stage transition rules | ~141 | Stage-by-stage rules for AI agent behavior |

### Target State (DealFlow)

```
Web: Next.js 14 + TypeScript + Supabase + Tailwind + dnd-kit (multi-tenant)
Mobile: Expo/React Native + Supabase JS client
Auth: Supabase Auth with workspace isolation
DB: Supabase PostgreSQL with workspace_id RLS
AI: Per-workspace AI agent instances (Claude API / OpenAI)
Billing: Stripe (subscriptions + usage metering)
Deploy: Vercel (web), Expo EAS (mobile), Supabase (DB)
```

---

## Checkpoint 0: Project Setup & Scaffolding

**Definition of Done:** New monorepo exists with web app, mobile app, and shared packages. Dev environment runs locally. CI is configured.

**Dependencies:** None (starting point)

**Owner:** Developer

### Tasks

- [ ] **[S]** Create monorepo structure using Turborepo
  ```
  dealflow/
    apps/
      web/          # Next.js 14 app (port of brand-deal-tracker)
      mobile/       # Expo React Native app
      landing/      # Marketing site (Next.js or Astro)
    packages/
      types/        # Shared TypeScript types (from src/types/database.ts)
      supabase/     # Shared Supabase client config (from src/lib/supabase.ts)
      ui/           # Shared UI primitives (colors, tokens)
      api-client/   # Shared API client for mobile + web
    supabase/
      migrations/   # All SQL migrations
      config.toml   # Supabase project config
  ```

- [ ] **[S]** Initialize Turborepo: `npx create-turbo@latest dealflow`

- [ ] **[S]** Set up `apps/web` by copying the brand-deal-tracker Next.js app
  - Copy `package.json` dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@supabase/supabase-js`, `date-fns`, `next@14`, `react@18`
  - Copy `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`
  - Copy `src/` directory structure

- [ ] **[S]** Set up `packages/types` by extracting from template `src/types/database.ts`
  - Move `Deal`, `DealActivity`, `DealStage`, `WaitingOn`, `Priority`, `DealType` types
  - Add new multi-tenant types: `Workspace`, `WorkspaceMember`, `WorkspaceRole`, `Subscription`
  - Export `STAGES`, `STAGE_LABELS`, `STAGE_COLORS` constants

- [ ] **[S]** Set up `packages/supabase` by extracting from template `src/lib/supabase.ts`
  - Create `createSupabaseClient(url, key)` factory
  - Create `createSupabaseAdmin(url, serviceKey)` factory
  - Add TypeScript database types generated from schema

- [ ] **[M]** Set up `apps/mobile` with Expo
  ```bash
  npx create-expo-app apps/mobile --template blank-typescript
  ```
  - Add dependencies: `@supabase/supabase-js`, `expo-secure-store`, `date-fns`
  - Configure Supabase client with secure token storage

- [ ] **[S]** Create `.env.example` with all required environment variables
  ```
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_KEY=
  
  # Stripe
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  
  # AI Agent
  ANTHROPIC_API_KEY=
  OPENAI_API_KEY=
  
  # Gmail (per-workspace, stored in DB)
  # No global env vars needed
  ```

- [ ] **[S]** Set up ESLint + Prettier shared config in monorepo root

- [ ] **[M]** Set up GitHub Actions CI pipeline
  - Type check: `npx tsc --noEmit` for web and mobile
  - Lint: `npm run lint`
  - Build: `npm run build` for web
  - Expo doctor: `npx expo-doctor` for mobile

- [ ] **[S]** Create new Supabase project for DealFlow (separate from brand-deal-tracker)
  - Note: The existing project `ifgebelwbkojmdiwzhlm` is for the template; DealFlow gets its own

- [ ] **[S]** Add `turbo.json` with pipeline configuration
  ```json
  {
    "pipeline": {
      "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
      "dev": { "cache": false, "persistent": true },
      "lint": {},
      "typecheck": {}
    }
  }
  ```

---

## Checkpoint 1: Multi-Tenant Database Schema

**Definition of Done:** Supabase schema supports multiple workspaces with full data isolation. All migrations are written and tested. RLS policies enforce workspace boundaries.

**Dependencies:** Checkpoint 0

**Owner:** Developer

### Tasks

- [ ] **[L]** Write migration `001_workspaces.sql` -- core workspace tables
  ```sql
  -- Workspaces
  CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    plan TEXT NOT NULL DEFAULT 'trial', -- trial, base, premium, team
    trial_ends_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    ai_scans_remaining INTEGER DEFAULT 10, -- trial limit
    ai_enabled BOOLEAN DEFAULT false,
    gmail_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_workspaces_slug ON workspaces(slug);
  CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

  -- Workspace members
  CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    invited_by UUID REFERENCES auth.users(id),
    invited_email TEXT,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
  );
  CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
  CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
  ```

- [ ] **[L]** Write migration `002_deals_multi_tenant.sql` -- add workspace_id to deals
  Reference: template `supabase/migrations/20260101000000_initial_schema.sql` for base schema
  ```sql
  -- Deals table (based on template, with workspace_id added)
  CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    slug TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'outreach',
    priority TEXT NOT NULL DEFAULT 'medium',
    value TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_source TEXT,
    last_contact DATE,
    next_action TEXT,
    next_action_date DATE,
    waiting_on TEXT,
    follow_up_count INTEGER DEFAULT 0,
    notes TEXT,
    archived BOOLEAN DEFAULT false,
    is_repeat_brand BOOLEAN DEFAULT false,
    past_history TEXT,
    sort_order INTEGER,
    deal_type TEXT DEFAULT 'posted', -- ugc, posted, hybrid
    is_multi_month BOOLEAN DEFAULT false,
    total_months INTEGER,
    monthly_value NUMERIC,
    parent_deal_id UUID REFERENCES deals(id),
    month_number INTEGER,
    brief_url TEXT,
    contract_url TEXT,
    other_attachments JSONB,
    stage_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, slug)
  );
  
  CREATE INDEX idx_deals_workspace ON deals(workspace_id);
  CREATE INDEX idx_deals_stage ON deals(stage);
  CREATE INDEX idx_deals_archived ON deals(archived);
  
  -- Deal activities (with workspace_id for RLS)
  CREATE TABLE deal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    note TEXT NOT NULL,
    actor TEXT DEFAULT 'user', -- user, agent
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_activities_deal ON deal_activities(deal_id);
  CREATE INDEX idx_activities_workspace ON deal_activities(workspace_id);
  ```

- [ ] **[L]** Write migration `003_agent_tables.sql` -- AI agent per workspace
  Reference: template `supabase/migrations/20260414040000_brandi_feedback.sql` and `20260414050000_brandi_runs.sql`
  ```sql
  -- Agent runs per workspace
  CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    deals_created INTEGER DEFAULT 0,
    deals_updated INTEGER DEFAULT 0,
    emails_scanned INTEGER DEFAULT 0,
    suggestions JSONB DEFAULT '[]',
    tokens_used INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_agent_runs_workspace ON agent_runs(workspace_id);

  -- Agent feedback per workspace
  CREATE TABLE agent_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_agent_feedback_workspace ON agent_feedback(workspace_id);

  -- Agent config per workspace
  CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    personality TEXT DEFAULT 'default',
    custom_instructions TEXT,
    scan_frequency_hours INTEGER DEFAULT 2,
    last_scan_at TIMESTAMPTZ,
    gmail_access_token TEXT, -- encrypted
    gmail_refresh_token TEXT, -- encrypted
    gmail_token_expires_at TIMESTAMPTZ,
    gmail_email TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **[L]** Write migration `004_rls_policies.sql` -- workspace-scoped RLS
  Reference: template `supabase/migrations/20260414010000_auth_rls_policies.sql` for pattern
  ```sql
  -- Helper function: check workspace membership
  CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
  RETURNS BOOLEAN AS $$
    SELECT EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = ws_id
      AND user_id = auth.uid()
    );
  $$ LANGUAGE sql SECURITY DEFINER;

  -- Helper: check workspace role
  CREATE OR REPLACE FUNCTION workspace_role(ws_id UUID)
  RETURNS TEXT AS $$
    SELECT role FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    LIMIT 1;
  $$ LANGUAGE sql SECURITY DEFINER;

  -- Enable RLS on all tables
  ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
  ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

  -- Workspaces: members can view, owners can update
  CREATE POLICY "Members can view workspace"
    ON workspaces FOR SELECT
    USING (is_workspace_member(id));
  
  CREATE POLICY "Owners can update workspace"
    ON workspaces FOR UPDATE
    USING (owner_id = auth.uid());

  CREATE POLICY "Authenticated users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

  -- Workspace members: members can view their workspace's members
  CREATE POLICY "Members can view members"
    ON workspace_members FOR SELECT
    USING (is_workspace_member(workspace_id));

  CREATE POLICY "Admins can manage members"
    ON workspace_members FOR ALL
    USING (workspace_role(workspace_id) IN ('owner', 'admin'));

  -- Deals: workspace members only
  CREATE POLICY "Members can view deals"
    ON deals FOR SELECT
    USING (is_workspace_member(workspace_id));

  CREATE POLICY "Members can insert deals"
    ON deals FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id)
      AND workspace_role(workspace_id) IN ('owner', 'admin', 'member'));

  CREATE POLICY "Members can update deals"
    ON deals FOR UPDATE
    USING (is_workspace_member(workspace_id)
      AND workspace_role(workspace_id) IN ('owner', 'admin', 'member'));

  CREATE POLICY "Admins can delete deals"
    ON deals FOR DELETE
    USING (workspace_role(workspace_id) IN ('owner', 'admin'));

  -- Deal activities: same as deals
  CREATE POLICY "Members can view activities"
    ON deal_activities FOR SELECT
    USING (is_workspace_member(workspace_id));

  CREATE POLICY "Members can insert activities"
    ON deal_activities FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

  -- Agent tables: same workspace isolation
  CREATE POLICY "Members can view runs"
    ON agent_runs FOR SELECT
    USING (is_workspace_member(workspace_id));

  CREATE POLICY "Members can view feedback"
    ON agent_feedback FOR SELECT
    USING (is_workspace_member(workspace_id));

  CREATE POLICY "Members can post feedback"
    ON agent_feedback FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

  CREATE POLICY "Admins can view agent config"
    ON agent_configs FOR SELECT
    USING (workspace_role(workspace_id) IN ('owner', 'admin'));

  CREATE POLICY "Admins can update agent config"
    ON agent_configs FOR UPDATE
    USING (workspace_role(workspace_id) IN ('owner', 'admin'));
  ```

- [ ] **[M]** Write migration `005_billing_tables.sql`
  ```sql
  -- Usage tracking for AI token metering
  CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'ai_scan', 'ai_tokens', 'storage_mb'
    quantity INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_usage_workspace ON usage_records(workspace_id);
  CREATE INDEX idx_usage_created ON usage_records(created_at);

  -- Billing events (Stripe webhook log)
  CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    stripe_event_id TEXT UNIQUE,
    event_type TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **[M]** Write migration `006_storage_policies.sql`
  Reference: template `supabase/migrations/20260325150000_create_storage_bucket.sql`
  ```sql
  -- Storage bucket per workspace
  -- Buckets are created per-workspace programmatically, or use paths:
  -- deal-attachments/{workspace_id}/{deal_slug}/{filename}
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('deal-attachments', 'deal-attachments', true)
  ON CONFLICT DO NOTHING;

  -- Storage policies: workspace members can upload to their workspace path
  CREATE POLICY "Workspace members can upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'deal-attachments'
      AND is_workspace_member((storage.foldername(name))[1]::UUID)
    );

  CREATE POLICY "Workspace members can view"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'deal-attachments'
      AND is_workspace_member((storage.foldername(name))[1]::UUID)
    );
  ```

- [ ] **[S]** Write migration `007_updated_at_triggers.sql`
  Reference: template `supabase/migrations/20260101000000_initial_schema.sql` trigger
  ```sql
  -- Reuse the update_updated_at_column() function from template
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_agent_configs_updated_at
    BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ```

- [ ] **[S]** Generate TypeScript types from Supabase schema
  ```bash
  npx supabase gen types typescript --project-id <PROJECT_ID> > packages/types/supabase.ts
  ```

- [ ] **[S]** Test migrations locally with `npx supabase db push` and verify all tables exist

---

## Checkpoint 2: Authentication & Workspace Management

**Definition of Done:** Users can sign up, create a workspace, invite team members, and switch between workspaces. Auth is fully working with workspace context.

**Dependencies:** Checkpoint 0, Checkpoint 1

**Owner:** Developer

### Tasks

- [ ] **[L]** Create `WorkspaceProvider` context (replaces template `src/components/AuthProvider.tsx`)
  Reference: template AuthProvider pattern -- extend with workspace selection
  ```typescript
  // apps/web/src/contexts/WorkspaceProvider.tsx
  interface WorkspaceContextType {
    user: User | null;
    session: Session | null;
    workspace: Workspace | null;
    workspaces: Workspace[];
    role: WorkspaceRole;
    loading: boolean;
    switchWorkspace: (id: string) => void;
    signOut: () => Promise<void>;
  }
  ```
  - On login, fetch user's workspace_members to get all workspaces
  - Store active workspace_id in localStorage
  - Pass workspace_id to all Supabase queries
  - Show workspace selector if user belongs to multiple workspaces

- [ ] **[M]** Create sign-up flow with workspace creation
  - `/auth/signup` page with email + password + workspace name
  - On signup: create user, create workspace, create workspace_member (role: owner)
  - Set trial_ends_at to 14 days from now
  - Redirect to onboarding or main board

- [ ] **[M]** Create sign-in flow
  Reference: template `src/components/AuthProvider.tsx` LoginForm component
  - `/auth/signin` page
  - After sign-in, fetch workspaces and redirect to most recent
  - Handle case where user has no workspaces (shouldn't happen, but guard)

- [ ] **[M]** Create workspace settings page (`/settings/workspace`)
  - Edit workspace name
  - View plan details
  - Danger zone: delete workspace (owner only)

- [ ] **[M]** Create team invite system (`/settings/team`)
  - Invite by email (creates workspace_member with invited_email, no user_id yet)
  - Accept invite flow (on signup/signin, check for pending invites by email)
  - Role management: owner can change roles, admin can invite members
  - Remove member (owner/admin only)

- [ ] **[S]** Create workspace switcher dropdown component
  - Show in header/sidebar
  - List all workspaces user belongs to
  - "Create new workspace" option

- [ ] **[S]** Create middleware for workspace context
  ```typescript
  // apps/web/src/middleware.ts
  // Redirect unauthenticated users to /auth/signin
  // Redirect users without workspace to /onboarding
  // Set workspace_id header from cookie/localStorage
  ```

- [ ] **[M]** Create onboarding flow for new users
  - Step 1: Create workspace (name, optional logo)
  - Step 2: Invite team members (optional, skip)
  - Step 3: Connect Gmail (optional, skip for base plan)
  - Step 4: Import existing deals or start fresh
  - Redirect to main board

- [ ] **[S]** Create API helper that injects workspace_id into all Supabase queries
  ```typescript
  // packages/supabase/workspace-client.ts
  // Wraps supabase client to always filter by workspace_id
  function useWorkspaceQuery<T>(table: string) {
    const { workspace } = useWorkspace();
    return supabase.from(table).select('*').eq('workspace_id', workspace.id);
  }
  ```

- [ ] **[S]** Add workspace_id to all existing API routes
  Reference: template `src/app/api/deals/route.ts` -- add workspace_id validation
  - Verify the requesting user is a member of the workspace
  - Add workspace_id to all INSERT operations
  - Filter all SELECT operations by workspace_id

---

## Checkpoint 3: Core Kanban Pipeline (Web)

**Definition of Done:** Multi-tenant kanban board works with drag-and-drop, column sorting, and deal filtering. Functionally equivalent to template but workspace-scoped.

**Dependencies:** Checkpoint 1, Checkpoint 2

**Owner:** Developer

### Tasks

- [ ] **[L]** Port `KanbanBoard.tsx` to multi-tenant version
  Reference: template `src/components/KanbanBoard.tsx` (878 lines)
  Key changes from template:
  - All `supabase.from('deals')` queries add `.eq('workspace_id', workspace.id)`
  - Replace `supabase` import with workspace-scoped client
  - Remove the Brandi sync call from `useEffect` (line 128-134 in template); agent sync is now server-side
  - Keep: custom collision detection (lines 29-54), DndContext setup, handleDragEnd logic
  - Keep: sort order management, optimistic updates
  - Keep: UnsortedBanner component (lines 764-877)
  - Keep: search, archive filter, new deal button
  - Add: workspace_id to all deal inserts

- [ ] **[L]** Port `Column.tsx` to DealFlow
  Reference: template `src/components/Column.tsx` (97 lines)
  - Direct port, no workspace changes needed (operates on passed-in deals array)
  - Keep: SortableContext, value totals, hover indicators
  - Keep: useDroppable integration

- [ ] **[L]** Port `DealCard.tsx` to DealFlow
  Reference: template `src/components/DealCard.tsx` (198 lines)
  - Direct port, no workspace changes needed
  - Keep: useSortable, priority colors, overdue/urgent badges
  - Keep: multi-month indicators (parent/child styling)
  - Keep: spawn child button

- [ ] **[M]** Port `SpawnChildModal.tsx` to DealFlow
  Reference: template `src/components/SpawnChildModal.tsx`
  - Add workspace_id to child deal creation

- [ ] **[M]** Port shared types to `packages/types`
  Reference: template `src/types/database.ts` (139 lines)
  - Move all types, keep STAGES, STAGE_LABELS, STAGE_COLORS
  - Add workspace-scoped types

- [ ] **[S]** Update page layout to include sidebar/header with workspace context
  - Sidebar: workspace name, navigation (Board, Calendar, Settings)
  - Header: search, new deal button, user menu
  - Mobile: hamburger menu for sidebar

- [ ] **[S]** Implement deal stage customization (future feature prep)
  - Store custom stages in workspace settings
  - For now, use the 13 default stages from template
  - Schema: `workspace_settings.custom_stages JSONB`

- [ ] **[M]** Port deal CRUD API routes
  Reference: template `src/app/api/deals/route.ts` (169 lines)
  - POST: add workspace_id, verify membership
  - PATCH: add workspace_id filter, verify membership
  - Add GET route for fetching deals (template uses client-side Supabase directly)
  - Add DELETE route for archiving (soft delete)

---

## Checkpoint 4: Deal Management & Auto-Save

**Definition of Done:** Deal modal works with auto-save, file uploads, multi-month deals, and activity logging. All deal fields from the template are supported.

**Dependencies:** Checkpoint 3

**Owner:** Developer

### Tasks

- [ ] **[L]** Port `DealModal.tsx` to multi-tenant version
  Reference: template `src/components/DealModal.tsx` (827 lines)
  Key patterns to preserve:
  - Auto-save on blur (lines 98-101): `autoSave` helper calls `onSave(updatedData, true)` to save without closing
  - Stage change auto-save (lines 126-132): stage dropdown triggers immediate save
  - Date change auto-save (lines 373-380): next_action_date saves immediately
  - Tab system: Details tab + Activity tab
  - Multi-month deal section (lines 472-596): parent/child display, monthly portions list, spawn button
  - Repeat brand section (lines 440-469): checkbox + past_history textarea
  - File upload section (lines 684-826): FileUploadSection with drag-and-drop, Supabase Storage upload
  
  Changes needed:
  - All Supabase operations use workspace-scoped client
  - File uploads go to `{workspace_id}/{deal_slug}/{filename}` path
  - Activity logging includes workspace_id

- [ ] **[M]** Port FileUploadSection sub-component
  Reference: template `DealModal.tsx` lines 684-826
  - Keep: drag-and-drop, click-to-browse, upload progress, file preview
  - Change: upload path includes workspace_id
  - Change: Use workspace-scoped storage bucket

- [ ] **[M]** Implement activity logging with workspace isolation
  Reference: template KanbanBoard.tsx handleSave (lines 370-398) for auto-logging pattern
  - Track: stage changes, value changes, priority changes, waiting_on changes, file uploads
  - Format: `"Stage: Outreach -> Pitched | Value: none -> $1,000"`
  - Actor field: 'user' (default) or 'agent' (from AI)

- [ ] **[S]** Implement deal slug generation with workspace uniqueness
  Reference: template `src/app/api/deals/route.ts` slugify function (lines 15-19)
  - Slugs must be unique within workspace, not globally
  - Pattern: `brand-name` with numeric suffix if duplicate

- [ ] **[S]** Port multi-month deal logic
  Reference: template `KanbanBoard.tsx` handleCreateMonthlyPortion (lines 456-511) and handleDoSpawn (lines 535-596)
  - Parent deal: is_multi_month=true, tracks total_months, monthly_value
  - Child deals: parent_deal_id set, month_number, dashed border
  - Parent is final month; children are months 1 through N-1
  - All child creation adds workspace_id

- [ ] **[S]** Add deal type support (posted/ugc/hybrid)
  Reference: template `DealModal.tsx` lines 241-255, `DealCard.tsx` lines 89-96
  - UGC deals skip Scheduled and Delivered stages
  - Visual indicator on card

---

## Checkpoint 5: Dashboard & Analytics

**Definition of Done:** Dashboard shows workspace-scoped metrics, value breakdowns, tier progress, and monthly goals. Sticky top bar works.

**Dependencies:** Checkpoint 3, Checkpoint 4

**Owner:** Developer

### Tasks

- [ ] **[L]** Port `Dashboard.tsx` to multi-tenant version
  Reference: template `src/components/Dashboard.tsx` (475 lines)
  Key patterns:
  - Sticky top bar (lines 166-244): workspace name, active deals count, overdue dropdown, waiting badges, user menu
  - Value breakdown grid (lines 248-272): Potential (negotiation), Agreed (agreed+contract), Active Contracts (content->invoiced), Paid (this year)
  - `parseValue` helper (lines 19-25): extracts numbers from `"$1,000"` strings
  - DealDropdown component (lines 38-111): expandable dropdown listing deals with scroll-to-deal
  - Collapsible goals section (lines 275-291): Monthly Goals + Tier Progress
  - Stage counts row (lines 293-305): small badges per stage
  
  Changes:
  - Replace `useAuth` with `useWorkspace` context
  - Add workspace name to header
  - Brandi button becomes "AI Agent" button (workspace-aware)
  - Add plan badge (Base/Premium/Team)

- [ ] **[M]** Port `TierProgress.tsx`
  Reference: template `src/components/TierProgress.tsx`
  - Workspace-scoped calculations
  - Make tier thresholds configurable per workspace

- [ ] **[M]** Port `MonthlyGoals.tsx`
  Reference: template `src/components/MonthlyGoals.tsx`
  - Workspace-scoped calculations
  - Allow custom monthly targets per workspace

- [ ] **[M]** Create workspace-level analytics dashboard
  - Total revenue (all time, this year, this month)
  - Deal conversion funnel (outreach -> paid completion rate)
  - Average deal value
  - Average time in each stage
  - Deals closed per month chart
  - Revenue trends chart

- [ ] **[S]** Create export functionality
  - Export deals to CSV
  - Export analytics to PDF (future)

---

## Checkpoint 6: AI Agent System (Brandi per Workspace)

**Definition of Done:** Each workspace can configure and run their own AI agent that scans emails and updates deals. Token usage is tracked and metered.

**Dependencies:** Checkpoint 4, Checkpoint 7 (Gmail), Checkpoint 8 (billing for metering)

**Owner:** Developer

### Tasks

- [ ] **[L]** Design AI agent architecture for multi-tenant
  Reference: template `brandi/AGENT.md` for personality and pipeline playbook
  
  Architecture:
  ```
  User triggers "Run Agent" -> API route /api/agent/run
    -> Verify workspace has premium plan
    -> Verify AI scans remaining (or unlimited for premium)
    -> Fetch workspace's Gmail tokens from agent_configs
    -> Fetch workspace's deals from DB
    -> Fetch workspace's feedback/instructions
    -> Call Claude API (or OpenAI) with:
        - System prompt (agent personality + pipeline rules)
        - Gmail email summaries
        - Current deal state
        - Custom instructions
    -> Parse agent response into deal updates
    -> Apply updates to workspace's deals
    -> Log run to agent_runs
    -> Track token usage in usage_records
    -> Decrement ai_scans_remaining (if on trial)
  ```

- [ ] **[L]** Create `/api/agent/run` route
  Reference: template pipeline playbook from `brandi/AGENT.md` lines 58-140
  
  The agent system prompt should include ALL stage transition rules:
  - Negotiation: track follow-ups, move to Agreed when rate+deliverables confirmed
  - Agreed: waiting on contract, move to Contract when doc sent
  - Contract: reviewing revisions, move to Content when signed
  - Content: mostly manual, move to Approval when submitted
  - Approval: waiting on brand, move to Scheduled when approved
  - Scheduled: posting date tracking, move to Delivered when posted
  - Delivered: prompt to invoice, move to Invoiced when sent
  - Invoiced: waiting on payment (30-60 days), move to Paid when confirmed
  - Paid: follow up for renewal
  
  General rules from template:
  - Liz sends email -> waiting_on: "brand"
  - Brand replies -> waiting_on: "us"
  - Update last_contact to most recent email date
  - Prepend new notes (most recent on top)
  - Only write updates when there is substantive info

- [ ] **[L]** Create agent system prompt builder
  ```typescript
  function buildAgentPrompt(workspace: Workspace, config: AgentConfig, deals: Deal[], feedback: AgentFeedback[]) {
    return `
    You are an AI deal management agent for ${workspace.name}.
    
    ## Your Responsibilities
    1. Scan emails for brand deal activity
    2. Create new deals when you find outreach
    3. Update existing deals based on email threads
    4. Track waiting_on, next_action, next_action_date
    5. Move deals between stages per the pipeline rules
    
    ## Pipeline Stage Rules
    ${PIPELINE_RULES} // From brandi/AGENT.md
    
    ## Custom Instructions
    ${config.custom_instructions || 'None'}
    
    ## User Feedback
    ${feedback.map(f => `[${f.created_at}] ${f.author}: ${f.message}`).join('\n')}
    
    ## Current Deals
    ${JSON.stringify(deals.map(d => ({
      id: d.id, brand: d.brand, stage: d.stage,
      value: d.value, waiting_on: d.waiting_on,
      next_action: d.next_action, next_action_date: d.next_action_date,
      last_contact: d.last_contact, notes: d.notes?.substring(0, 200)
    })))}
    
    ## Output Format
    Return JSON: { updates: [...], new_deals: [...], summary: "...", suggestions: [...] }
    `;
  }
  ```

- [ ] **[M]** Implement Claude API integration for agent
  ```typescript
  import Anthropic from '@anthropic-ai/sdk';
  
  async function runAgent(prompt: string, emails: EmailSummary[]) {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: prompt,
      messages: [{
        role: 'user',
        content: `Here are the recent emails:\n${JSON.stringify(emails)}\n\nAnalyze these and return your updates.`
      }]
    });
    return parseAgentResponse(response);
  }
  ```

- [ ] **[M]** Implement OpenAI fallback
  ```typescript
  // For cost-sensitive users or if Claude API is down
  import OpenAI from 'openai';
  
  async function runAgentOpenAI(prompt: string, emails: EmailSummary[]) {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Emails:\n${JSON.stringify(emails)}` }
      ]
    });
    return parseAgentResponse(response);
  }
  ```

- [ ] **[M]** Create agent response parser and deal updater
  Reference: template `src/app/api/brandi/sync/route.ts` for update application pattern
  - Parse JSON response from AI
  - Validate all stage transitions
  - Apply updates with optimistic conflict resolution
  - Prepend notes (don't replace)
  - Create new deals with workspace_id
  - Log all changes as activities with actor='agent'

- [ ] **[M]** Create token usage tracking
  ```typescript
  async function trackUsage(workspaceId: string, tokens: number, model: string) {
    const costCents = calculateCost(tokens, model);
    await supabaseAdmin.from('usage_records').insert({
      workspace_id: workspaceId,
      type: 'ai_tokens',
      quantity: tokens,
      metadata: { model, cost_cents: costCents }
    });
    // Update workspace ai_scans_remaining for trial
    if (workspace.plan === 'trial') {
      await supabaseAdmin.from('workspaces')
        .update({ ai_scans_remaining: workspace.ai_scans_remaining - 1 })
        .eq('id', workspaceId);
    }
  }
  ```

- [ ] **[M]** Create scheduled agent runs (cron)
  - Vercel Cron Job: `/api/cron/agent-runs`
  - Runs every 2 hours (configurable per workspace)
  - Fetches all workspaces with agent enabled + premium plan
  - Runs agent for each workspace in parallel (with concurrency limit)
  - Logs results

- [ ] **[S]** Port agent feedback UI
  Reference: template `src/components/BrandiFeedback.tsx` (417 lines)
  - Focus tab: overdue deals, stale deals, AI suggestions
  - Runs tab: run history with stats
  - Feedback tab: chat-style instructions
  - All queries scoped to workspace

- [ ] **[S]** Create agent config UI (`/settings/agent`)
  - Enable/disable agent
  - Set scan frequency (1h, 2h, 4h, 8h, 12h, 24h)
  - Custom instructions textarea
  - View token usage this month
  - View cost this month

---

## Checkpoint 7: Gmail Integration & OAuth per Tenant

**Definition of Done:** Each workspace can connect their Gmail account via OAuth2. Tokens are securely stored and refreshed. Agent can read emails.

**Dependencies:** Checkpoint 2

**Owner:** Developer

### Tasks

- [ ] **[L]** Set up Google Cloud project for OAuth
  - Create project in Google Cloud Console
  - Enable Gmail API
  - Create OAuth 2.0 credentials (web application)
  - Set redirect URI to `https://app.dealflow.io/api/auth/gmail/callback`
  - Request scopes: `gmail.readonly`
  - Submit for verification (takes days/weeks for sensitive scopes)

- [ ] **[M]** Create Gmail OAuth flow
  ```
  /api/auth/gmail/connect -> redirect to Google consent screen
  /api/auth/gmail/callback -> exchange code for tokens, store in agent_configs
  ```
  Reference: template `src/app/api/brandi/gmail/route.ts` for token refresh pattern (lines 3-10)
  
  Changes from template:
  - Template uses env vars for ONE account: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
  - DealFlow stores per-workspace tokens in `agent_configs` table
  - Token refresh happens per-workspace using stored refresh_token

- [ ] **[M]** Create Gmail proxy API route (workspace-scoped)
  Reference: template `src/app/api/brandi/gmail/route.ts` (137 lines)
  
  Port the three actions:
  - `search`: Search emails with query (lines 36-66)
  - `message`: Get full message with body extraction (lines 68-103)
  - `thread`: Get thread metadata (lines 105-129)
  
  Key change: fetch Gmail tokens from `agent_configs` for the workspace, not from env vars

- [ ] **[M]** Implement secure token storage
  - Store access_token and refresh_token in `agent_configs` table
  - Encrypt at rest using Supabase Vault or application-level encryption
  - Refresh tokens before they expire (template pattern: lines 3-10 of gmail/route.ts)
  - Handle token revocation gracefully

- [ ] **[S]** Create Gmail connection status UI
  - Show connected email address
  - Disconnect button
  - Re-authorize button (if token expired)
  - Connection health check

- [ ] **[S]** Handle Gmail API errors
  - 401: token expired, auto-refresh
  - 403: insufficient permissions, prompt re-auth
  - 429: rate limit, back off
  - Notify user if connection is broken

---

## Checkpoint 8: Billing & Subscription Management

**Definition of Done:** Stripe integration works for subscriptions. Users can upgrade/downgrade plans. Usage is metered for AI features. Trial enforcement works.

**Dependencies:** Checkpoint 2

**Owner:** Developer

### Tasks

- [ ] **[L]** Set up Stripe products and prices
  ```
  Products:
  1. DealFlow Base — $29/month or $290/year
     - Unlimited deals
     - 1 workspace
     - Up to 3 team members
     - No AI agent
     
  2. DealFlow Premium — $59/month or $590/year
     - Everything in Base
     - AI agent (unlimited scans)
     - Gmail integration
     - Smart suggestions
     - Up to 5 team members
     
  3. DealFlow Team — $129/month or $1,290/year
     - Everything in Premium
     - Up to 15 team members
     - Advanced analytics
     - Priority support
     - Custom agent instructions
     - API access
  ```

- [ ] **[L]** Create Stripe checkout flow
  ```typescript
  // /api/billing/checkout
  // Creates Stripe Checkout session
  // On success: update workspace plan, stripe_customer_id, stripe_subscription_id
  ```

- [ ] **[M]** Create Stripe webhook handler
  ```typescript
  // /api/webhooks/stripe
  // Handle events:
  // - checkout.session.completed: activate plan
  // - customer.subscription.updated: plan change
  // - customer.subscription.deleted: downgrade to free
  // - invoice.payment_failed: notify user, grace period
  // - invoice.paid: extend subscription
  ```

- [ ] **[M]** Create billing portal route
  ```typescript
  // /api/billing/portal
  // Creates Stripe Customer Portal session
  // User can manage payment method, view invoices, cancel
  ```

- [ ] **[M]** Implement plan enforcement middleware
  ```typescript
  // Check plan limits on every relevant action:
  // - Base: block AI agent access
  // - Premium: allow AI, check usage
  // - Team: allow everything
  // - Trial: check expiry and scan count
  
  function checkPlanLimit(workspace: Workspace, feature: string): boolean {
    const limits = {
      trial: { ai_scans: 10, team_members: 2, deals: 50 },
      base: { ai_scans: 0, team_members: 3, deals: Infinity },
      premium: { ai_scans: Infinity, team_members: 5, deals: Infinity },
      team: { ai_scans: Infinity, team_members: 15, deals: Infinity },
    };
    // ...
  }
  ```

- [ ] **[M]** Create usage metering for AI
  ```typescript
  // Track per-workspace per-month:
  // - Number of AI scans
  // - Total tokens consumed
  // - Estimated cost
  
  // Show on settings page:
  // "This month: 142 scans, ~$14.20 in AI costs (included in Premium)"
  ```

- [ ] **[S]** Create pricing page UI
  - Three-tier pricing cards
  - Annual/monthly toggle
  - Feature comparison table
  - "Current plan" badge for active plan
  - Upgrade/downgrade buttons

- [ ] **[S]** Create trial enforcement
  - Show trial days remaining in header
  - Nag banner when trial < 3 days
  - On trial expiry: disable AI, show upgrade prompt
  - Allow continued use of base features after trial

- [ ] **[S]** Create billing settings page (`/settings/billing`)
  - Current plan display
  - Next billing date
  - Payment method (link to Stripe portal)
  - Usage stats
  - Invoice history (from Stripe)

---

## Checkpoint 9: Team Roles & Permissions

**Definition of Done:** Team members have appropriate access levels. Viewer role is read-only. Admin can manage team. Owner has full control.

**Dependencies:** Checkpoint 2

**Owner:** Developer

### Tasks

- [ ] **[M]** Define role permissions matrix
  ```
  Permission          | Owner | Admin | Member | Viewer
  --------------------|-------|-------|--------|-------
  View deals          |  Y    |  Y    |   Y    |   Y
  Create deals        |  Y    |  Y    |   Y    |   N
  Edit deals          |  Y    |  Y    |   Y    |   N
  Delete deals        |  Y    |  Y    |   N    |   N
  Move deals (DnD)    |  Y    |  Y    |   Y    |   N
  View analytics      |  Y    |  Y    |   Y    |   Y
  Manage team         |  Y    |  Y    |   N    |   N
  Manage billing      |  Y    |  N    |   N    |   N
  Configure agent     |  Y    |  Y    |   N    |   N
  Connect Gmail       |  Y    |  Y    |   N    |   N
  Delete workspace    |  Y    |  N    |   N    |   N
  ```

- [ ] **[M]** Implement client-side permission checks
  ```typescript
  // packages/types/permissions.ts
  const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
    owner: ['*'],
    admin: ['deals.crud', 'team.manage', 'agent.configure', 'analytics.view'],
    member: ['deals.crud', 'analytics.view'],
    viewer: ['deals.view', 'analytics.view'],
  };
  
  function usePermission(permission: Permission): boolean {
    const { role } = useWorkspace();
    return hasPermission(role, permission);
  }
  ```

- [ ] **[M]** Implement server-side permission checks in API routes
  - Verify role on every mutation endpoint
  - Return 403 for unauthorized actions
  - RLS policies already enforce at DB level (from Checkpoint 1)

- [ ] **[S]** Apply viewer restrictions to UI
  - Hide "New Deal" button for viewers
  - Disable drag-and-drop for viewers
  - Disable form fields in DealModal for viewers
  - Show "View Only" badge

- [ ] **[S]** Add activity attribution
  - Log which user made each change
  - Show user name/avatar in activity feed
  - "Kenny moved to Negotiation" vs "Sarah updated value to $1,500"

---

## Checkpoint 10: Calendar View & File Uploads

**Definition of Done:** Calendar view works with workspace-scoped deals. File uploads work with workspace-isolated storage.

**Dependencies:** Checkpoint 3, Checkpoint 4

**Owner:** Developer

### Tasks

- [ ] **[L]** Port `CalendarView.tsx` to multi-tenant
  Reference: template `src/components/CalendarView.tsx` (521 lines)
  Key patterns to preserve:
  - Calendar grid generation (lines 126-139): date-fns startOfMonth/endOfMonth/startOfWeek
  - dealsByDate grouping (lines 112-123): group deals by next_action_date
  - Stage dot colors (lines 23-41): STAGE_DOT_COLORS mapping
  - Day cell rendering (lines 362-435): deal chips with stage colors, click to open modal
  - "Deals without dates" section (lines 442-486): list of unscheduled deals
  - Month navigation (lines 297-322): prev/next/today buttons
  - Stage legend (lines 326-347): colored dots for each stage
  
  Changes:
  - All queries scoped to workspace
  - Spawn child modal uses workspace_id

- [ ] **[M]** Implement workspace-scoped file storage
  Reference: template `DealModal.tsx` FileUploadSection (lines 684-826)
  - Upload path: `{workspace_id}/{deal_slug}/{file_type}-{filename}`
  - Storage policies enforce workspace isolation
  - Public URLs for viewing (same pattern as template)

- [ ] **[S]** Add storage usage tracking
  - Track total storage per workspace
  - Show storage used in settings
  - Free tier: 100MB, Base: 1GB, Premium: 10GB, Team: 50GB

---

## Checkpoint 11: Mobile App Foundation (Expo/React Native)

**Definition of Done:** Expo app runs on iOS and Android simulators. Auth works. Supabase connection works. Navigation is set up.

**Dependencies:** Checkpoint 0, Checkpoint 2

**Owner:** Developer

### Tasks

- [ ] **[L]** Set up Expo project structure
  ```
  apps/mobile/
    app/                    # Expo Router file-based routing
      (auth)/
        sign-in.tsx
        sign-up.tsx
      (app)/
        _layout.tsx         # Tab navigator
        index.tsx           # Board (kanban)
        calendar.tsx        # Calendar view
        settings.tsx        # Settings
        deal/[id].tsx       # Deal detail
    components/
      DealCard.tsx
      Column.tsx
      Dashboard.tsx
      AgentPanel.tsx
    contexts/
      WorkspaceProvider.tsx
    lib/
      supabase.ts           # Mobile Supabase client with SecureStore
    constants/
      stages.ts             # Shared stage definitions
  ```

- [ ] **[M]** Configure Supabase client for React Native
  ```typescript
  // apps/mobile/lib/supabase.ts
  import { createClient } from '@supabase/supabase-js';
  import * as SecureStore from 'expo-secure-store';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  });
  ```

- [ ] **[M]** Implement mobile auth screens
  - Sign-in screen with email/password
  - Sign-up screen with workspace creation
  - Biometric unlock (Face ID / fingerprint) via expo-local-authentication
  - Session persistence with SecureStore

- [ ] **[M]** Set up navigation with Expo Router
  ```
  Tabs:
  1. Board (kanban) — main tab
  2. Calendar — calendar view
  3. Agent — AI agent panel (focus, runs, feedback)
  4. Settings — workspace, team, billing, account
  ```

- [ ] **[S]** Create mobile WorkspaceProvider
  - Same pattern as web but with SecureStore for workspace_id
  - Workspace switcher in settings

- [ ] **[S]** Set up EAS Build configuration
  ```json
  // eas.json
  {
    "build": {
      "development": { "distribution": "internal" },
      "preview": { "distribution": "internal" },
      "production": {}
    }
  }
  ```

- [ ] **[S]** Configure app icons and splash screen
  - DealFlow logo (need design)
  - Splash screen with brand colors

---

## Checkpoint 12: Mobile Kanban & Deal Management

**Definition of Done:** Mobile kanban board works with swipe gestures. Deal modal works with all fields. Data syncs with web in real time.

**Dependencies:** Checkpoint 11

**Owner:** Developer

### Tasks

- [ ] **[L]** Create mobile kanban board
  Reference: template `src/components/KanbanBoard.tsx` for data flow pattern
  
  Mobile-specific implementation:
  - Horizontal scroll for columns (FlatList horizontal)
  - Swipe deal card left/right to move between stages
  - Long-press to open deal modal
  - Pull-to-refresh to sync deals
  - Stage counts in column headers
  - Value totals per column

- [ ] **[L]** Create mobile deal detail screen
  Reference: template `src/components/DealModal.tsx` for fields
  
  Mobile-specific:
  - Full-screen modal (not overlay)
  - Scrollable form
  - Stage selector as horizontal pill bar
  - Auto-save on field blur (same pattern as template)
  - Activity tab with pull-to-refresh
  - File upload with camera integration

- [ ] **[M]** Create mobile deal card component
  Reference: template `src/components/DealCard.tsx` for visual design
  
  Adapt to React Native:
  - Priority left border color
  - Overdue/urgent badges
  - Multi-month indicators
  - Brand name, value, contact, waiting_on, next_action

- [ ] **[M]** Implement swipe-to-move-stage gesture
  ```typescript
  // Swipe right: move to next stage
  // Swipe left: move to previous stage
  // Show stage name overlay during swipe
  // Confirm with haptic feedback
  import { Gesture, GestureDetector } from 'react-native-gesture-handler';
  import * as Haptics from 'expo-haptics';
  ```

- [ ] **[M]** Create mobile dashboard header
  Reference: template `src/components/Dashboard.tsx` for metrics
  - Compact top bar: active deals, overdue count, value summary
  - Expandable for full metrics

- [ ] **[S]** Implement real-time sync
  ```typescript
  // Subscribe to Supabase Realtime for deal changes
  supabase
    .channel('deals')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'deals',
      filter: `workspace_id=eq.${workspaceId}`
    }, (payload) => {
      // Update local state
    })
    .subscribe();
  ```

- [ ] **[M]** Create mobile camera integration for content uploads
  ```typescript
  import * as ImagePicker from 'expo-image-picker';
  
  // Take photo or select from gallery
  // Upload to Supabase Storage
  // Attach to deal as brief/contract/other
  ```

- [ ] **[S]** Create mobile search
  - Search bar at top of board
  - Filter deals by brand name, contact, stage

---

## Checkpoint 13: Mobile Push Notifications & Offline

**Definition of Done:** Users receive push notifications for overdue deals, agent updates, and team changes. App works offline with queued writes.

**Dependencies:** Checkpoint 12

**Owner:** Developer

### Tasks

- [ ] **[L]** Set up Expo Notifications
  ```typescript
  import * as Notifications from 'expo-notifications';
  
  // Register for push notifications
  // Store push token in user profile
  // Send from server via Expo Push API
  ```

- [ ] **[M]** Create notification server
  ```typescript
  // /api/notifications/send
  // Triggers:
  // 1. Deal overdue (daily check at 9 AM user's timezone)
  // 2. Agent completed a run (new deals found, updates made)
  // 3. Team member moved a deal
  // 4. New deal assigned to you
  // 5. Trial expiring (3 days, 1 day, expired)
  ```

- [ ] **[M]** Implement notification preferences
  - Per-user settings: which notifications to receive
  - Quiet hours
  - Per-workspace notification settings

- [ ] **[L]** Implement offline support
  ```typescript
  // Strategy: optimistic updates with queue
  // 1. All reads from local cache (SQLite or AsyncStorage)
  // 2. Writes go to local queue immediately
  // 3. Queue syncs when online
  // 4. Conflict resolution: last-write-wins with timestamps
  
  // Use @supabase/supabase-js offline capabilities
  // Or use expo-sqlite for local cache
  ```

- [ ] **[M]** Implement background sync
  ```typescript
  import * as BackgroundFetch from 'expo-background-fetch';
  
  // Register background task to sync queued writes
  // Also fetch latest deals on background wake
  ```

- [ ] **[S]** Add network status indicator
  - Show offline banner when no connection
  - Show "Syncing..." when reconnecting
  - Show sync errors with retry button

---

## Checkpoint 14: Testing & QA

**Definition of Done:** Core flows have automated tests. Manual QA checklist is completed for web and mobile.

**Dependencies:** Checkpoints 3-10

**Owner:** Developer

### Tasks

- [ ] **[L]** Write integration tests for multi-tenant data isolation
  ```typescript
  // Test: User A cannot see User B's workspace deals
  // Test: RLS policies block cross-workspace queries
  // Test: Workspace member roles are enforced
  // Test: AI agent only processes its workspace's deals
  ```

- [ ] **[L]** Write API route tests
  ```typescript
  // Test: POST /api/deals creates deal in correct workspace
  // Test: PATCH /api/deals only updates deals in user's workspace
  // Test: /api/agent/run respects plan limits
  // Test: /api/webhooks/stripe processes events correctly
  // Test: Gmail OAuth flow stores tokens correctly
  ```

- [ ] **[M]** Write component tests for kanban board
  ```typescript
  // Test: Drag and drop updates deal stage
  // Test: Auto-save fires on blur
  // Test: Multi-month deal creation works
  // Test: Search filters deals correctly
  // Test: Archive toggle works
  ```

- [ ] **[M]** Write E2E tests (Playwright)
  ```typescript
  // Test: Full signup -> create workspace -> add deal -> move through pipeline
  // Test: Team invite -> accept -> view shared board
  // Test: Upgrade plan -> access AI agent
  // Test: Connect Gmail -> run agent -> see results
  ```

- [ ] **[M]** Manual QA checklist for web
  - [ ] Sign up with new account
  - [ ] Create workspace
  - [ ] Create deal, edit all fields
  - [ ] Drag deal between stages
  - [ ] Multi-month deal creation and child spawning
  - [ ] File upload (brief and contract)
  - [ ] Calendar view navigation and deal display
  - [ ] Invite team member, accept invite
  - [ ] Role restrictions (viewer cannot edit)
  - [ ] Upgrade to premium
  - [ ] Connect Gmail
  - [ ] Run AI agent
  - [ ] View agent results in panel
  - [ ] Submit agent feedback
  - [ ] Export deals
  - [ ] Mobile responsive layout

- [ ] **[M]** Manual QA checklist for mobile
  - [ ] Sign in / sign up
  - [ ] View kanban board
  - [ ] Swipe deal between stages
  - [ ] Open deal detail, edit fields
  - [ ] Upload photo from camera
  - [ ] Receive push notification
  - [ ] Work offline, sync on reconnect
  - [ ] View AI agent panel
  - [ ] Switch workspaces
  - [ ] Biometric unlock

- [ ] **[S]** Performance testing
  - Load test with 100+ deals per workspace
  - Test with 50+ workspaces (multi-tenant)
  - Measure API response times
  - Check mobile app startup time

---

## Checkpoint 15: Deployment & Infrastructure

**Definition of Done:** Web app is deployed to production. Mobile app is submitted to app stores. Infrastructure is production-ready.

**Dependencies:** All previous checkpoints

**Owner:** Developer

### Tasks

- [ ] **[M]** Deploy web app to Vercel
  - Create new Vercel project for `apps/web`
  - Set all environment variables
  - Configure custom domain: `app.dealflow.io`
  - Set up preview deployments for PRs

- [ ] **[M]** Configure Supabase for production
  - Enable connection pooling (PgBouncer)
  - Set up database backups
  - Configure RLS policies (already done in migrations)
  - Enable Realtime for deals table
  - Set up Supabase Vault for sensitive data (Gmail tokens)

- [ ] **[M]** Deploy mobile app with EAS
  ```bash
  # Build for iOS
  eas build --platform ios --profile production
  
  # Build for Android
  eas build --platform android --profile production
  
  # Submit to App Store
  eas submit --platform ios
  
  # Submit to Play Store
  eas submit --platform android
  ```

- [ ] **[L]** App Store submission preparation
  - [ ] App icon (1024x1024)
  - [ ] Screenshots for all required device sizes (iPhone, iPad)
  - [ ] App description (short + long)
  - [ ] Keywords for ASO
  - [ ] Privacy policy URL
  - [ ] Terms of service URL
  - [ ] App Review notes (demo account credentials)
  - [ ] Age rating questionnaire
  - [ ] Export compliance declaration
  - [ ] Content rights declaration

- [ ] **[L]** Play Store submission preparation
  - [ ] Feature graphic (1024x500)
  - [ ] Screenshots for phone and tablet
  - [ ] Short description (80 chars)
  - [ ] Full description (4000 chars)
  - [ ] Content rating questionnaire
  - [ ] Data safety form
  - [ ] Privacy policy URL
  - [ ] Target audience declaration

- [ ] **[M]** Set up monitoring and alerting
  - Vercel Analytics for web performance
  - Sentry for error tracking (web + mobile)
  - Supabase Dashboard for DB monitoring
  - Stripe Dashboard for billing monitoring
  - Uptime monitoring (Vercel, Better Uptime, or similar)

- [ ] **[S]** Set up logging
  - Structured logging for API routes
  - Agent run logging (tokens, cost, duration)
  - Error logging to Sentry

- [ ] **[S]** Configure CDN and caching
  - Static assets via Vercel CDN
  - API response caching where appropriate
  - Supabase edge functions if needed

- [ ] **[S]** Set up staging environment
  - Separate Vercel project: `staging.dealflow.io`
  - Separate Supabase project for staging
  - Stripe test mode for staging

---

## Checkpoint 16: Landing Page & Marketing Site

**Definition of Done:** Landing page is live, SEO-optimized, and converts visitors to signups. Case study with MissLizDidIt is featured.

**Dependencies:** Checkpoint 15 (deployment)

**Owner:** Developer + Marketing Agent

### Tasks

- [ ] **[L]** Build landing page (`apps/landing`)
  - Hero section: tagline, CTA, product screenshot
  - Features section: kanban, AI agent, Gmail, mobile, team
  - Pricing section: three tiers with comparison
  - Case study: MissLizDidIt testimonial with real metrics
  - FAQ section
  - Footer: links, legal, social

- [ ] **[M]** SEO optimization
  - Meta tags, Open Graph, Twitter cards
  - Structured data (JSON-LD)
  - Sitemap.xml
  - robots.txt
  - Page speed optimization (< 3s load)

- [ ] **[S]** Set up analytics
  - Google Analytics 4
  - Plausible or Fathom (privacy-friendly alternative)
  - Conversion tracking (signup, upgrade events)

- [ ] **[S]** Create blog (`/blog`)
  - MDX-based blog with Next.js
  - Categories: tutorials, case studies, product updates, creator economy
  - Initial posts: "Why Creators Need a Deal Pipeline" etc.

- [ ] **[S]** Set up email capture
  - Early access signup form
  - Mailchimp or ConvertKit integration
  - Welcome email sequence

---

## Checkpoint 17: Launch Preparation

**Definition of Done:** Product is launched on all channels. Early users are onboarded. Feedback loop is established.

**Dependencies:** All previous checkpoints

**Owner:** Marketing Agent + Developer

### Tasks

- [ ] **[M]** Product Hunt launch preparation
  - Create Product Hunt page
  - Prepare screenshots, GIF, and video
  - Write description
  - Line up upvotes from community
  - Schedule for Tuesday launch (best day)

- [ ] **[M]** Creator community outreach
  - Post in r/influencer, r/NewTubers, r/InstagramMarketing
  - Share in creator economy Discord servers
  - TikTok/Instagram about the tool
  - Newsletter outreach (The Creator Economy Newsletter, Creator Economy)

- [ ] **[S]** Beta user onboarding
  - Invite 10-20 beta users
  - Offer 3 months free Premium for feedback
  - Schedule onboarding calls
  - Create feedback collection system

- [ ] **[S]** Documentation
  - Help center / knowledge base
  - Getting started guide
  - API documentation (for Team plan)
  - Video tutorials

- [ ] **[S]** Legal
  - Terms of Service
  - Privacy Policy
  - Data Processing Agreement
  - Cookie Policy

---

## Checkpoint 18: Post-Launch & Iteration

**Definition of Done:** Product is live with paying users. Feedback is being collected and prioritized. Iteration cycle is running.

**Dependencies:** Checkpoint 17

**Owner:** All agents

### Tasks

- [ ] **[M]** Set up user feedback collection
  - In-app feedback widget
  - NPS survey (after 7 days, 30 days)
  - User interviews (monthly)
  - Feature request board (Canny or similar)

- [ ] **[M]** Monitor key metrics
  - Daily Active Users (DAU)
  - Weekly Active Users (WAU)
  - Monthly Recurring Revenue (MRR)
  - Churn rate
  - Feature adoption rates
  - AI agent usage per workspace
  - Customer Acquisition Cost (CAC)

- [ ] **[M]** Implement v1.1 features based on feedback
  - Priority: whatever users request most
  - See Feature Planning Agent Brief for roadmap

- [ ] **[S]** Set up customer support
  - Intercom or Crisp for live chat
  - Help center with searchable articles
  - Email support: support@dealflow.io

---

## Pricing Model

### AI Token Cost Analysis

**Claude API (Anthropic):**
| Model | Input (per M tokens) | Output (per M tokens) |
|-------|---------------------|----------------------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |
| Claude Haiku | $0.25 | $1.25 |

**OpenAI:**
| Model | Input (per M tokens) | Output (per M tokens) |
|-------|---------------------|----------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |

**Estimated tokens per agent run:**
- System prompt (pipeline rules, deal context, feedback): ~5,000-8,000 input tokens
- Email content (5-15 email summaries): ~5,000-12,000 input tokens
- Agent response (deal updates, summary, suggestions): ~2,000-5,000 output tokens
- **Total per run: ~12,000-25,000 tokens**

**Cost per run:**
| Model | Input cost | Output cost | Total per run |
|-------|-----------|-------------|---------------|
| Claude Sonnet 4 | $0.024-$0.075 | $0.030-$0.075 | $0.054-$0.150 |
| GPT-4o | $0.025-$0.063 | $0.020-$0.050 | $0.045-$0.113 |
| GPT-4o-mini | $0.002-$0.004 | $0.001-$0.003 | $0.003-$0.007 |
| Claude Haiku | $0.002-$0.006 | $0.003-$0.006 | $0.005-$0.013 |

**Monthly cost per user (at 7 runs/day = 210 runs/month):**
| Model | Low estimate | High estimate |
|-------|-------------|---------------|
| Claude Sonnet 4 | $11.34/month | $31.50/month |
| GPT-4o | $9.45/month | $23.73/month |
| GPT-4o-mini | $0.63/month | $1.47/month |
| Claude Haiku | $1.05/month | $2.73/month |

**Recommended approach:** Use GPT-4o-mini or Claude Haiku for initial scanning/classification, escalate to Sonnet/GPT-4o only for complex deal analysis. Estimated blended cost: **$3-8/month per user**.

### Pricing Tiers

```
Plan        | Monthly | Annual (save 17%) | AI Scans    | Team Size | Margin
------------|---------|-------------------|-------------|-----------|-------
Free Trial  | $0      | N/A               | 10 total    | 2         | N/A
Base        | $29     | $290/year         | None        | 3         | ~95%
Premium     | $59     | $590/year         | Unlimited*  | 5         | ~85%
Team        | $129    | $1,290/year       | Unlimited*  | 15        | ~90%
```

*Unlimited = up to 12 runs/day. Burst usage above that is rate-limited, not billed extra.

### Competitor Pricing Comparison

| Tool | Free Tier | Starter | Pro | Enterprise | AI Features |
|------|-----------|---------|-----|------------|-------------|
| **DealFlow** | 14-day trial | $29/mo | $59/mo | $129/mo | AI agent, Gmail scanning |
| Honeybook | No | $16/mo | $32/mo | $66/mo | Basic AI |
| Grin | No | Custom | Custom | Custom | None built-in |
| AspireIQ | No | Custom | Custom | Custom | None built-in |
| CreatorIQ | No | Custom | Custom | Custom | Basic |
| Beacons | Free | $30/mo | $50/mo | Custom | Basic AI |
| Stan Store | $29/mo | $29/mo | N/A | N/A | None |
| Collabstr | Free | $25/mo | $45/mo | Custom | None |
| Koji | Free | Free | N/A | N/A | None |

**DealFlow differentiators:**
1. Only tool with AI agent that actively scans emails and manages pipeline
2. Purpose-built for brand deal tracking (not general CRM)
3. Mobile app with swipe-based kanban
4. Transparent, affordable pricing (vs. enterprise-only competitors)
5. Built by a creator, for creators (MissLizDidIt story)

### Unit Economics

```
Target metrics (Year 1):
- CAC: $50-80 (blended across channels)
- LTV: $500-800 (average 12-18 month retention)
- LTV:CAC ratio: 8-10x (healthy)
- Payback period: 2-3 months
- Monthly churn target: <5%
- ARPU: $45/month (blended across plans)

Revenue projections:
- Month 3: 100 users, $4,500 MRR
- Month 6: 500 users, $22,500 MRR
- Month 12: 2,000 users, $90,000 MRR
- Month 18: 5,000 users, $225,000 MRR
```

---

## Multi-Tenant Architecture (Detailed)

### Data Model

```
                   +-----------------+
                   |   workspaces    |
                   +-----------------+
                   | id              |
                   | name            |
                   | slug            |
                   | owner_id -------|-----> auth.users
                   | plan            |
                   | stripe_*        |
                   | ai_*            |
                   +--------+--------+
                            |
              +-------------+-------------+
              |             |             |
    +---------v---------+   |   +---------v---------+
    | workspace_members |   |   |  agent_configs    |
    +-------------------+   |   +-------------------+
    | workspace_id      |   |   | workspace_id      |
    | user_id           |   |   | gmail_*           |
    | role              |   |   | personality       |
    +-------------------+   |   | scan_frequency    |
                            |   +-------------------+
              +-------------+-------------+
              |             |             |
    +---------v----+  +-----v------+  +---v-----------+
    |    deals     |  | agent_runs |  | agent_feedback|
    +--------------+  +------------+  +---------------+
    | workspace_id |  | workspace_id|  | workspace_id |
    | brand        |  | summary    |  | message      |
    | stage        |  | tokens_used|  | author       |
    | value        |  | cost_cents |  +---------------+
    | ...          |  +------------+
    +------+-------+
           |
    +------v-----------+
    | deal_activities   |
    +------------------+
    | workspace_id     |
    | deal_id          |
    | note             |
    | actor            |
    +------------------+
```

### RLS Policy Architecture

Every table has `workspace_id` as the partition key. RLS policies use the `is_workspace_member()` function to check if the requesting user belongs to the workspace.

**Query flow:**
1. Client makes Supabase query with auth token
2. Supabase extracts `auth.uid()` from JWT
3. RLS policy calls `is_workspace_member(workspace_id)` which checks `workspace_members` table
4. Only rows where the user is a member are returned

**Service key bypass:** API routes that use `supabaseAdmin` (service key) bypass RLS. Used for:
- Agent runs (scheduled, no user context)
- Webhook handlers (Stripe, no user context)
- Admin operations

### Gmail OAuth Flow per Tenant

```
1. User clicks "Connect Gmail" in workspace settings
2. Frontend redirects to: GET /api/auth/gmail/connect?workspace_id=xxx
3. Server generates Google OAuth URL with state={workspace_id}
4. User authorizes in Google consent screen
5. Google redirects to: GET /api/auth/gmail/callback?code=xxx&state=xxx
6. Server exchanges code for tokens (access_token + refresh_token)
7. Server stores tokens in agent_configs for the workspace (encrypted)
8. Server updates workspace: gmail_connected = true
9. Server redirects to workspace settings with success message
```

**Token lifecycle:**
- Access tokens expire after 1 hour
- Before each Gmail API call, check if token is expired
- If expired, use refresh_token to get new access_token (same pattern as template `src/app/api/brandi/gmail/route.ts` lines 3-10)
- Store new access_token and expiry in agent_configs

### AI Agent Provisioning per Workspace

Each workspace gets its own agent "instance" (not a separate process, but a separate context):

1. **Config** (`agent_configs`): stores personality, custom instructions, scan frequency, Gmail tokens
2. **Context** (built per run): current deals, recent feedback, pipeline rules
3. **Execution** (on demand or cron): API call to Claude/OpenAI with workspace-specific prompt
4. **Results** (`agent_runs`): stored per workspace with token usage tracking
5. **Metering** (`usage_records`): tracks AI cost per workspace per month

### Token Usage Metering and Billing

```
Per agent run:
1. Before run: check workspace plan allows AI (premium/team/trial-with-remaining)
2. Run agent, capture token counts from API response
3. After run: insert usage_record with tokens + cost
4. If trial: decrement ai_scans_remaining
5. Monthly: aggregate usage for billing dashboard

Stripe integration:
- Not usage-based billing (flat rate per plan)
- Usage data is for internal monitoring and plan enforcement
- Show users their AI usage in settings (transparency)
```

### Data Isolation and Security

1. **Row-level:** RLS policies on every table
2. **Storage-level:** Storage policies enforce workspace path isolation
3. **API-level:** Every API route validates workspace membership
4. **Token-level:** Gmail tokens encrypted at rest
5. **Network-level:** Supabase SSL, Vercel HTTPS
6. **Backup:** Supabase automated daily backups
7. **Deletion:** CASCADE on workspace delete removes all workspace data
8. **Audit:** deal_activities table logs all changes with actor attribution

---

## Mobile App Architecture (Detailed)

### Tech Stack

```
Framework: Expo SDK 52+ with Expo Router
Language: TypeScript
State: React Context (matching web pattern) + Supabase Realtime
Navigation: Expo Router (file-based)
Auth: Supabase Auth + expo-secure-store
Gestures: react-native-gesture-handler + react-native-reanimated
Notifications: expo-notifications
Camera: expo-image-picker
Offline: @supabase/supabase-js cache + expo-sqlite (optional)
```

### Shared Code Strategy

```
packages/
  types/          # TypeScript types shared between web and mobile
  api-client/     # API client with Supabase queries, shared logic
  
Shared via packages:
  - Deal type definitions
  - Stage constants and colors
  - API query builders
  - Business logic (parseValue, isOverdue, etc.)
  - Permission checking logic

Platform-specific:
  - UI components (React DOM vs React Native)
  - Navigation (Next.js routing vs Expo Router)
  - Storage (localStorage vs SecureStore)
  - Notifications (web push vs Expo push)
  - Gestures (dnd-kit vs gesture-handler)
```

### Push Notification Architecture

```
1. App startup: register for push notifications via Expo
2. Get Expo push token
3. Store token in user_push_tokens table (user_id, token, platform, workspace_id)
4. Server sends notifications via Expo Push API

Notification triggers (server-side cron jobs):
- Daily 9AM: overdue deal reminders
- On agent run complete: "Brandi found 3 new deals"
- On team activity: "Kenny moved Aleve to Content"
- Trial expiring: 3 days, 1 day, 0 days

Notification payload:
{
  to: "ExponentPushToken[xxx]",
  title: "3 deals overdue",
  body: "Flexsteel, JLab, and Aleve need attention",
  data: { type: "overdue", workspace_id: "xxx" }
}

Deep linking:
- Tap notification -> open app -> navigate to relevant screen
- "overdue" -> Board view
- "deal_update" -> Deal detail
- "agent_run" -> Agent panel
```

### Swipe-Based Kanban for Mobile

```
Implementation with react-native-gesture-handler:

1. Each DealCard is wrapped in a PanGestureHandler
2. Horizontal swipe detection:
   - Swipe right > 100px: move to NEXT stage
   - Swipe left > 100px: move to PREVIOUS stage
3. Visual feedback during swipe:
   - Card follows finger horizontally
   - Background shows target stage name + color
   - Right side: green with next stage name
   - Left side: orange with previous stage name
4. On release:
   - If past threshold: animate card out, apply stage change, animate new card in
   - If not past threshold: snap back with spring animation
5. Haptic feedback: light on threshold, medium on release

Column navigation:
- Horizontal FlatList of columns
- Each column is a vertical FlatList of cards
- Snap to column center on scroll end
- Column indicator dots at bottom
```

### Offline Support Strategy

```
Architecture: Cache-first with background sync

READ path:
1. Query Supabase -> return data -> cache locally
2. On subsequent reads, return cached data immediately
3. Background: check for updates, merge into cache
4. Show "Last synced: 5 min ago" indicator

WRITE path:
1. Apply change to local cache immediately (optimistic)
2. Queue write operation in pending_operations table
3. When online: process queue in order
4. On conflict: last-write-wins (server timestamp)
5. If server rejects: revert local change, show error

Conflict resolution:
- Each deal has updated_at timestamp
- On sync: compare local updated_at with server
- If server is newer: merge (server wins for conflicting fields)
- If local is newer: push local changes
- If both changed same field: server wins, log conflict

Cache storage:
- AsyncStorage for small data (deal list, user prefs)
- expo-sqlite for larger datasets (activities, agent runs)
- Cache invalidation: on Realtime event or manual refresh
```

### App Store / Play Store Submission Checklist

**iOS App Store:**
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect setup
- [ ] Bundle identifier: `io.dealflow.app`
- [ ] Provisioning profiles configured in EAS
- [ ] App icon: 1024x1024 PNG (no transparency)
- [ ] Screenshots: 6.7", 6.5", 5.5" iPhone + iPad Pro
- [ ] App Preview video (optional, recommended)
- [ ] Description: features, benefits, pricing
- [ ] Keywords (100 char limit): "brand deals, influencer, creator, pipeline, kanban, CRM"
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Marketing URL (landing page)
- [ ] App Review information: demo account, notes
- [ ] In-App Purchases: link to Stripe (external, must follow Apple guidelines)
  - Note: Apple requires in-app purchase for digital goods/services
  - DealFlow is a SaaS tool (reader rule exception may apply)
  - Consult Apple guidelines or use StoreKit for subscriptions
- [ ] Data collection disclosures (App Privacy)
- [ ] Export compliance (no encryption beyond HTTPS = "No")
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Build uploaded via EAS Submit

**Google Play Store:**
- [ ] Google Developer Account ($25 one-time)
- [ ] Google Play Console setup
- [ ] Package name: `io.dealflow.app`
- [ ] Signing key configured in EAS
- [ ] Feature graphic: 1024x500
- [ ] App icon: 512x512 PNG
- [ ] Screenshots: phone (min 2) + 7" tablet + 10" tablet
- [ ] Short description (80 chars): "AI-powered brand deal tracker for creators"
- [ ] Full description (4000 chars)
- [ ] Content rating: IARC questionnaire
- [ ] Data safety form: what data is collected, shared, encrypted
- [ ] Privacy Policy URL
- [ ] Target audience: 18+ (business tool)
- [ ] App category: Business
- [ ] Country/region availability
- [ ] Pricing: Free (subscriptions via Stripe)
- [ ] Build uploaded via EAS Submit

---

## Marketing Agent Brief

> Full prompt for the Marketing Agent. Copy-paste to launch.

---

### MARKETING AGENT: DealFlow Launch Strategy

**You are a marketing strategist for DealFlow**, an AI-powered brand deal tracker built for content creators and influencers. Your job is to research the competitive landscape, develop messaging, and create a complete go-to-market strategy.

#### About DealFlow

DealFlow is a multi-tenant SaaS + mobile app that helps influencers manage brand partnerships through a visual kanban pipeline. Key differentiators:

1. **13-stage kanban pipeline** purpose-built for brand deals (Outreach -> Pitched -> Negotiation -> Agreed -> Contract -> Content -> Approval -> Scheduled -> Delivered -> Invoiced -> Paid -> Complete)
2. **AI agent** that scans Gmail every 2 hours, creates/updates deals, tracks follow-ups, and moves cards between stages
3. **Mobile app** with swipe-based kanban
4. **Multi-month deal management** (parent/child cards for recurring partnerships)
5. **Built by a real creator** -- MissLizDidIt (Liz) uses the original version daily to manage her brand deals

**Pricing:** Free trial (14 days), Base ($29/mo), Premium ($59/mo with AI), Team ($129/mo)

#### Task 1: Competitive Analysis

Research these competitors in detail. For each, document:
- Target audience
- Core features
- Pricing model
- Strengths and weaknesses
- User reviews (G2, Capterra, Reddit, Twitter)
- What DealFlow does better

**Competitors to analyze:**
1. **Honeybook** -- All-in-one business management for creatives. Broad, not influencer-specific. $16-66/mo.
2. **Lumanu** -- Payment and tax management for creators. Focuses on payment, not pipeline.
3. **Grin** -- Influencer marketing platform (brand-side). Enterprise, not for creators.
4. **AspireIQ (now Aspire)** -- Brand-side influencer platform. Enterprise pricing, not creator-facing.
5. **CreatorIQ** -- Enterprise brand-side platform. Not for individual creators.
6. **Koji** -- Link-in-bio with mini-apps. Free, broad, not deal-focused.
7. **Beacons** -- Creator hub with link-in-bio, invoicing, media kit. $0-50/mo.
8. **Stan Store** -- Creator storefront. $29/mo. Not deal-tracking focused.
9. **Collabstr** -- Marketplace connecting creators with brands. $0-45/mo.
10. **Notion/Airtable/Trello** -- Generic tools creators hack together for deal tracking.

#### Task 2: Messaging Framework

Develop messaging for three audiences:
1. **Micro-influencers** (10K-100K followers): Overwhelmed by email, losing track of deals, need simple tool
2. **Mid-tier creators** (100K-500K): Managing multiple simultaneous deals, need pipeline visibility
3. **UGC creators**: Creating content for brands without posting, need contract/invoice tracking

For each audience, write:
- Primary headline (7 words max)
- Supporting headline (15 words max)
- Three value propositions (one sentence each)
- Objection handling (3 common objections + responses)
- Social proof angle

#### Task 3: Landing Page Copy

Write complete landing page copy:
- Hero section (headline, subheadline, CTA)
- "The Problem" section (pain points creators face)
- "The Solution" section (how DealFlow works, with feature highlights)
- Social proof section (MissLizDidIt case study, metrics)
- Feature deep-dive (3-4 sections with screenshots)
- Pricing section (three tiers, feature comparison)
- FAQ (10 questions)
- Final CTA

#### Task 4: Launch Strategy

**Phase 1: Pre-launch (2 weeks before)**
- Build waitlist with early access form
- Reach out to 50 creator economy newsletters for launch coverage
- Create 3 TikTok/Reels showing the product in action
- Write 5 blog posts for SEO
- Set up Product Hunt ship page

**Phase 2: Launch Day**
- Product Hunt launch (Tuesday, 12:01 AM PST)
- Email waitlist
- Post in all creator communities (Reddit, Discord, Facebook groups)
- Twitter/X thread announcing the product
- Instagram carousel showing features

**Phase 3: Post-launch (4 weeks after)**
- Content marketing: 2 blog posts/week
- Creator spotlights: feature early users
- Partnership outreach to talent agencies and MCNs
- Paid ads testing (Instagram, TikTok, Google)

**Specific creator communities to target:**
- r/influencer, r/NewTubers, r/InstagramMarketing, r/Twitch
- Creator Economy Discord servers
- Facebook groups: "Influencer Marketing", "Brand Deals for Creators", "UGC Creators"
- Newsletters: The Creator Economy, Creator Economy (by Peter Yang), Creator Science

#### Task 5: Social Proof Strategy

MissLizDidIt (Liz) is the flagship user. Build a case study around:
- How many deals she manages
- How much pipeline value she tracks
- How the AI agent saves her time (specific hours/week)
- Quote from Liz about the tool
- Before/after: spreadsheet chaos vs. organized pipeline

Additional social proof to develop:
- Beta user testimonials (collect during beta)
- "Trusted by X creators managing $Y in brand deals"
- Video testimonial from Liz

#### Task 6: Content Marketing Plan

**Blog posts (prioritized by SEO value):**
1. "How to Track Brand Deals as a Creator (Ultimate Guide)"
2. "DealFlow vs Honeybook: Which is Better for Influencers?"
3. "The Complete Guide to Negotiating Brand Deals"
4. "How AI is Changing Influencer Marketing"
5. "Brand Deal Pipeline: The Secret Top Creators Use"
6. "How MissLizDidIt Manages 20+ Brand Deals with DealFlow"
7. "Creator Economy Tools: The 2026 Stack"
8. "From Pitch to Payment: Automating Your Brand Deal Workflow"
9. "Why Spreadsheets Are Killing Your Brand Deal Revenue"
10. "How to Follow Up on Brand Deals Without Being Annoying"

**SEO keywords to target:**
- "brand deal tracker" (low competition, high intent)
- "influencer CRM" (medium competition)
- "how to track brand deals" (informational, top of funnel)
- "creator brand deal management" (low competition)
- "AI for influencers" (emerging keyword)

#### Task 7: Paid Acquisition Strategy

**Channels to test (ordered by expected ROI):**
1. **Instagram Ads** -- Target creator audiences, carousel format showing product
2. **TikTok Ads** -- Short demo video ads, target 18-35 creator demographics
3. **Google Ads** -- Search ads for "brand deal tracker", "influencer CRM", "creator tools"
4. **YouTube Ads** -- Pre-roll on creator education videos
5. **Reddit Ads** -- Target r/influencer, r/NewTubers

**Budget allocation (first 3 months):**
- Month 1: $2,000 total -- Instagram ($800), TikTok ($600), Google ($600)
- Month 2: Double down on best performer
- Month 3: Scale winner, test YouTube/Reddit

**CAC targets:**
- Organic: $10-20
- Paid Instagram: $40-60
- Paid TikTok: $30-50
- Paid Google: $50-80
- Blended target: $50-80

#### Task 8: Partnership Strategy

**Talent agencies and MCNs to approach:**
- Viral Nation, Whalar, Obviously, The Influencer Marketing Factory
- Pitch: "Free DealFlow Team plan for your talent roster"
- Value prop: better pipeline visibility for the agency + happier creators

**Creator education platforms:**
- Thinkific/Teachable course creators who teach brand deals
- Offer affiliate deal: 30% recurring commission

**Tech partnerships:**
- Stripe Atlas (creator business formation + DealFlow for deal tracking)
- Beacons/Linktree (integration: link-in-bio with deal tracking)
- QuickBooks/FreshBooks (integration: invoice sync)

---

## Researcher Agent Brief

> Full prompt for the Researcher Agent. Copy-paste to launch.

---

### RESEARCHER AGENT: Creator Economy Market Analysis

**You are a market researcher** analyzing the creator economy to inform DealFlow's product and go-to-market strategy. Your research should be data-driven, cite sources, and produce actionable insights.

#### Research Area 1: Creator Economy Market Size

Research and document:
- Total creator economy market size (2024-2026 data)
- Growth rate and projections (2026-2030)
- Breakdown by platform: Instagram, TikTok, YouTube, Twitch, Podcasts
- Breakdown by monetization: brand deals, subscriptions, tips, merch, courses
- Brand deal market specifically: how much do brands spend on influencer marketing annually?
- Average brand deal value by creator tier

**Key data points to find:**
- Goldman Sachs estimate: $250B by 2027
- Influencer Marketing Hub annual report
- SignalFire creator economy data
- HypeAuditor State of Influencer Marketing
- Statista creator economy data

#### Research Area 2: Creator Tools Landscape

Map the current tool ecosystem creators use:
- **Deal tracking:** What do creators currently use? (Spreadsheets, Notion, Airtable, nothing)
- **Invoicing:** Honeybook, QuickBooks, Wave, PayPal invoicing
- **Communication:** Gmail, Instagram DMs, TikTok messages
- **Content planning:** Later, Planoly, Buffer, Hootsuite
- **Analytics:** Social Blade, HypeAuditor, native analytics
- **Link-in-bio:** Linktree, Beacons, Koji, Stan Store
- **Contracts:** HelloSign, DocuSign, manual PDFs

For each category:
- What percentage of creators use dedicated tools vs. free/manual methods?
- What are the pain points with current solutions?
- Where is the biggest gap?

#### Research Area 3: Underserved Creator Segments

Analyze these segments for DealFlow targeting:

**Micro-influencers (10K-100K followers):**
- Population size
- Average brand deal frequency (deals per month)
- Average deal value
- Current tool usage
- Willingness to pay for deal management
- Pain points specific to this segment

**UGC creators:**
- Market size and growth
- How they find brands (platforms, marketplaces, outreach)
- Average deal value
- Typical deal volume
- Unique needs (no posting, just content creation + delivery)

**Nano-creators (1K-10K followers):**
- Are they doing brand deals? At what rate?
- Is this segment worth targeting? (Deal volume may be too low)
- What would make them pay for a tool?

**Multi-platform creators:**
- How many creators are active on 3+ platforms?
- How does multi-platform affect deal complexity?
- Need for cross-platform deal tracking

#### Research Area 4: Pricing Sensitivity

Research what creators pay for tools:
- Survey data on creator tool spending (monthly)
- Price points of existing creator tools (compile table)
- Willingness to pay for AI-powered features specifically
- Free vs. paid adoption rates in creator tools
- Premium feature adoption rates

**Key questions:**
- What is the maximum a micro-influencer would pay monthly for deal management?
- Does AI agent feature justify a $30 premium over base?
- Is annual pricing preferred? What discount drives annual adoption?
- How price-sensitive are creators at different tiers?

#### Research Area 5: Churn Patterns in Creator SaaS

Research retention and churn in creator economy SaaS:
- Average churn rate for creator tools
- Top reasons creators cancel subscriptions
- Seasonality: do creators cancel in slow months?
- Correlation between deal volume and retention
- Features that drive retention vs. features that drive acquisition

**Specific data to find:**
- Honeybook retention rates (public data, analyst reports)
- Beacons churn data (if available)
- General SaaS churn benchmarks for comparison
- Creator income seasonality (Q4 peak for brand deals)

#### Research Area 6: AI Agent Cost Analysis

Detailed cost modeling for the AI agent feature:

**Variables to model:**
- Tokens per scan: 15-25K (system prompt + email content + response)
- Scans per day per user: 1-12 (configurable)
- Model options: Claude Sonnet ($3/$15 per M), Claude Haiku ($0.25/$1.25), GPT-4o ($2.50/$10), GPT-4o-mini ($0.15/$0.60)
- Token usage by scan complexity (quick scan vs. deep analysis)

**Questions to answer:**
- At $59/month premium price, what is the maximum AI cost per user before it's unprofitable?
- What is the optimal scan frequency (cost vs. value tradeoff)?
- Should heavy users pay more? (Usage-based pricing analysis)
- Can intelligent scan scheduling reduce costs? (Skip scans when no new emails)

#### Research Area 7: Competitive Feature Matrix

Build a detailed comparison table:

| Feature | DealFlow | Honeybook | Beacons | Collabstr | Notion* | Airtable* |
|---------|----------|-----------|---------|-----------|---------|-----------|
| Kanban pipeline | | | | | | |
| Brand deal specific stages | | | | | | |
| AI email scanning | | | | | | |
| Gmail integration | | | | | | |
| Mobile app | | | | | | |
| Multi-month deals | | | | | | |
| Team collaboration | | | | | | |
| File uploads | | | | | | |
| Invoicing | | | | | | |
| Contracts | | | | | | |
| Analytics/reporting | | | | | | |
| Calendar view | | | | | | |
| API access | | | | | | |
| Custom stages | | | | | | |
| Drag-and-drop | | | | | | |
| Offline mode | | | | | | |
| Push notifications | | | | | | |

*Notion/Airtable = common DIY solutions creators use

Fill in with Y/N/Partial and notes.

#### Research Area 8: User Personas

Develop 4 detailed user personas:

**Persona 1: Sarah the Micro-Influencer**
- Demographics, platform, niche, follower count
- Monthly brand deals (volume and value)
- Current workflow (tools, pain points)
- Goals and motivations
- Why she would/wouldn't pay for DealFlow

**Persona 2: Marcus the Multi-Platform Creator**
- Demographics, platforms (YouTube + TikTok + Instagram)
- Deal complexity (multi-deliverable, multi-platform)
- Team situation (solo vs. manager)
- Pain points, willingness to pay

**Persona 3: Jessica the UGC Creator**
- Demographics, specialization
- High deal volume, lower value per deal
- Needs: batch management, content delivery tracking
- Contract/invoice pain points

**Persona 4: Alex the Creator Agency Manager**
- Manages 10-20 creators
- Needs: team view, multi-workspace, reporting
- Decision-maker for tool adoption
- Budget: per-creator spending tolerance

For each persona: day-in-the-life scenario, deal tracking workflow, feature priorities, pricing sensitivity.

---

## Feature Planning Agent Brief

> Full prompt for the Feature Planning Agent. Copy-paste to launch.

---

### FEATURE PLANNING AGENT: DealFlow Product Roadmap

**You are a product manager** responsible for DealFlow's feature roadmap. Your job is to prioritize features, define the MVP, plan future releases, and design the evolution of the AI agent system.

#### Context: Existing Features (from template)

The brand deal tracker already has these features, which form the DealFlow MVP:

1. **13-stage kanban pipeline** with drag-and-drop (dnd-kit)
2. **Deal cards** with: brand, value, contact, priority, waiting_on, next_action, deal type (ugc/posted/hybrid)
3. **Deal modal** with auto-save on blur, file uploads (brief + contract), multi-month deal management
4. **Dashboard** with value breakdowns (potential/agreed/active/paid), overdue alerts, stage counts
5. **Calendar view** with deal dots by next_action_date
6. **AI agent panel** with Focus (overdue/stale/suggestions), Run History, Feedback chat
7. **Multi-month deals** with parent/child cards
8. **Activity logging** with user/agent attribution
9. **Search** and archive filter

#### Task 1: Feature Roadmap

Define features for each release:

**MVP (v1.0) -- Launch:**
List the minimum features needed to launch. This should be the existing features above, adapted for multi-tenant, plus:
- Multi-tenant with workspace_id
- Stripe billing (3 tiers)
- Team invite/roles
- Gmail OAuth per workspace
- AI agent per workspace
- Mobile app (basic kanban + deal detail)

**v1.1 (Month 2 post-launch):**
- What features should come next based on expected user feedback?
- Consider: custom stages, email templates, bulk actions, deal tags

**v2.0 (Month 4-6 post-launch):**
- What makes the product significantly better?
- Consider: multi-platform integration (TikTok, YouTube), CRM features, reporting

**v3.0 (Month 8-12 post-launch):**
- Platform play features
- Consider: marketplace, API, white-labeling, enterprise

#### Task 2: Prioritization Framework

For each feature in the roadmap, score on:
- **Impact** (1-5): How much does this help users manage deals?
- **Effort** (1-5): How hard is it to build? (1 = easy, 5 = very hard)
- **Revenue** (1-3): Does this drive upgrades or reduce churn?
- **Priority Score** = (Impact * Revenue) / Effort

Create a prioritized feature table sorted by Priority Score.

#### Task 3: Detailed Feature Specs

For these high-priority features, write detailed specs:

**A. Invoice Generation**
- Generate PDF invoices from deal data
- Template system (customizable logo, payment terms)
- Track invoice status (sent, viewed, paid)
- Integration: QuickBooks, FreshBooks, Stripe Invoicing
- Impact on pipeline: auto-move deal to Invoiced when invoice sent

**B. Contract Templates**
- Library of contract templates (brand deal, UGC, affiliate)
- Variable substitution: {{brand_name}}, {{deal_value}}, {{deliverables}}
- E-signature integration (DocuSign, HelloSign)
- Impact on pipeline: auto-move to Contract when template sent

**C. Analytics Dashboard**
- Revenue over time (monthly, quarterly, yearly)
- Deal conversion funnel (what % of Outreach reaches Paid?)
- Average deal value trends
- Time-in-stage analysis (bottleneck detection)
- Brand repeat rate
- Seasonal patterns
- Compare to previous periods

**D. Multi-Platform Integration**
- Connect TikTok Creator Marketplace API
- Connect YouTube BrandConnect API
- Connect Instagram Creator Marketplace
- Auto-import deals from these platforms
- Track which platform each deal is for

**E. Content Calendar Integration**
- Show deal deliverable dates on calendar
- Sync with Google Calendar
- Reminders for content creation deadlines
- Link deliverables to specific deals

#### Task 4: AI Agent Evolution Roadmap

Plan the evolution of the AI agent system:

**v1 (Launch):**
- Gmail scanning (existing pattern from template brandi/AGENT.md)
- Deal creation from emails
- Stage transitions based on email content
- Follow-up reminders
- Pipeline rules (from template stage playbook)

**v2 (3 months post-launch):**
- Smarter suggestions: "You charged Brand X $500. Similar creators charge $800. Consider raising your rate."
- Auto-draft email responses: "Here's a reply to Brand X's counteroffer..."
- Deal template suggestions: "Brand X's deal looks similar to Brand Y -- here's what worked"
- Summary emails: weekly pipeline digest sent to user

**v3 (6 months post-launch):**
- Meeting scheduling: detect meeting requests, suggest times
- Rate negotiation AI: analyze market rates, suggest counteroffers
- Content calendar integration: suggest posting schedules based on deal deadlines
- Multi-platform scanning: TikTok DMs, Instagram DMs (when APIs allow)
- Predictive analytics: "Based on patterns, Brand X is likely to ghost. Follow up now."

**v4 (12 months post-launch):**
- Autonomous agent: can send follow-up emails with user approval
- Brand research: auto-research brands before user responds to outreach
- Contract analysis: summarize key terms, flag unusual clauses
- Revenue forecasting: predict monthly revenue based on pipeline
- Creator matchmaking: suggest brands based on creator niche and past deals

#### Task 5: API & Integration Strategy

Plan the developer platform:

**Webhooks (v1.1):**
- Trigger on: deal.created, deal.updated, deal.stage_changed, agent.run_completed
- Configurable per workspace
- Use case: connect to Zapier, custom automations

**Public API (v2.0):**
- REST API for deal CRUD, workspace management
- API key authentication
- Rate limiting per plan
- Available on Team plan only
- Endpoints: /deals, /activities, /agent/runs, /workspace
- Documentation with OpenAPI/Swagger

**Zapier Integration (v2.0):**
- Triggers: new deal, deal stage change, deal paid, agent suggestion
- Actions: create deal, update deal, move stage
- 5-star Zapier listing

**Embeddable Widgets (v3.0):**
- Embeddable deal submission form (brands can submit deals to creator)
- Embeddable pipeline status widget (creator can show pipeline on portfolio)
- Embed code generator in settings

#### Task 6: Platform Play Analysis

Analyze the viability of marketplace features:

**Brand Marketplace (v3.0+):**
- Brands can browse creator profiles and submit deal proposals
- Creators set their rates, availability, niches
- DealFlow facilitates the connection (deal auto-created in creator's pipeline)
- Revenue model: percentage fee on marketplace deals (10-15%)

**Questions to answer:**
- Is this a good idea or does it dilute the core product?
- What's the competitive landscape for creator marketplaces?
- Would brands actually use this vs. direct outreach?
- Could this be a separate product or should it be integrated?
- What's the TAM for a creator marketplace?

**White-Labeling (v3.0+):**
- Agencies can white-label DealFlow for their talent roster
- Custom branding, custom domain
- Agency dashboard: overview of all creators' pipelines
- Revenue model: per-seat enterprise pricing ($20-40/creator/month)

**Questions to answer:**
- Is there demand from agencies?
- What customization is needed?
- How does this affect the core product architecture?
- Pricing: per-agency or per-creator?

#### Task 7: Technical Debt & Infrastructure Features

Plan these non-user-facing but critical features:

**Performance:**
- [ ] Virtual scrolling for 100+ deal boards
- [ ] Pagination for activity feeds
- [ ] CDN for file uploads
- [ ] Database query optimization (indexes, materialized views)

**Security:**
- [ ] SOC 2 compliance preparation
- [ ] GDPR compliance (data export, deletion)
- [ ] Penetration testing
- [ ] Bug bounty program

**Scalability:**
- [ ] Connection pooling for 1000+ concurrent users
- [ ] AI agent queue system (Bull/BullMQ) for concurrent workspace runs
- [ ] Rate limiting per workspace
- [ ] Multi-region deployment (US + EU)

**Developer Experience:**
- [ ] Storybook for UI components
- [ ] API documentation auto-generation
- [ ] Seed data scripts for development
- [ ] Feature flags system (LaunchDarkly or custom)

---

## Appendix A: Template File Reference Quick Guide

When implementing DealFlow features, reference these template files for patterns:

### Kanban & DnD
- **Custom collision detection:** `KanbanBoard.tsx` lines 29-54
- **Drag handlers (start/over/end):** `KanbanBoard.tsx` lines 142-296
- **Sort order management:** `KanbanBoard.tsx` lines 203-233
- **Column with SortableContext:** `Column.tsx` full file
- **Card with useSortable:** `DealCard.tsx` lines 17-31

### Auto-Save Pattern
- **Auto-save helper:** `DealModal.tsx` lines 98-101
- **Stage auto-save:** `DealModal.tsx` lines 126-132
- **Date auto-save:** `DealModal.tsx` lines 373-380
- **Blur auto-save:** `DealModal.tsx` lines 210-211 (value field)

### File Uploads
- **FileUploadSection component:** `DealModal.tsx` lines 684-826
- **Supabase Storage upload:** `DealModal.tsx` lines 717-738
- **Drag-and-drop file handling:** `DealModal.tsx` lines 741-753

### Dashboard Metrics
- **parseValue helper:** `Dashboard.tsx` lines 19-25
- **Value breakdown calculation:** `Dashboard.tsx` lines 117-143
- **DealDropdown component:** `Dashboard.tsx` lines 38-111
- **Sticky top bar:** `Dashboard.tsx` lines 166-244

### AI Agent
- **Stage transition rules:** `brandi/AGENT.md` lines 58-140
- **Focus items (overdue/stale):** `BrandiFeedback.tsx` lines 126-143
- **Run polling:** `BrandiFeedback.tsx` lines 46-63, 96-106
- **Feedback chat:** `BrandiFeedback.tsx` lines 108-123, 373-411
- **Gmail API proxy:** `api/brandi/gmail/route.ts` full file
- **Sync processor:** `api/brandi/sync/route.ts` full file
- **Deal CRUD API:** `api/deals/route.ts` full file

### Auth
- **Auth context pattern:** `AuthProvider.tsx` lines 14-19, 23-63
- **Login form:** `AuthProvider.tsx` lines 66-135

### Calendar
- **Calendar grid generation:** `CalendarView.tsx` lines 126-139
- **Deal grouping by date:** `CalendarView.tsx` lines 112-123
- **Stage dot colors:** `CalendarView.tsx` lines 23-41

### Database Schema
- **Initial schema:** `supabase/migrations/20260101000000_initial_schema.sql`
- **Multi-month fields:** `supabase/migrations/20260621000000_add_multi_month.sql`
- **RLS policies:** `supabase/migrations/20260414010000_auth_rls_policies.sql`
- **Agent tables:** `supabase/migrations/20260414040000_brandi_feedback.sql` and `20260414050000_brandi_runs.sql`

---

## Appendix B: Environment Variables Reference

### Web App (apps/web)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AI Agent
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Google OAuth (for Gmail integration)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# App
NEXT_PUBLIC_APP_URL=https://app.dealflow.io
NEXT_PUBLIC_LANDING_URL=https://dealflow.io
```

### Mobile App (apps/mobile)
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
EXPO_PUBLIC_APP_URL=https://app.dealflow.io
```

---

## Appendix C: Dependency Diagram

```
Checkpoint 0 (Scaffolding)
    |
    +-> Checkpoint 1 (Schema)
    |       |
    |       +-> Checkpoint 2 (Auth + Workspaces)
    |       |       |
    |       |       +-> Checkpoint 3 (Kanban)
    |       |       |       |
    |       |       |       +-> Checkpoint 4 (Deal Management)
    |       |       |       |       |
    |       |       |       |       +-> Checkpoint 5 (Dashboard)
    |       |       |       |       +-> Checkpoint 10 (Calendar + Files)
    |       |       |       |
    |       |       |       +-> Checkpoint 14 (Testing)
    |       |       |
    |       |       +-> Checkpoint 7 (Gmail OAuth)
    |       |       |       |
    |       |       |       +-> Checkpoint 6 (AI Agent) -- also needs 4, 8
    |       |       |
    |       |       +-> Checkpoint 8 (Billing)
    |       |       +-> Checkpoint 9 (Roles)
    |       |       |
    |       |       +-> Checkpoint 11 (Mobile Foundation)
    |       |               |
    |       |               +-> Checkpoint 12 (Mobile Kanban)
    |       |               |       |
    |       |               |       +-> Checkpoint 13 (Push + Offline)
    |       |
    |       +-> Checkpoint 15 (Deploy) -- needs all above
    |
    +-> Checkpoint 16 (Landing Page) -- parallel with development
    
Checkpoint 15 + 16 -> Checkpoint 17 (Launch)
Checkpoint 17 -> Checkpoint 18 (Post-Launch)
```

---

## Appendix D: Estimated Timeline

| Phase | Checkpoints | Duration | Parallel Work |
|-------|-------------|----------|---------------|
| Foundation | 0, 1 | Week 1-2 | Marketing Agent research |
| Core Web | 2, 3, 4, 5 | Week 3-6 | Researcher Agent analysis |
| Platform | 6, 7, 8, 9, 10 | Week 7-10 | Feature Planning Agent roadmap |
| Mobile | 11, 12, 13 | Week 8-12 | Landing page (Checkpoint 16) |
| QA & Deploy | 14, 15 | Week 11-13 | App Store prep |
| Launch | 16, 17 | Week 14 | All agents activated |
| Post-Launch | 18 | Week 15+ | Continuous iteration |

**Total estimated timeline: 14 weeks (3.5 months) to launch**

---

*This playbook was generated from the template project at `/Users/melodi/clawd/projects/brand-deal-tracker`. All file references, line numbers, and code patterns are based on the actual codebase as of 2026-04-14.*
