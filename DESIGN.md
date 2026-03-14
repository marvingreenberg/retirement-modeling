# Design Document

This document describes the technical architecture and design decisions of the retirement simulation tool.

## Architecture Overview

```
src/retirement_model/
├── cli.py              # Click-based command-line interface
├── api.py              # FastAPI REST endpoints
├── loader.py           # Portfolio loading abstraction
├── models.py           # Pydantic data models
├── simulation.py       # Core simulation logic
├── monte_carlo.py      # Monte Carlo analysis
├── strategies.py       # Spending strategy calculations
├── taxes.py            # Tax calculations (RMD, IRMAA, brackets)
├── withdrawals.py      # Account withdrawal logic
├── output.py           # Output formatting
├── constants.py        # Tax brackets, IRMAA tiers, RMD tables
└── historical_returns.py  # S&P 500 and inflation data
```

## Module Responsibilities

### `models.py`
Pydantic models for data validation:
- `Account`: Individual account (balance, type, owner)
- `Portfolio`: Collection of accounts + configuration
- `SimulationConfig`: All simulation parameters
- `YearResult`: Single year's simulation output
- `SimulationResult`: Complete simulation output
- Enums: `AccountType`, `Owner`, `ConversionStrategy`, `SpendingStrategy`

### `simulation.py`
Core simulation loop (`run_simulation`):
1. For each year:
   - Calculate Social Security income
   - Calculate and execute RMDs
   - Determine spending target (via spending strategy)
   - Withdraw from accounts to meet spending
   - Execute Roth conversions (based on conversion strategy)
   - Calculate taxes (income, capital gains, IRMAA)
   - Apply investment growth
   - Record results

Key design: Accepts optional `returns_sequence` and `inflation_sequence` parameters for Monte Carlo integration.

### `monte_carlo.py`
Two Monte Carlo implementations:

**`run_monte_carlo`** (simplified):
- Faster, balance-only simulation
- Used by `retirement-model monte-carlo` command
- Good for quick probability analysis

**`run_full_monte_carlo`** (complete):
- Runs full simulation with taxes, RMDs, conversions
- Used by `retirement-model run --with-montecarlo`
- Shows all fields with percentile ranges

### `loader.py`
Abstraction layer for portfolio loading:
- `PortfolioLoader` abstract base class
- `FileLoader` handles local JSON files and `file://` URLs
- `register_loader()` allows adding custom loaders
- Designed for future extension to `sql://`, `https://`, etc.

### `strategies.py`
Spending strategy implementations:
- `calculate_spending_target()` dispatches to strategy-specific functions
- `SpendingState` dataclass tracks state across years (for guardrails)
- Each strategy returns (spending_amount, updated_state)

### `taxes.py`
Tax calculation functions:
- `calculate_rmd_amount()`: IRS Uniform Lifetime Table
- `calculate_irmaa_cost()`: Medicare surcharges by income tier
- `get_marginal_tax_rate()`: Federal bracket lookup
- `calculate_capital_gains_tax()`: Long-term gains tax

### `withdrawals.py`
Account operations:
- `withdraw_from_accounts()`: Withdraw with priority ordering
- `deposit_to_account()`: Add to account (conversions, surplus)
- `apply_growth()`: Apply returns to all accounts
- `get_total_balance_by_type()`: Aggregate by account type

## Historical Data and Monte Carlo

### Data Source

`historical_returns.py` contains:
- **S&P 500 Total Returns** (1928-2023): 96 years of annual returns including dividends
- **CPI Inflation** (1928-2023): 96 years of annual inflation rates

The data covers:
- Great Depression (1929-1932)
- Post-WWII boom (1950s)
- Stagflation (1970s)
- Dot-com bubble and crash (1995-2002)
- Great Financial Crisis (2008)
- COVID crash and recovery (2020)

### Block Sampling Algorithm

```python
def sample_historical_sequence(num_years, returns, inflation, seed):
    block_size = 5
    sampled_returns = []
    sampled_inflation = []

    while len(sampled_returns) < num_years:
        # Pick random starting point in 96-year history
        start_idx = random.randint(0, len(returns) - block_size)

        # Take 5 consecutive years together
        for j in range(block_size):
            sampled_returns.append(returns[start_idx + j])
            sampled_inflation.append(inflation[start_idx + j])

    return sampled_returns[:num_years], sampled_inflation[:num_years]
```

**Why block sampling?**
1. **Preserves correlation**: Return and inflation from each year stay paired (e.g., 1974's -26.5% return with 12.2% inflation)
2. **Preserves autocorrelation**: Markets exhibit momentum; 5-year blocks capture multi-year trends
3. **Uses real events**: No artificial smoothing; includes actual crashes and recoveries

**Alternative approaches not used**:
- *Parametric sampling* (normal distribution): Would assume returns follow a bell curve; real returns have fat tails
- *Single-year random sampling*: Would lose year-to-year correlations
- *Sequential historical*: Would only show what happened, not what could have happened with different timing

### Monte Carlo Statistics

For each year across N simulations:
```python
balances = sorted([sim.years[year].balance for sim in all_simulations])
percentile_5 = balances[int(N * 0.05)]    # Pessimistic
percentile_25 = balances[int(N * 0.25)]   # Below average
median = balances[N // 2]                  # Typical
percentile_75 = balances[int(N * 0.75)]   # Above average
percentile_95 = balances[int(N * 0.95)]   # Optimistic
```

## Withdrawal Order Logic

The simulation withdraws in this order to minimize taxes:

1. **Brokerage first**: Only gains are taxed (often at favorable capital gains rates)
2. **Roth second**: Tax-free, but preserves tax-free growth potential
3. **Pre-tax last**: Fully taxed as ordinary income

This order is modified by:
- **AGI headroom**: If doing Roth conversions, limit brokerage withdrawals to stay under conversion ceiling
- **RMD requirements**: Pre-tax RMDs are mandatory regardless of need

## Roth Conversion Logic

Conversions occur after spending withdrawals, before year-end growth:

```python
if conversion_ceiling > 0 and age < rmd_start_age:
    agi_headroom = conversion_ceiling - current_agi

    if agi_headroom > 5000:  # Worth doing
        conversion_amount = min(agi_headroom, available_pretax)
        conversion_tax = conversion_amount * marginal_rate

        # Pay tax from brokerage
        withdraw(conversion_tax, brokerage)

        # Execute conversion
        withdraw(conversion_amount, pretax)
        deposit(conversion_amount - unpaid_tax, roth)
```

## Data Flow

```
Portfolio JSON
     │
     ▼
┌─────────────────┐
│  loader.py      │  Validate and parse
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  simulation.py  │◄────│  strategies.py   │  Spending calculation
└────────┬────────┘     └──────────────────┘
         │                      ▲
         │              ┌───────┴────────┐
         │              │  taxes.py      │  Tax calculations
         │              └────────────────┘
         │                      ▲
         │              ┌───────┴────────┐
         │              │ withdrawals.py │  Account operations
         │              └────────────────┘
         ▼
┌─────────────────┐
│ SimulationResult│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────────┐
│output.py│ │monte_carlo.py │  (runs simulation N times)
└────────┘ └────────────────┘
```

## API Design

REST endpoints mirror CLI functionality:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/simulate` | POST | Run single simulation |
| `/monte-carlo` | POST | Run Monte Carlo (simplified) |
| `/compare` | POST | Compare multiple strategies |
| `/strategies` | GET | List available strategies |

Request bodies use the same Pydantic models as the CLI, ensuring consistency.

## Testing Strategy

- **Unit tests**: Each module has corresponding `test_*.py`
- **Coverage target**: 85%+ line coverage
- **Fixtures**: Shared in `conftest.py` (sample portfolios, accounts)
- **Monte Carlo tests**: Use fixed seeds for reproducibility

## Future Considerations

### Per-Account Asset Allocation
Currently, all accounts use the same growth rate. Future enhancement:
```python
class Account:
    asset_allocation: dict[str, float]  # {"stocks": 0.6, "bonds": 0.4}

def apply_growth(accounts, stock_return, bond_return):
    for acc in accounts:
        weighted_return = (acc.allocation["stocks"] * stock_return +
                          acc.allocation["bonds"] * bond_return)
        acc.balance *= (1 + weighted_return)
```

### Additional Loaders
The `loader.py` abstraction supports:
```python
class HttpLoader(PortfolioLoader):
    def can_handle(self, source): return source.startswith("https://")
    def load(self, source): return fetch_and_parse(source)

class SqlLoader(PortfolioLoader):
    def can_handle(self, source): return source.startswith("sql://")
    def load(self, source): return query_and_parse(source)
```

### Regime-Based Sampling
More sophisticated Monte Carlo could use regime detection:
- Identify historical "regimes" (bull market, bear market, stagflation)
- Sample entire regimes rather than arbitrary blocks
- Would better capture extended market conditions
