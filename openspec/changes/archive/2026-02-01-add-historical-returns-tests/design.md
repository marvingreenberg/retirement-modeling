## Context

`historical_returns.py` has three public functions with no test coverage. The existing test suite uses pytest with fixtures in `conftest.py`.

## Goals / Non-Goals

**Goals:**
- Achieve high test coverage for all three public functions
- Verify data integrity, copy semantics, and statistics correctness
- Follow existing test patterns in the project

**Non-Goals:**
- Testing the raw data values exhaustively (we trust the source data)
- Refactoring the module itself

## Decisions

### Decision 1: Verify statistics against independent calculations

Rather than hardcoding expected values, compute expected mean/std_dev/min/max independently in the test using Python's built-in math. This makes the tests resilient to data updates while still verifying correctness.

### Decision 2: Use pytest.approx for float comparisons

Statistics involve floating-point arithmetic, so use `pytest.approx` for comparisons rather than exact equality.
