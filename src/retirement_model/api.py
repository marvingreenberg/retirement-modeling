"""REST API layer for retirement simulation.

Provides FastAPI endpoints for running simulations and Monte Carlo analysis.
Designed to be consumed by web applications. Serves built SvelteKit static
assets when available.
"""

import importlib.metadata
import logging
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from retirement_model.models import (
    ConversionStrategy,
    Portfolio,
    SimulationResult,
    SpendingStrategy,
)
from retirement_model.monte_carlo import FullMonteCarloResult, run_full_monte_carlo
from retirement_model.simulation import run_simulation

logger = logging.getLogger(__name__)

APP_VERSION = importlib.metadata.version("retirement-model")

app = FastAPI(
    title="Retirement Simulation API",
    description="API for running retirement portfolio simulations with tax-optimized strategies",
    version=APP_VERSION,
)

router = APIRouter(prefix="/api/v1")


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


class YearlyResultPercentilesResponse(BaseModel):
    """Percentile data for a single year from full Monte Carlo."""

    age: int
    balance_p5: float
    balance_p25: float
    balance_median: float
    balance_p75: float
    balance_p95: float
    agi_median: float
    total_tax_median: float
    roth_conversion_median: float


class MonteCarloResponse(BaseModel):
    """Response from running full Monte Carlo simulation."""

    num_simulations: int
    success_rate: float
    median_simulation: SimulationResult
    yearly_percentiles: list[YearlyResultPercentilesResponse]
    final_balance_p5: float
    final_balance_p95: float

    @classmethod
    def from_result(cls, result: FullMonteCarloResult) -> "MonteCarloResponse":
        return cls(
            num_simulations=result.num_simulations,
            success_rate=result.success_rate,
            median_simulation=result.median_simulation,
            yearly_percentiles=[
                YearlyResultPercentilesResponse(
                    age=yp.age,
                    balance_p5=yp.balance_p5,
                    balance_p25=yp.balance_p25,
                    balance_median=yp.balance_median,
                    balance_p75=yp.balance_p75,
                    balance_p95=yp.balance_p95,
                    agi_median=yp.agi_median,
                    total_tax_median=yp.total_tax_median,
                    roth_conversion_median=yp.roth_conversion_median,
                )
                for yp in result.yearly_percentiles
            ],
            final_balance_p5=result.final_balance_p5,
            final_balance_p95=result.final_balance_p95,
        )


# --- Versioned API routes (on the router) ---


@router.get("/status")
async def status() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "version": APP_VERSION}


@router.get("/")
async def api_root() -> dict:
    """API discovery endpoint."""
    return {
        "name": "Retirement Simulation API",
        "version": APP_VERSION,
        "endpoints": {
            "status": "/api/v1/status",
            "simulate": "/api/v1/simulate",
            "monte-carlo": "/api/v1/monte-carlo",
            "compare": "/api/v1/compare",
            "strategies": "/api/v1/strategies",
        },
    }


@router.get("/strategies")
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


@router.post("/simulate", response_model=SimulationResponse)
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


@router.post("/monte-carlo", response_model=MonteCarloResponse)
async def monte_carlo(request: MonteCarloRequest) -> MonteCarloResponse:
    """Run full Monte Carlo simulation with taxes, RMDs, and conversions."""
    portfolio = request.portfolio.model_copy(deep=True)

    if request.spending_strategy:
        portfolio.config.spending_strategy = request.spending_strategy
    if request.withdrawal_rate is not None:
        portfolio.config.withdrawal_rate = request.withdrawal_rate

    if request.num_simulations < 1 or request.num_simulations > 10000:
        raise HTTPException(status_code=400, detail="num_simulations must be between 1 and 10000")

    try:
        result = run_full_monte_carlo(
            portfolio, num_simulations=request.num_simulations, seed=request.seed
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return MonteCarloResponse.from_result(result)


@router.post("/compare")
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


# --- Include the versioned router ---

app.include_router(router)


# --- Backward-compat redirects from old unversioned routes ---

_OLD_ROUTES = [
    ("/simulate", "/api/v1/simulate"),
    ("/monte-carlo", "/api/v1/monte-carlo"),
    ("/compare", "/api/v1/compare"),
    ("/strategies", "/api/v1/strategies"),
]

for _old_path, _new_path in _OLD_ROUTES:

    def _make_redirect(target: str):  # noqa: E301
        async def redirect() -> RedirectResponse:
            return RedirectResponse(url=target, status_code=307)

        return redirect

    app.add_api_route(
        _old_path,
        _make_redirect(_new_path),
        methods=["GET", "POST"],
        include_in_schema=False,
    )


# --- Conditional static file serving OR root health endpoint ---

STATIC_DIR = Path(__file__).parent / "static"


def mount_static_or_root() -> None:
    """Mount static files if present, otherwise register root health endpoint."""
    if STATIC_DIR.is_dir():
        from starlette.staticfiles import StaticFiles

        app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
        logger.info("Static asset serving: ACTIVE (serving from %s)", STATIC_DIR)
    else:

        @app.get("/")
        async def root() -> dict:
            """Health/info endpoint when no static assets are mounted."""
            return {
                "name": "Retirement Simulation API",
                "version": APP_VERSION,
                "status": "ok",
                "api": "/api/v1/",
            }

        logger.info("Static asset serving: INACTIVE (no static/ directory found)")


mount_static_or_root()
