# Project: Retirement Simulator

## Architecture

Full-stack retirement planning simulator: Python/FastAPI backend + SvelteKit frontend, served from a single Docker container.

### Backend (`src/retirement_model/`)
- **Python 3.10+, FastAPI**, Pydantic models, click CLI
- API routes under `/api/v1/` with backward-compat redirects
- Key modules: `simulation.py` (core loop), `monte_carlo.py`, `strategies.py`, `taxes.py`, `withdrawals.py`, `models.py`
- `pyproject.toml` — must include `[tool.setuptools.package-data]` for `static/**/*` or Docker won't serve the frontend

### Frontend (`ui/`)
- **SvelteKit** with **Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$props`, `$bindable`) — NOT Svelte 4 syntax
- **Skeleton UI** framework for components (AppBar, drawers, buttons, inputs)
- **Chart.js** for balance/fan charts
- **Zod** for client-side validation matching backend Pydantic constraints
- Package manager: **pnpm**
- Routes: `/` (unified view — Approach/Scenarios tabs, result panes for Balance/Spending/Monte Carlo/Details) and `/settings` (profile, accounts, income, advanced). The old `/spending`, `/compare`, `/details` routes were merged into `/` — do not assume they still exist.

### Key Frontend Files
- `ui/src/lib/types.ts` — TypeScript interfaces matching backend models
- `ui/src/lib/schema.ts` — Zod schemas for validation
- `ui/src/lib/stores.svelte.ts` — Svelte 5 `$state()` stores with getter/setter `.value` pattern
- `ui/src/lib/format.ts` — Currency/number formatting helpers
- `ui/src/lib/api.ts` — API client functions
- `ui/src/lib/components/portfolio/` — PortfolioEditor, SpendingEditor, AccountsEditor, IncomeEditor
- `ui/src/lib/components/SimulateSettings.svelte` — Simulation controls (inflation, growth, strategy, run mode)
- `ui/src/lib/components/ProfileDrawer.svelte` — Name/age/timeline + Tax & Advanced settings
- `ui/src/lib/components/CollapsibleSection.svelte` — Reusable collapsible with optional `summary` snippet

### Svelte 5 Patterns Used
- Props: `let { foo = $bindable() }: { foo: Type } = $props()`
- Render delegation: `{#snippet summary()}...{/snippet}` passed as props (type `Snippet`)
- Reactivity: `$derived()`, `$derived.by(() => { ... })`, `$effect()`
- Component tests use `@testing-library/svelte` with `render()` + `screen` queries — query by role/label, not DOM structure

## Development Workflow

### Miscellaneous Tools

Use `do_cmd` for running commands in worktrees or to run commnds in subdirectories generally.  Also use to setup venv before running command.
Run do_cmd --help for full description

- `do_cmd -w <worktree> -- <command>` — run command in a worktree
- `do_cmd -w <worktree> -p .,dev -- pytest tests -q` — API tests in worktree, with venv set up, and activated
- `do_cmd -w <worktree> -d ui -- pnpm exec vitest run` — frontend tests in worktree
- `-p .,dev` sets up `.venv` with dev extras (skips if `.venv` exists); `-d` changes to subdirectory



### Task Execution Process

Follow global CLAUDE.md.

In addition, update DESIGN.md when changes affect the overall architecture, and review help text when behavior is changed or added.

### GUARDRAIL: MAIN IS ALWAYS DEPLOYABLE

`main` must have zero lint errors and zero test failures at all times. Never dismiss failures as "pre-existing" or "not from our changes." If `make lint` or tests fail after a merge, fix them before considering the work done. This applies to both backend and frontend — run `make lint` (not just `make lint-api`), which checks both.

### Linting

All changes must conform to existing lint/format styles. **Always run `make lint` before committing** and fix any issues.

**Backend**: `make lint-api` / `make format-api`
**Frontend**: `make lint-ui` / `make format-ui`
**All at once**: `make lint` (both) / `make format` (auto-fix both)

Keep the Makefile lint/format targets up to date as the project evolves.

- ESLint is configured with warnings (not errors) for pre-existing patterns like `no-explicit-any`, `require-each-key`, `no-navigation-without-resolve` (off — project uses adapter-static)
- New code should not introduce new warnings; fix or suppress with inline comments if justified

### Testing

**Backend**: `python -m pytest tests/ -x -q`
**Frontend unit**: `cd ui && npx vitest run`
**Frontend E2E**: `cd ui && npx playwright test`
**Svelte type check**: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`

**Test value rule (see global CLAUDE.md §5):** Every test must catch a real bug. In the completion summary, name the concrete implementation mistake each new test would catch. If you can't name one, delete or rewrite the test. No `is not None`, `isinstance`, or vacuous `> 0` smoke checks. No "renders the heading" component tests without an event or conditional-render assertion.

**Prefer invariants for simulator logic.** This project's highest-leverage tests are accounting identities — fields rolled up from components must equal their components:

- **Sources = Uses** (`tests/test_simulation.py::TestSourcesEqualUses` and the `_assert_sources_equal_uses` helper): income + withdrawals = spending + taxes + deposits + surplus for every live year
- **Balance decomposition** (`TestSimulationInvariants::test_balance_components_sum_to_total`): `pretax + roth + roth_conversion + brokerage = total_balance`
- **Tax decomposition** (`TestSimulationInvariants::test_tax_components_sum_to_total`): `income_tax + state_income_tax + brokerage_gains_tax = total_tax` (IRMAA and conversion_tax are separate by design)

When adding simulation logic, prefer adding an assertion to one of these invariant tests (or adding a new invariant class in the same style) over writing a single-scenario regression test. One invariant catches a class of bugs across every test fixture and every simulated year.

### Docker
- Single multi-stage Dockerfile: Node builds SvelteKit → Python copies static + installs backend
- `make docker-run` for integration testing (port 8000)
- `make dev` runs uvicorn + pnpm dev in parallel for development

### Git Notes
- May use worktrees: check `git worktree list` to verify which worktree has `main` checked out
- When main is checked out in another worktree, copy files there to commit, or use `git worktree add`

## Completed Work
   see Completed.md
