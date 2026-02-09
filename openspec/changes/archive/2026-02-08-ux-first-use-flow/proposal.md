## Why

The app currently boots with a pre-filled default portfolio (age 65/62, $500K IRA, $36K SS, $100K/yr spending, IRMAA Tier 1 strategy). A new user sees someone else's numbers and must figure out what to change. There is no onboarding — the first experience is a wall of pre-populated fields with arbitrary defaults. The app needs an empty starting state with a guided setup flow so users begin with their own data.

## What Changes

- Replace the pre-filled `defaultPortfolio` with a minimal empty state (zeroed balances, no accounts, no SS)
- Add a `needsSetup` flag (derived from portfolio state) that triggers a setup view instead of the normal landing page
- Create a setup view on the landing page: name, primary age, spouse toggle + age, with a [Start] button and a [Load Sample Data] alternative
- After setup, the user lands on the normal two-panel page with their basic info filled in and empty accounts/income ready to configure
- Update WelcomeState to reflect the post-setup context (user has entered ages but needs accounts)

## Capabilities

### New Capabilities
- `first-use-flow`: Setup experience for new users — detects empty portfolio, shows setup form, transitions to normal landing page

### Modified Capabilities
- `landing-page`: Welcome state updates to reflect post-setup context; landing page conditionally shows setup view when portfolio is unconfigured

## Impact

- `ui/src/lib/stores.ts` — new empty default, `needsSetup` derived store or logic
- `ui/src/routes/+page.svelte` — conditional rendering of setup vs normal view
- `ui/src/lib/components/WelcomeState.svelte` — updated messaging
- `ui/src/lib/components/FileControls.svelte` — Load Sample Data available in setup flow
- Tests for setup flow, updated tests for changed defaults
