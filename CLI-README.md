# Retirement Simulator CLI

Command-line interface for running retirement simulations, comparing strategies, and Monte Carlo analysis.

## Setup

```bash
make setup          # creates .venv with editable install
source .venv/bin/activate
retirement-model --help
```

## Commands

### `run` — Single Simulation

Runs the simulation and outputs a year-by-year table (same data as the UI Details page).

```bash
retirement-model run portfolio.json
retirement-model run portfolio.json -f summary
retirement-model run portfolio.json -f json -o results.json
retirement-model run portfolio.json -f csv -o results.csv
```

Override strategies and assumptions on the fly:

```bash
# Conversion strategies
retirement-model run portfolio.json --strategy standard
retirement-model run portfolio.json --strategy 24_percent_bracket

# Spending strategies
retirement-model run portfolio.json --spending-strategy percent_of_portfolio --withdrawal-rate 0.04
retirement-model run portfolio.json --spending-strategy guardrails

# Growth rate (overrides per-account stock_pct-derived rates)
retirement-model run portfolio.json --growth-rate 0.04
retirement-model run portfolio.json --growth-rate 0.08

# Annual spending amount
retirement-model run portfolio.json --spending 100000
retirement-model run portfolio.json --spending 80000

# Scale entire portfolio (balances, spending, income, SS — not tax brackets)
retirement-model run portfolio.json --scale 0.5
retirement-model run portfolio.json --scale 2.0

# Combine freely
retirement-model run portfolio.json --scale 0.5 --growth-rate 0.05 --spending 80000
```

Add Monte Carlo ranges to the single run:

```bash
retirement-model run portfolio.json -m --montecarlo-iterations 500 --seed 42
```

**Output formats:** `table` (default), `csv`, `json`, `summary`

The `table` output includes: Age, AGI, Bracket, RMD, Surplus, Roth Conv, Conv Tax, PreTax WD, Roth WD, Brok WD, Total Tax, IRMAA, Balance — matching the UI Details table columns.

The `json` output includes everything from the table plus per-account withdrawal details, per-source income details, and account balances by type (pretax, roth, brokerage, roth_conversion).

### `compare` — Strategy Comparison

Compare multiple conversion and/or spending strategies side by side:

```bash
# Compare all conversion strategies with fixed spending
retirement-model compare portfolio.json \
  -s standard -s irmaa_tier_1 -s 22_percent_bracket -s 24_percent_bracket

# Compare spending strategies
retirement-model compare portfolio.json \
  --spending-strategy fixed_dollar \
  --spending-strategy percent_of_portfolio \
  --spending-strategy guardrails

# Cross-product: 3 conversion × 2 spending = 6 runs
retirement-model compare portfolio.json \
  -s standard -s irmaa_tier_1 -s 24_percent_bracket \
  --spending-strategy fixed_dollar --spending-strategy guardrails

# With overrides applied to all runs
retirement-model compare portfolio.json \
  -s standard -s irmaa_tier_1 --scale 0.5 --growth-rate 0.05
```

Output shows: Final Balance, Total Taxes, Total IRMAA, Roth Conversions, and final balances by account type for each combination.

### `monte-carlo` — Portfolio Survival Analysis

```bash
retirement-model monte-carlo portfolio.json -n 1000 --seed 42
retirement-model monte-carlo portfolio.json --spending-strategy guardrails
retirement-model monte-carlo portfolio.json --scale 0.5 --spending 80000
```

Shows success rate and year-by-year percentile distribution (5th, 25th, median, 75th, 95th).

Supports the same override flags as `run`: `--growth-rate`, `--spending`, `--scale`, `--spending-strategy`, `--withdrawal-rate`.

### `validate` — Check Portfolio JSON

```bash
retirement-model validate portfolio.json
retirement-model validate portfolio.json --scale 0.5
```

Reports account count, total balance, strategies, and simulation years without running. Supports `--scale`.

### `strategies` — List Available Options

```bash
retirement-model strategies
```

## Override Flags Summary

These flags are available on `run`, `compare`, and `monte-carlo` (except where noted):

| Flag | Description | Example |
|------|-------------|---------|
| `--strategy` | Conversion strategy | `--strategy standard` |
| `--spending-strategy` | Spending strategy | `--spending-strategy guardrails` |
| `--withdrawal-rate` | Withdrawal rate (for percent_of_portfolio) | `--withdrawal-rate 0.04` |
| `--growth-rate` | Override growth rate for all accounts | `--growth-rate 0.06` |
| `--spending` | Override annual spending amount | `--spending 100000` |
| `--scale` | Scale all dollar amounts by factor | `--scale 0.5` |

`--scale` scales account balances, spending, Social Security benefits, income streams, planned expenses, and salary/401k contributions. It does **not** scale tax brackets, IRMAA limits, or rates/percentages.

`--growth-rate` overrides the per-account stock_pct-derived growth rates with a single uniform rate for all accounts.

## Portfolio JSON Format

The CLI reads the same JSON format the UI saves. To get a portfolio JSON file:

1. **From the UI:** Configure a scenario in the web app, then use the Save button (Settings drawer) to download a JSON file
2. **From scratch:** Create a JSON file following the schema below

The UI save file includes a `profile` key (names, display preferences) that the CLI ignores — it only reads `config` and `accounts`.

### Minimal Example

```json
{
  "config": {
    "current_age_primary": 65,
    "simulation_years": 30,
    "start_year": 2026,
    "annual_spend_net": 100000,
    "inflation_rate": 0.03,
    "strategy_target": "irmaa_tier_1",
    "tax_rate_state": 0.05,
    "social_security": {
      "primary_benefit": 30000,
      "primary_start_age": 67
    }
  },
  "accounts": [
    {
      "id": "ira1",
      "name": "Traditional IRA",
      "balance": 500000,
      "type": "ira",
      "owner": "primary"
    },
    {
      "id": "roth1",
      "name": "Roth IRA",
      "balance": 100000,
      "type": "roth_ira",
      "owner": "primary"
    },
    {
      "id": "brokerage1",
      "name": "Brokerage",
      "balance": 300000,
      "type": "brokerage",
      "owner": "primary",
      "cost_basis_ratio": 0.40
    }
  ]
}
```

### Account Types

| Type | Description |
|------|-------------|
| `brokerage` | Taxable investment account |
| `cash_cd` | Cash, savings, CDs (0% growth) |
| `roth_ira` | Roth IRA |
| `roth_401k` | Roth 401(k) |
| `roth_conversion` | Roth conversion bucket (auto-created by sim) |
| `401k` | Traditional 401(k) |
| `403b` | 403(b) |
| `457b` | 457(b) |
| `ira` | Traditional IRA |
| `sep_ira` | SEP IRA |
| `simple_ira` | SIMPLE IRA |

### Account Fields

| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| `id` | yes | — | Unique identifier |
| `name` | yes | — | Display name |
| `balance` | yes | — | Current balance |
| `type` | yes | — | See account types above |
| `owner` | yes | — | `primary`, `spouse`, or `joint` |
| `cost_basis_ratio` | no | 1.0 | Brokerage only: fraction that is cost basis (0.25 = 75% gains) |
| `available_at_age` | no | 0 | Age at which withdrawals allowed (e.g., 59 for penalty-free) |
| `stock_pct` | no | 60 | Stock allocation percentage (0-100), drives growth rate |
| `tax_drag_override` | no | null | Override calculated tax drag for brokerage accounts |

### Conversion Strategies

| Value | Description |
|-------|-------------|
| `standard` | No voluntary Roth conversions |
| `irmaa_tier_1` | Cap AGI at IRMAA Tier 1 threshold (~$206K) |
| `22_percent_bracket` | Fill to top of 22% bracket (~$201K MFJ) |
| `24_percent_bracket` | Fill to top of 24% bracket (~$384K MFJ) |

### Spending Strategies

| Value | Config Fields Used |
|-------|-------------------|
| `fixed_dollar` | `annual_spend_net`, `inflation_rate` |
| `percent_of_portfolio` | `withdrawal_rate` (e.g., 0.04) |
| `guardrails` | `guardrails_config` (initial rate, floor, ceiling, adjustment) |

### Other Config Fields

| Field | Default | Notes |
|-------|---------|-------|
| `current_age_spouse` | null | Omit for single filer |
| `tax_brackets_federal` | 2024 brackets | Array of `{limit, rate}` |
| `tax_rate_state` | 0.0 | State income tax rate |
| `tax_rate_capital_gains` | 0.15 | Flat cap gains rate (progressive if omitted) |
| `irmaa_limit_tier_1` | 218000 | IRMAA threshold |
| `rmd_start_age` | 73 | RMD start age |
| `retirement_age` | null | If set, pre-retirement rules apply before this age |
| `withdrawal_order` | cash, brokerage, pretax, roth | Order of account types for spending withdrawals |
| `excess_income_routing` | brokerage | Where surplus income goes: `brokerage`, `roth_ira_first`, `ira_first` |
| `planned_expenses` | [] | One-time or recurring extra expenses |
| `income_streams` | [] | Employment, pension, rental income |
| `social_security.spouse_benefit` | null | Spouse SS benefit |
| `social_security.spouse_start_age` | null | Spouse SS start age |

## Scripting Scenarios

### Compare Growth Assumptions

```bash
for rate in 0.04 0.06 0.08; do
  echo "=== Growth: ${rate} ==="
  retirement-model run portfolio.json -f summary --growth-rate "$rate"
  echo
done
```

### Compare Spending Levels

```bash
for spend in 80000 100000 120000 144000; do
  echo "=== Spending: \$${spend} ==="
  retirement-model run portfolio.json -f summary --spending "$spend"
  echo
done
```

### Scale Analysis (What If I Had Less/More?)

```bash
for scale in 0.25 0.5 0.75 1.0; do
  echo "=== Scale: ${scale}x ==="
  retirement-model run portfolio.json -f summary --scale "$scale"
  echo
done
```

### Compare Strategies at Different Portfolio Sizes

```bash
for scale in 0.5 1.0; do
  echo "=== Scale: ${scale}x ==="
  retirement-model compare portfolio.json \
    -s standard -s irmaa_tier_1 -s 24_percent_bracket \
    --scale "$scale"
  echo
done
```

### Export Detailed Results for Analysis

```bash
# Full JSON with per-account details
retirement-model run portfolio.json -f json -o detailed_results.json

# CSV for spreadsheet import
retirement-model run portfolio.json -f csv -o results.csv

# Compare strategies as JSON
for strat in standard irmaa_tier_1 24_percent_bracket; do
  retirement-model run portfolio.json --strategy "$strat" -f json -o "results_${strat}.json"
done
```

### Monte Carlo with Different Strategies

```bash
for strat in fixed_dollar percent_of_portfolio guardrails; do
  echo "=== ${strat} ==="
  retirement-model monte-carlo portfolio.json -n 1000 --seed 42 --spending-strategy "$strat"
  echo
done
```

## Gaps vs. UI Details Table

The CLI `table` output shows the same core columns as the UI Details page. The CLI `json` output includes the full `SimulationResult` model with all per-account and per-source details that the UI renders in expandable rows.

What the CLI **does not** currently provide:
- **No side-by-side year-by-year comparison** — `compare` only shows summary metrics, not year-by-year diffs across strategies
- **No chart output** — tables and data only (pipe JSON/CSV to your own plotting tools)
