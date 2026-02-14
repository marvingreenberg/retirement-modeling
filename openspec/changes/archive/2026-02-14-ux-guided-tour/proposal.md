## Why

New users completing the setup form land on the Overview page with no context about what each navigation tab does or what next steps to take. A brief guided tour after first setup would orient them. Additionally, warnings like "$0 spending" currently display as inline banners that are easy to overlook — anchoring them as tooltip popovers to the relevant nav tab makes the connection between the warning and the fix more obvious.

## What Changes

- Rename the "Home" nav tab to "Overview"
- Add a sequential tooltip tour that runs once after first setup (Get Started or Load Sample Data), highlighting each nav tab and the avatar/profile button with a brief description
- Each tour tooltip auto-advances after a few seconds or can be dismissed by clicking
- Replace inline warning banners (e.g., "$0 spending") with inline section warnings in the PortfolioEditor that auto-expand when Simulate is blocked
- Tour state tracked so it only runs once per session

## Capabilities

### New Capabilities
- `guided-tour`: Sequential tooltip walkthrough triggered after first setup, anchored to nav tabs and profile button
- `nav-warnings`: Inline section warnings in PortfolioEditor with simulate-blocking behavior that auto-expands the relevant section

### Modified Capabilities
- `app-shell-layout`: Rename "Home" to "Overview" in navigation; nav items become anchor targets for tour tooltips and warning popovers
- `first-use-flow`: After setup submission or sample data load, trigger the guided tour

## Impact

- `ui/src/lib/components/AppBar.svelte` — rename Home→Overview, add data-tour anchor attributes
- `ui/src/lib/components/` — new GuidedTour and TourTooltip components
- `ui/src/lib/components/portfolio/PortfolioEditor.svelte` — inline Budget section, section warnings, simulateBlockedSection effect
- `ui/src/routes/+page.svelte` — simulate blocking when prerequisites missing
- `ui/src/lib/stores.ts` — tourActive and simulateBlockedSection stores
- Tests for tour sequence, tooltip display/dismiss, setup integration, and nav structure
