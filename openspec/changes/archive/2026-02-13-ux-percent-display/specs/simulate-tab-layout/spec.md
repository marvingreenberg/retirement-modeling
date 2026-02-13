## ADDED Requirements

### Requirement: Percentage input display
All percentage inputs in the simulation settings panel SHALL display values as human-readable percentages (e.g., 3.0 for 3%) rather than raw decimals (0.03). Values SHALL be converted to/from decimals for storage.

#### Scenario: Inflation rate display
- **WHEN** the inflation rate is 0.03 in the store
- **THEN** the input displays 3.0

#### Scenario: User edits percentage
- **WHEN** the user types 3.5 in the inflation rate input
- **THEN** the store value is set to 0.035

#### Scenario: All percentage inputs converted
- **WHEN** the settings panel is displayed
- **THEN** Inflation %, Growth %, State Tax %, Cap Gains %, Withdrawal Rate, and all guardrails percentage inputs display as human-readable percentages
