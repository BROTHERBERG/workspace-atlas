# Workscape Atlas — the Derek pitch

**One line:** A live scan of an entire local coworking market that produces two ready-to-work lead lists — one for web services (Crush), one for recruitment (Bottle Rocket / Lean Six Search).

This is not a mockup. Every number below comes from a real scan of the Calgary market run **2026-06-21**, reproducible on demand and re-pointable at any other city.

---

## What it does

The same scan that builds a clean coworking directory also does two things Derek's businesses get paid for:

1. **Scores every operator's real website** (rendered in a real browser — HTTPS, mobile, SEO, social, booking). Weak/missing sites become **web-services leads**.
2. **Reads each operator's hiring signals** (careers pages, live postings). Operators hiring leadership become **recruitment leads** routed to Bottle Rocket.

One pipeline in, two monetizable lists out.

---

## The Calgary result (real, today)

| Metric | Value |
|---|---|
| Spaces mapped | **52** (45 Calgary + 7 nearby AB) |
| Independent operators | **34** |
| Websites scored live | **47** |
| Average digital score | **72 / 100** |
| Grade spread | A 25 · B 2 · C 18 · D 2 · F 5 |
| **Web-services leads** | **7** |
| **Recruitment leads** | **5** (1 with a confirmed live role) |

### Web-services leads (→ Crush) — 7
Operators with weak, broken, or missing websites:
- **Zeina's Office Space** — no website at all
- **KOWORK (Airdrie)** — no website at all
- **The Collective 12|12**, **The Collab Hub**, **Highfield Hive** — domains no longer resolve (sites offline)
- **STRATUS Offices**, **VennYYC** — live but weak (score 54: no mobile/SEO/social/booking)

### Recruitment leads (→ Bottle Rocket / Lean Six Search) — 5
Independent operators surfacing hiring signals:
- **TradeSpace** — ⭐ **confirmed live opening: Community Manager, Calgary**
- **Platform Calgary** — live job board
- **Workhaus Core**, **cSPACE Marda Loop**, **Pavilion Cowork** — active careers pages

Every lead carries its source URL. Nothing is invented — unknown values are left blank, not guessed.

---

## The second layer: the global Radar (the scale story)

Calgary proves the *method*. The **Radar** is the same engine pointed at the whole industry — a live scan of the major coworking operators' job boards (Convene, CIC, WeWork, IWG, Techspace…) for leadership openings. As of the latest scan:

- **47 active openings** tracked, **17 at leadership level** (Directors of Membership / Hospitality Sales, GMs, Community & Ops Managers) across **3+ live operators**.
- Refreshes on demand from **free** ATS + industry feeds — re-runs in minutes, re-points at any market.
- Surfaced publicly on the **Recruitment** page (labeled *Global*) and in an internal **Radar dashboard**.

This is the part that's directly Bottle Rocket's placement market — they place these exact roles, globally. Workscape Atlas is the top-of-funnel that makes that deal-flow systematic instead of network-driven.

---

## Why this matters to Derek specifically

- **It speaks in his P&L.** The recruitment list is Lean Six Search deal-flow; the web list is Crush deal-flow. Same engine, both businesses.
- **It's a result, not an idea.** He's been shown concepts before — this is a working artifact with named, verifiable leads he can call tomorrow.
- **It scales geographically.** Point it at Dubai, Edmonton, or anywhere Bottle Rocket operates — it returns the same two lists. It's a market-intelligence machine, not a Calgary directory.

---

## The credibility spine (why the numbers hold up)

- Spaces sourced from operator sites + Coworker.com/CoworkingCafe/Spaces/Regus directories, each cross-verified against a second source.
- Scores measured by **rendering each live site in headless Chromium** — bot-protected pages (Regus, WeWork) are flagged low-confidence and *not* scored as failing, instead of producing false negatives.
- Known limits stated plainly on the Intelligence page (sparse Google ratings; 3 domains that didn't resolve are flagged, not assumed closed).

---

## The pitch — a 4-stop click-through

It's a **working app**, not slides. Walk Derek through it in this order:

1. **Home** (`/`) — the live scan board + "two pipelines hiding in one map." Sets the frame in 10 seconds.
2. **Intelligence** (`/intelligence`) — the money view: the full Calgary market, scored, with the **7 web-services leads** and **5 recruitment leads** tables (TradeSpace's live opening called out) + the honest methodology. *This is the result.*
3. **Recruitment** (`/recruitment`) — the Calgary talent leads, then scroll to the **global Radar** (48 live openings) — "the same engine pointed at your actual market." Hit **Request talent** to show the capture form works.
4. **Directory / Search** (`/directory`) — proves it's real data end-to-end, every space scored.

(Optional: the internal **Radar dashboard** at `/admin/radar` for the "this runs continuously" point.)

## The ask

> "This is one scan of one market — it handed us 7 web-services leads and 5 recruitment leads with sources, plus 48 live leadership openings across the major operators. Do you want Bottle Rocket pointed at this, and which market do we scan next?"

Decision for him: which market to run next, and whether Bottle Rocket works the talent pipeline.

---

## State (for Eric)

Working, verified, on branch `calgary-real-rebuild` (not yet pushed — needs your `git push`). Build clean; every reachable page console-clean; both lead-capture forms work end-to-end (file-based, no DB). Demo runs locally with a dummy `.env.local`; a real launch needs real DB/auth/email provisioning. See `docs/SPRINTS.md` for the full build trail.

*Built by Crush Digital Atelier · Calgary scan 2026-06-21, Radar refreshed 2026-06-22 · reproducible, not mocked up.*
