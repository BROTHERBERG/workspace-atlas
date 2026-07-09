# TRIPWIRE — the coworking trigger engine (scope v1)

*Our own Selligence: detect that an executive seat needs filling BEFORE the market knows. 2026-07-09.*

**Why this exists (recon, verified 07-09):** Retained mandates are won pre-posting (25–35% fees, ~$80K minimums; a ~20–30-day window between detectable signal and public posting). The three signals that convert prospecting into mandates: **expansion/funding events**, **leadership changes**, and **postings aged 45+ days unfilled**. The one product that sold this (Selligence/Talent Ticker, ~£300–400/mo) is defunct as of July 2026 — the category is vacant. Bottle Rocket itself published *"Why the Job You're Waiting For Was Probably Never Going to Be Posted"* (LinkedIn, 2026-05-11) — the buyer already believes the thesis.

**Verdict on the old radar:** the ATS job-board sweep is DEMOTED. Fresh postings are the cheapest, latest, lowest-fee signal (and our feed proved noisy — 2022-dated junk). It survives only as the **aging tracker** (signal S4) and as confirmation.

---

## Operating model

- **Fable = advisor.** Owns this scope, the signal taxonomy, task specs, and REVIEW of every executed task. No task merges without Fable review + spot-verification of emitted signals against live sources (no agent asserts un-pulled data).
- **GPT-5.6 Sol = executor.** Picks tasks from the queue below, one at a time, in order unless the spec says parallel-safe. Each task ends with: build clean, the task's verification command run, sample output committed under `data/_provenance/tripwire/`.
- **Eric = gate.** Reviews the money view + digest before anything reaches Derek.

**Hard rules (inherited from Crush practice):**
1. FREE sources only — Playwright/RSS/public registries. No metered API in any loop, ever, without an explicit ceiling and Eric's OK.
2. No fabrication. Unknown = null. Every signal carries `url` + `source` + `firstSeen`.
3. Tag/score, never delete. A dead signal decays; it is not erased.
4. Rate-limit politely (per-domain throttle, identify as a normal browser, cache aggressively).

---

## Signal taxonomy

Every signal answers: *"why would this operator need a leader RIGHT NOW?"* Each emits `{type, operator, evidence, url, confidence, firstSeen}` into the existing store (`lib/radar/store.ts`, schema extended per T1).

### Tier 1 — build first (free, high-precision, mostly infrastructure we already have)

- **S1 · Expansion news sweep** — trade press (Allwork.Space, Coworking Insights, Bisnow flex/coworking tags, Commercial Observer) + per-operator Google News RSS queries + operator press/newsroom pages. Extract: new location announcements, landlord management-agreement deals (the Industrious model — publicly announced), franchise development, market entries. *A new location = a GM/community team hire 3–6 months out.*
- **S2 · Careers-page diffing** — we already hold careers URLs per operator. Snapshot + diff on each scan: a NEW leadership-level role on the operator's OWN site is the earliest posting-shaped signal (days before aggregators). Diff, not scrape-and-list.
- **S3 · Team-page diffing (departure detection)** — snapshot operator team/about pages (we already crawl their sites for digital scores); diff monthly. **A person disappearing from the team page = a seat just opened.** Nobody sells this. Bonus: "Interim"/"Acting" titles appearing = an active search is already underway.
- **S4 · Posting-age tracker (the demoted job board)** — recycle the existing ATS scan + `firstSeen/lastSeen` into ONE derived signal: leadership posting **aged 45+ days** = in-house TA is failing = call-now lead. Junk filter first (drop stale/foreign/staff-level noise like the 2022 Kolkata entries).
- **S5 · Poach detection** — from the S1 news stream + public "X joins Y" announcements: when anyone announces hiring a leader FROM operator Z, **Z now has a hole**. The hire announcement is public; the vacancy it creates is the lead.

### Tier 2 — the moat (Diggby DNA; build once Tier 1 emits)

- **S6 · Fit-out/TI permit matching** — building permits at known operator addresses (or naming operators as applicant/tenant) = expansion confirmed months before any announcement. Calgary/AB via existing Diggby sources now; any ArcGIS-served city later (Austin candidate). *This is the signal literally no recruiting-intel product has ever had.*
- **S7 · Location-page diffing** — operator website adds a city/location/"opening soon" page → expansion detected from their own site before press coverage.
- **S8 · Funding & M&A tracker** — free-tier news detection of raises/acquisitions (CBRE–Industrious pattern). Post-acquisition = leadership churn window; post-raise = 3–6-week hiring wave.
- **S9 · Licence/registration changes** — business-licence or registration changes at operator addresses (ownership change → management turnover). AB free via existing Diggby pipes; proves the method.

### Tier 3 — exploratory (score later, don't block on)

- **S10 · Review-health decline** — falling review velocity/response rate at a location (community manager likely gone; 62% operator burnout stat). Noisy; use only as a score modifier, never a standalone lead.
- **S11 · Conference expansion signals** — GCUC/industry sponsor+exhibitor deltas (marketing spend = growth mode).

---

## Entity resolution & scoring

- **Operator registry** (extend `lib/radar/operators.ts`): canonical operator → aliases, domains, careers URL, team-page URL, known addresses, market(s). Seed = our 148 spaces + the global ATS operator list. Every signal must resolve to a registry operator or park in a triage queue — no orphan signals.
- **Trigger score per operator**: weighted sum with time decay (e.g. S3 departure 40 · S6 permit 35 · S1 expansion 30 · S5 poach 30 · S2 careers-add 25 · S8 funding 20 · S4 aged-posting 15 · S10 modifier ±10; half-life ~45 days). **Compounding is the product**: expansion news + fit-out permit + careers-page GM role = red-hot, auto-surfaced.
- **Reason-to-call**: every hot operator gets one generated sentence citing its signals + source URLs — the thing a recruiter says on the phone. This string IS the product.

## Money surfaces

- **Trigger Board** (rework `/intelligence` + `/admin/radar`): ranked hot operators, reason-to-call, signal chips w/ sources, market filter. Job-posting table demoted below the fold.
- **Weekly digest** (extend `radar-digest.ts`): email-ready md/HTML — "N operators tripped this week", reason-to-call each. The digest is the sellable artifact ($500–1K/mo thesis; Selligence anchor); the app is the demo.

---

## Task queue for Sol

Execute in order; ✅ = acceptance criteria. One commit per task, prefix `tripwire:`.

- **T1 — Schema + registry.** Extend `lib/radar/types.ts` with signal types (`expansion_news, careers_added, team_departure, interim_title, poach, aged_posting, permit, location_page, funding_ma, licence_change`), `confidence`, `evidence`. Build the operator registry (aliases/domains/careers/team URLs/addresses) seeded from existing data. ✅ `tsc` clean; registry ≥ 40 operators incl. all 148-space independents w/ domains.
- **T2 — Snapshot/diff engine.** Generic page-snapshot store + differ (used by S2/S3/S7): fetch→normalize→hash→diff→emit. Polite throttling, per-domain. ✅ run twice against 5 operators; second run emits zero false diffs.
- **T3 — S2+S3 collectors** on the diff engine (careers pages, team pages; incl. interim-title regexes). ✅ sample run across ≥ 25 operators, emitted signals valid per schema, 5 hand-checked against live pages.
- **T4 — S1 news sweep + S5 poach extraction.** RSS + Google News per-operator queries + trade-press indexes; LLM-classified into expansion/poach/funding/other (cheap tier, capped by item count). ✅ 14-day backfill run; ≥ 10 classified signals; zero fabricated URLs (every one fetchable).
- **T5 — S4 aging derivation + junk filter.** Score existing ATS store: drop non-leadership/stale-country noise; emit `aged_posting` at 45+ days. ✅ current store yields a clean list; Kolkata-class junk gone.
- **T6 — Trigger scorer + reason-to-call.** Per-operator compounding score, decay, hot threshold; reason strings w/ citations. ✅ deterministic on fixture data; top-5 hot list is human-sensible (Fable review).
- **T7 — Trigger Board UI** (`/intelligence` rework + admin). ✅ Playwright-verified, 0 console errors, desktop + mobile, danglers checked.
- **T8 — Digest v2** (weekly md/HTML email-ready). ✅ generated from live store; reads like a BD briefing, not a data dump.
- **T9 — Scheduler + deploy.** Fly.io (volume for `data/`), daily `tripwire:scan`, deploy unlisted. ✅ live URL; two consecutive scheduled scans produce sane diffs.
- **T10 (Tier 2, after Eric review) — S6 permits + S7 location pages + S8 funding + S9 licences.**

**Review protocol per task:** Sol commits → Fable reviews diff + spot-verifies 5 emitted signals against live sources → merge or bounce with notes. Eric sees the Trigger Board after T7 and gates the Derek send after T9.
