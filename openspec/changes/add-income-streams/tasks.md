## 1. Model

- [x] 1.1 Add `IncomeStream` model to `models.py` (name, amount, start_age, end_age optional, taxable_pct default 1.0)
- [x] 1.2 Add `income_streams: list[IncomeStream]` field to `SimulationConfig` with default empty list

## 2. Simulation

- [x] 2.1 Add income stream calculation in `simulation.py` after SS income (sum active streams based on age)
- [x] 2.2 Add taxable portion of income streams to AGI
- [x] 2.3 Add net-of-tax income stream cash to cash_in_hand

## 3. Input

- [x] 3.1 Add example income streams to `input.json`
- [x] 3.2 Verify CLI accepts income streams from input file
- [x] 3.3 Verify API endpoints accept income streams in portfolio payload

## 4. Tests

- [x] 4.1 Test IncomeStream model validation (fields, defaults, constraints)
- [x] 4.2 Test income stream age activation (before, during, after age range)
- [x] 4.3 Test income stream AGI and cash flow integration
- [x] 4.4 Test simulation with no income streams behaves identically to current
- [x] 4.5 Run full test suite and verify no regressions (226 passed, 0 failed)

## 5. Verify

- [x] 5.1 Run coverage check — models.py 99%, simulation.py 99%, overall 94%
- [x] 5.2 Run linters (black, isort, mypy)
