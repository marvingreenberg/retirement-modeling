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

For each TODO task, follow these steps in order. The goal is autonomous completion with minimal user intervention.

1. **Branch**: `git checkout -b <feature-branch>` off main
2. **Spec**: `/opsx:ff <change-name>: <description>` — creates proposal, design, specs, tasks
3. **Implement**: `/opsx:apply <change-name>` — work through tasks
4. **Test**: Run all tests, fix failures by correcting implementation (unless the test itself doesn't match the spec)
5. **Verify**: `/opsx:verify <change-name>` — check implementation against specs
6. **Resolve**: If verify finds issues, fix them. Note issue/resolution/choices in VerificationIssues.md
7. **Sync/Archive**: `/opsx:archive <change-name>` — sync delta specs to main specs (remove "change language" like ADDED/MODIFIED/REMOVED headers when merging), then archive
8. **Commit**: Commit changes to the feature branch
9. **Merge**: Merge feature branch onto main
   Conflicts should be resolved by user
10. **Push**: Push main to origin. Leave local branches in place. Do NOT push feature branches.

### OpenSpec Structure
- `openspec/specs/<capability>/spec.md` — Main requirement specs (the source of truth)
- `openspec/changes/<name>/` — Active changes with proposal, design, delta specs, tasks
- `openspec/changes/archive/` — Completed changes (dated)
- Delta specs use `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements` headers
- When syncing/archiving, these change headers get stripped — only the requirement content merges into main specs

### Linting

All changes must conform to existing lint/format styles. Run linters before committing and fix any issues in changed code.

**Backend**: `black --check src/ tests/` and `isort --check src/ tests/` (configured in `pyproject.toml`)
**Frontend**: `cd ui && pnpm lint` (ESLint + eslint-plugin-svelte) and `cd ui && pnpm format:check` (Prettier)
**All at once**: `make lint` (both) / `make format` (auto-fix both)

- ESLint is configured with warnings (not errors) for pre-existing patterns like `no-explicit-any`, `require-each-key`, `no-navigation-without-resolve` (off — project uses adapter-static)
- New code should not introduce new warnings; fix or suppress with inline comments if justified

### Testing

**Backend**: `python -m pytest tests/ -x -q` (currently ~353 tests, 95% coverage)
**Frontend unit**: `cd ui && npx vitest run` (currently ~227 tests across 24 test files)
**Frontend E2E**: `cd ui && npx playwright test` (currently ~30 tests)
**Svelte type check**: `cd ui && npx svelte-check --tsconfig ./tsconfig.json`
  - Known pre-existing error in `vite.config.ts` about `process` — ignore this

### Docker
- Single multi-stage Dockerfile: Node builds SvelteKit → Python copies static + installs backend
- `make docker-run` for integration testing (port 8000)
- `make dev` runs uvicorn + pnpm dev in parallel for development

### Git Notes
- May use worktrees: check `git worktree list` to verify which worktree has `main` checked out
- When main is checked out in another worktree, copy files there to commit, or use `git worktree add`

## Completed Work
   see Completed.md
