"""Tests for historical tax regime data and sampling."""

import math

from retirement_model.historical_tax_regimes import (
    HISTORICAL_TAX_REGIMES,
    get_historical_regimes,
    sample_regime_sequence,
)


class TestHistoricalRegimeData:
    def test_regime_count(self):
        regimes = get_historical_regimes()
        assert len(regimes) >= 7

    def test_last_federal_bracket_is_inf(self):
        for regime in HISTORICAL_TAX_REGIMES:
            last = regime["federal_brackets"][-1]
            assert math.isinf(last["limit"]), f"{regime['name']} last bracket not inf"

    def test_last_cg_bracket_is_inf(self):
        for regime in HISTORICAL_TAX_REGIMES:
            last = regime["capital_gains_brackets"][-1]
            assert math.isinf(last["limit"]), f"{regime['name']} last CG bracket not inf"

    def test_last_irmaa_tier_is_inf(self):
        for regime in HISTORICAL_TAX_REGIMES:
            last = regime["irmaa_tiers"][-1]
            assert math.isinf(last["limit"]), f"{regime['name']} last IRMAA tier not inf"

    def test_federal_brackets_ascending_limits(self):
        for regime in HISTORICAL_TAX_REGIMES:
            limits = [b["limit"] for b in regime["federal_brackets"]]
            for i in range(len(limits) - 1):
                assert limits[i] < limits[i + 1], f"{regime['name']} federal brackets not ascending"

    def test_get_historical_regimes_returns_copy(self):
        regimes1 = get_historical_regimes()
        regimes2 = get_historical_regimes()
        regimes1[0]["name"] = "MUTATED"
        assert regimes2[0]["name"] != "MUTATED"
        assert HISTORICAL_TAX_REGIMES[0]["name"] != "MUTATED"

    def test_tcja_regime_present(self):
        names = [r["name"] for r in HISTORICAL_TAX_REGIMES]
        assert any("TCJA" in n for n in names)


class TestSampleRegimeSequence:
    def test_correct_length(self):
        seq = sample_regime_sequence(30, seed=42)
        assert len(seq) == 30

    def test_correct_length_short(self):
        seq = sample_regime_sequence(3, seed=42)
        assert len(seq) == 3

    def test_reproducible_with_seed(self):
        seq1 = sample_regime_sequence(20, seed=123)
        seq2 = sample_regime_sequence(20, seed=123)
        assert [r["name"] for r in seq1] == [r["name"] for r in seq2]

    def test_different_seeds_differ(self):
        seq1 = sample_regime_sequence(20, seed=1)
        seq2 = sample_regime_sequence(20, seed=999)
        names1 = [r["name"] for r in seq1]
        names2 = [r["name"] for r in seq2]
        assert names1 != names2

    def test_block_boundaries_respected(self):
        """Consecutive years within a block use the same regime."""
        # Use many unique regimes to avoid accidental same-regime collisions
        unique_regimes = [{"name": f"R{i}"} for i in range(50)]
        seq = sample_regime_sequence(30, regimes=unique_regimes, seed=42)

        block_lengths = []
        current_name = seq[0]["name"]
        current_len = 1
        for i in range(1, len(seq)):
            if seq[i]["name"] == current_name:
                current_len += 1
            else:
                block_lengths.append(current_len)
                current_name = seq[i]["name"]
                current_len = 1
        block_lengths.append(current_len)

        # All blocks should be 2-4 years (last block may be shorter due to truncation)
        for length in block_lengths[:-1]:
            assert 2 <= length <= 4, f"Block length {length} outside 2-4 range"
        # Last block can be 1-4 (truncated)
        assert 1 <= block_lengths[-1] <= 4

    def test_custom_regime_list(self):
        custom = [{"name": "TestA"}, {"name": "TestB"}]
        seq = sample_regime_sequence(10, regimes=custom, seed=42)
        assert all(r["name"] in ("TestA", "TestB") for r in seq)

    def test_single_year(self):
        seq = sample_regime_sequence(1, seed=42)
        assert len(seq) == 1
        assert seq[0]["name"] in [r["name"] for r in HISTORICAL_TAX_REGIMES]
