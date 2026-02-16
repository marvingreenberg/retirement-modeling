## ADDED Requirements

### Requirement: Effective spending in results summary
The simulation results summary SHALL display the effective initial spending amount in both monthly and annual formats, using data from the API response.

#### Scenario: Single run spending display
- **WHEN** a single run simulation completes
- **THEN** the results summary includes a spending line showing monthly and annual amounts (e.g., "$10,000/mo ($120,000/yr)")

#### Scenario: No spending display for Monte Carlo
- **WHEN** a Monte Carlo simulation completes
- **THEN** the results summary does NOT display initial spending (the MC API response does not include spending fields)
