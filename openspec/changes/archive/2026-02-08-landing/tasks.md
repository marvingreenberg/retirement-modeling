## 1. Sample Data

- [x] 1.1 Add `samplePortfolio` constant to stores module with realistic two-person household scenario
- [x] 1.2 Add "Load Sample Data" button to `FileControls.svelte` alongside Load/Save

## 2. Welcome State

- [x] 2.1 Create `WelcomeState.svelte` component with guidance message and visual hint

## 3. SimulateView Refactor

- [x] 3.1 Extract SimulateSettings from SimulateView — lift to page level as a separate section
- [x] 3.2 Refactor SimulateView to be results-only (accept results as props or use shared state)
- [x] 3.3 Lift simulation state (loading, error, results, runMode) to the page level

## 4. Landing Page Layout

- [x] 4.1 Redesign `+page.svelte` with two-panel grid: left (editor + simulate controls), right (welcome or results)
- [x] 4.2 Wire up Simulate button to run simulation and display results in right panel

## 5. Tests

- [x] 5.1 Add sample data tests (valid portfolio, passes Zod validation)
- [x] 5.2 Add WelcomeState component test
- [x] 5.3 Update SimulateView tests for results-only behavior
- [x] 5.4 Verify all existing tests pass
- [x] 5.5 Verify `pnpm build` succeeds
