## MODIFIED Requirements

### Requirement: Simulation settings panel
The simulation settings panel SHALL provide input controls for simulation assumption parameters. Primary assumptions (Inflation Rate, Investment Growth Rate, Conversion Strategy) SHALL be on one compact row. The panel SHALL NOT contain an Advanced subsection — those settings are in the ProfileDrawer.

#### Scenario: No Advanced section in SimulateSettings
- **WHEN** the user views the simulation settings panel
- **THEN** there is no "Advanced" toggle or collapsible section
- **AND** Inflation %, Growth %, and Conversion are visible on one row

#### Scenario: Withdrawal Strategy remains
- **WHEN** the user views the simulation settings panel
- **THEN** the Withdrawal Strategy collapsible subsection is still present below the primary row
