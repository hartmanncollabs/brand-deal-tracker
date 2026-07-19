# Brandi Run Log

## 2026-07-19 — ❌ GMAIL AUTH FAILURE (day 27)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **27th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for nearly 4 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved after 27 days.

---

## 2026-07-13 — ❌ GMAIL AUTH FAILURE (day 21)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **21st consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 3 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved after 21 days.

---

## 2026-07-13 — ❌ GMAIL AUTH FAILURE (day 20)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **20th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for nearly 3 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved after 20 days.

---

## 2026-07-08 — ❌ GMAIL AUTH FAILURE (day 15)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **15th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for two weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved.

---

## 2026-07-06 — ❌ GMAIL AUTH FAILURE (day 14)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **14th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for two weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved.

---

## 2026-07-05 — ❌ GMAIL AUTH FAILURE (day 12)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **12th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline was NOT updated.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved.

---

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
