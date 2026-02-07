## Why

The retirement model has a FastAPI backend and CLI but no web interface. Users must craft JSON portfolio files by hand and run CLI commands or raw API calls to get results. A web UI makes the tool accessible to non-technical users and provides visual feedback through charts and tables.

## What Changes

- Add a SvelteKit single-page application in a `ui/` directory at the repo root
- Tabbed interface with four views: Portfolio, Simulate, Monte Carlo, Compare
- Portfolio editor with collapsible sections for all configuration (people, accounts, income, spending, taxes, strategy)
- JSON file load/save for portfolio configurations (compatible with CLI)
- Simulate view: line chart of balances over time (stacked by account type), summary stats, year-by-year detail table
- Monte Carlo view: fan chart with percentile bands (5th/25th/median/75th/95th), success rate display, depletion age info
- Compare view: bar charts and table comparing strategy combinations across metrics
- SvelteKit dev server proxies `/api` requests to FastAPI on port 8000
- Form validation using Zod schemas matching the backend Pydantic models

## Capabilities

### New Capabilities
- `ui-shell`: SvelteKit project setup, tab navigation, API proxy configuration, shared layout
- `portfolio-editor`: Form-based portfolio configuration editor with collapsible sections, Zod validation, JSON file import/export
- `simulation-view`: Single simulation results display with balance charts, summary stats, and year-by-year table
- `monte-carlo-view`: Monte Carlo results display with fan chart, success rate, and percentile analysis
- `compare-view`: Strategy comparison display with bar charts and metrics table

### Modified Capabilities

(none — the backend API and specs are unchanged)

## Impact

- **New dependency**: Node.js / npm toolchain for the UI
- **New directory**: `ui/` with SvelteKit project structure
- **Makefile**: New targets for UI setup, dev, build
- **No backend changes**: UI consumes existing API endpoints as-is
- **Dev workflow**: Two servers during development (FastAPI :8000, SvelteKit :5173)
