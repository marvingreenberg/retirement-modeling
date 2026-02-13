## MODIFIED Requirements

### Requirement: Budget configuration page
The `/budget` route SHALL display a dedicated budget configuration page with annual spending amount and planned expenses. The page heading SHALL read "Budget".

#### Scenario: Budget page content
- **WHEN** the user navigates to `/budget`
- **THEN** the page displays annual spending amount and planned expenses editor
- **AND** no spending strategy controls are present

#### Scenario: Annual spending input
- **WHEN** the user views the budget page
- **THEN** an annual spending amount input is visible with the current portfolio value

#### Scenario: Planned expenses editor
- **WHEN** the user views the budget page
- **THEN** the planned expenses editor is visible with add/remove expense controls

## REMOVED Requirements

### ~~Scenario: Spending strategy selection~~
Strategy selection has moved to the simulation settings panel (see simulate-tab-layout spec).

### ~~Scenario: Conditional parameters for Percent of Portfolio~~
Moved to simulation settings panel.

### ~~Scenario: Conditional parameters for Guardrails~~
Moved to simulation settings panel.

---

### Requirement: Budget page uses shared portfolio state
The budget page SHALL read from and write to the shared `portfolio` store. Changes made on the budget page are immediately reflected when running a simulation from the home page.

#### Scenario: Budget change persists
- **WHEN** the user changes annual spending on the budget page
- **AND** navigates back to the home page and clicks Simulate
- **THEN** the simulation uses the updated spending amount
