## Why

The landing page works but lacks polish. There are no warnings when the portfolio is misconfigured (e.g., $0 spending), no summary of portfolio health before running a simulation, and the loading state is just text. These small improvements make the app feel more complete and guide the user.

## What Changes

- Add portfolio summary bar showing total balance, annual spending, and years remaining
- Add validation warning banner when common issues exist (no spending configured, no income)
- Improve loading state with animated indicator
- Add "View Details" link after results appear, pointing to /details page
- Update WelcomeState with portfolio summary when portfolio is configured

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `landing-page`: Add portfolio summary, validation warnings, and post-results navigation

## Impact

- `ui/src/lib/components/WelcomeState.svelte` — Add portfolio quick stats
- `ui/src/lib/components/SimulateView.svelte` — Add "View Details" link after results
- `ui/src/routes/+page.svelte` — Add validation warning banner, improve loading state
