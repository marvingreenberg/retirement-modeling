## ADDED Requirements

### Requirement: Historical Tax Regime Definitions
The system SHALL provide a set of historical federal tax regimes normalized to 2024 dollars.

#### Scenario: Regime data structure
- **WHEN** a tax regime is defined
- **THEN** it SHALL include:
  - `name`: descriptive label (e.g., "TCJA 2018-2025")
  - `federal_brackets`: 7-entry list matching `FEDERAL_TAX_BRACKETS_MFJ` format (limit/rate dicts)
  - `capital_gains_brackets`: 3-entry list matching `CAPITAL_GAINS_BRACKETS_MFJ` format
  - `standard_deduction`: dollar amount (2024 equivalent)
  - `irmaa_tiers`: 6-entry list matching `IRMAA_TIERS_MFJ` format (limit/cost dicts)

#### Scenario: Uniform 7-bracket structure
- **WHEN** a historical era had fewer than 7 income brackets
- **THEN** the regime SHALL pad to 7 brackets by repeating the top rate at increasing thresholds
- **AND** the simulation code SHALL iterate 7 brackets uniformly with no conditionals

#### Scenario: Pre-IRMAA regimes
- **WHEN** a regime predates IRMAA (before 2007)
- **THEN** all IRMAA tier limits SHALL be set to `float("inf")` with cost 0
- **AND** the structure remains uniform with existing IRMAA code

#### Scenario: Coverage of historical eras
- **WHEN** the regime data is loaded
- **THEN** approximately 8 regimes SHALL be available covering 1970s through TCJA
- **AND** all dollar amounts SHALL be normalized to 2024 purchasing power

### Requirement: Tax Regime Sampling
The system SHALL sample tax regime sequences for Monte Carlo simulations.

#### Scenario: Block sampling
- **WHEN** `sample_regime_sequence(num_years, regimes, seed)` is called
- **THEN** it SHALL select a regime uniformly at random
- **AND** hold that regime for 2-4 consecutive years (random block length)
- **AND** then select a new regime for the next block
- **AND** repeat until `num_years` are covered

#### Scenario: Reproducibility
- **WHEN** a seed is provided
- **THEN** the same seed SHALL produce the same regime sequence

#### Scenario: Accessor function
- **WHEN** `get_historical_regimes()` is called
- **THEN** it SHALL return a copy of the regime list (mutation-safe)
