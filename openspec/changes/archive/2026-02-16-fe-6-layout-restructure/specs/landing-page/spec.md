## MODIFIED Requirements

### Requirement: Landing page layout order
The landing page SHALL render components in this order: PortfolioEditor (Accounts, Budget, Income), then SimulateSettings, then results area (SimulateView or WelcomeState). The portfolio summary bar is removed.

#### Scenario: Landing page component order
- **WHEN** the user views the landing page after setup
- **THEN** the page displays (top to bottom): PortfolioEditor, SimulateSettings, results/welcome area
- **AND** there is no separate portfolio summary bar

#### Scenario: Navigation links in AppBar suffice
- **WHEN** the portfolio summary bar is removed
- **THEN** navigation to Spending, Compare, and Details is available via the AppBar
