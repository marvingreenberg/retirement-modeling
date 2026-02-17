## MODIFIED Requirements

### Requirement: Conversion source restriction
Roth conversions SHALL only withdraw from IRA-category pre-tax accounts (`ira`, `sep_ira`, `simple_ira`). Employer-plan accounts (`401k`, `403b`, `457b`) SHALL NOT be eligible as conversion sources. Tax payment for conversions SHALL still be sourced from brokerage/cash accounts.

#### Scenario: IRA eligible for conversion
- **WHEN** the user has an IRA account with $200K balance and a conversion strategy is active
- **THEN** the simulation converts from the IRA account up to the AGI headroom

#### Scenario: 401k not eligible for conversion
- **WHEN** the user has only a 401k account (no IRA) and a conversion strategy is active
- **THEN** no conversions are performed for that year

#### Scenario: Mixed pre-tax accounts
- **WHEN** the user has a 401k ($500K) and an IRA ($100K) with a conversion strategy active
- **THEN** conversions draw only from the IRA, up to $100K or AGI headroom (whichever is less)

### Requirement: Conversion deposit to tracking account
Roth conversion deposits SHALL go to a dedicated `roth_conversion` type account, separate from existing Roth accounts. The simulation SHALL auto-create this account (balance $0) at simulation start when a conversion strategy is active and IRA-eligible accounts exist. This allows conversion growth to be tracked and displayed independently.

#### Scenario: Auto-create conversion account
- **WHEN** a simulation starts with conversion strategy "irmaa_tier_1" and an IRA account exists
- **THEN** a `roth_conversion` account named "Roth Conversions" is created with balance $0

#### Scenario: No conversion account when no eligible source
- **WHEN** a simulation starts with a conversion strategy active but only 401k accounts (no IRA)
- **THEN** no `roth_conversion` account is created

#### Scenario: Conversion deposits accumulate
- **WHEN** the simulation converts $30K in year 1 and $25K in year 2
- **THEN** the `roth_conversion` account balance reflects both deposits plus growth
