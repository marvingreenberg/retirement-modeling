"""REST API layer for retirement simulation.

Provides FastAPI endpoints for running simulations and Monte Carlo analysis.
Designed to be consumed by web applications. Serves built SvelteKit static
assets when available.
"""

import importlib.metadata
import logging
import os
from pathlib import Path
from typing import Annotated, Any

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
    summary: dict[str, Any]


# --- Versioned API routes (on the router) ---


@router.get("/status")
async def status() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": APP_VERSION,
        "previous_version_url": os.environ.get("PREVIOUS_VERSION_URL", ""),
        "previous_version": os.environ.get("PREVIOUS_VERSION", ""),
    }


@router.get("/")
async def api_root() -> dict[str, Any]:
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
async def list_strategies() -> dict[str, Any]:
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


SPENDING_FIELD_USAGE: dict[SpendingStrategy, dict[str, list[str]]] = {
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
}


def _get_spending_field_usage(strategy: SpendingStrategy) -> dict[str, list[str]]:
    return SPENDING_FIELD_USAGE[strategy]


def _get_spending_description(strategy: SpendingStrategy) -> str:
    match strategy:
        case SpendingStrategy.FIXED_DOLLAR:
            return "Fixed dollar amount adjusted for inflation"
        case SpendingStrategy.PERCENT_OF_PORTFOLIO:
            return "Withdraw fixed percentage of current portfolio value"
        case SpendingStrategy.GUARDRAILS:
            return "Guyton-Klinger: adjust spending when withdrawal rate crosses thresholds"


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


@router.post("/monte-carlo", response_model=FullMonteCarloResult)
async def monte_carlo(request: MonteCarloRequest) -> FullMonteCarloResult:
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

    return result


@router.post("/compare")
async def compare_strategies(
    portfolio: Portfolio,
    conversion_strategies: Annotated[
        list[ConversionStrategy], Query(description="Conversion strategies to compare")
    ] = [ConversionStrategy.IRMAA_TIER_1],
    spending_strategies: Annotated[
        list[SpendingStrategy], Query(description="Spending strategies to compare")
    ] = [SpendingStrategy.FIXED_DOLLAR],
) -> dict[str, Any]:
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

    def _make_redirect(target: str):  # type: ignore[no-untyped-def]  # noqa: E301
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
        from starlette.exceptions import HTTPException as StarletteHTTPException
        from starlette.responses import Response
        from starlette.staticfiles import StaticFiles
        from starlette.types import Scope

        class SPAStaticFiles(StaticFiles):
            """StaticFiles with SPA fallback and cache headers.

            Hashed assets under _app/immutable/ get long cache; index.html
            and other mutable files get no-cache so browsers always revalidate.
            """

            async def get_response(self, path: str, scope: Scope) -> Response:
                try:
                    resp = await super().get_response(path, scope)
                except StarletteHTTPException as exc:
                    if exc.status_code == 404 and not Path(path).suffix:
                        resp = await super().get_response("index.html", scope)
                    else:
                        raise
                if "/_app/immutable/" in path:
                    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
                elif path == "." or path.endswith(".html") or not Path(path).suffix:
                    resp.headers["Cache-Control"] = "no-cache"
                return resp

        app.mount("/", SPAStaticFiles(directory=str(STATIC_DIR), html=True), name="static")
        logger.info("Static asset serving: ACTIVE (serving from %s)", STATIC_DIR)
    else:

        @app.get("/")
        async def root() -> dict[str, Any]:
            """Health/info endpoint when no static assets are mounted."""
            return {
                "name": "Retirement Simulation API",
                "version": APP_VERSION,
                "status": "ok",
                "api": "/api/v1/",
            }

        logger.info("Static asset serving: INACTIVE (no static/ directory found)")


mount_static_or_root()
