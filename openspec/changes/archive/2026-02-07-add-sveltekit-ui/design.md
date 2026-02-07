## Context

The retirement model has a FastAPI REST API with four user-facing endpoints (`/strategies`, `/simulate`, `/monte-carlo`, `/compare`) and a CLI. There is no web UI. Users must construct portfolio JSON by hand and interact via curl or CLI commands. The API accepts and returns well-typed Pydantic models.

## Goals / Non-Goals

**Goals:**
- Provide a browser-based UI for all user-facing API endpoints
- Make portfolio creation accessible without JSON knowledge
- Visualize simulation results with interactive charts
- Maintain compatibility with CLI portfolio JSON format (load/save)

**Non-Goals:**
- User accounts, authentication, or server-side persistence
- Mobile-optimized responsive design (desktop-first is fine)
- Real-time collaboration or sharing
- Replacing or modifying the backend API
- Server-side rendering in production (static SPA is sufficient)

## Decisions

### SvelteKit with static adapter
**Choice**: SvelteKit as the UI framework, configured for static site generation (SPA mode).

**Alternatives considered**:
- React: Larger ecosystem but more boilerplate for form-heavy apps
- Vue: Middle ground, but Svelte's reactivity model is simpler for this use case
- Streamlit: Fast to prototype but limited customization for charts and layout

**Rationale**: Svelte produces the most concise code for form-heavy UIs (two-way binding, minimal boilerplate). SvelteKit provides routing, dev server, and build tooling. Static adapter means the built output is plain HTML/JS/CSS that FastAPI can serve.

### Chart.js for visualization
**Choice**: Chart.js via canvas-based rendering.

**Alternatives considered**:
- D3: More powerful but much more code for standard chart types
- ECharts: Good but heavier bundle, more enterprise-oriented
- LayerCake: Svelte-native but less mature, fewer chart types

**Rationale**: Chart.js covers all needed chart types (line, stacked area, bar), has good defaults, and is framework-agnostic. The `svelte-chartjs` wrapper provides Svelte component integration.

### Zod for client-side validation
**Choice**: Zod schemas that mirror the backend Pydantic models.

**Rationale**: Validates portfolio data before sending to the API. Provides immediate field-level error feedback. Schemas serve as documentation of the expected data shape.

### Single-page tabbed layout
**Choice**: One page with tab navigation (Portfolio, Simulate, Monte Carlo, Compare) rather than separate routes.

**Rationale**: The portfolio state is shared across all analysis views. Tabs avoid redundant state management or URL-based state serialization. Users naturally bounce between analysis modes with the same portfolio.

### API proxy in development, static build in production
**Choice**: SvelteKit dev server proxies `/api/*` to FastAPI at `localhost:8000`. Production build outputs static files to `ui/build/` which FastAPI can serve.

**Rationale**: Clean separation during development (two servers). Simple deployment in production (one server serves both API and UI).

### JSON file import/export for portfolio persistence
**Choice**: Browser-side file download/upload using the same JSON format as the CLI.

**Alternatives considered**:
- localStorage: Not portable, can't share or use with CLI
- Backend storage: Requires auth, database, more complexity

**Rationale**: Zero backend changes needed. Files are interchangeable with CLI usage. Users can maintain multiple portfolio scenarios as files.

## Architecture

```
ui/
├── src/
│   ├── lib/
│   │   ├── api.ts              # API client (fetch wrappers)
│   │   ├── schema.ts           # Zod schemas matching Pydantic models
│   │   ├── stores.ts           # Svelte stores (portfolio state, results)
│   │   ├── components/
│   │   │   ├── portfolio/      # Portfolio editor sections
│   │   │   │   ├── PeopleTimeline.svelte
│   │   │   │   ├── AccountsEditor.svelte
│   │   │   │   ├── IncomeEditor.svelte
│   │   │   │   ├── SpendingEditor.svelte
│   │   │   │   ├── TaxEditor.svelte
│   │   │   │   └── StrategyEditor.svelte
│   │   │   ├── charts/         # Chart components
│   │   │   │   ├── BalanceChart.svelte
│   │   │   │   ├── FanChart.svelte
│   │   │   │   └── CompareChart.svelte
│   │   │   ├── TabNav.svelte
│   │   │   └── FileControls.svelte
│   │   └── types.ts            # TypeScript interfaces
│   └── routes/
│       └── +page.svelte        # Single page with tab layout
├── static/
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

### Data Flow

```
┌──────────────────────────────────────────────────┐
│ Browser                                          │
│                                                  │
│  ┌─────────┐    ┌──────────┐    ┌────────────┐  │
│  │Portfolio │───▶│ Svelte   │───▶│ Results    │  │
│  │ Editor   │    │ Store    │    │ Views      │  │
│  └─────────┘    └────┬─────┘    └────────────┘  │
│       ▲              │               ▲           │
│       │         ┌────▼─────┐         │           │
│  JSON │         │ API      │─────────┘           │
│  file │         │ Client   │                     │
│       │         └────┬─────┘                     │
└───────┼──────────────┼───────────────────────────┘
        │              │ /api/*
        │         ┌────▼─────┐
        │         │ FastAPI  │
        │         │ Backend  │
        │         └──────────┘
   load/save
```

## Testing Strategy

### Layers

```
Unit Tests              Component Tests           E2E Tests
───────────             ───────────────           ─────────
vitest                  vitest +                  Playwright
pure functions          @testing-library/svelte   full app + real API
                        + jsdom

schemas ✅              accounts CRUD             proxy → FastAPI
api client ✅           accounts validation       simulate flow
stores ✅               simulate flow (mocked)

◄── Fast, isolated ──────────────────── Slow, integrated ──►
```

### Resilient test design

The UI is early and will evolve. Tests should break only when **user-visible behavior** changes, not when layout or styling changes.

**Query by role/label, not DOM structure.** Use `getByRole`, `getByText`, `getByLabelText` — never CSS selectors or DOM tree position. If a button moves from top to bottom of a panel, tests should still pass.

**Assert on outcomes, not structure.** "After clicking Add Account, the user sees two account rows" — not "the container has two children with class `.account-row`". "After entering a negative balance, an error is visible" — not "an element with class `.error` has specific text".

**Use test helpers as an abstraction layer.** Locator logic lives in shared helpers (one per component area). When the UI evolves, update the helper — not every test.

```
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Test Files  │────▶│  Helpers     │────▶│  Actual   │
│              │     │              │     │  DOM      │
│ "add account │     │ knows how to │     │          │
│  shows row"  │     │ find things  │     │ (can     │
│              │     │              │     │  change)  │
│ "negative    │     │ single place │     │          │
│  shows error"│     │ to update    │     │          │
└──────────────┘     └──────────────┘     └──────────┘
```

**Use `data-testid` sparingly.** Only when no semantic query exists (no role, label, or text). Prefer improving accessibility markup over adding testids — it helps real users too.

**Don't assert on exact API values.** Verify that results render (chart exists, summary region exists), not that specific dollar amounts match.

### Component test scope (minimal, evolution-safe)

Focus on stable interaction patterns, not volatile field-level details:

**Accounts section:**
- Renders with default account
- Add account → new row appears
- Remove account → row disappears
- Field values bind correctly (name, type, balance)
- Empty name → validation error visible
- Negative balance → validation error visible
- Fix invalid value → error clears

**Simulate tab:**
- Run button triggers API call (mocked)
- Loading state shows while waiting
- Results render after response (chart canvas, summary region)
- Error state displays on API failure

Income, Spending, Tax, and Strategy sections are deliberately excluded — these fields are likely to evolve as the retirement model matures. Add coverage for them once they stabilize.

### E2E scope (minimal)

One Playwright test proving the full stack works:
- Load app in real browser
- Navigate to Simulate tab
- Click Run Simulation with default portfolio
- Verify results appear (via proxy to real FastAPI)

No assertions on specific values — just that the plumbing connects.

### Future: containerization for CI

E2E tests currently require a running FastAPI backend. A future change will add Docker/Podman Compose to start both services, run Playwright, and tear down — making E2E tests reproducible in CI without manual setup.

## Risks / Trade-offs

- **Zod/Pydantic drift** → If backend models change, Zod schemas must be updated manually. Mitigation: keep schemas in one file (`schema.ts`), add a comment noting the Pydantic source models.
- **Chart.js bundle size** → Chart.js is ~200KB. Mitigation: tree-shake unused chart types, use dynamic imports if needed.
- **No backend validation feedback** → Client validates with Zod before submit, but backend may reject edge cases Zod doesn't catch. Mitigation: display API error responses in the UI.
- **Portfolio complexity** → The form has many fields. Mitigation: collapsible sections with sensible defaults; most users only need to fill People, Accounts, and Spending.
