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
- **Known issue**: `binding_property_non_reactive` warnings in editors — stores use Svelte 4 `writable()` so props are plain objects, not Svelte 5 reactive proxies. Works via focusout-triggered store updates. Proper fix: migrate to `$state()` runes at store level.
- **Skeleton UI** framework for components (AppBar, drawers, buttons, inputs)
- **Chart.js** for balance/fan charts
- **Zod** for client-side validation matching backend Pydantic constraints
- Package manager: **pnpm**
- Routes: `/` (Overview), `/spending` (Budget), `/compare`, `/details`

### Key Frontend Files
- `ui/src/lib/types.ts` — TypeScript interfaces matching backend models
- `ui/src/lib/schema.ts` — Zod schemas for validation
- `ui/src/lib/stores.ts` — Svelte writable stores, sample/default portfolio data
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

### Task Execution Process

1. **Branch**: `git checkout -b <feature-branch>` off main
2. **Plan**: Use plan mode for non-trivial changes to design the approach
3. **Implement**: Write code and tests
4. **Test**: Run all tests, fix failures
5. **Commit**: Commit changes to the feature branch
6. **Merge**: Merge feature branch onto main (conflicts resolved by user)
7. **Push**: Push main to origin. Leave local branches in place. Do NOT push feature branches.

Update DESIGN.md when changes affect the overall architecture.

### Linting

All changes must conform to existing lint/format styles. **Always run `make lint` before committing** and fix any issues in changed code.

**Backend**: `make lint-api` / `make format-api`
**Frontend**: `make lint-ui` / `make format-ui`
**All at once**: `make lint` (both) / `make format` (auto-fix both)

Keep the Makefile lint/format targets up to date as the project evolves.

- ESLint is configured with warnings (not errors) for pre-existing patterns like `no-explicit-any`, `require-each-key`, `no-navigation-without-resolve` (off — project uses adapter-static)
- New code should not introduce new warnings; fix or suppress with inline comments if justified

### Responding to Warnings

When a linter, type-checker, compiler, or any tool produces a warning, do not apply a mechanical fix. Trace the full consequences of the proposed change — what reads the value, what writes it, what triggers re-execution. A warning identifies a real concern, but the "obvious" fix may create a worse problem (infinite loops, race conditions, subtle breakage) if applied without understanding the surrounding data flow. Think through second-order effects before changing code to silence a warning.

### Testing

**Backend**: `python -m pytest tests/ -x -q` (currently ~353 tests, 95% coverage)
**Frontend unit**: `cd ui && npx vitest run` (currently ~227 tests across 24 test files)
**Frontend E2E**: `cd ui && npx playwright test` (currently ~30 tests)
**Svelte type check**: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`

### Docker
- Single multi-stage Dockerfile: Node builds SvelteKit → Python copies static + installs backend
- `make docker-run` for integration testing (port 8000)
- `make dev` runs uvicorn + pnpm dev in parallel for development

### Git Notes
- May use worktrees: check `git worktree list` to verify which worktree has `main` checked out
- When main is checked out in another worktree, copy files there to commit, or use `git worktree add`

## Completed Work
   see Completed.md
