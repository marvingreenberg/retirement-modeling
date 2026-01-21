"""Output formatting and display logic for simulation results."""

from enum import Enum
from io import StringIO
from typing import TextIO

import pandas as pd

from retirement_model.models import ConversionStrategy, SimulationResult, SpendingStrategy


class OutputFormat(str, Enum):
    TABLE = "table"
    CSV = "csv"
    JSON = "json"
    SUMMARY = "summary"


def get_strategy_description(strategy: ConversionStrategy) -> str:
    """Get a human-readable description of the conversion strategy."""
    match strategy:
        case ConversionStrategy.BRACKET_24:
            return "Filling to Top of 24% Bracket (~$383,900)"
        case ConversionStrategy.BRACKET_22:
            return "Filling to Top of 22% Bracket (~$201,050)"
        case ConversionStrategy.IRMAA_TIER_1:
            return "Capping at IRMAA Tier 1 (~$206,000)"
        case ConversionStrategy.STANDARD:
            return "Standard (No voluntary conversions)"
        case _:
            return str(strategy.value)


def get_spending_strategy_description(strategy: SpendingStrategy) -> str:
    """Get a human-readable description of the spending strategy."""
    match strategy:
        case SpendingStrategy.FIXED_DOLLAR:
            return "Fixed Dollar (inflation-adjusted)"
        case SpendingStrategy.PERCENT_OF_PORTFOLIO:
            return "Percent of Portfolio"
        case SpendingStrategy.GUARDRAILS:
            return "Guardrails (Guyton-Klinger)"
        case SpendingStrategy.RMD_BASED:
            return "RMD-Based"
        case _:
            return str(strategy.value)


def results_to_dataframe(result: SimulationResult) -> pd.DataFrame:
    """Convert simulation results to a pandas DataFrame."""
    records = []
    for yr in result.years:
        records.append(
            {
                "Age": yr.age_primary,
                "AGI": yr.agi,
                "Bracket": yr.bracket,
                "RMD": yr.rmd,
                "Surplus": yr.surplus,
                "Roth Conv": yr.roth_conversion,
                "Conv Tax": yr.conversion_tax,
                "PreTax WD": yr.pretax_withdrawal,
                "Roth WD": yr.roth_withdrawal,
                "Brok WD": yr.brokerage_withdrawal,
                "Total Tax": yr.total_tax,
                "IRMAA": int(yr.irmaa_cost),
                "Balance": yr.total_balance,
            }
        )
    return pd.DataFrame(records)


def format_table(result: SimulationResult) -> str:
    """Format results as a text table."""
    df = results_to_dataframe(result)
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 1000)
    return df.to_string(index=False)


def format_csv(result: SimulationResult) -> str:
    """Format results as CSV."""
    df = results_to_dataframe(result)
    return df.to_csv(index=False)


def format_json(result: SimulationResult) -> str:
    """Format results as JSON."""
    return result.model_dump_json(indent=2)


def format_summary(result: SimulationResult) -> str:
    """Format a brief summary of results."""
    lines = [
        f"Conversion Strategy: {get_strategy_description(result.strategy)}",
        f"Spending Strategy: {get_spending_strategy_description(result.spending_strategy)}",
        "",
        f"Simulation Period: Age {result.years[0].age_primary} - {result.years[-1].age_primary}",
        f"Starting Balance: ${result.years[0].total_balance:,.0f}",
        f"Final Balance: ${result.final_balance:,.0f}",
        "",
        f"Total Taxes Paid: ${result.total_taxes_paid:,.0f}",
        f"Total IRMAA Paid: ${result.total_irmaa_paid:,.0f}",
        f"Total Roth Conversions: ${result.total_roth_conversions:,.0f}",
        "",
        "Balance by Account Type (Final Year):",
        f"  Pre-Tax: ${result.years[-1].pretax_balance:,.0f}",
        f"  Roth: ${result.years[-1].roth_balance:,.0f}",
        f"  Brokerage: ${result.years[-1].brokerage_balance:,.0f}",
    ]
    return "\n".join(lines)


def print_results(
    result: SimulationResult,
    output_format: OutputFormat = OutputFormat.TABLE,
    file: TextIO | None = None,
) -> None:
    """Print simulation results in the specified format."""
    output = file or StringIO()

    header = f"Strategy: {get_strategy_description(result.strategy)}"
    separator = "-" * 60

    match output_format:
        case OutputFormat.TABLE:
            print(header, file=output)
            print(separator, file=output)
            print(format_table(result), file=output)
        case OutputFormat.CSV:
            print(format_csv(result), file=output)
        case OutputFormat.JSON:
            print(format_json(result), file=output)
        case OutputFormat.SUMMARY:
            print(format_summary(result), file=output)

    if file is None:
        print(output.getvalue())


def get_result_label(result: SimulationResult) -> str:
    """Get a short label for a result combining both strategies."""
    conv = result.strategy.value[:10]
    spend = result.spending_strategy.value[:10]
    return f"{conv}/{spend}"


def compare_results(results: list[SimulationResult]) -> str:
    """Compare multiple simulation results side by side."""
    lines = ["Strategy Comparison", "=" * 60, ""]

    headers = ["Metric"] + [get_result_label(r) for r in results]
    rows = [
        ["Final Balance"] + [f"${r.final_balance:,.0f}" for r in results],
        ["Total Taxes"] + [f"${r.total_taxes_paid:,.0f}" for r in results],
        ["Total IRMAA"] + [f"${r.total_irmaa_paid:,.0f}" for r in results],
        ["Roth Conversions"] + [f"${r.total_roth_conversions:,.0f}" for r in results],
        ["Final Roth"] + [f"${r.years[-1].roth_balance:,.0f}" for r in results],
        ["Final PreTax"] + [f"${r.years[-1].pretax_balance:,.0f}" for r in results],
        ["Final Brokerage"] + [f"${r.years[-1].brokerage_balance:,.0f}" for r in results],
    ]

    col_widths = [max(len(str(row[i])) for row in [headers] + rows) for i in range(len(headers))]

    def format_row(row: list[str]) -> str:
        return " | ".join(str(cell).ljust(col_widths[i]) for i, cell in enumerate(row))

    lines.append(format_row(headers))
    lines.append("-" * sum(col_widths) + "-" * (len(headers) - 1) * 3)
    for row in rows:
        lines.append(format_row(row))

    return "\n".join(lines)
