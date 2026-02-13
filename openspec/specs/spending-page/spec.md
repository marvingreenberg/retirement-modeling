## Purpose
Defines the budget page at `/budget` for configuring annual spending and planned expenses.
## Requirements
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

