# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repo analyzes player data from the game "Lurker's Lab" to support the dev team's internal balancing discussions.

- Players control a party of 4 characters. Each character can equip up to 4 items, with no duplicate items on a single character.
- Players progress through a sequence of trials and must beat each trial before the next becomes available (e.g. trial 3 must be beaten before trial 4 unlocks), but trials can be replayed afterward to farm items and gold.
- **Expected difficulty curve**: trials 1-3 should have ~100% clear rate; trials 4-5 are slightly harder. After that, every group of 5 trials should show a decreasing clear rate, bottoming out at a boss trial on every 5th trial (5, 10, 15, ...) which should be significantly harder than the trials leading into it. After a boss trial, clear rate returns to a middling value and the decreasing pattern repeats. Visualizations of trial clear rates should make deviations from this expected curve easy to spot.
- Items have a **tier** (two items of the same tier combine/"tier up" into one item of the next tier with upgraded stats, e.g. two tier-0 items become one tier-1 item) and a **rarity** (`RARITY_COLORS`/`getRarityColor` in `src/colors.ts`: Common, Uncommon, Rare, Epic — higher rarities are stronger and may add extra effects). Balance comparisons between items should account for both tier and rarity rather than treating all items as equivalent. `TierStat` represents per-tier aggregate stats for an item across all trials.
- Items are also loosely grouped into **classes** (Tank, Attack, Support, Utility, Spell — see `CLASS_CATEGORIES`/`getClassColor` in `src/colors.ts`); a character isn't restricted to items from one class. `ITEM_CATEGORIES`/`getItemColor` group items by shared theme/effect (e.g. poison, AoE) rather than class.
- **Data methodology**: each season's player run history is replayed via 100 simulations to produce the exported stats. The player base is ~50 at early trials and drops to ~5–10 at the furthest trials. At higher trials, low player counts make the simulated data less statistically reliable — visualizations should surface or caveat low-sample data where relevant.
- The game exports data containing clear/win rates per trial and per item (see `src/data/*.json` for sample exports).
- The visualizations in this app are meant to surface which trials and items are outliers (too strong, too weak, too easy, too hard) so the game's progression curve stays engaging but appropriately difficult. The game is in early balancing — expect coarse adjustments before fine-tuning.
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

React + TypeScript + Vite SPA deployed to GitHub Pages via `.github/workflows/deploy.yml` (builds `dist/` on push to `main`).

### Routing

`HashRouter` (required for GitHub Pages) is set up in `src/main.tsx`. Routes are declared in `src/App.tsx`. A persistent `NavBar` (`src/components/NavBar.tsx`) is rendered on every page for navigation between views.

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | `Home` | File upload entry point |
| `/AllTrialsChart` | `AllTrialsChart` | Bar chart of clear rate per trial; click a bar to drill into it |
| `/TrialChart` | `TrialChart` | Bar chart of item win rates within a single trial; prev/next navigation between trials; click an item bar to drill into it |
| `/SingleItemTrials` | `SingleItemTrials` | Composed chart showing a single item's win rate by rarity across all trials, overlaid with overall trial clear rate as a dot line |
| `/ItemScatter` | `ItemScatterPlot` | Scatter plot of all items by delta (X) vs total_sims (Y); surfaces reliably OP/weak items; click to drill into item |
| `/ItemTierScaling` | `ItemTierScaling` | Line chart of a single item's win rate by tier, one line per rarity; shows how an item scales as it tiers up |
| `/ItemHeatmap` | `ItemHeatmap` | Item × trial heatmap (win rate as color); filterable by rarity; click cell → trial, click label → item detail |
| `/ItemPairing` | `ItemPairingHeatmap` | Heatmap of how frequently pairs of items appear together in builds |
| `/BuildDiversity` | `BuildDiversityChart` | Build diversity chart showing unique build distribution across trials |

### Data flow

The uploaded JSON is stored in a React context (`src/context/DataContext.tsx`, `DataProvider` / `useData()`). The user uploads a JSON file on `Home` (`src/Pages/HandleFileUpload.tsx` parses it into a `ClearRateData` object and calls `setJson`). All pages read `json` from `useData()` directly — the full dataset is never passed through `location.state`. Page-specific navigation parameters (e.g. which trial or item to show) are passed as `react-router` `location.state` typed as `NavState`. The primary drill-down chain is:

```
Home → AllTrialsChart → TrialChart → SingleItemTrials
```

### Data shapes (`src/types.ts`)

- `ClearRateData` — top-level export: `trials` (array of `Trial`), `items` (array of `Item`), `items_by_trial` (map of trial ID → `Item[]`), `sims_per_build`, `trials_version`
- `Trial` — `trial_id`, `clear_rate`, `avg_level`, `avg_tier`, `total_clears`, `total_sims`, `total_losses`, `unique_builds`, `num_waves`, `max_tier`, `min_tier`, `death_waves` (`DeathWave[]`), `builds?` (`Build[]`)
- `DeathWave` — `wave`, `reached`, `deaths`, `conditional`, `share`
- `Build` — `items` (`BuildItem[][]`, one inner array per character slot), `clear_rate`, `clears`, `avg_tier`, `avg_level`, `max_tier`, `min_tier`, `death_waves`
- `BuildItem` — `name`, `rarity`, `tier`
- `Item` — `name`, `win_rate`, `overall_rate?`, `delta?`, `total_clears?`, `total_sims?`, `tiers` (`TierStat[]`)
- `TierStat` — per-tier aggregate stats for an item: `tier`, `rate`, `rarity`, `clears`, `sims`
- `NavState` — page-specific navigation params passed via `location.state`: `trial_id?`, `item_name?`

### Charts & colors (`src/colors.ts`)

Charts use `recharts` (`BarChart`, `ComposedChart`, `Bar`, `Line`, etc.). Bar/label colors come from:

- `getRgbBarColor(rate)` — red-to-green gradient by clear rate (used on trial bars in `AllTrialsChart`)
- `getItemColor(name)` — color by `ITEM_CATEGORIES` theme (poison, AoE, etc.) in `TrialChart`
- `getClassColor(name)` — color by `CLASS_CATEGORIES` (Attack, Tank, Support, Spell, Utility) used on X-axis labels in `TrialChart`
- `getRarityColor(rarity)` — color by rarity tier (Common → Legendary) used in `SingleItemTrials`
