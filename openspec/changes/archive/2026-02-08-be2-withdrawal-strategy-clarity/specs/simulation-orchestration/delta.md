## ADDED Requirements

### Requirement: Initial Spending in Simulation Summary
The API SHALL include the effective initial spending amounts in the simulation summary response.

#### Scenario: Summary includes initial spending
- **WHEN** a simulation completes successfully
- **THEN** the summary dict SHALL include `initial_annual_spend` equal to `years[0].spending_target`
- **AND** the summary dict SHALL include `initial_monthly_spend` equal to `years[0].spending_target / 12`

#### Scenario: Empty results
- **WHEN** a simulation produces no year results
- **THEN** `initial_annual_spend` and `initial_monthly_spend` SHALL be 0

### Requirement: Monthly Spend Convenience Property
`SimulationConfig` SHALL provide a `monthly_spend` computed property.

#### Scenario: Compute monthly from annual
- **WHEN** `SimulationConfig.monthly_spend` is accessed
- **THEN** it SHALL return `annual_spend_net / 12`

### Requirement: API Version Alignment
The API version SHALL be aligned across `pyproject.toml` and the FastAPI app.

#### Scenario: Version is 0.9.0
- **WHEN** the API root endpoint is called
- **THEN** the version field SHALL be `0.9.0`
- **AND** `pyproject.toml` version SHALL be `0.9.0`
