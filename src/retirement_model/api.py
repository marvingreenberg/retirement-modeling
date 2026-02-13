"""REST API layer for retirement simulation.

Provides FastAPI endpoints for running simulations and Monte Carlo analysis.
Designed to be consumed by web applications.
"""

from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from retirement_model.models import (
    ConversionStrategy,
    Portfolio,
    SimulationResult,
    SpendingStrategy,
)
from retirement_model.monte_carlo import MonteCarloResult, run_monte_carlo
from retirement_model.simulation import run_simulation

app = FastAPI(
    title="Retirement Simulation API",
    description="API for running retirement portfolio simulations with tax-optimized strategies",
    version="0.9.0",
)


class SimulationRequest(BaseModel):
    """Request body for running a simulation."""

    portfolio: Portfolio
    strategy: ConversionStrategy | None = None
    spending_strategy: SpendingStrategy | None = None
    withdrawal_rate: float | None = None


class MonteCarloRequest(BaseModel):
    """Request body for running Monte Carlo simulation."""

    portfolio: Portfolio
    num_simulations: int = 1000
    seed: int | None = None
    spending_strategy: SpendingStrategy | None = None
    withdrawal_rate: float | None = None


class SimulationResponse(BaseModel):
    """Response from running a simulation."""

    result: SimulationResult
    summary: dict


class YearlyPercentilesResponse(BaseModel):
    """Percentile data for a single year."""

    age: int
    percentile_5: float
    percentile_25: float
    median: float
    percentile_75: float
    percentile_95: float


class MonteCarloResponse(BaseModel):
    """Response from running Monte Carlo simulation."""

    num_simulations: int
    success_rate: float
    failure_rate: float
    median_final_balance: float
    percentile_5: float
    percentile_25: float
    percentile_75: float
    percentile_95: float
    depletion_ages: list[int]
    yearly_percentiles: list[YearlyPercentilesResponse]

    @classmethod
    def from_result(cls, result: MonteCarloResult) -> "MonteCarloResponse":
        return cls(
            num_simulations=result.num_simulations,
            success_rate=result.success_rate,
            failure_rate=result.failure_rate,
            median_final_balance=result.median_final_balance,
            percentile_5=result.percentile_5,
            percentile_25=result.percentile_25,
            percentile_75=result.percentile_75,
            percentile_95=result.percentile_95,
            depletion_ages=result.depletion_ages,
            yearly_percentiles=[
                YearlyPercentilesResponse(
                    age=yp.age,
                    percentile_5=yp.percentile_5,
                    percentile_25=yp.percentile_25,
                    median=yp.median,
                    percentile_75=yp.percentile_75,
                    percentile_95=yp.percentile_95,
                )
                for yp in result.yearly_percentiles
            ],
        )


@app.get("/")
async def root() -> dict:
    """API root endpoint."""
    return {
        "name": "Retirement Simulation API",
        "version": "0.9.0",
        "endpoints": {
            "simulate": "/simulate",
            "monte-carlo": "/monte-carlo",
            "strategies": "/strategies",
        },
    }


@app.get("/strategies")
async def list_strategies() -> dict:
    """List available strategies."""
    return {
        "conversion_strategies": [
            {"value": s.value, "description": _get_conversion_description(s)}
            for s in ConversionStrategy
        ],
        "spending_strategies": [
            {
                "value": s.value,
                "description": _get_spending_description(s),
                **_get_spending_field_usage(s),
            }
            for s in SpendingStrategy
        ],
    }


def _get_conversion_description(strategy: ConversionStrategy) -> str:
    match strategy:
        case ConversionStrategy.STANDARD:
            return "No voluntary Roth conversions"
        case ConversionStrategy.IRMAA_TIER_1:
            return "Cap AGI at IRMAA Tier 1 threshold to avoid Medicare surcharges"
        case ConversionStrategy.BRACKET_22:
            return "Fill up to top of 22% federal tax bracket"
        case ConversionStrategy.BRACKET_24:
            return "Fill up to top of 24% federal tax bracket"


SPENDING_FIELD_USAGE: dict[SpendingStrategy, dict] = {
    SpendingStrategy.FIXED_DOLLAR: {
        "uses_fields": ["annual_spend_net"],
        "ignores_fields": ["withdrawal_rate", "guardrails_config"],
    },
    SpendingStrategy.PERCENT_OF_PORTFOLIO: {
        "uses_fields": ["withdrawal_rate"],
        "ignores_fields": ["annual_spend_net", "guardrails_config"],
    },
    SpendingStrategy.GUARDRAILS: {
        "uses_fields": ["guardrails_config"],
        "ignores_fields": ["annual_spend_net", "withdrawal_rate"],
    },
    SpendingStrategy.RMD_BASED: {
        "uses_fields": [],
        "ignores_fields": ["annual_spend_net", "withdrawal_rate", "guardrails_config"],
    },
}


def _get_spending_field_usage(strategy: SpendingStrategy) -> dict:
    return SPENDING_FIELD_USAGE[strategy]


def _get_spending_description(strategy: SpendingStrategy) -> str:
    match strategy:
        case SpendingStrategy.FIXED_DOLLAR:
            return "Fixed dollar amount adjusted for inflation"
        case SpendingStrategy.PERCENT_OF_PORTFOLIO:
            return "Withdraw fixed percentage of current portfolio value"
        case SpendingStrategy.GUARDRAILS:
            return "Guyton-Klinger: adjust spending when withdrawal rate crosses thresholds"
        case SpendingStrategy.RMD_BASED:
            return "Withdraw based on RMD percentages from IRS tables"


@app.post("/simulate", response_model=SimulationResponse)
async def simulate(request: SimulationRequest) -> SimulationResponse:
    """Run a retirement simulation."""
    portfolio = request.portfolio.model_copy(deep=True)

    if request.strategy:
        portfolio.config.strategy_target = request.strategy
    if request.spending_strategy:
        portfolio.config.spending_strategy = request.spending_strategy
    if request.withdrawal_rate is not None:
        portfolio.config.withdrawal_rate = request.withdrawal_rate

    try:
        result = run_simulation(portfolio)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    initial_annual = result.years[0].spending_target if result.years else 0
    summary = {
        "final_balance": result.final_balance,
        "total_taxes_paid": result.total_taxes_paid,
        "total_irmaa_paid": result.total_irmaa_paid,
        "total_roth_conversions": result.total_roth_conversions,
        "simulation_years": len(result.years),
        "strategy": result.strategy.value,
        "spending_strategy": result.spending_strategy.value,
        "initial_annual_spend": initial_annual,
        "initial_monthly_spend": initial_annual / 12,
    }

    return SimulationResponse(result=result, summary=summary)


@app.post("/monte-carlo", response_model=MonteCarloResponse)
async def monte_carlo(request: MonteCarloRequest) -> MonteCarloResponse:
    """Run Monte Carlo simulation."""
    portfolio = request.portfolio.model_copy(deep=True)

    if request.spending_strategy:
        portfolio.config.spending_strategy = request.spending_strategy
    if request.withdrawal_rate is not None:
        portfolio.config.withdrawal_rate = request.withdrawal_rate

    if request.num_simulations < 1 or request.num_simulations > 10000:
        raise HTTPException(status_code=400, detail="num_simulations must be between 1 and 10000")

    try:
        result = run_monte_carlo(
            portfolio, num_simulations=request.num_simulations, seed=request.seed
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return MonteCarloResponse.from_result(result)


@app.post("/compare")
async def compare_strategies(
    portfolio: Portfolio,
    conversion_strategies: Annotated[
        list[ConversionStrategy], Query(description="Conversion strategies to compare")
    ] = [ConversionStrategy.IRMAA_TIER_1],
    spending_strategies: Annotated[
        list[SpendingStrategy], Query(description="Spending strategies to compare")
    ] = [SpendingStrategy.FIXED_DOLLAR],
) -> dict:
    """Compare multiple strategy combinations."""
    results = []

    for conv_strat in conversion_strategies:
        for spend_strat in spending_strategies:
            p = portfolio.model_copy(deep=True)
            p.config.strategy_target = conv_strat
            p.config.spending_strategy = spend_strat

            result = run_simulation(p)
            results.append(
                {
                    "conversion_strategy": conv_strat.value,
                    "spending_strategy": spend_strat.value,
                    "final_balance": result.final_balance,
                    "total_taxes_paid": result.total_taxes_paid,
                    "total_irmaa_paid": result.total_irmaa_paid,
                    "total_roth_conversions": result.total_roth_conversions,
                    "final_roth_balance": result.years[-1].roth_balance,
                    "final_pretax_balance": result.years[-1].pretax_balance,
                    "final_brokerage_balance": result.years[-1].brokerage_balance,
                }
            )

    return {"comparisons": results}
