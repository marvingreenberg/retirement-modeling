## Why

`historical_returns.py` provides core data and statistics functions used by the Monte Carlo simulation, but has zero test coverage. These functions could silently break (e.g., data corruption, statistics bugs) with no safety net.

## What Changes

- Add a new test file `tests/test_historical_returns.py`
- Cover all three public functions: `get_historical_returns()`, `get_historical_inflation()`, `get_return_statistics()`
- Pin down copy semantics, data integrity, and statistics correctness

## Capabilities

### New Capabilities
- `historical-returns-testing`: Unit tests covering data integrity, copy semantics, and statistics calculations for the historical returns module

### Modified Capabilities
<!-- None — no existing specs are changing -->

## Impact

- `tests/test_historical_returns.py`: New file with test coverage for all public functions in `src/retirement_model/historical_returns.py`
