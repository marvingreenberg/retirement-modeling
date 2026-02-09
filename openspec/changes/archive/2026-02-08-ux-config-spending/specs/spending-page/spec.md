## ADDED Requirements

### Requirement: Spending configuration page
The `/spending` route SHALL display a dedicated spending configuration page with all spending-related controls: spending strategy, annual spending amount, strategy-specific parameters, and planned expenses.

#### Scenario: Spending page content
- **WHEN** the user navigates to `/spending`
- **THEN** the page displays spending strategy selection, annual spending amount, and planned expenses editor

#### Scenario: Spending strategy selection
- **WHEN** the user views the spending page
- **THEN** a dropdown is visible with options: Fixed Dollar, Percent of Portfolio, Guardrails, RMD-Based

#### Scenario: Conditional parameters for Percent of Portfolio
- **WHEN** the user selects "Percent of Portfolio" spending strategy
- **THEN** a Withdrawal Rate input appears

#### Scenario: Conditional parameters for Guardrails
- **WHEN** the user selects "Guardrails" spending strategy
- **THEN** Initial Withdrawal Rate, Floor %, Ceiling %, and Adjustment % inputs appear

#### Scenario: Annual spending input
- **WHEN** the user views the spending page
- **THEN** an annual spending amount input is visible with the current portfolio value

#### Scenario: Planned expenses editor
- **WHEN** the user views the spending page
- **THEN** the planned expenses editor is visible with add/remove expense controls

### Requirement: Spending page uses shared portfolio state
The spending page SHALL read from and write to the shared `portfolio` store. Changes made on the spending page SHALL be immediately reflected when running a simulation from the home page.

#### Scenario: Strategy change persists
- **WHEN** the user changes the spending strategy on the spending page
- **AND** navigates back to the home page and clicks Simulate
- **THEN** the simulation uses the updated spending strategy
