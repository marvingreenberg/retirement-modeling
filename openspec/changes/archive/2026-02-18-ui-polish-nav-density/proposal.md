## Problem

The UI has several visual inconsistencies and density issues:
- App title says "Retirement Simulator" with no icon — rename to "Retirement Planner" with icon
- Top nav text and icons are small (`text-sm`, `size={16}`), hard to read
- Help icon is similarly undersized
- Section headers (Accounts, Budget, Income) use small icons (`size={16}`) and default accordion text
- Account rows have excessive vertical padding (`p-3`, `gap-3`) and spacing
- Account Name field is too narrow (`w-36`) for longer names
- "Cost Basis %" label wraps — needs shorter label
- "(now)" hint on Avail. Year is pointless noise
- Strategy dropdown shows "Standard" which is unclear — should say "No conversion"
- Withdrawal Strategy label is small/muted compared to other text
- Simulate button is small and right-aligned; could be a prominent left-justified square button

## Proposed Solution

Pure CSS/markup changes across AppBar, CollapsibleSection, AccountsEditor, SimulateSettings, and PortfolioEditor. No logic changes, no backend changes.

## Affected Areas

- AppBar.svelte — title rename + icon, bigger nav/help icons
- CollapsibleSection.svelte — bigger section header text
- PortfolioEditor.svelte — section icon sizes
- AccountsEditor.svelte — denser rows, wider name, label rename, remove (now)
- SimulateSettings.svelte — rename Standard, bigger strategy text, redesigned simulate button
