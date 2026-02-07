## MODIFIED Requirements

### Requirement: Tab navigation
The UI SHALL display a tab bar with four tabs: Portfolio, Simulate, Monte Carlo, and Compare. Clicking a tab SHALL display the corresponding view content. The tab bar SHALL use Skeleton Tab components with themed styling.

#### Scenario: Default tab on load
- **WHEN** the user opens the application
- **THEN** the Portfolio tab is active and the portfolio editor is displayed

#### Scenario: Switch between tabs
- **WHEN** the user clicks the "Simulate" tab
- **THEN** the Simulate view is displayed and the tab is visually marked as active

#### Scenario: Portfolio state persists across tabs
- **WHEN** the user edits portfolio fields, switches to Simulate, then switches back to Portfolio
- **THEN** the previously entered values are preserved

#### Scenario: Tabs render with theme styling
- **WHEN** the application loads
- **THEN** the tab bar uses Skeleton Tab component styling consistent with the active theme
