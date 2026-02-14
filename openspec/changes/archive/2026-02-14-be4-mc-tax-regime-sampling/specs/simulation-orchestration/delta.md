## MODIFIED Requirements

### Requirement: Year-by-Year Processing Order (MODIFIED)
Tax threshold computation now supports regime override.

#### Scenario: Tax regime override per year
- **WHEN** a `tax_regime_sequence` is provided to `run_simulation`
- **THEN** for each year, the regime dict SHALL provide the base brackets, cap gains brackets, standard deduction, and IRMAA tiers
- **AND** these base values SHALL be inflation-indexed using `inflate_brackets` and `cumulative_inflation` (layering with BE-3)
- **AND** when no regime sequence is provided, the 2024 constants SHALL be used as the base (unchanged behavior)

## ADDED Requirements

### Requirement: Tax Regime Configuration
The system SHALL support an optional flag to enable tax regime variation in Monte Carlo.

#### Scenario: Config field
- **WHEN** `SimulationConfig` is defined
- **THEN** it SHALL include `vary_tax_regimes: bool` with default `False`

#### Scenario: Deterministic simulation unaffected
- **WHEN** running a deterministic simulation (not Monte Carlo)
- **THEN** `vary_tax_regimes` SHALL have no effect
- **AND** the simulation SHALL use 2024 constants as the base brackets
