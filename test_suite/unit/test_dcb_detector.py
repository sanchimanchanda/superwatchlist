"""
Unit Tests: Dead Cat Bounce Detector, Bull-Trap Detector, RSI-14, and Sector Divergence.
Run with: python -m pytest test_suite/unit/test_dcb_detector.py -v
"""

import sys
import os
import pytest

# Add backend/analytics to path so we can import directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend/analytics"))

from anomaly_engine import AnomalyEngine
from google_ingest import compute_rsi14, compute_ema20


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_quote(symbol="TEST", ltp=100.0, change_pct=0.0, volume=1_000_000,
               sector="Technology", is_uc=False, is_lc=False, rsi14=50.0,
               w52_high=120.0, w52_low=80.0, prev_close=100.0):
    """Build a minimal quote dict for testing."""
    return {
        "symbol": symbol,
        "ltp": ltp,
        "changePct": change_pct,
        "volume": volume,
        "week52High": w52_high,
        "week52Low": w52_low,
        "vwap": ltp * 0.998,
        "isUpperCircuit": is_uc,
        "isLowerCircuit": is_lc,
        "rsi14": rsi14,
        "rsiState": "OVERBOUGHT" if rsi14 >= 70 else ("OVERSOLD" if rsi14 <= 30 else "NEUTRAL"),
        "sector": sector,
        "prevClose": prev_close,
    }


# ── RSI-14 Tests ──────────────────────────────────────────────────────────────

class TestRSI14:
    def test_insufficient_data_returns_neutral(self):
        """Fewer than 15 data points → RSI=50, NEUTRAL."""
        prices = [100.0] * 10
        rsi, state = compute_rsi14(prices)
        assert rsi == 50.0
        assert state == "NEUTRAL"

    def test_all_gains_returns_100(self):
        """All gains → RSI approaches 100."""
        prices = [float(i) for i in range(1, 20)]  # strictly increasing
        rsi, state = compute_rsi14(prices)
        assert rsi == 100.0
        assert state == "OVERBOUGHT"

    def test_all_losses_returns_0(self):
        """All losses → RSI approaches 0."""
        prices = [float(20 - i) for i in range(20)]  # strictly decreasing
        rsi, state = compute_rsi14(prices)
        assert rsi == 0.0
        assert state == "OVERSOLD"

    def test_overbought_threshold(self):
        """RSI >= 70 → OVERBOUGHT."""
        # Construct a strongly bullish series
        prices = [100.0 + i * 2.5 for i in range(20)]
        rsi, state = compute_rsi14(prices)
        assert rsi >= 70.0
        assert state == "OVERBOUGHT"

    def test_oversold_threshold(self):
        """RSI <= 30 → OVERSOLD."""
        prices = [200.0 - i * 5 for i in range(20)]
        rsi, state = compute_rsi14(prices)
        assert rsi <= 30.0
        assert state == "OVERSOLD"

    def test_neutral_range(self):
        """Mixed prices → NEUTRAL (30 < RSI < 70)."""
        import random
        random.seed(42)
        prices = [100.0 + random.uniform(-1, 1) for _ in range(20)]
        rsi, state = compute_rsi14(prices)
        assert 30.0 < rsi < 70.0
        assert state == "NEUTRAL"

    def test_rsi_bounded_0_to_100(self):
        """RSI must always be in [0, 100]."""
        for seed in range(10):
            import random
            random.seed(seed)
            prices = [100.0 + random.uniform(-10, 10) for _ in range(20)]
            rsi, _ = compute_rsi14(prices)
            assert 0.0 <= rsi <= 100.0, f"RSI out of bounds: {rsi}"


# ── 20-EMA Tests ──────────────────────────────────────────────────────────────

class TestEMA20:
    def test_flat_series_ema_equals_price(self):
        """All prices the same → EMA equals that price."""
        prices = [150.0] * 20
        ema, state = compute_ema20(prices, 150.0)
        assert abs(ema - 150.0) < 0.01
        assert state == "ABOVE_EMA"  # ltp == ema counts as above

    def test_above_ema_state(self):
        """LTP above EMA → ABOVE_EMA."""
        prices = [100.0] * 20
        ema, state = compute_ema20(prices, 110.0)
        assert state == "ABOVE_EMA"

    def test_below_ema_state(self):
        """LTP below EMA → BELOW_EMA."""
        prices = [100.0] * 20
        ema, state = compute_ema20(prices, 90.0)
        assert state == "BELOW_EMA"

    def test_fewer_than_20_falls_back_to_sma(self):
        """Fewer than 20 prices → falls back to SMA."""
        prices = [100.0, 110.0, 120.0]
        ema, state = compute_ema20(prices, 115.0)
        expected_sma = sum(prices) / len(prices)
        assert abs(ema - expected_sma) < 0.01

    def test_rising_series_ema_lags(self):
        """On a rising series, EMA lags behind price (LTP > EMA → ABOVE_EMA)."""
        prices = [float(i) for i in range(1, 25)]
        ltp = 30.0  # higher than any price in series
        _, state = compute_ema20(prices, ltp)
        assert state == "ABOVE_EMA"


# ── Dead Cat Bounce Tests ─────────────────────────────────────────────────────

class TestDeadCatBounce:
    def _make_engine_with_drop(self, symbol, start_price=100.0, drop_pct=6.0):
        """Returns an engine that has already recorded a qualifying drop."""
        engine = AnomalyEngine()
        # Simulate intraday high
        engine._update_dcb_trackers(symbol, start_price)
        # Simulate the drop
        drop_price = start_price * (1 - drop_pct / 100)
        engine._update_dcb_trackers(symbol, drop_price)
        return engine, drop_price

    def test_dcb_fires_on_bounce_weak_volume(self):
        """Drop ≥5% from high + bounce ≥2% from low + RVOL < 1.2 → DCB fires."""
        engine, drop_price = self._make_engine_with_drop("ABC")
        bounce_price = drop_price * 1.03  # +3% bounce — qualifies
        assert engine._is_dead_cat_bounce("ABC", bounce_price, rvol=0.9)

    def test_dcb_does_not_fire_on_high_rvol(self):
        """Same price action but strong RVOL → DCB should NOT fire."""
        engine, drop_price = self._make_engine_with_drop("ABC")
        bounce_price = drop_price * 1.03
        assert not engine._is_dead_cat_bounce("ABC", bounce_price, rvol=2.5)

    def test_dcb_does_not_fire_without_prior_drop(self):
        """No prior drop recorded → DCB should NOT fire."""
        engine = AnomalyEngine()
        engine._update_dcb_trackers("XYZ", 100.0)  # just set initial high
        # Price goes up, never dropped
        assert not engine._is_dead_cat_bounce("XYZ", 103.0, rvol=0.8)

    def test_dcb_does_not_fire_on_small_bounce(self):
        """Drop ≥5% but bounce < 2% from low → DCB should NOT fire."""
        engine, drop_price = self._make_engine_with_drop("AABB")
        tiny_bounce = drop_price * 1.01  # only 1% bounce
        assert not engine._is_dead_cat_bounce("AABB", tiny_bounce, rvol=0.9)

    def test_dcb_appears_in_anomaly_batch(self):
        """End-to-end: DCB anomaly appears in analyze_batch output."""
        engine = AnomalyEngine()
        symbol = "DCBTEST"

        # First call: establish high + big volume (builds baseline)
        q1 = make_quote(symbol, ltp=100.0, volume=5_000_000)
        engine.rolling_baseline_vol[symbol] = 5_000_000.0
        engine._update_dcb_trackers(symbol, 100.0)

        # Simulate drop
        engine._update_dcb_trackers(symbol, 92.0)  # -8% drop
        engine.post_drop_low[symbol] = 92.0

        # Now run batch at bounce point with weak RVOL
        bounce_vol = int(5_000_000 * 0.9)  # RVOL ~ 0.9x
        q_bounce = make_quote(symbol, ltp=94.5, change_pct=2.5, volume=bounce_vol)
        engine.rolling_baseline_vol[symbol] = 5_000_000.0  # keep baseline

        anomalies = engine.analyze_batch([q_bounce])
        dcb_anomalies = [a for a in anomalies if a["type"] == "DEAD_CAT_BOUNCE"]
        assert len(dcb_anomalies) == 1
        assert dcb_anomalies[0]["symbol"] == symbol


# ── Bull-Trap Tests ───────────────────────────────────────────────────────────

class TestBullTrap:
    def _make_engine_with_recovery(self, symbol, high=100.0, drop_pct=6.0):
        """Returns an engine with a drop and near-recovery."""
        engine = AnomalyEngine()
        engine._update_dcb_trackers(symbol, high)
        drop_price = high * (1 - drop_pct / 100)
        engine._update_dcb_trackers(symbol, drop_price)
        return engine

    def test_bull_trap_fires_near_high_weak_rvol_low_rsi(self):
        """Price near prior high + RVOL < 1.5 + RSI < 55 → Bull-Trap fires."""
        engine = self._make_engine_with_recovery("BT1")
        # ltp at 99.5% of the intraday high (100.0)
        assert engine._is_bull_trap("BT1", ltp=99.6, rvol=1.2, rsi14=48.0)

    def test_bull_trap_does_not_fire_strong_rvol(self):
        """Same price, but RVOL >= 1.5 → NOT a trap (genuine breakout)."""
        engine = self._make_engine_with_recovery("BT2")
        assert not engine._is_bull_trap("BT2", ltp=99.6, rvol=2.0, rsi14=48.0)

    def test_bull_trap_does_not_fire_high_rsi(self):
        """Same price + RSI >= 55 → NOT a trap (momentum is real)."""
        engine = self._make_engine_with_recovery("BT3")
        assert not engine._is_bull_trap("BT3", ltp=99.6, rvol=1.2, rsi14=62.0)

    def test_bull_trap_does_not_fire_far_from_high(self):
        """Price < 99.5% of high → NOT near enough to trigger trap."""
        engine = self._make_engine_with_recovery("BT4")
        assert not engine._is_bull_trap("BT4", ltp=95.0, rvol=1.0, rsi14=40.0)

    def test_bull_trap_does_not_fire_without_prior_drop(self):
        """No prior drop → NOT a trap (no context)."""
        engine = AnomalyEngine()
        engine._update_dcb_trackers("BT5", 100.0)
        assert not engine._is_bull_trap("BT5", ltp=100.0, rvol=1.0, rsi14=40.0)


# ── Sector Divergence Tests ───────────────────────────────────────────────────

class TestSectorDivergence:
    def test_sector_delta_computed_correctly(self):
        """Sector delta = stock changePct - sector median changePct."""
        engine = AnomalyEngine()
        quotes = [
            make_quote("TECH1", change_pct=5.0, sector="Technology"),
            make_quote("TECH2", change_pct=1.0, sector="Technology"),
            make_quote("TECH3", change_pct=0.5, sector="Technology"),
        ]
        # Median of [5.0, 1.0, 0.5] = 1.0
        deltas = engine._compute_sector_deltas(quotes)
        assert abs(deltas["TECH1"] - 4.0) < 0.01   # 5.0 - 1.0
        assert abs(deltas["TECH2"] - 0.0) < 0.01   # 1.0 - 1.0
        assert abs(deltas["TECH3"] - (-0.5)) < 0.01 # 0.5 - 1.0

    def test_sector_divergence_anomaly_emitted_above_threshold(self):
        """Stocks with |delta| >= 3% get a SECTOR_DIVERGENCE anomaly."""
        engine = AnomalyEngine()
        quotes = [
            make_quote("RISER", change_pct=6.0, sector="Banking"),
            make_quote("FLAT1", change_pct=0.5, sector="Banking"),
            make_quote("FLAT2", change_pct=0.3, sector="Banking"),
        ]
        # Median ~ 0.5; RISER delta ~ 5.5 → should fire
        deltas = engine._compute_sector_deltas(quotes)
        anomalies = engine._emit_sector_divergence_anomalies(quotes, deltas, now=1000000)
        divergence_syms = [a["symbol"] for a in anomalies if a["type"] == "SECTOR_DIVERGENCE"]
        assert "RISER" in divergence_syms

    def test_sector_divergence_not_emitted_below_threshold(self):
        """Stocks with |delta| < 3% should NOT get a SECTOR_DIVERGENCE anomaly."""
        engine = AnomalyEngine()
        quotes = [
            make_quote("SYM1", change_pct=1.0, sector="FMCG"),
            make_quote("SYM2", change_pct=0.8, sector="FMCG"),
        ]
        # delta ~ 0.1 → below threshold
        deltas = engine._compute_sector_deltas(quotes)
        anomalies = engine._emit_sector_divergence_anomalies(quotes, deltas, now=1000000)
        assert len(anomalies) == 0

    def test_cross_sector_isolation(self):
        """Sectors are computed independently — no bleed between sectors."""
        engine = AnomalyEngine()
        quotes = [
            make_quote("IT1", change_pct=5.0, sector="IT"),
            make_quote("IT2", change_pct=4.0, sector="IT"),
            make_quote("BNK1", change_pct=0.0, sector="Banking"),
            make_quote("BNK2", change_pct=0.0, sector="Banking"),
        ]
        deltas = engine._compute_sector_deltas(quotes)
        # IT sector: median=4.5; IT1 delta=+0.5, IT2 delta=-0.5
        assert abs(deltas["IT1"] - 0.5) < 0.01
        assert abs(deltas["IT2"] - (-0.5)) < 0.01
        # Banking sector: median=0.0; both delta=0.0
        assert abs(deltas["BNK1"]) < 0.01
        assert abs(deltas["BNK2"]) < 0.01

    def test_severity_high_for_large_divergence(self):
        """Divergence >= 5% → severity HIGH."""
        engine = AnomalyEngine()
        quotes = [
            make_quote("BIGMOVER", change_pct=8.0, sector="Energy"),
            make_quote("FLAT1", change_pct=0.5, sector="Energy"),
            make_quote("FLAT2", change_pct=0.3, sector="Energy"),
        ]
        deltas = engine._compute_sector_deltas(quotes)
        anomalies = engine._emit_sector_divergence_anomalies(quotes, deltas, now=1000000)
        for a in anomalies:
            if a["symbol"] == "BIGMOVER":
                assert a["severity"] == "HIGH"
                break

    def test_attention_score_scales_with_divergence(self):
        """Larger divergence → higher attention score."""
        engine = AnomalyEngine()
        quotes_small = [
            make_quote("S1", change_pct=3.5, sector="Auto"),
            make_quote("S2", change_pct=0.0, sector="Auto"),
        ]
        quotes_large = [
            make_quote("L1", change_pct=9.0, sector="Auto"),
            make_quote("L2", change_pct=0.0, sector="Auto"),
        ]
        d_small = engine._compute_sector_deltas(quotes_small)
        d_large = engine._compute_sector_deltas(quotes_large)
        ano_small = engine._emit_sector_divergence_anomalies(quotes_small, d_small, now=1)
        ano_large = engine._emit_sector_divergence_anomalies(quotes_large, d_large, now=1)

        score_small = next((a["attentionScore"] for a in ano_small if a["symbol"] == "S1"), 0)
        score_large = next((a["attentionScore"] for a in ano_large if a["symbol"] == "L1"), 0)
        assert score_large > score_small


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
