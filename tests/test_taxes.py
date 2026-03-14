"""Tests for tax calculation functions."""

import pytest

from retirement_model.taxes import (
    calculate_capital_gains_tax,
    calculate_income_tax,
    calculate_irmaa_cost,
    calculate_rmd_amount,
    calculate_ss_taxable_portion,
    estimate_effective_tax_rate,
    get_bracket_label,
    get_marginal_tax_rate,
    inflate_brackets,
)


class TestGetMarginalTaxRate:
    def test_lowest_bracket(self):
        assert get_marginal_tax_rate(10000) == 0.10

    def test_12_percent_bracket(self):
        assert get_marginal_tax_rate(50000) == 0.12

    def test_22_percent_bracket(self):
        assert get_marginal_tax_rate(150000) == 0.22

    def test_24_percent_bracket(self):
        assert get_marginal_tax_rate(300000) == 0.24

    def test_32_percent_bracket(self):
        assert get_marginal_tax_rate(450000) == 0.32

    def test_highest_bracket(self):
        assert get_marginal_tax_rate(1000000) == 0.37

    def test_custom_brackets(self):
        custom = [{"limit": 50000, "rate": 0.15}, {"limit": 100000, "rate": 0.25}]
        assert get_marginal_tax_rate(30000, custom) == 0.15
        assert get_marginal_tax_rate(75000, custom) == 0.25

    def test_dict_brackets(self):
        custom = [{"limit": 50000, "rate": 0.15}, {"limit": 100000, "rate": 0.25}]
        assert get_marginal_tax_rate(30000, custom) == 0.15
        assert get_marginal_tax_rate(75000, custom) == 0.25


class TestGetBracketLabel:
    def test_low_income(self):
        assert get_bracket_label(50000) == "12%"

    def test_22_percent_label(self):
        assert get_bracket_label(150000) == "22%"

    def test_24_percent_label(self):
        assert get_bracket_label(250000) == "24%"

    def test_32_percent_label(self):
        assert get_bracket_label(400000) == "32%"

    def test_high_income_label(self):
        assert get_bracket_label(500000) == "35%+"

    def test_inflation_adjusted_label(self):
        # $250k is "24%" at factor=1.0 (above 201050, below 383900)
        # At factor=2.0 thresholds double: 250k > 94300*2=188600 → "22%"
        assert get_bracket_label(250000, inflation_factor=1.0) == "24%"
        assert get_bracket_label(250000, inflation_factor=2.0) == "22%"


class TestCalculateIrmaaCost:
    def test_below_threshold(self):
        assert calculate_irmaa_cost(150000) == 0

    def test_tier_1(self):
        assert calculate_irmaa_cost(206000) == 0

    def test_tier_2(self):
        assert calculate_irmaa_cost(230000) == 1600

    def test_tier_3(self):
        assert calculate_irmaa_cost(300000) == 4000

    def test_tier_4(self):
        assert calculate_irmaa_cost(350000) == 6400

    def test_tier_5(self):
        assert calculate_irmaa_cost(400000) == 8800

    def test_highest_tier(self):
        assert calculate_irmaa_cost(800000) == 11200

    def test_custom_tiers(self):
        custom = [{"limit": 100000, "cost": 0}, {"limit": 200000, "cost": 500}]
        assert calculate_irmaa_cost(50000, custom) == 0
        assert calculate_irmaa_cost(150000, custom) == 500


class TestCalculateCapitalGainsTax:
    def test_zero_gains(self):
        assert calculate_capital_gains_tax(0, 100000) == 0

    def test_negative_gains(self):
        assert calculate_capital_gains_tax(-5000, 100000) == 0

    def test_gains_fully_in_zero_bracket(self):
        # Ordinary income $50k, gains $10k → stacks to $60k, all under $89,250 → 0%
        assert calculate_capital_gains_tax(10000, 50000) == 0

    def test_gains_fully_in_15_bracket(self):
        # Ordinary income $200k, gains $10k → all gains above $89,250 → 15%
        assert calculate_capital_gains_tax(10000, 200000) == 1500

    def test_gains_fully_in_20_bracket(self):
        # Ordinary income $600k, gains $10k → all above $553,850 → 20%
        assert calculate_capital_gains_tax(10000, 600000) == 2000

    def test_gains_span_zero_to_15_bracket(self):
        # Ordinary income $80k, gains $20k → first $9,250 at 0%, remaining $10,750 at 15%
        tax = calculate_capital_gains_tax(20000, 80000)
        expected = 9250 * 0.0 + 10750 * 0.15
        assert tax == pytest.approx(expected, rel=0.01)

    def test_gains_span_15_to_20_bracket(self):
        # Ordinary income $540k, gains $30k → first $13,850 at 15%, remaining $16,150 at 20%
        tax = calculate_capital_gains_tax(30000, 540000)
        expected = 13850 * 0.15 + 16150 * 0.20
        assert tax == pytest.approx(expected, rel=0.01)

    def test_custom_brackets(self):
        brackets = [{"limit": 100000, "rate": 0.0}, {"limit": float("inf"), "rate": 0.20}]
        assert calculate_capital_gains_tax(10000, 50000, brackets) == 0
        # Ordinary $50k + gains $60k → first $50k at 0%, last $10k at 20%
        assert calculate_capital_gains_tax(60000, 50000, brackets) == pytest.approx(10000 * 0.20)


class TestCalculateRmdAmount:
    def test_before_rmd_age(self):
        assert calculate_rmd_amount(70, 500000) == 0

    def test_at_rmd_start(self):
        rmd = calculate_rmd_amount(73, 500000)
        assert rmd == pytest.approx(500000 / 26.5, rel=0.01)

    def test_at_age_80(self):
        rmd = calculate_rmd_amount(80, 500000)
        assert rmd == pytest.approx(500000 / 20.2, rel=0.01)

    def test_zero_balance(self):
        assert calculate_rmd_amount(75, 0) == 0

    def test_very_old(self):
        rmd = calculate_rmd_amount(100, 100000)
        assert rmd == pytest.approx(100000 / 6.4, rel=0.01)

    def test_custom_start_age(self):
        assert calculate_rmd_amount(72, 500000, rmd_start_age=72) > 0
        assert calculate_rmd_amount(71, 500000, rmd_start_age=72) == 0


class TestCalculateIncomeTax:
    def test_zero_income(self):
        assert calculate_income_tax(0) == 0

    def test_negative_income(self):
        assert calculate_income_tax(-10000) == 0

    def test_progressive_brackets(self):
        # First $23,200 at 10%
        tax_low = calculate_income_tax(23200)
        assert tax_low == pytest.approx(2320, rel=0.01)

        # $50,000: $23,200 at 10% + $26,800 at 12%
        tax_mid = calculate_income_tax(50000)
        expected = 23200 * 0.10 + 26800 * 0.12
        assert tax_mid == pytest.approx(expected, rel=0.01)

    def test_with_state_tax(self):
        tax = calculate_income_tax(50000, state_rate=0.05)
        # Federal + 5% state
        federal = 23200 * 0.10 + 26800 * 0.12
        assert tax == pytest.approx(federal + 50000 * 0.05, rel=0.01)

    def test_dict_brackets(self):
        brackets = [{"limit": 50000, "rate": 0.10}, {"limit": float("inf"), "rate": 0.20}]
        tax = calculate_income_tax(80000, brackets)
        expected = 50000 * 0.10 + 30000 * 0.20
        assert tax == pytest.approx(expected, rel=0.01)


class TestCalculateSsTaxablePortion:
    def test_low_combined_income(self):
        # Below $32,000 combined - 0% taxable
        assert calculate_ss_taxable_portion(20000, 10000) == 0

    def test_mid_combined_income(self):
        # $32,000-$44,000 - up to 50% taxable
        taxable = calculate_ss_taxable_portion(30000, 30000)
        assert 0 < taxable <= 30000 * 0.5

    def test_high_combined_income(self):
        # Above $44,000 - up to 85% taxable
        taxable = calculate_ss_taxable_portion(50000, 100000)
        assert taxable == pytest.approx(50000 * 0.85, rel=0.01)

    def test_unsupported_filing_status(self):
        with pytest.raises(NotImplementedError):
            calculate_ss_taxable_portion(30000, 30000, filing_status="single")


class TestInflateBrackets:
    def test_scales_limits(self):
        brackets = [{"limit": 100000, "rate": 0.10}, {"limit": 200000, "rate": 0.20}]
        result = inflate_brackets(brackets, 1.5)
        assert result[0]["limit"] == 150000
        assert result[1]["limit"] == 300000

    def test_preserves_rates(self):
        brackets = [{"limit": 100000, "rate": 0.10}]
        result = inflate_brackets(brackets, 2.0)
        assert result[0]["rate"] == 0.10

    def test_preserves_cost_fields(self):
        tiers = [{"limit": 206000, "cost": 0}, {"limit": 258000, "cost": 1600}]
        result = inflate_brackets(tiers, 1.3)
        assert result[0]["cost"] == 0
        assert result[1]["cost"] == 1600

    def test_inf_limit_unchanged(self):
        brackets = [{"limit": 100000, "rate": 0.10}, {"limit": float("inf"), "rate": 0.37}]
        result = inflate_brackets(brackets, 2.0)
        assert result[0]["limit"] == 200000
        assert result[1]["limit"] == float("inf")

    def test_factor_one_no_change(self):
        brackets = [{"limit": 23200, "rate": 0.10}, {"limit": 94300, "rate": 0.12}]
        result = inflate_brackets(brackets, 1.0)
        assert result[0]["limit"] == 23200
        assert result[1]["limit"] == 94300

    def test_does_not_mutate_original(self):
        brackets = [{"limit": 100000, "rate": 0.10}]
        inflate_brackets(brackets, 2.0)
        assert brackets[0]["limit"] == 100000


class TestEstimateEffectiveTaxRate:
    def test_below_deduction(self):
        # If AGI is below standard deduction, effective rate is 0
        rate = estimate_effective_tax_rate(20000)
        assert rate == 0

    def test_with_taxable_income(self):
        # AGI of $100,000 minus ~$29,200 deduction = ~$70,800 taxable
        rate = estimate_effective_tax_rate(100000)
        assert 0 < rate < 0.20

    def test_with_state_rate(self):
        rate_no_state = estimate_effective_tax_rate(100000, state_rate=0)
        rate_with_state = estimate_effective_tax_rate(100000, state_rate=0.05)
        assert rate_with_state > rate_no_state
