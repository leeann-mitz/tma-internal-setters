# TMA Internal Setters

Next.js dashboard for Performance Golf's Transformation Academy Internal
Setter team (**Team Philip**): trend, leaderboard, and per-rep performance
monitoring — built from the
"[Transformation Academy Report | Phone Team 2026](https://docs.google.com/spreadsheets/d/1h15NbdmLgN0WwneR0lxiXPywXQAXceN4qLZkU-tJojQ/edit)"
Google Sheet, specifically its **"IS Trend View"**, **"Internal Setter
Executive Summary"**, and **"Setter Leaderboard"** tabs.

Patterned after the sibling **closer-performance-trends** app, but the
source sheet's layout is different enough that the parsers are not shared —
see "Data source" below.

## Data source

- `lib/setter-parse.ts` has three parsers, since this sheet's layout differs
  from `closer-performance-trends`' block-per-rep layout:
  - `parseIsTrendCsv` — the "IS Trend View" tab is block-per-metric-group: a
    team block ("Internal Setter (Team Philip)": Sets, Show, Closed Deal,
    Show Rate, Revenue, Cash Collected, each Monthly/Weekly/Daily), followed
    by two per-rep blocks, "Setter Sets Trend" and "Setter Shows Trend" (one
    row per rep). There's no per-rep Closed Deal/Revenue breakdown at this
    grain — setters aren't credited with those daily/weekly, only at the
    team level. Columns are classified by label pattern (month name / `WB
    MM/DD` / `MM/DD`), same approach as `closer-parse.ts`, so it keeps
    working as new columns get appended.
  - `parseExecutiveSummaryCsv` — the "Internal Setter Executive Summary"
    tab's current-month per-rep table (Name, Revenue, Net Cash Collected,
    Sets, Show, Closed Deal, Show Rate, Closed Deal Rate). This is a
    **single current-month snapshot**, not a time series — there's no
    historical daily/weekly per-rep revenue/closed-deal breakdown anywhere
    in the sheet, so it's kept as a separate `RepSummary` type rather than
    faked into `PeriodPoint`.
  - `parseLeaderboardCsv` — the "Setter Leaderboard" tab's current-month
    block only (Name, Show, Cash Collected, Conversion, Show Bonus, CC
    Bonus, Top Show, Top Cash, Total Bonus). A separate quarterly
    revenue/bonus table sits to the right of it in the same tab — out of
    scope for now.
- `lib/setter-source.ts` reads the bundled JSON snapshots
  (`data/is-trend-snapshot.json`, `data/is-leaderboard-snapshot.json`) —
  **snapshot-only, no live sync**. `closer-performance-trends` tried live
  "publish to web" sync and had to disable it (Vercel kept serving a stale
  cached export that didn't match real sheet edits), so this app skips that
  failure mode entirely rather than repeat it.

## Refreshing the bundled snapshot

1. Pull fresh CSV exports of the three tabs (via the Drive connector or an
   authenticated browser session — Lee Ann's Google session, since these
   tabs aren't published to web):
   - "IS Trend View" → `data/is-trend-snapshot.csv`
   - "Internal Setter Executive Summary" → `data/is-executive-summary.csv`
   - "Setter Leaderboard" → `data/is-leaderboard.csv`
2. Run:
   ```
   npx tsx scripts/generate-snapshot.ts
   ```
3. Commit the refreshed CSVs and regenerated JSON, push.

## Scope

Covers **Team Philip only** — the sheet also tracks Team Anne and a
Support group (see the "TMA Daily Agent Perf" tab's Team filter), which are
out of scope until asked for.

## Local dev

```
npm run dev
```
