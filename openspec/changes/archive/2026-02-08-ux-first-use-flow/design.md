## Context

The app boots with `defaultPortfolio` — a fully populated portfolio with age 65/62, $500K IRA, SS income, $100K spending. This creates a confusing first experience where all fields are pre-filled with someone else's numbers. The `WelcomeState` component shows in the right panel but the left panel is fully populated with defaults.

The landing page (`+page.svelte`) has a two-panel layout: PortfolioEditor + SimulateSettings on the left, results/welcome on the right. FileControls offers Load Sample Data, Load, Save.

## Goals / Non-Goals

**Goals:**
- New users see a setup form instead of pre-filled defaults
- Setup captures minimal info: primary age, spouse toggle + age
- After setup, normal landing page with empty accounts ready to populate
- "Load Sample Data" available as an alternative to manual setup
- Existing users who load a portfolio file bypass setup entirely

**Non-Goals:**
- User profiles or authentication
- Persisting setup state across sessions (browser refresh resets)
- First-use tutorials or guided walkthroughs beyond the setup form

## Decisions

### Empty default portfolio

Replace the current `defaultPortfolio` with a truly empty state: age 0, no accounts, zeroed SS, $0 spending. The `samplePortfolio` (realistic two-person scenario) already exists for users who want example data.

**Rationale**: Pre-filling arbitrary numbers is worse than empty. The setup form captures the essentials (ages), and after that the user adds accounts and income themselves.

**Alternative considered**: Keep defaults but mark them as "example" — rejected because the user still has to mentally separate their data from the examples, and validation would need to handle half-edited states.

### Setup detection via derived state

Add a derived `needsSetup` check in `+page.svelte` based on portfolio state: `accounts.length === 0 && current_age_primary === 0`. This avoids a separate flag that could get out of sync.

**Rationale**: Deriving from actual state is more robust than a boolean flag. Loading a portfolio file or sample data naturally transitions past setup because the portfolio will have accounts and non-zero ages.

### Setup view as a centered card on the landing page

The setup form replaces the entire landing page content (not just the right panel). It's a centered card with: heading, age inputs, spouse toggle, and two CTAs: [Get Started] and [Load Sample Data].

**Rationale**: Showing the empty PortfolioEditor behind a setup overlay is confusing. A clean centered form focuses attention. After setup, the full two-panel layout appears.

### Post-setup state

After clicking [Get Started], the portfolio store is updated with the entered ages, `simulation_years` is derived (plan to age 95), and a single empty brokerage account is added as a starting point. The user lands on the normal two-panel page.

**Rationale**: At least one account is needed for the portfolio editor to be useful — an empty account list shows nothing to edit. A brokerage account is the simplest starting point.

## Risks / Trade-offs

- **Browser refresh loses setup**: Since there's no persistence, refreshing returns to setup. → Acceptable for now. Users who care will use Save/Load.
- **Empty defaults break existing tests**: Tests that rely on `defaultPortfolio` having a $500K account will need updating. → Tests should use `samplePortfolio` or create their own fixtures.
- **Validation on empty portfolio**: The empty default will have validation errors (age 0, no accounts). → Setup form validates before transitioning; the error banner shouldn't show during setup since `formTouched` starts false.
