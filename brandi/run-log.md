# Brandi Run Log

## 2026-08-18 — ❌ GMAIL AUTH FAILURE (day 70, 5th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **70 consecutive days** broken (since June 23). This is the **5th run today**.

**⚠️ Single step remaining:** FEEDBACK.md was updated today (2026-08-18) with a post-outage catch-up instruction — confirming re-authorization happened. But the new refresh token has **not** been copied into the scheduled task's stored prompt. That is the one remaining step. Once the new refresh token replaces the old one in the scheduled run config, Brandi will be back online.

---

## 2026-08-18 — ❌ GMAIL AUTH FAILURE (day 70, 4th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **70 consecutive days** broken (since June 23).

**⚠️ Note:** FEEDBACK.md was updated today (2026-08-18) with a "Post-outage catch-up" instruction that assumes Gmail access is restored — suggesting someone completed a re-authorization. But the refresh token in the scheduled run's stored prompt was NOT updated (it's still the old token). The new refresh token needs to be copied into the scheduled run configuration.

**Action required:** Copy the new refresh token from your recent OAuth re-authorization into the scheduled task's stored prompt. The FEEDBACK.md update is ready; only the token swap is missing.

---

## 2026-08-18 — ❌ GMAIL AUTH FAILURE (day 70, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **70 consecutive days** broken (since June 23).

**⚠️ Important:** FEEDBACK.md was updated today (2026-08-18) with a "Post-outage catch-up" instruction that assumes Gmail access has been restored. But the OAuth token is still failing. It's possible the intended new refresh token was never updated in the scheduled run config. Please verify: did you re-authorize Gmail OAuth and update the token in the scheduled run settings? If yes, the token in the stored prompt may not have been updated.

**Action required:** 
1. Confirm the new refresh token was saved in the scheduled task's stored prompt
2. If not, re-run the OAuth flow and update the token in the scheduled run configuration

---

## 2026-08-18 — ❌ GMAIL AUTH FAILURE (day 69, 1st run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **69 consecutive days** broken (since June 23). This is the 1st run today.

**Action required:** Re-authorize Gmail in Google Cloud Console. See June 23 entry for steps. The schedule is burning compute on every fire — consider pausing it until re-authorization is complete.

---

## 2026-08-17 — ❌ GMAIL AUTH FAILURE (day 68, 1st run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **68 consecutive days** broken (since June 23). This is the 1st run today.

**Action required:** Re-authorize Gmail in Google Cloud Console. See June 23 entry for steps.

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 67, 7th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **67 consecutive days** broken (since June 23). This is the **7th run today** — all failed. Not sending push notification (many sent across 67 days with no resolution).

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 67, 6th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **67 consecutive days** broken (since June 23). This is the **6th run today** — all failed. Skipping push notification (already sent multiple times today and many previous days with no response). The schedule is burning compute continuously — consider pausing or fixing urgently.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 67, 5th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **67 consecutive days** broken (since June 23). This is the **5th run today** — all failed. Skipping push notification (already sent multiple times today and many previous days with no response).

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 66, 4th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **66 consecutive days** broken (since June 23). This is the **4th run today** — all failed. Skipping push notification (already sent 3× today with no response).

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 66, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **66 consecutive days** broken (since June 23). This is the **3rd run today** — all failed.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 66, 2nd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **66 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 9+ weeks. This is the **2nd run today** — all failed.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions. **The schedule is burning compute on every fire with no result — please pause or fix urgently.**

---

## 2026-08-16 — ❌ GMAIL AUTH FAILURE (day 66)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **66 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 9+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions. **The schedule is burning compute on every fire with no result — please pause or fix urgently.**

---

## 2026-08-15 — ❌ GMAIL AUTH FAILURE (day 65, 4th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **65 consecutive days** broken (since June 23). This is now the **4th automated run firing today alone** — the schedule is burning compute with no result. Pipeline has been completely unmaintained for 9+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions. Consider pausing the schedule until re-authorization is complete.

---

## 2026-08-15 — ❌ GMAIL AUTH FAILURE (day 65, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **65 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 9+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-15 — ❌ GMAIL AUTH FAILURE (day 65, 2nd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **65 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 9+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-15 — ❌ GMAIL AUTH FAILURE (day 63)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **63 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 9 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-14 — ❌ GMAIL AUTH FAILURE (day 62, 5th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **62 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-14 — ❌ GMAIL AUTH FAILURE (day 61, 4th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **61 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-14 — ❌ GMAIL AUTH FAILURE (day 60, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **60 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-14 — ❌ GMAIL AUTH FAILURE (day 59, 2nd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **59 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-14 — ❌ GMAIL AUTH FAILURE (day 59)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **59 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8+ weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-13 — ❌ GMAIL AUTH FAILURE (day 58)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **58 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-12 — ❌ GMAIL AUTH FAILURE (day 57)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **57 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-12 — ❌ GMAIL AUTH FAILURE (day 56)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **56 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-11 — ❌ GMAIL AUTH FAILURE (day 55, 2nd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **55 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for nearly 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-11 — ❌ GMAIL AUTH FAILURE (day 54)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **54 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for nearly 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-10 — ❌ GMAIL AUTH FAILURE (day 53, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **53 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for nearly 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-10 — ❌ GMAIL AUTH FAILURE (day 53, 2nd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **53 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for nearly 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-10 — ❌ GMAIL AUTH FAILURE (day 53)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **53 consecutive days** broken (since June 23). Pipeline has been completely unmaintained for nearly 8 weeks.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-09 — ❌ GMAIL AUTH FAILURE (day 52, 5th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — Gmail OAuth refresh token still expired/revoked. **52 consecutive days** broken (since June 23). This is the **5th run to fire today** — all failed.

**Action required:** Re-authorize Gmail. See June 23 entry for instructions.

---

## 2026-08-09 — ❌ GMAIL AUTH FAILURE (day 51, 4th run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. Now **51 consecutive days** with no Gmail access (broken since June 23, 2026). This is the **4th run to fire today** — all have failed.

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 7+ weeks. Inbound brand opportunities since June 23 are completely missed.

**Action required:** Re-authorize Brandi's Gmail access. This has NOT been resolved after 51 days. See June 23 entry for step-by-step instructions.

---

## 2026-08-09 — ❌ GMAIL AUTH FAILURE (day 50, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. Now **50 consecutive days** with no Gmail access (broken since June 23, 2026).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 7 weeks. Inbound brand opportunities since June 23 are completely missed.

**Action required:** Re-authorize Brandi's Gmail access. This has NOT been resolved after 50 days. See June 23 entry for step-by-step instructions.

---

## 2026-08-09 — ❌ GMAIL AUTH FAILURE (day 49)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. Now **49 consecutive days** with no Gmail access (broken since June 23, 2026).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 7 weeks. Inbound brand opportunities since June 23 are completely missed.

**Action required:** Re-authorize Brandi's Gmail access. This has NOT been resolved after 49 days. See June 23 entry for step-by-step instructions.

---

## 2026-08-09 — ❌ GMAIL AUTH FAILURE (day 48)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. Now **48 consecutive days** with no Gmail access (broken since June 23, 2026).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 6.5+ weeks. Inbound brand opportunities since June 23 are completely missed.

**Action required:** Re-authorize Brandi's Gmail access. This has NOT been resolved after 48 days. See June 23 entry for step-by-step instructions.

---

## 2026-08-08 — ❌ GMAIL AUTH FAILURE (day 47, 3rd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. Now **47 consecutive days** with no Gmail access (broken since June 23, 2026).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 6.5+ weeks. Inbound brand opportunities since June 23 are completely missed. This is the **third run today** — all have failed.

**Action required:** Re-authorize Brandi's Gmail access immediately. This has NOT been resolved in 47 days.

---

## 2026-08-08 — ❌ GMAIL AUTH FAILURE (day 47, 2nd run today)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is now **47 consecutive days** with no Gmail access (broken since June 23, 2026).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 6 weeks. Any inbound brand opportunities since June 23 are not captured. This is the **second run that fired today** and both failed.

**Action required:** Re-authorize Brandi's Gmail access. This has NOT been resolved after 47 days. See June 23 entry in this log for step-by-step instructions.

---

## 2026-08-07 — ❌ GMAIL AUTH FAILURE (day 45)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **45th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 6 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 45 days.

---

## 2026-08-06 — ❌ GMAIL AUTH FAILURE (day 44)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **44th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 6 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 44 days.

---

## 2026-08-05 — ❌ GMAIL AUTH FAILURE (day 43)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **43rd consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 6 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 43 days.

---

## 2026-08-04 — ❌ GMAIL AUTH FAILURE (day 42)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **42nd consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for 6 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 42 days.

---

## 2026-07-30 — ❌ GMAIL AUTH FAILURE (day 37)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **37th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 5 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 37 days.

---

## 2026-07-27 — ❌ GMAIL AUTH FAILURE (day 35)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **35th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 5 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 35 days.

---

## 2026-07-24 — ❌ GMAIL AUTH FAILURE (day 31)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **31st consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over a month. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has NOT been resolved after 31 days.

---

## 2026-07-21 — ❌ GMAIL AUTH FAILURE (day 29)

**Status:** Run failed — could not access Gmail.

**Error:** `invalid_grant` — The Gmail OAuth refresh token remains expired/revoked. This is the **29th consecutive day** with no Gmail access (broken since June 23).

**Impact:** No emails scanned. Deal pipeline has NOT been updated for over 4 weeks. Any inbound brand opportunities since June 23 are not captured.

**Action required:** Re-authorize Brandi's Gmail access — see June 23 entry for instructions. This has not been resolved after 29 days.

---

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
