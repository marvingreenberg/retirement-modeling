## MODIFIED Requirements

### Requirement: Year-by-Year Processing Order
The system SHALL process each simulation year in a specific sequence.

#### Scenario: Annual simulation sequence
- GIVEN a simulation year
- THEN processing occurs in this order:
  1. Calculate ages (primary and spouse)
  2. Determine growth/inflation rates (from config or Monte Carlo sequence)
  3. Calculate spending target (via spending strategy)
  4. Add planned expenses for this year
  5. Calculate Social Security income (if age threshold met)
  6. Calculate income from additional income streams (if age threshold met), applying per-stream COLA
  7. Calculate and execute RMDs (if age threshold met)
  8. Determine cash available vs. spending needed
  9. Execute withdrawals to meet spending shortfall
  10. Execute Roth conversions (if pre-RMD age and strategy permits)
  11. Reinvest surplus cash (if any)
  12. Calculate all taxes
  13. Apply investment growth to all accounts
  14. Record year results

## ADDED Requirements

### Requirement: SS Auto-Generation at Simulation Start

The system SHALL materialize auto-generated SS income streams before the simulation loop begins.

#### Scenario: ss_auto present
- **WHEN** `SimulationConfig.ss_auto` is set
- **THEN** the system SHALL call `generate_ss_streams(ss_auto)` to produce SS `IncomeStream` entries
- **AND** prepend them to the working copy of `income_streams`
- **AND** skip legacy `social_security` income in the per-year SS block

#### Scenario: ss_auto absent
- **WHEN** `SimulationConfig.ss_auto` is None
- **THEN** the simulation SHALL use the existing `social_security` config for SS income (no change)

### Requirement: COLA Application in Income Stream Loop

The system SHALL apply per-stream COLA when calculating income stream contributions each year.

#### Scenario: Stream with COLA
- **WHEN** an active income stream has `cola_rate` set
- **THEN** effective amount SHALL be `amount * (1 + cola_rate) ^ (current_age - start_age)`

#### Scenario: Stream without COLA
- **WHEN** an active income stream has `cola_rate` as None
- **THEN** effective amount SHALL be the base `amount`
