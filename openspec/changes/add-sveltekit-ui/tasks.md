## 1. Project Setup

- [x] 1.1 Initialize SvelteKit project in `ui/` with TypeScript, static adapter, and vite config for API proxy to localhost:8000
- [x] 1.2 Install dependencies: chart.js, svelte-chartjs, zod
- [x] 1.3 Add Makefile targets: `ui-setup`, `ui-dev`, `ui-build`
- [x] 1.4 Create base layout with tab navigation component (Portfolio, Simulate, Monte Carlo, Compare)

## 2. Shared Infrastructure

- [x] 2.1 Create TypeScript types matching backend Pydantic models (Portfolio, Account, SimulationConfig, enums)
- [x] 2.2 Create Zod validation schemas mirroring backend constraints (field ranges, required fields, conditional validation)
- [x] 2.3 Create API client module with typed fetch wrappers for all four endpoints (`/strategies`, `/simulate`, `/monte-carlo`, `/compare`)
- [x] 2.4 Create Svelte writable store for portfolio state with defaults matching backend defaults

## 3. Portfolio Editor

- [x] 3.1 Build collapsible section component for reuse across editor sections
- [x] 3.2 Build People & Timeline section (ages, simulation years, start year)
- [x] 3.3 Build Accounts editor with add/remove rows (name, type, balance, owner, cost basis, available age)
- [x] 3.4 Build Income section (Social Security primary/spouse benefits and start ages)
- [x] 3.5 Build Spending section with conditional fields (strategy dropdown, withdrawal rate, guardrails config, planned expenses)
- [x] 3.6 Build Tax section (state rate, capital gains rate, RMD start age, IRMAA limit)
- [x] 3.7 Build Strategy section (conversion strategy dropdown)
- [x] 3.8 Wire Zod validation to display inline field errors
- [x] 3.9 Implement JSON file load (file picker, parse, validate, populate store)
- [x] 3.10 Implement JSON file save (serialize store to CLI-compatible JSON, trigger download)

## 4. Simulation View

- [x] 4.1 Build Simulate tab with "Run Simulation" button, loading state, and error display
- [x] 4.2 Build balance line chart (pretax, roth, brokerage, total lines by age) using Chart.js
- [x] 4.3 Build summary statistics panel (final balance, total taxes, IRMAA, conversions, strategies)
- [x] 4.4 Build collapsible year-by-year detail table with all YearResult fields

## 5. Monte Carlo View

- [x] 5.1 Build Monte Carlo tab with simulation count input, seed input, "Run Monte Carlo" button, loading/error states
- [x] 5.2 Build fan chart (5th/25th/median/75th/95th percentile bands by age) using Chart.js area chart
- [x] 5.3 Build success rate display and final balance percentiles panel
- [x] 5.4 Build depletion age display (earliest/median/latest when applicable, "no depletion" message otherwise)

## 6. Compare View

- [x] 6.1 Build Compare tab with strategy checkboxes (fetched from `/strategies`), "Run Comparison" button, loading/error states
- [x] 6.2 Build comparison bar chart (grouped by strategy combination, bars for each metric)
- [x] 6.3 Build comparison table with highlighting for best values per column

## 7. Testing

- [x] 7.1 Add unit tests for Zod schemas (valid/invalid portfolio data, edge cases)
- [x] 7.2 Add unit tests for API client (mock fetch, verify request/response handling)
- [x] 7.3 Add unit tests for validation module (valid/invalid portfolios, field error lookup)
- [ ] 7.4 Add component tests for portfolio editor sections (field rendering, validation display, add/remove accounts)
- [ ] 7.5 Verify dev proxy works end-to-end with running FastAPI backend
