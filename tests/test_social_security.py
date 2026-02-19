"""Tests for Social Security benefit formula and stream generation."""

import pytest

from retirement_model.models import IncomeStream, SSAutoConfig
from retirement_model.social_security import (
    SS_TAXABLE_PCT,
    compute_ss_benefit,
    generate_ss_streams,
)


class TestComputeSSBenefit:
    """Tests for actuarial reduction and delayed retirement credits."""

    def test_at_fra(self) -> None:
        assert compute_ss_benefit(36000, claiming_age=67, fra_age=67) == 36000

    def test_one_year_early(self) -> None:
        # 12 months early, all within first 36: 12 * 5/9 of 1% = 6.667% reduction
        result = compute_ss_benefit(36000, claiming_age=66, fra_age=67)
        expected = 36000 * (1 - 12 * 5 / 9 / 100)
        assert result == pytest.approx(expected)

    def test_three_years_early_exactly_36_months(self) -> None:
        # 36 months early: 36 * 5/9 of 1% = 20% reduction
        result = compute_ss_benefit(36000, claiming_age=64, fra_age=67)
        expected = 36000 * (1 - 36 * 5 / 9 / 100)
        assert result == pytest.approx(expected)

    def test_five_years_early_beyond_36_months(self) -> None:
        # 60 months early: first 36 at 5/9%, next 24 at 5/12%
        result = compute_ss_benefit(36000, claiming_age=62, fra_age=67)
        reduction = (36 * 5 / 9 / 100) + (24 * 5 / 12 / 100)
        expected = 36000 * (1 - reduction)
        assert result == pytest.approx(expected)

    def test_one_year_delayed(self) -> None:
        # 12 months delayed: 12 * 2/3 of 1% = 8% increase
        result = compute_ss_benefit(36000, claiming_age=68, fra_age=67)
        expected = 36000 * (1 + 12 * 2 / 3 / 100)
        assert result == pytest.approx(expected)

    def test_at_70(self) -> None:
        # 36 months delayed: 36 * 2/3 of 1% = 24% increase
        result = compute_ss_benefit(36000, claiming_age=70, fra_age=67)
        expected = 36000 * (1 + 36 * 2 / 3 / 100)
        assert result == pytest.approx(expected)

    def test_after_70_capped(self) -> None:
        # Claiming at 71 should give same as 70 (no additional credits)
        at_70 = compute_ss_benefit(36000, claiming_age=70, fra_age=67)
        at_71 = compute_ss_benefit(36000, claiming_age=71, fra_age=67)
        assert at_71 == at_70

    def test_custom_fra(self) -> None:
        # FRA at 66 instead of 67
        result = compute_ss_benefit(36000, claiming_age=66, fra_age=66)
        assert result == 36000  # at FRA, no adjustment

    def test_zero_benefit(self) -> None:
        assert compute_ss_benefit(0, claiming_age=62, fra_age=67) == 0


class TestGenerateSSStreams:
    """Tests for auto-generating SS income streams from profile config."""

    def test_primary_only(self) -> None:
        config = SSAutoConfig(
            primary_fra_amount=36000,
            primary_start_age=67,
        )
        streams = generate_ss_streams(config)
        assert len(streams) == 1
        assert streams[0].name == "Social Security (primary)"
        assert streams[0].amount == 36000  # at FRA, no adjustment
        assert streams[0].start_age == 67
        assert streams[0].end_age is None
        assert streams[0].taxable_pct == SS_TAXABLE_PCT

    def test_primary_and_spouse(self) -> None:
        config = SSAutoConfig(
            primary_fra_amount=36000,
            primary_start_age=67,
            spouse_fra_amount=18000,
            spouse_start_age=65,
        )
        streams = generate_ss_streams(config)
        assert len(streams) == 2
        assert streams[0].name == "Social Security (primary)"
        assert streams[1].name == "Social Security (spouse)"
        assert streams[1].taxable_pct == SS_TAXABLE_PCT

    def test_early_claiming_reduces_amount(self) -> None:
        config = SSAutoConfig(
            primary_fra_amount=36000,
            primary_start_age=62,
        )
        streams = generate_ss_streams(config)
        assert streams[0].amount < 36000

    def test_delayed_claiming_increases_amount(self) -> None:
        config = SSAutoConfig(
            primary_fra_amount=36000,
            primary_start_age=70,
        )
        streams = generate_ss_streams(config)
        assert streams[0].amount > 36000

    def test_spouse_not_generated_when_absent(self) -> None:
        config = SSAutoConfig(
            primary_fra_amount=36000,
            primary_start_age=67,
        )
        streams = generate_ss_streams(config)
        assert len(streams) == 1
        assert all("spouse" not in s.name.lower() for s in streams)

    def test_custom_fra_age(self) -> None:
        config = SSAutoConfig(
            primary_fra_amount=36000,
            primary_start_age=66,
            fra_age=66,
        )
        streams = generate_ss_streams(config)
        assert streams[0].amount == 36000  # at FRA, no adjustment
