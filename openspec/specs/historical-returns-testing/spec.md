# historical-returns-testing Specification

## Purpose
TBD - created by archiving change add-historical-returns-tests. Update Purpose after archive.
## Requirements
### Requirement: Data Integrity

The historical data arrays SHALL contain the expected number of entries with values in reasonable ranges.

#### Scenario: Returns data completeness
- **WHEN** `get_historical_returns()` is called
- **THEN** it returns exactly 96 values (1928-2023)
- **AND** all values are between -0.5 and 0.6

#### Scenario: Inflation data completeness
- **WHEN** `get_historical_inflation()` is called
- **THEN** it returns exactly 96 values (1928-2023)
- **AND** all values are between -0.15 and 0.20

### Requirement: Copy Semantics

Getter functions SHALL return copies so callers cannot corrupt the module-level data.

#### Scenario: Returns mutation safety
- **WHEN** a caller modifies the list returned by `get_historical_returns()`
- **THEN** a subsequent call to `get_historical_returns()` returns the original unmodified data

#### Scenario: Inflation mutation safety
- **WHEN** a caller modifies the list returned by `get_historical_inflation()`
- **THEN** a subsequent call to `get_historical_inflation()` returns the original unmodified data

### Requirement: Statistics Correctness

`get_return_statistics()` SHALL return accurate calculations for the historical data.

#### Scenario: Statistics keys and types
- **WHEN** `get_return_statistics()` is called
- **THEN** the result contains keys: `mean`, `std_dev`, `min`, `max`, `median`
- **AND** all values are floats

#### Scenario: Statistics values match known data
- **WHEN** `get_return_statistics()` is called
- **THEN** `min` equals the minimum of `SP500_ANNUAL_RETURNS`
- **AND** `max` equals the maximum of `SP500_ANNUAL_RETURNS`
- **AND** `mean` is approximately the arithmetic mean of the data

