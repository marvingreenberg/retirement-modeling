# Completed

Items moved from TODO.md in order of completion.

---

## FE/BE boundary verification tests

Review the FE/BE boundary with permutations of inputs to ensure that the changes at the UI are processed properly to cause changes in returned API requests for simulation and montecarlo.

---

## UI bugs

- First use lets set user name and age AND add spouse (profile does not allow adding/deleting spouse)
- Bug parsing OFX: tag mismatch errors for .QFX files
- Parsing identifies %equities, etc. but information is not retained anywhere
- Can't import to create first account - get error must have one account
- Disconnect between 4% rule, RMD, and guardrails since can't support spending budget

---

## API Versioning (folded into BE-6)

Implemented as part of BE-6 cloud deployment: API routes under `/api/v1/` prefix, version aligned to 0.9.0.

---

## BE-1. Income Stream Model Expansion

Implemented in `be-improvements` branch across two changes:
- **add-income-streams**: Generic `IncomeStream` model with name, amount, start/end age, taxable_pct
- **be1-cola-and-ss-features**: Per-stream COLA adjustment, SS actuarial benefit formula (early/late claiming), SS auto-generation from profile config (`ss_auto`)

---

## BE-2. Withdrawal Strategy Clarity

Implemented in `be-improvements` branch:
- Fixed `percent_of_portfolio` bug (was reading `guardrails_config` instead of `withdrawal_rate`)
- Added `initial_annual_spend` and `initial_monthly_spend` to API simulation summary
- Added `monthly_spend` convenience property to `SimulationConfig`
- Enriched `/strategies` endpoint with `uses_fields`/`ignores_fields` metadata per strategy
- Aligned version to 0.9.0 across `pyproject.toml` and API

---

## BE-3. Inflation-Index Tax Brackets and Thresholds

Implemented in `be-improvements` branch:
- Added `inflate_brackets` utility to scale bracket/tier limits by inflation factor
- Simulation loop now computes inflation-adjusted federal brackets, IRMAA tiers, capital gains brackets, standard deduction, and conversion ceiling each year using `cumulative_inflation`
- Fixed hardcoded standard deduction (was 30000, now uses correct `STANDARD_DEDUCTION_MFJ` = 29200, inflation-indexed)
- Tax functions widened to accept dict brackets alongside TaxBracket objects
- Year 0 unchanged (factor=1.0), later years reflect bracket growth

---

## BE-4. Monte Carlo Tax Regime Sampling

Implemented in `be-improvements` branch:
- Added `historical_tax_regimes.py` with 7 historical regimes (1978–2024), all normalized to 2024 dollars
- Each regime has uniform structure: 7 federal brackets, 3 CG brackets, 6 IRMAA tiers, standard deduction
- `sample_regime_sequence` uses 2-4 year blocks (political cycles) for Monte Carlo sampling
- `run_simulation` accepts optional `tax_regime_sequence` parameter, regime values override constants before inflation indexing
- `vary_tax_regimes: bool = False` on SimulationConfig; `run_full_monte_carlo` samples regime sequences when enabled
- Pre-IRMAA regimes use `float("inf")` with cost 0 for uniform structure

---

## BE-5. Stop Simulation After Fund Exhaustion

Implemented in `be-improvements` branch. Simulation loop breaks after recording the depleted year. Monte Carlo percentile calculations handle variable-length results.

---

## BE-6. Cloud deployment

Implemented in `be-improvements` branch:
- API routes versioned under `/api/v1/` prefix with backward-compat 307 redirects
- FastAPI conditionally serves built SvelteKit static assets from `static/` directory
- Single multi-stage Dockerfile (node builds FE, python copies + installs)
- `make dev` runs uvicorn + pnpm dev in parallel; `make docker-run` for integration testing
- Deleted `Dockerfile.api`, `Dockerfile.ui`, `compose.yaml`; updated Makefile targets

---

## BE-6b. Cloud Run Deployment Process

Define a `docs/Deploy.md` documenting the GCP Cloud Run deployment process. Add a `make deploy` target.

---

## BE-7. Sophisticated Portfolio Analysis (OBE)

Superseded by client-side OFX/QFX portfolio import.

---

## BE-8. Chatbot Integration / BE-9. Multi-user

Design documents for chatbot integration and multi-user support.

---

## FE-1. UX Refactoring — Layout and Navigation

SvelteKit route-based navigation, AppBar with profile drawer, first-use setup flow, guided tour, landing page with simulation controls, spending page, compare page, details page.

---

## FE-2. E2E Testing Expansion

Playwright E2E test suite covering setup, navigation, simulation, spending, compare, and details pages. TESTING.md documenting test layers.

---

## FE-3. Integrate ApplicationDetails.md Into UI

Contextual help drawer with 4 topics (Tax Bracket Inflation Indexing, Spending Strategies, Social Security Benefit Formula, Income Stream COLA), route-based default topics, maximize toggle, and internal navigation between related topics. CircleHelp button in AppBar.

---

## FE-5. Bug Fixes

Fixed 4 UI bugs: monthly-primary spending display across all views, conversion strategy dropdown disabled when age >= RMD age with explanatory note, inline validation errors for inflation/growth inputs routed away from portfolio banner, effective spending display in single-run results summary.

---

## FE-6. Layout Restructure

Reordered landing page (PortfolioEditor above SimulateSettings), added collapsed section summaries (Accounts total, Budget monthly + expenses, Income SS/streams), moved Advanced settings (tax rates, RMD, IRMAA) to ProfileDrawer, converted BalanceChart to stacked area (Pre-tax/Roth/Brokerage, no Total line), removed redundant portfolio summary bar.

---

## Fix Expense UX

Fixed planned expense reactivity bug (recurring fields not appearing until section collapse/reopen), changed recurring expenses from start/end age to start/end year (backend + frontend), made spending input annual-primary with monthly shown as detail text, and preserved start date when switching between one-time and recurring types.

---

## Inline Spending Editor

Removed Spending tab from AppBar and deleted the `/spending` route. Moved full SpendingEditor into the Budget collapsible section of PortfolioEditor. Converted planned expenses from repeated label blocks to a compact table with columns: Name, Amount, Type, When (year or start–end range), Inflation Adj., and remove button.
