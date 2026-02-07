## ADDED Requirements

### Requirement: Reusable InfoPopover component
The UI SHALL provide a reusable component for displaying contextual help via a clickable (i) icon.

#### Scenario: Info icon renders
- **WHEN** an InfoPopover component is placed next to a label or control
- **THEN** a small (i) icon is displayed inline
- **AND** the icon is visually distinct but unobtrusive (muted color, small size)

#### Scenario: Click opens popover
- **WHEN** user clicks the (i) icon
- **THEN** a popover appears near the icon containing the help text
- **AND** the popover is styled consistently with the application theme

#### Scenario: Click anywhere dismisses popover
- **WHEN** a popover is open
- **AND** user clicks anywhere outside the popover
- **THEN** the popover is dismissed

#### Scenario: Only one popover open at a time
- **WHEN** a popover is open
- **AND** user clicks a different (i) icon
- **THEN** the first popover closes and the second opens

---

### Requirement: Info popovers on simulation assumptions
Each simulation assumption input on the Simulate tab SHALL have an (i) icon with contextual help.

#### Scenario: Inflation Rate help
- **WHEN** user clicks (i) next to Inflation Rate
- **THEN** popover explains: assumed annual rate at which prices increase, reducing purchasing power of fixed withdrawals

#### Scenario: Investment Growth Rate help
- **WHEN** user clicks (i) next to Investment Growth Rate
- **THEN** popover explains: assumed annual return on investments before inflation; Monte Carlo mode overrides this with historically-sampled returns

#### Scenario: Spending Strategy help
- **WHEN** user clicks (i) next to Spending Strategy
- **THEN** popover explains the selected strategy's approach to calculating annual withdrawals

#### Scenario: Conversion Strategy help
- **WHEN** user clicks (i) next to Conversion Strategy
- **THEN** popover explains how Roth conversions are limited based on the selected tax bracket or IRMAA threshold

#### Scenario: Monte Carlo run mode help
- **WHEN** user clicks (i) next to the Monte Carlo radio option
- **THEN** popover explains: runs the simulation many times with investment returns sampled from historical market data (1928-2023), showing how the plan performs across a range of market conditions

---

### Requirement: Info popovers on portfolio inputs
Key portfolio inputs SHALL have (i) icons with contextual help.

#### Scenario: Cost Basis Ratio help
- **WHEN** user clicks (i) next to Cost Basis Ratio on an account
- **THEN** popover explains: the portion of the account that represents original contributions (not gains); affects capital gains tax on brokerage withdrawals

#### Scenario: IRMAA Tier 1 Limit help
- **WHEN** user clicks (i) next to IRMAA Tier 1 Limit
- **THEN** popover explains: income threshold above which Medicare Part B/D premiums increase; Roth conversions that push income above this trigger surcharges

#### Scenario: RMD Start Age help
- **WHEN** user clicks (i) next to RMD Start Age
- **THEN** popover explains: age at which Required Minimum Distributions from pre-tax accounts begin; currently 73 under SECURE 2.0 Act
