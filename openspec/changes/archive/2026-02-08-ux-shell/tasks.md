## 1. Theme

- [x] 1.1 Switch theme from seafoam to pine in `app.html` (`data-theme`) and `app.css` (import path)

## 2. Route Structure

- [x] 2.1 Create route directories and `+page.svelte` files for `/spending`, `/compare`, `/details`
- [x] 2.2 Move PortfolioEditor + SimulateView into `/` route page (home/landing)
- [x] 2.3 Move SpendingEditor into `/spending` route page (placeholder — extraction deferred to ux-config-spending)
- [x] 2.4 Move CompareView into `/compare` route page
- [x] 2.5 Create placeholder page for `/details`

## 3. AppBar and Layout

- [x] 3.1 Create `AppBar.svelte` component using Skeleton AppBar with Navigation tiles, dark mode toggle, and avatar
- [x] 3.2 Create `AvatarButton.svelte` placeholder component
- [x] 3.3 Update `+layout.svelte` to render AppBar above a content wrapper with `{@render children()}`
- [x] 3.4 Remove `TabNav.svelte` and its usage from `+page.svelte`

## 4. Tests

- [x] 4.1 Remove `TabNav` component tests
- [x] 4.2 Add AppBar component tests (renders nav links, active state, dark mode toggle, avatar)
- [x] 4.3 Add navigation integration test (route changes render correct content)
- [x] 4.4 Verify existing component tests still pass after route restructure

## 5. Cleanup

- [x] 5.1 Remove unused tab-related imports and types (no remaining references)
- [x] 5.2 Verify `pnpm build` succeeds with no type errors
