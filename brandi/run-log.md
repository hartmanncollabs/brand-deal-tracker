# Brandi Run Log

## 2026-07-04 — ❌ GMAIL AUTH FAILURE (still broken)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **11th day** with no Gmail access.

**Impact:** No emails scanned. Deal pipeline was NOT updated.

**Action required:** Re-authorize Brandi's Gmail access (same as June 23 — not yet resolved).

1. Go to Google Cloud Console → the OAuth app for Brandi
2. Re-run the OAuth authorization flow for `hartmanncollabs@gmail.com`
3. Get the new refresh token and update it in the scheduled run configuration

---

## 2026-06-23 — ❌ GMAIL AUTH FAILURE

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token is expired or has been revoked.

**Impact:** No emails scanned today. Deal pipeline was NOT updated.

**Action required:** Re-authorize Brandi's Gmail access. The refresh token in the agent's OAuth config needs to be regenerated. Someone needs to go through the OAuth flow again to get a new refresh token.

**What to do:**
1. Go to Google Cloud Console → the OAuth app for Brandi
2. Re-run the OAuth authorization flow for `hartmanncollabs@gmail.com`
3. Get the new refresh token and update it in the scheduled run configuration

---
