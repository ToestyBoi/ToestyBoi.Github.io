# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repo analyzes player data from the game "Lurker's Lab" to support the dev team's internal balancing discussions.

- Players control a party of 4 characters. Each character can equip up to 4 items, with no duplicate items on a single character.
- Players progress through a sequence of trials and must beat each trial before the next becomes available (e.g. trial 3 must be beaten before trial 4 unlocks), but trials can be replayed afterward to farm items and gold.
- **Expected difficulty curve**: trials 1-3 should have ~100% clear rate; trials 4-5 are slightly harder. After that, every group of 5 trials should show a decreasing clear rate, bottoming out at a boss trial on every 5th trial (5, 10, 15, ...) which should be significantly harder than the trials leading into it. After a boss trial, clear rate returns to a middling value and the decreasing pattern repeats. Visualizations of trial clear rates should make deviations from this expected curve easy to spot.
- Items have a **tier** (two items of the same tier combine/"tier up" into one item of the next tier with upgraded stats, e.g. two tier-0 items become one tier-1 item) and a **rarity** (`RARITY_COLORS`/`getRarityColor` in `src/colors.ts`: Common, Uncommon, Rare, Epic — higher rarities are stronger and may add extra effects). Balance comparisons between items should account for both tier and rarity rather than treating all items as equivalent.
- Items are also loosely grouped into **classes** (Tank, Attack, Support, Utility, Spell — see `CLASS_CATEGORIES`/`getClassColor` in `src/colors.ts`); a character isn't restricted to items from one class. `ITEM_CATEGORIES`/`getItemColor` group items by shared theme/effect (e.g. poison, AoE) rather than class.
- The game exports data containing clear/win rates per trial and per item (see `src/data/*.json` for sample exports).
- The visualizations in this app are meant to surface which trials and items are outliers (too strong, too weak, too easy, too hard) so the game's progression curve stays engaging but appropriately difficult.
- The exported data format isn't fixed — if a visualization would benefit from data the game doesn't currently export, it's reasonable to propose new fields or a changed export format.
- The `CoEquipped` concept (items commonly used together) is currently unreliable/outdated — ignore it for now.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) then build (`vite build`) to `dist/`
- `npm run typecheck` — type-check only (`tsc -b`)
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build

There is no test suite configured.

## Architecture

This is a small React + TypeScript + Vite SPA for visualizing "lurkers lab" trial/item clear-rate data, deployed to GitHub Pages via `.github/workflows/deploy.yml` (build artifact from `dist/` on pushes to `main`).

- **Routing**: `HashRouter` is used (required for GitHub Pages static hosting), set up in `src/main.tsx`. Routes are declared in `src/App.tsx`.
- **Data flow via router state, not global state/API**: The user uploads a JSON file on `Home` (`src/Pages/Home.tsx`) via `handleFileUpload` (`src/Pages/HandleFileUpload.tsx`), which parses the file into a `ClearRateData` object and navigates to `/AllTrialsChart`, passing the parsed JSON and filename through `react-router`'s `location.state`. Every subsequent page reads `json`/`file_name`/etc. out of `location.state` (typed as `NavState` in `src/types.ts`) and re-passes them forward when navigating deeper (drill-down navigation: AllTrialsChart -> TrialChart). There is no central store — each page is responsible for forwarding the full `json` blob along with any extra context (e.g. `trial_id`, `item_name`, `co_equipped`) to the next route's state.
- **Data shapes**: All JSON shapes (`ClearRateData`, `Trial`, `Item`, `TierStat`, `CoEquipped`, `NavState`) are defined in `src/types.ts`. Sample data files live in `src/data/*.json`.
- **Charts**: Built with `recharts` (`BarChart`, `Bar`, `Cell`, etc.). Bar colors are computed dynamically from data values or item/class category lookup tables (see `getBarColor`, `getItemColor`, `getXAxisColor` in `AllTrialsChart.tsx` / `TrialChart.tsx`).
