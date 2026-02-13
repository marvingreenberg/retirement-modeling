## MODIFIED Requirements

### Requirement: Year-by-Year Processing Order (MODIFIED)
Step 12 (Calculate all taxes) now uses inflation-adjusted thresholds.

#### Scenario: Tax thresholds adjusted each year
- **WHEN** processing a simulation year
- **THEN** the simulation SHALL compute `inflation_factor = cumulative_inflation` for that year
- **AND** pass inflation-adjusted brackets, IRMAA tiers, capital gains brackets, and standard deduction to all tax functions

### Requirement: Conversion Ceiling (MODIFIED)
Bracket-based conversion ceilings SHALL be inflation-indexed.

#### Scenario: Inflation-adjusted conversion ceiling
- **WHEN** computing the Roth conversion AGI ceiling
- **THEN** bracket thresholds (383900 for 24%, 201050 for 22%) SHALL be multiplied by `cumulative_inflation_factor`
- **AND** the `irmaa_limit_tier_1` from config SHALL also be multiplied by `cumulative_inflation_factor`
- **AND** the `STANDARD` strategy ceiling (0) SHALL remain 0
