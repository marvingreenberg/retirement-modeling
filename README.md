# Retirement Portfolio Simulation

A Python tool for simulating retirement portfolio outcomes with tax-optimized withdrawal strategies, Roth conversion planning, and Monte Carlo analysis.

## Installation

```bash
# Clone and install
git clone <repo-url>
cd retirement_model
make setup

# Or install with pip
pip install -e .

# For API server support
pip install -e ".[api]"
```

## Quick Start

```bash
# Run a basic simulation
retirement-model run portfolio.json

# Run with Monte Carlo to see range of outcomes
retirement-model run portfolio.json --with-montecarlo

# Compare different strategies
retirement-model compare portfolio.json -s irmaa_tier_1 -s 24_percent_bracket

# Validate a portfolio file
retirement-model validate portfolio.json

# List available strategies
retirement-model strategies
```

## Portfolio File Format

```json
{
  "config": {
    "current_age_primary": 65,
    "current_age_spouse": 62,
    "simulation_years": 30,
    "start_year": 2026,
    "annual_spend_net": 120000,
    "investment_growth_rate": 0.06,
    "inflation_rate": 0.03,
    "strategy_target": "irmaa_tier_1",
    "spending_strategy": "fixed_dollar",
    "social_security": {
      "primary_benefit": 36000,
      "primary_start_age": 70,
      "spouse_benefit": 18000,
      "spouse_start_age": 67
    }
  },
  "accounts": [
    {
      "id": "ira_primary",
      "name": "Traditional IRA",
      "balance": 1500000,
      "type": "pretax",
      "owner": "primary"
    },
    {
      "id": "roth_primary",
      "name": "Roth IRA",
      "balance": 300000,
      "type": "roth",
      "owner": "primary"
    },
    {
      "id": "brokerage",
      "name": "Joint Brokerage",
      "balance": 800000,
      "type": "brokerage",
      "owner": "joint",
      "cost_basis_ratio": 0.65
    }
  ]
}
```

## Understanding the Simulation

### What It Models

The simulation runs year-by-year through retirement, modeling:

1. **Income sources**: Social Security benefits starting at specified ages
2. **Required Minimum Distributions (RMDs)**: Mandatory withdrawals from pre-tax accounts starting at age 73
3. **Spending needs**: Your annual spending target, adjusted for inflation
4. **Withdrawal order**: Brokerage -> Roth -> Pre-tax (to minimize taxes)
5. **Roth conversions**: Optional conversion of pre-tax to Roth based on your strategy
6. **Taxes**: Federal income tax, capital gains, and IRMAA Medicare surcharges
7. **Portfolio growth**: Investment returns applied to remaining balances

### Single Run vs Monte Carlo

**Single Run** (`retirement-model run portfolio.json`):
- Uses your configured growth rate (e.g., 6%) and inflation rate (e.g., 3%)
- Shows one deterministic outcome
- Good for conservative planning with fixed assumptions

**Monte Carlo** (`retirement-model run portfolio.json --with-montecarlo`):
- Runs 100+ simulations with varying market conditions
- Shows range of outcomes (5th percentile to 95th percentile)
- Answers "what might happen given historical market variability?"

### How Monte Carlo Works

The Monte Carlo simulation does **not** generate random numbers from a statistical distribution. Instead, it uses **actual historical market data**:

**Historical Data**:
- 96 years of S&P 500 total returns (1928-2023)
- 96 years of actual U.S. inflation rates (CPI) from the same years
- Returns range from -43.8% (1931) to +52.6% (1954)
- Historical average return: 11.7%, standard deviation: 19.5%

**Sampling Method (Block Sampling)**:

For each Monte Carlo iteration, we build a 30-year sequence of returns by:

1. Randomly pick a starting year from history (e.g., 1987)
2. Take 5 consecutive years of returns AND inflation together (1987-1991)
3. Randomly pick another starting year, take the next 5 years
4. Repeat until we have 30 years of data

This "block sampling" approach:
- **Preserves correlation**: Returns and inflation from each year stay paired (they actually happened together)
- **Preserves autocorrelation**: Market trends tend to persist for a few years; keeping 5-year blocks captures this
- **Uses real events**: Your simulations include actual crashes (1929, 1974, 2008), booms (1995-1999), and stagflation (1970s)

**Why Monte Carlo Results Differ from Single Run**:

| Mode | Growth Rate | Typical Use |
|------|-------------|-------------|
| Single run | Your config (typically 6%) | Conservative planning baseline |
| Monte Carlo | Historical S&P 500 (avg 11.7%) | Stress testing with actual history |

The Monte Carlo median will typically be higher than a conservative single-run projection because historical equity returns have averaged higher than conservative planning assumptions. Both are useful:
- **Single run**: "What if I plan conservatively?"
- **Monte Carlo**: "What range of outcomes actually occurred historically?"

## Spending Strategies

Control how much you withdraw each year:

| Strategy | Description | Best For |
|----------|-------------|----------|
| `fixed_dollar` | Fixed amount, adjusted for inflation each year | Predictable income needs |
| `percent_of_portfolio` | Fixed % of current portfolio value | Flexible income, can't deplete |
| `guardrails` | Adjusts +/-10% when withdrawal rate crosses thresholds | Balance of stability and safety |
| `rmd_based` | Uses IRS RMD percentages (increases with age) | Systematic, age-based approach |

## Roth Conversion Strategies

Control how aggressively you convert pre-tax to Roth:

| Strategy | Description | Best For |
|----------|-------------|----------|
| `standard` | No voluntary conversions, only required RMDs | Already in high tax bracket |
| `irmaa_tier_1` | Stay below IRMAA threshold (~$206K AGI) | On Medicare, avoid surcharges |
| `22_percent_bracket` | Fill to top of 22% bracket (~$201K) | Moderate conversion at low rate |
| `24_percent_bracket` | Fill to top of 24% bracket (~$384K) | Aggressive conversion, large IRA |

See [STRATEGIES.md](STRATEGIES.md) for detailed explanations of when to use each strategy.

## CLI Reference

```bash
# Basic simulation
retirement-model run <portfolio.json> [options]
  --strategy <strategy>           # Override conversion strategy
  --spending-strategy <strategy>  # Override spending strategy
  --withdrawal-rate <rate>        # Override withdrawal rate (e.g., 0.04)
  -f, --output-format <format>    # table, csv, json, summary
  -o, --output-file <path>        # Write to file instead of stdout
  -m, --with-montecarlo           # Run Monte Carlo simulation
  --montecarlo-iterations <n>     # Number of iterations (default: 100)
  --seed <n>                      # Random seed for reproducibility

# Compare strategies
retirement-model compare <portfolio.json> [options]
  -s, --strategy <strategy>       # Strategies to compare (can repeat)
  --spending-strategy <strategy>  # Spending strategies to compare

# Simple Monte Carlo (balance-only, faster)
retirement-model monte-carlo <portfolio.json> [options]
  -n, --simulations <n>           # Number of simulations (default: 1000)
  --seed <n>                      # Random seed

# Utilities
retirement-model validate <portfolio.json>  # Check file validity
retirement-model strategies                  # List available strategies
```

## API Server

For web application integration:

```bash
pip install retirement-model[api]
uvicorn retirement_model.api:app --reload
```

Endpoints:
- `POST /simulate` - Run simulation with portfolio JSON
- `POST /monte-carlo` - Run Monte Carlo analysis
- `POST /compare` - Compare multiple strategies
- `GET /strategies` - List available strategies

See [DESIGN.md](DESIGN.md) for technical architecture details.

## Development

```bash
make setup      # Create venv and install dependencies
make test       # Run tests with coverage
make format     # Format code with black/isort
make lint       # Run type checking with mypy
```

## License

MIT
