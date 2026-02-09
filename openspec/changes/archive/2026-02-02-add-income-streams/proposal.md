## Why

The simulation only models Social Security as an income source. Many retirees have pensions, annuities, rental income, or other periodic income that reduces portfolio withdrawal needs and affects tax calculations. Without these, the model overstates withdrawal requirements and misestimates AGI.

## What Changes

- Add a generic `IncomeStream` model (amount, start age, end age, taxable percentage)
- Accept a list of income streams on `SimulationConfig`
- Incorporate income streams into the simulation loop (AGI, cash flow, withdrawal reduction)
- Expose income streams through CLI and API inputs
- Add tests for income stream behavior

## Capabilities

### New Capabilities
- `income-streams`: Generic additional income sources (pensions, annuities, rental income, etc.) with configurable amount, age range, and tax treatment

### Modified Capabilities
- `simulation-orchestration`: Simulation loop SHALL incorporate income streams into AGI calculation and cash flow
- `tax-calculations`: AGI calculation SHALL include taxable portion of income streams

## Impact

- `src/retirement_model/models.py`: New `IncomeStream` model, updated `SimulationConfig`
- `src/retirement_model/simulation.py`: Income stream processing in yearly loop
- `src/retirement_model/cli.py`: Accept income streams in input
- `src/retirement_model/api.py`: Accept income streams in API endpoints
- `input.json`: Example income stream entries
- `tests/`: New and updated test files
