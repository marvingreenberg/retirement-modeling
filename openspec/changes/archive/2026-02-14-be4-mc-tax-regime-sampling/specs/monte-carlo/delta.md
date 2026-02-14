## MODIFIED Requirements

### Requirement: Full Monte Carlo
The system SHALL provide a complete Monte Carlo mode with all tax logic.

#### Scenario: Run full simulation
- **WHEN** using `run_full_monte_carlo` function
- **THEN** the complete simulation is run for each iteration
- **AND** taxes, RMDs, conversions, IRMAA are all calculated
- NOTE: Default is 100 iterations (slower but comprehensive)

#### Scenario: Full simulation captures
- **WHEN** running full Monte Carlo
- **THEN** each iteration includes:
  - Tax bracket progression
  - RMD calculations by age
  - Roth conversion execution
  - IRMAA surcharges
  - Account-level balances

#### Scenario: Tax regime variation enabled
- **WHEN** `vary_tax_regimes` is True in portfolio config
- **THEN** each Monte Carlo iteration SHALL sample a tax regime sequence
- **AND** pass it to `run_simulation` alongside returns and inflation sequences

#### Scenario: Tax regime variation disabled
- **WHEN** `vary_tax_regimes` is False (default)
- **THEN** no regime sequence SHALL be passed to `run_simulation`
- **AND** behavior SHALL be identical to the current implementation
