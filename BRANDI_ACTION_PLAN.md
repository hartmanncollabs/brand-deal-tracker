# Brandi Action Plan

## Goal
Make Brand Deal Tracker work great for Liz's real internal workflow while keeping Brandi's useful behavior, without overbuilding an in-app AI runtime.

## Core principle
Brandi should remain a reliable operating role and audit trail, not necessarily an embedded application runtime.

## Architecture decision

### Brand Deal Tracker should own
- deals and pipeline state
- notes and deal activities
- Brandi feedback/instructions
- Brandi run summaries
- UI for seeing what Brandi changed
- safe sync/update surfaces

### OpenClaw Brandi should own
- reasoning and email review
- deciding what to update
- applying updates through safe existing routes
- summarizing what changed
- following Brandi rules consistently

## What to keep
1. `brandi_feedback`
2. `brandi_runs`
3. `deal_activities.actor = 'brandi'`
4. Brandi rules in `brandi/AGENT.md`
5. Safe sync route and pending update flow
6. Brandi panel as a review/visibility surface

## What to pause or deprioritize
1. Deep in-app AI runtime orchestration
2. Productizing Brandi runtime before core tracker workflow is excellent
3. Further complexity around Claude-specific or provider-specific trigger flows

## Concrete execution order

### Phase 1 — Make internal Brandi workflow excellent
1. Audit current Brandi panel and card activity UX
2. Improve visibility of Brandi-made updates inside the tracker
3. Make Brandi run summaries more actionable and easier to review
4. Preserve easy manual override by Kenny
5. Ensure OpenClaw-driven Brandi updates can write cleanly into existing tracker structures

### Phase 2 — Simplify runtime responsibilities
1. Treat OpenClaw/chat-triggered Brandi as the primary internal workflow
2. Keep in-app trigger plumbing lightweight and optional
3. Avoid further runtime embedding unless it clearly improves internal ops

### Phase 3 — Future product path, only if needed
1. Re-evaluate whether a built-in AI assistant belongs in a marketable version
2. If yes, design it as a product feature for multi-user accounts, not as a workaround for internal operations

## Immediate next implementation priorities

### Priority 1
Improve tracker UX so Brandi-originated actions are easy to see and trust.

Status:
- In progress
- Added better latest-run summary treatment in the Brandi panel
- Reinforced that applied Brandi changes are logged on cards as Brandi activity

Possible next tasks:
- Better visual treatment for Brandi activities on cards
- Clearer distinction between Brandi suggestions vs actual applied updates
- Surface last Brandi-touched time on deal cards or in modal header

### Priority 2
Make OpenClaw-driven Brandi updates the default internal workflow.

Possible tasks:
- Document the intended workflow clearly
- Keep existing sync/update path stable
- Avoid forcing the in-app launcher to be the primary path

### Priority 3
Only then decide whether to keep, simplify, or remove in-app run trigger plumbing.

## Success criteria
- Kenny can ask Melodi/OpenClaw to review and update the Brand Deal Tracker naturally
- Changes made by Brandi are clearly visible and attributable in the app
- Kenny can easily review, trust, and override Brandi changes
- The tracker stays focused on being a great operations tool, not an overcomplicated AI runtime container
