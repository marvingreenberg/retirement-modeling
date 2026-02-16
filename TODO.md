# Improvements

When an item here is completed, move it to Completed.md in the order of completion.  Move all the completed sections over first.  Do each task in whatever order seems appropriate.

Note that with the UI refactporing some of the changes have become no longer relevant, first review the current UI.

Second, It seems like the simulation behavior is not correctly changing the single-simulation runs.  Whether this is a UX (passing wrong values) or API problem is not clear.

For each TODO task, at whatever granularity makes sense, DO ALL THESE STEPS

Where it makes sense, open up to three parallel agents to accomplish tasks.

For each task, make a new branch off main
opsx:ff
opsx:apply
Run all tests, fixing failures by correcting implementation, unless the test itself does not match the spec
opsx:verify
Verify results may identify issues, resolve them and list issue, resolution, and choices (briefly) in VerificationIssues.md
opsx:sync/archive.  Change specs should remove "change language" when merging into the top level specs
commit changes to the branch
merge changes onto main
push main to origin, leave local branches in place, do not push feature branches.

Then advance to the next task you have identified.  I want this whole process, all tasks completed with no user intervention.  I consider that goal worth the risk that the implementation diverges some from the intent.


# First

## Review the FE/BE boundary with permutations of inputs to ensure that the changes at the UI are processed properly to cause changes in returned API requets for simulation and montecarlo.  (First verify that changes to the UX send changed requests).  Then verify changed requests return changed responses.  If needed mock the random() to make MC expect to be unchaged.


---

# Backend (API / Simulation Engine)

## ~~API Versioning~~ ✓ DONE (folded into BE-6)

Implemented as part of BE-6 cloud deployment: API routes under `/api/v1/` prefix, version aligned to 0.9.0.

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

## ~~BE-3. Inflation-Index Tax Brackets and Thresholds~~ ✓ DONE

Implemented in `be-improvements` branch:
- Added `inflate_brackets` utility to scale bracket/tier limits by inflation factor
- Simulation loop now computes inflation-adjusted federal brackets, IRMAA tiers, capital gains brackets, standard deduction, and conversion ceiling each year using `cumulative_inflation`
- Fixed hardcoded standard deduction (was 30000, now uses correct `STANDARD_DEDUCTION_MFJ` = 29200, inflation-indexed)
- Tax functions widened to accept dict brackets alongside TaxBracket objects
- Year 0 unchanged (factor=1.0), later years reflect bracket growth

## ~~BE-4. Monte Carlo Tax Regime Sampling~~ ✓ DONE

Implemented in `be-improvements` branch:
- Added `historical_tax_regimes.py` with 7 historical regimes (1978–2024), all normalized to 2024 dollars
- Each regime has uniform structure: 7 federal brackets, 3 CG brackets, 6 IRMAA tiers, standard deduction
- `sample_regime_sequence` uses 2-4 year blocks (political cycles) for Monte Carlo sampling
- `run_simulation` accepts optional `tax_regime_sequence` parameter, regime values override constants before inflation indexing
- `vary_tax_regimes: bool = False` on SimulationConfig; `run_full_monte_carlo` samples regime sequences when enabled
- Pre-IRMAA regimes use `float("inf")` with cost 0 for uniform structure

## ~~BE-5. Stop Simulation After Fund Exhaustion~~ ✓ DONE

Implemented in `be-improvements` branch. Simulation loop breaks after recording the depleted year. Monte Carlo percentile calculations handle variable-length results.

## ~~BE-6. Cloud deployment~~ ✓ DONE

Implemented in `be-improvements` branch:
- API routes versioned under `/api/v1/` prefix with backward-compat 307 redirects
- FastAPI conditionally serves built SvelteKit static assets from `static/` directory
- Single multi-stage Dockerfile (node builds FE, python copies + installs)
- `make dev` runs uvicorn + pnpm dev in parallel; `make docker-run` for integration testing
- Deleted `Dockerfile.api`, `Dockerfile.ui`, `compose.yaml`; updated Makefile targets

## BE-6b. Cloud Run Deployment Process

Define a `docs/Deploy.md` documenting the GCP Cloud Run deployment process. Add a `make deploy` target that assumes `gcloud` CLI is installed and authenticated, builds the Docker image, pushes to Artifact Registry, and deploys to Cloud Run. Cover: project/region configuration, service name, environment variables, IAM basics, and how to verify a deployment. Keep it simple — single service, no custom domain initially.

## BE-7. Sophisticated Portfolio Analysis

Detailed portfolio import using exported files, or 3rd party connectors (expensive)? Showing stock/bond mix, make guestimates of default rate of return.

Simplest starting point: CSV import from brokerage exports (Fidelity, Schwab, Vanguard all offer CSV downloads of holdings). Covers most use cases without API integration costs.

## BE-8. Chatbot Integration

Expand. Does this need GCP, what security issues, what use cases make sense for chatbot integration (portfolio analysis)?

## BE-9 Multi-user

Something cloud based, information stored encrypted at rest. Some best practices for security. Security review. OAuth with Apple, Google, Facebook. Probably Google Cloud.  But, need to evaluate and discuss what the value.


---
# UI bugs

## First use lets set user name and age AND add spouse
    Profile does not allow adding (or deleting) a spouse

## Bug parsing
    Failed to parse OFX: This page contains the following errors:error on line 5 at column 38: Opening and ending tag mismatch: STATUS line 4 and CODE Below is a rendering of the page up to the first error.
    for .accounts/WF_Joint_Investment.QFX

    Test parsing of all

## Parsing identifies %equities, etc. but information is not retained anywhere
    Want to use to estimate rate of return

## can't import to create first account - get error must have one account

## Some disconenct between the 4% rule, RMD, and guardrails, since can't support spending budget
if 4% withdrawal, sometimes.

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

## FE-3. Integrate ApplicationDetails.md Into UI

Surface the content from `docs/ApplicationDetails.md` as contextual help in the UI — tooltips, info popovers, or a dedicated "How It Works" section. Topics include tax bracket indexing, spending strategy explanations, SS benefit formula, and COLA mechanics. Content is maintained in the markdown file and rendered in the UI.

Depends on: FE-1 (UX refactoring — need the final layout to know where help content goes).

## FE-2. E2E Testing Expansion

After the UI changes from FE-1 stabilize, evaluate and add more complete E2E tests for the different interactions.

Depends on: FE-1 (UX refactoring).
