## 1. Setup

- [x] 1.1 Install Tailwind v4, `@skeletonlabs/skeleton`, and `@skeletonlabs/skeleton-svelte` via pnpm
- [x] 1.2 Create `ui/src/app.css` with Tailwind, Skeleton core, Skeleton Svelte, and cerberus theme imports
- [x] 1.3 Update `ui/src/app.html` to add `data-theme="cerberus"` on the `<html>` tag
- [x] 1.4 Update `ui/src/routes/+layout.svelte` to import `app.css`
- [x] 1.5 Verify build passes with Skeleton and Tailwind configured

## 2. App Shell and Navigation

- [x] 2.1 Add light/dark mode toggle to the app header in `+page.svelte`
- [x] 2.2 Replace hand-rolled `TabNav.svelte` with Skeleton Tab components
- [x] 2.3 Update `+page.svelte` header and layout to use Tailwind utility classes, remove `<style>` block

## 3. Portfolio Editor Components

- [x] 3.1 Replace `CollapsibleSection.svelte` with Skeleton Accordion/AccordionItem
- [x] 3.2 Migrate `PortfolioEditor.svelte` to use Skeleton Accordion and remove `<style>` block
- [x] 3.3 Migrate `PeopleTimeline.svelte` — replace `<style>` with Tailwind classes on inputs and labels
- [x] 3.4 Migrate `AccountsEditor.svelte` — replace `<style>` with Tailwind classes, style add/remove buttons with Skeleton presets
- [x] 3.5 Migrate `IncomeEditor.svelte` — replace `<style>` with Tailwind classes
- [x] 3.6 Migrate `SpendingEditor.svelte` — replace `<style>` with Tailwind classes, style expense rows and buttons
- [x] 3.7 Migrate `TaxEditor.svelte` — replace `<style>` with Tailwind classes
- [x] 3.8 Migrate `StrategyEditor.svelte` — replace `<style>` with Tailwind classes
- [x] 3.9 Migrate `FileControls.svelte` — style buttons with Skeleton presets, style error display
- [x] 3.10 Migrate `FieldError.svelte` — replace `<style>` with Tailwind classes

## 4. Result View Components

- [x] 4.1 Migrate `SimulateView.svelte` — style button, summary panel, error display, and table with Skeleton/Tailwind
- [x] 4.2 Migrate `MonteCarloView.svelte` — style controls, success rate, stats panels, and depletion display
- [x] 4.3 Migrate `CompareView.svelte` — style checkboxes, button, table, and best-value highlighting

## 5. Chart Components

- [x] 5.1 Minimal chart wrapper updates — ensure `BalanceChart`, `FanChart`, and `CompareChart` canvas containers use Tailwind classes

## 6. Cleanup and Testing

- [x] 6.1 Remove unused hand-rolled CSS and verify no `<style>` blocks remain with replaced styles
- [x] 6.2 Verify all existing tests still pass after migration
- [x] 6.3 Verify light/dark toggle works and preference persists across reload
