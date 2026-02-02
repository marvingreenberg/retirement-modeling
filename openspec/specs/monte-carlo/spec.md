# Monte Carlo Simulation Specification

## Purpose
Define how the simulation uses historical market data and statistical sampling to model a range of possible retirement outcomes.

## Requirements

### Requirement: Historical Data Source
The system SHALL use actual historical market data for Monte Carlo simulations.

#### Scenario: S&P 500 returns
- WHEN running Monte Carlo
- THEN historical S&P 500 total returns (1928-2023) are used
- AND returns include dividends
- AND 96 years of data are available
- NOTE: Historical average return is approximately 11.7%

#### Scenario: Inflation rates
- WHEN running Monte Carlo
- THEN historical CPI inflation rates (1928-2023) are used
- AND rates are paired with returns from the same year

---

### Requirement: Block Sampling Algorithm
The system SHALL use block sampling to preserve temporal correlations.

#### Scenario: Sample a sequence
- WHEN generating a return/inflation sequence for N years
- THEN use blocks of 5 consecutive years
- AND randomly select starting year for each block
- AND keep return and inflation paired from each historical year

#### Scenario: Block size rationale
- WHEN using 5-year blocks
- THEN multi-year market trends are preserved
- AND autocorrelation in returns is maintained
- EXAMPLE: A bear market that lasted 3 years stays together

#### Scenario: Correlation preservation
- WHEN 1974 is sampled
- THEN both -26.5% return AND 12.2% inflation are used together
- NOTE: This captures stagflation conditions realistically

---

### Requirement: Simplified Monte Carlo
The system SHALL provide a fast balance-only Monte Carlo mode.

#### Scenario: Run simplified simulation
- WHEN using `run_monte_carlo` function
- THEN a simplified model calculates year-end balances
- AND spending is withdrawn proportionally from all accounts
- AND growth is applied uniformly
- NOTE: Taxes, RMDs, and conversions are NOT modeled

#### Scenario: Performance characteristics
- WHEN running 1000 simplified simulations
- THEN execution completes in seconds
- NOTE: Useful for quick probability analysis

---

### Requirement: Full Monte Carlo
The system SHALL provide a complete Monte Carlo mode with all tax logic.

#### Scenario: Run full simulation
- WHEN using `run_full_monte_carlo` function
- THEN the complete simulation is run for each iteration
- AND taxes, RMDs, conversions, IRMAA are all calculated
- NOTE: Default is 100 iterations (slower but comprehensive)

#### Scenario: Full simulation captures
- WHEN running full Monte Carlo
- THEN each iteration includes:
  - Tax bracket progression
  - RMD calculations by age
  - Roth conversion execution
  - IRMAA surcharges
  - Account-level balances

---

### Requirement: Percentile Calculations
The system SHALL report results as percentile distributions.

#### Scenario: Final balance percentiles
- WHEN Monte Carlo completes
- THEN report:
  - 5th percentile (pessimistic)
  - 25th percentile (below average)
  - Median (50th percentile)
  - 75th percentile (above average)
  - 95th percentile (optimistic)

#### Scenario: Year-by-year percentiles
- WHEN Monte Carlo completes
- THEN for each simulation year, report balance percentiles
- AND this shows how the distribution evolves over time

---

### Requirement: Success Rate Calculation
The system SHALL calculate portfolio survival probability.

#### Scenario: Define success
- WHEN a simulation completes
- THEN it is "successful" if final_balance > 0
- AND it "failed" if the portfolio was depleted

#### Scenario: Calculate success rate
- WHEN all simulations complete
- THEN success_rate = successful_count / total_simulations

#### Scenario: Depletion risk by age
- WHEN simulations result in depletion
- THEN track the age at which depletion occurred
- AND report risk of depletion before ages 80, 85, 90, 95

---

### Requirement: Reproducibility
The system SHALL support reproducible results via random seed.

#### Scenario: Seeded simulation
- WHEN a seed value is provided
- THEN the same seed produces identical results
- AND each iteration uses seed + iteration_index

#### Scenario: Unseeded simulation
- WHEN no seed is provided
- THEN results vary between runs

---

## Output Format

### Simplified Monte Carlo Output
```
Monte Carlo Results (1000 simulations)
================================================================================
Success Rate: 92.3%
Failure Rate: 7.7%

Risk of Depletion Before Age:
  Age 80: 1.2%
  Age 85: 3.5%
  Age 90: 5.8%
  Age 95: 7.7%

Year-by-Year Balance Distribution:
Age    5th %ile   25th %ile     Median   75th %ile   95th %ile
 65      $2.4M       $2.5M       $2.6M       $2.7M       $2.9M
 ...
```

### Full Monte Carlo Output
Includes AGI, tax bracket, RMD, Roth conversion, and tax columns for the median simulation, with balance percentile ranges.
