"""Social Security benefit calculations and income stream generation."""

from retirement_model.models import IncomeStream, Owner, SSAutoConfig

SS_TAXABLE_PCT = 0.85
DELAYED_CREDIT_PER_MONTH = 2 / 3 / 100  # 2/3 of 1% per month (8% per year)
EARLY_REDUCTION_FIRST_36 = 5 / 9 / 100  # 5/9 of 1% per month
EARLY_REDUCTION_BEYOND_36 = 5 / 12 / 100  # 5/12 of 1% per month
MAX_CLAIMING_AGE = 70
DEFAULT_FRA = 67


def compute_ss_benefit(fra_amount: float, claiming_age: int, fra_age: int = DEFAULT_FRA) -> float:
    """Compute actuarially adjusted SS annual benefit for a given claiming age.

    Before FRA: reduced by 5/9 of 1% per month for first 36 months early,
    then 5/12 of 1% per additional month.
    After FRA: increased by 2/3 of 1% per month delayed, up to age 70.
    """
    if claiming_age >= MAX_CLAIMING_AGE:
        months_delayed = (MAX_CLAIMING_AGE - fra_age) * 12
        return fra_amount * (1 + DELAYED_CREDIT_PER_MONTH * months_delayed)

    if claiming_age >= fra_age:
        months_delayed = (claiming_age - fra_age) * 12
        return fra_amount * (1 + DELAYED_CREDIT_PER_MONTH * months_delayed)

    # Early claiming
    months_early = (fra_age - claiming_age) * 12
    if months_early <= 36:
        reduction = EARLY_REDUCTION_FIRST_36 * months_early
    else:
        reduction = EARLY_REDUCTION_FIRST_36 * 36 + EARLY_REDUCTION_BEYOND_36 * (months_early - 36)
    return fra_amount * (1 - reduction)


def generate_ss_streams(ss_auto: SSAutoConfig) -> list[IncomeStream]:
    """Generate IncomeStream entries from SS auto-config."""
    streams: list[IncomeStream] = []

    primary_amount = compute_ss_benefit(
        ss_auto.primary_fra_amount, ss_auto.primary_start_age, ss_auto.fra_age
    )
    streams.append(
        IncomeStream(
            name="Social Security (primary)",
            amount=round(primary_amount, 2),
            start_age=ss_auto.primary_start_age,
            taxable_pct=SS_TAXABLE_PCT,
            owner=Owner.PRIMARY,
        )
    )

    if ss_auto.spouse_fra_amount is not None and ss_auto.spouse_start_age is not None:
        spouse_amount = compute_ss_benefit(
            ss_auto.spouse_fra_amount, ss_auto.spouse_start_age, ss_auto.fra_age
        )
        streams.append(
            IncomeStream(
                name="Social Security (spouse)",
                amount=round(spouse_amount, 2),
                start_age=ss_auto.spouse_start_age,
                taxable_pct=SS_TAXABLE_PCT,
                owner=Owner.SPOUSE,
            )
        )

    return streams
