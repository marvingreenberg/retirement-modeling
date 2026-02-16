## MODIFIED Requirements

### Requirement: Budget configuration page
The `/budget` route SHALL display a dedicated budget configuration page with annual spending amount and planned expenses. The page heading SHALL read "Budget".

#### Scenario: Budget page content
- **WHEN** the user navigates to `/budget`
- **THEN** the page displays annual spending amount and planned expenses editor
- **AND** no spending strategy controls are present

#### Scenario: Annual spending input
- **WHEN** the user views the budget page
- **THEN** an annual spending input labeled "Annual Spending ($/yr)" is visible
- **AND** the monthly equivalent is shown as detail text below (e.g., "$10,000/mo")

#### Scenario: Planned expenses editor
- **WHEN** the user views the budget page
- **THEN** the planned expenses editor is visible with add/remove expense controls

## ADDED Requirements

### Requirement: Planned expense year-based fields
Planned expenses SHALL use calendar year fields for both one-time and recurring types. One-time expenses use a single "Year" field. Recurring expenses use "Start Year" and "End Year" fields.

#### Scenario: One-time expense fields
- **WHEN** a planned expense has type "One-time"
- **THEN** a single "Year" field is displayed

#### Scenario: Recurring expense fields
- **WHEN** a planned expense has type "Recurring"
- **THEN** "Start Year" and "End Year" fields are displayed

#### Scenario: Recurring fields appear immediately
- **WHEN** the user changes an expense type from "One-time" to "Recurring"
- **THEN** "Start Year" and "End Year" fields appear immediately without requiring collapse/reopen

### Requirement: Type switch preserves start date
When the user switches an expense between one-time and recurring, the start/at year value SHALL be preserved and only the end year SHALL be cleared.

#### Scenario: Switch from one-time to recurring
- **WHEN** a one-time expense has year 2028 and the user switches type to "Recurring"
- **THEN** Start Year is set to 2028 and End Year is empty

#### Scenario: Switch from recurring to one-time
- **WHEN** a recurring expense has start year 2030 and the user switches type to "One-time"
- **THEN** Year is set to 2030

### Requirement: Annual-primary spending input
The base spending input SHALL be labeled "Annual Spending ($/yr)" and accept annual dollar amounts. The monthly equivalent SHALL be displayed as detail text below the input.

#### Scenario: Annual input with monthly detail
- **WHEN** the user enters 144000 as annual spending
- **THEN** the input shows 144000
- **AND** detail text below shows "$12,000/mo"

#### Scenario: Store value matches input
- **WHEN** the user enters 120000 in the annual spending input
- **THEN** the store value `annual_spend_net` is 120000
