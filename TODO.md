# Future Work

Ideas and improvements not yet promoted to OpenSpec changes.
When an item here becomes an active change (`/opsx:new` or `/opsx:ff`), remove it from this list.

---

# Backend (API / Simulation Engine)

## API Versioning

Add URL-prefix versioning to the API: `/v1/simulate`, `/v1/monte-carlo`, etc. Fix the version mismatch (FastAPI app says `1.0.0`, package says `0.1.0`) — align on `0.9.0` in `pyproject.toml` to reflect pre-1.0 status. All new BE work targets `/v1`. Existing unversioned endpoints can redirect or remain as aliases temporarily.

New model fields should be optional with defaults matching current behavior so the existing UI continues to work against `/v1` without changes.

## ~~BE-1. Income Stream Model Expansion~~ ✓ DONE

Implemented in `be-improvements` branch across two changes:
- **add-income-streams**: Generic `IncomeStream` model with name, amount, start/end age, taxable_pct
- **be1-cola-and-ss-features**: Per-stream COLA adjustment, SS actuarial benefit formula (early/late claiming), SS auto-generation from profile config (`ss_auto`)

## ~~BE-2. Withdrawal Strategy Clarity~~ ✓ DONE

Implemented in `be-improvements` branch:
- Fixed `percent_of_portfolio` bug (was reading `guardrails_config` instead of `withdrawal_rate`)
- Added `initial_annual_spend` and `initial_monthly_spend` to API simulation summary
- Added `monthly_spend` convenience property to `SimulationConfig`
- Enriched `/strategies` endpoint with `uses_fields`/`ignores_fields` metadata per strategy
- Aligned version to 0.9.0 across `pyproject.toml` and API

## BE-3. Inflation-Index Tax Brackets and Thresholds

The simulation uses fixed nominal tax brackets, IRMAA tiers, and standard deduction. In reality these are indexed annually to CPI. Over a 30-year simulation the distortion is significant — the model overstates tax liability in later years, which biases withdrawal strategies and Roth conversion decisions toward being overly conservative.

The Monte Carlo engine already produces per-year inflation rates. Applying cumulative inflation to bracket thresholds, IRMAA tiers, and the standard deduction each year would be straightforward.

Social Security COLA adjustments are a related improvement.

No FE dependency — results just become more accurate.

## BE-4. Monte Carlo Tax Regime Sampling

Add historical tax regime randomization to Monte Carlo simulations. Instead of using fixed tax brackets throughout, sample from historical federal tax regimes the same way we sample historical returns and inflation.

**Regime-sampling approach:** Tax policy changes are legislative (discrete jumps every few years), not continuous like returns. Sample a "tax regime" and hold it for 2-4 years (aligned to political cycles), then sample a new one. ~8 distinct regimes over the last 50 years (pre-1981, Reagan, TRA86, Bush/Clinton, Bush cuts, ATRA, TCJA, etc.).

**Data structure:** Each regime is a complete bracket structure — always 7 income brackets, capital gains rate, standard deduction, and IRMAA tiers. Stored in a historical data file (like `historical_returns.py`), with a comment noting all thresholds are normalized to 2024 dollars.

**Uniform structure across eras:**
- Eras with fewer brackets (e.g., 1987 had only 2): pad to 7 by duplicating the top rate upward. "15% and 28%" becomes thresholds 2-7 all at the 28% rate. Simulation code always iterates 7 brackets, no conditionals.
- IRMAA before 2007: set thresholds to effectively infinity (e.g., 1e10). Structure stays uniform, no special cases.

**Normalization:** All regime thresholds stored in 2024 dollars (one-time data entry for ~8 regimes). During simulation, if BE-3 (inflation indexing) is also enabled, thresholds get further indexed forward. If not, used as-is.

**State/local taxes:** Not part of regime sampling. Remain a single flat rate config input (can still compare NYC vs Florida).

**API/Config:** Additive — optional flag to enable tax regime sampling (default off, current behavior preserved). Surfaces in FE Configuration as a toggle.

No dependencies. Complementary to BE-3 but independently useful.

## ~~BE-5. Stop Simulation After Fund Exhaustion~~ ✓ DONE

Implemented in `be-improvements` branch. Simulation loop breaks after recording the depleted year. Monte Carlo percentile calculations handle variable-length results.

## BE-6. Multi-User Service

Something cloud based, information stored encrypted at rest. Some best practices for security. Security review. OAuth with Apple, Google, Facebook. Probably Google Cloud.

Depends on: FE-1 (UX refactoring should settle the data model first).

## BE-7. Sophisticated Portfolio Analysis

Detailed portfolio import using exported files, or 3rd party connectors (expensive)? Showing stock/bond mix, make guestimates of default rate of return.

Simplest starting point: CSV import from brokerage exports (Fidelity, Schwab, Vanguard all offer CSV downloads of holdings). Covers most use cases without API integration costs.

## BE-8. Chatbot Integration

Expand. Does this need GCP, what security issues, what use cases make sense for chatbot integration (portfolio analysis)?

---

# Frontend (UI)

## FE-1. UX Refactoring — Layout and Navigation

Design principles: Familiar (patterns from financial apps like Wealthfront, Vanguard, E*Trade). Coherent. Simple — don't display complexity unless necessary. Current system is busy.

Consider what people expect about applications and where things live. Exercise independent judgement about what would be best.

Reference apps: Wealthfront (clean, simple, projection chart on landing), Vanguard/E*Trade (AppBar with profile dropdown, color bar, two-tier nav).

### Overall Structure

Switch from single-page tabs to SvelteKit route-based navigation. Each view is its own page, AppBar persists across all via `+layout.svelte`. Browser back/forward works naturally.

```
┌────────────────────────────────────────────────────┐
│  🌲 Retirement Sim          ⚙️  Mike G  👤        │  ← AppBar (persistent)
├────────────────────────────────────────────────────┤
│                                                     │
│  Route-based pages:                                 │
│    /           Landing (chart + accounts + income)  │
│    /spending   Spending plan                        │
│    /compare    Comparison view                      │
│    /details    Year-by-year simulation details      │
│    /config     (or drawer from profile icon)        │
│                                                     │
└────────────────────────────────────────────────────┘
```

Change theme to pine. Add a color bar (like financial apps have).

### First-Use Flow

On first visit (no saved data), show a setup page:
- Enter name, age, spouse toggle, spouse age
- [Load Sample Data] button — loads built-in example portfolio for exploring the tool
- [Start] — takes you to the landing page with empty portfolio

This is essentially the configuration page with just the core fields needed to begin. After setup, the user navigates to the landing page to add accounts and income.

### AppBar and Profile

Persistent AppBar across all routes. Left: app name/logo. Right: settings gear (opens config drawer or navigates to /config), user name + avatar icon.

Profile dropdown (click avatar): name, save/load data, switch profiles. No authentication — just local file save/load. Files named `<user-name>-portfolio.json`, `<user-name>-spending.json`, `<user-name>-configuration.json` (or a single combined file).

### Landing Page (/)

The main page combines the portfolio overview with simulation results. No separate "Simulate" or "Portfolio" tabs.

```
┌────────────────────────────────────────────────────┐
│  ┌─ Chart ──────────────────┐                      │
│  │ [Deterministic] [MC]     │  🔁 Refresh          │
│  │                          │  ☐ Add to Compare    │
│  │  projection chart here   │                      │
│  │                          │  "unchanged" if no   │
│  └──────────────────────────┘  inputs changed      │
│                                                     │
│  Portfolio: $1.2M    MC Success: 94%                │
│  Depletes: Never     Strategy: Fixed $80K           │
│                                                     │
│  ⚠️ Warnings/notifications area                    │
│  (portfolio depletes at 82, Roth conversion         │
│   exceeds income limits, etc.)                      │
│                                                     │
│  ── Accounts ───────────────────────────────────   │
│  Traditional IRA    $500K    primary    [edit]      │
│  Roth IRA           $200K    primary    [edit]      │
│  [+ Add Account]                                    │
│                                                     │
│  ── Income ─────────────────────────────────────   │
│  SS (primary, age 67)    $2,800/mo     [edit]      │
│  SS (spouse, age 65)     $1,400/mo     [edit]      │
│  [+ Add Income]                                     │
│                                                     │
│      [Spending →]   [Compare →]   [Details →]      │
└────────────────────────────────────────────────────┘
```

**Chart area:** Two tabs — Deterministic and Monte Carlo. Both run on Refresh. Deterministic displays immediately. MC tab grayed out until computation completes, then becomes available.

**Refresh button:** Always clickable (no dirty-state tracking). Shows "unchanged" if inputs haven't changed since last run.

**Add to Compare checkbox:** Next to Refresh. When checked and Refresh is clicked, the results are added to the compare list. Don't add if already there (same inputs).

**Warnings area:** Surface actionable notifications — portfolio depletion age, Roth conversion issues, strategy warnings, etc.

### Configuration (drawer or /config)

Accessed via gear icon in AppBar. Contains settings the user rarely changes:
- Tax brackets, RMD age, capital gains brackets, IRMAA limits — most hidden under [Show Advanced]
- Default investment return and rate of inflation visible by default
- "Use Advanced Strategies" toggle — enables complex withdrawal strategies and Roth conversion rules. Without it, only fixed-with-COLA and 4% rule are available.
- Withdrawal strategy selection (simple: fixed/4% rule; advanced: guardrails, RMD-based, etc.)

Historical configuration presets (1970s, 1990s tax/inflation environments) — but see What-If below for possibly a better approach.

### Spending Page (/spending)

Spending is its own page, navigated to from the landing page. Can be just annual spending, or specific goals (Second Home, Senior Living, Travel, Downsize, College, Charitable giving) which can be one-time or periodic with a duration, with/without inflation adjustment.

Recurring expenses: Monthly/Quarterly/Annual frequency. Stop after N occurrences.

### Income

Income streams live on the landing page alongside accounts. Types: SS, Pension, Annuity, Rental, Alimony, Other.

SS auto-populated from profile info (age, spouse). User selects start age. Is the SS benefit formula something we can compute instead of requiring separate amounts at 62/65/67 — just enter the full benefit amount?

Consider properties each income type might have: COLA adjustment, limited duration, taxability.

Depends on: BE-1 (income stream model expansion) for backend support of new income types.

### Compare Page (/compare)

Comparisons displayed as broad rows, each representing one simulation run. Rows can be dragged to reorder or deleted.

Each row shows: a summary chart, ending balance, min/median/max monthly income (today's dollars), MC success rate, key parameters that differ.

Rows need an identifier — auto-generated from differing parameters (e.g., "4% withdrawal, 7% return") or user-named.

Populated via the "Add to Compare" checkbox on the landing page. Don't add duplicates.

### Details Page (/details)

Year-by-year simulation table, moved from the current Simulate tab. Stop displaying rows after fund exhaustion (currently keeps going with $0 balances).

Depends on: BE-5 (stop after exhaustion) for the API to return truncated results. Or handle in FE only.

### What-If / Scenario Comparisons

Rather than complicated historical configuration presets, maybe user-friendly what-if scenarios: "What if taxes were like the 1970s?", "What if SS were means-tested?" Each with an explanation popup. "Note that Monte Carlo varies economic conditions, not policy changes."

These could feed into Compare — run a what-if, it auto-adds to comparison.

### Bug Fixes (fold into refactoring)
- Inflation input says % but expects a float like 0.03; validation error incorrectly flags the Portfolio pane
- IRA Conversion should be hidden/disabled when withdrawals exceed conversion income limits, or at least explain why conversions won't happen

Monthly vs annual display for desired income — make it monthly, show annual as a note?

- BE-2 adds `initial_monthly_spend` and `initial_annual_spend` to API summary — landing page summary area should display effective spending for the chosen strategy (e.g., "$6,667/mo via 4% rule")

## FE-2. E2E Testing Expansion

After the UI changes from FE-1 stabilize, evaluate and add more complete E2E tests for the different interactions.

Depends on: FE-1 (UX refactoring).
