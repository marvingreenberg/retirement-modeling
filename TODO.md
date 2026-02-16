# Improvements

When an item here is completed, move it to Completed.md in the order of completion.  Move all the completed sections over first.  Do each task in whatever order seems appropriate.

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

## ~~BE-7. Sophisticated Portfolio Analysis~~ ✓ OBE

Superseded by client-side OFX/QFX portfolio import (FE, commit 1a23213). Brokerage export import handled in the frontend.

## BE-8. Chatbot Integration

Expand. Does this need GCP, what security issues, what use cases make sense for chatbot integration (portfolio analysis)?

## BE-9 Multi-user

Something cloud based, information stored encrypted at rest. Some best practices for security. Security review. OAuth with Apple, Google, Facebook. Probably Google Cloud.  But, need to evaluate and discuss what the value.

---

# Frontend (UI)

## FE-4. What-If / Scenario Comparisons

Rather than complicated historical configuration presets, user-friendly what-if scenarios: "What if taxes were like the 1970s?", "What if SS were means-tested?" Each with an explanation popup. "Note that Monte Carlo varies economic conditions, not policy changes."

These could feed into Compare — run a what-if, it auto-adds to comparison.

## ~~FE-5. Bug Fixes~~ ✓ DONE

Fixed 4 UI bugs: monthly-primary spending display across all views, conversion strategy dropdown disabled when age >= RMD age with explanatory note, inline validation errors for inflation/growth inputs routed away from portfolio banner, effective spending display in single-run results summary.

## ~~FE-6. Layout Restructure~~ ✓ DONE

Reordered landing page (PortfolioEditor above SimulateSettings), added collapsed section summaries (Accounts total, Budget monthly + expenses, Income SS/streams), moved Advanced settings (tax rates, RMD, IRMAA) to ProfileDrawer, converted BalanceChart to stacked area (Pre-tax/Roth/Brokerage, no Total line), removed redundant portfolio summary bar.
