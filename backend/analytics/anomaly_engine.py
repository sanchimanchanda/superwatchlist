"""
Quant Anomaly & Attention Score Engine
Computes:
  - 1-minute RVOL surges
  - 52W high/low breaches
  - VWAP divergence
  - Dead Cat Bounce (DCB) detection
  - Bull-Trap detection
  - Sector Divergence signals
  - Attention Score (0-100)
"""

import time
import uuid
from typing import Dict, List, Optional, Tuple
import numpy as np


class AnomalyEngine:
    def __init__(self):
        # Rolling baseline volumes per symbol
        self.rolling_baseline_vol: Dict[str, float] = {}

        # ── DCB / Bull-Trap trackers ──────────────────────────────────────────
        # intraday_high tracks the highest LTP seen for the current session
        self.intraday_high: Dict[str, float] = {}
        # post_drop_low tracks the lowest LTP seen after a significant drop from intraday_high
        self.post_drop_low: Dict[str, float] = {}
        # Tracks whether a drop ≥5% from intraday_high has been observed
        self.drop_detected: Dict[str, bool] = {}

    # ── Primary batch analysis ────────────────────────────────────────────────

    def analyze_batch(self, quotes: List[dict]) -> List[dict]:
        """
        Analyzes a 1-minute batch of quotes and generates meaningful anomaly alerts.
        Runs all detectors and merges results (deduped by symbol priority).
        """
        anomalies = []
        now = int(time.time() * 1000)

        # Step 1: compute sector divergence map for all quotes
        sector_deltas = self._compute_sector_deltas(quotes)

        for q in quotes:
            symbol = q["symbol"]
            ltp = q["ltp"]
            change_pct = q["changePct"]
            volume = q["volume"]
            w52_high = q["week52High"]
            w52_low = q["week52Low"]
            vwap = q["vwap"]
            is_uc = q["isUpperCircuit"]
            is_lc = q["isLowerCircuit"]
            rsi14 = q.get("rsi14", 50.0)

            # Initialize baseline volume
            if symbol not in self.rolling_baseline_vol:
                self.rolling_baseline_vol[symbol] = volume * 0.95

            # Compute RVOL (Relative Volume)
            expected_vol = self.rolling_baseline_vol[symbol]
            rvol = round(volume / max(expected_vol, 1.0), 2)

            # Update DCB trackers
            self._update_dcb_trackers(symbol, ltp)

            # ── Signal Priority (highest wins per symbol per batch) ────────────
            anomaly = None

            # 1. Circuit Lock (CRITICAL — always fires)
            if is_uc or is_lc:
                circuit_type = "CIRCUIT_LOCK_UC" if is_uc else "CIRCUIT_LOCK_LC"
                name_circuit = "Upper Circuit (UC)" if is_uc else "Lower Circuit (LC)"
                anomaly = {
                    "id": f"ano_{uuid.uuid4().hex[:8]}",
                    "symbol": symbol,
                    "type": circuit_type,
                    "severity": "CRITICAL",
                    "headline": f"{symbol} Locked in {name_circuit}",
                    "description": f"Stock frozen at {name_circuit} limit ₹{ltp:,.2f} with 0 opposite liquidity.",
                    "attentionScore": 98.0,
                    "deltaPct": change_pct,
                    "rvol": rvol,
                    "timestamp": now
                }

            # 2. Bull-Trap (CRITICAL — high-risk pattern)
            elif self._is_bull_trap(symbol, ltp, rvol, rsi14):
                score = self.calculate_attention_score(abs(change_pct), rvol, is_breakout=False, is_circuit=False)
                score = max(score, 82.0)
                anomaly = {
                    "id": f"ano_{uuid.uuid4().hex[:8]}",
                    "symbol": symbol,
                    "type": "BULL_TRAP",
                    "severity": "CRITICAL",
                    "headline": f"{symbol} Bull-Trap Warning — Reclaiming High on Weak Volume",
                    "description": (
                        f"Price ₹{ltp:,.2f} reclaiming prior intraday high on low RVOL ({rvol}x) "
                        f"with RSI-14 at {rsi14:.1f}. Institutional sellers likely absorbing retail buying."
                    ),
                    "attentionScore": score,
                    "deltaPct": change_pct,
                    "rvol": rvol,
                    "rsi14": rsi14,
                    "timestamp": now
                }

            # 3. Dead Cat Bounce
            elif self._is_dead_cat_bounce(symbol, ltp, rvol):
                score = self.calculate_attention_score(abs(change_pct), rvol, is_breakout=False, is_circuit=False)
                score = max(score, 72.0)
                anomaly = {
                    "id": f"ano_{uuid.uuid4().hex[:8]}",
                    "symbol": symbol,
                    "type": "DEAD_CAT_BOUNCE",
                    "severity": "HIGH",
                    "headline": f"{symbol} Dead Cat Bounce — {change_pct:+.2f}% Recovery on Thin Volume",
                    "description": (
                        f"Post-drop bounce of {change_pct:+.2f}% from session low detected on weak RVOL ({rvol}x). "
                        f"High probability of continuation downside. Risk: {round(100 - rvol * 40, 1)}%."
                    ),
                    "attentionScore": score,
                    "deltaPct": change_pct,
                    "rvol": rvol,
                    "rsi14": rsi14,
                    "timestamp": now
                }

            # 4. 52W High Breakout
            elif ltp >= w52_high * 0.995:
                score = self.calculate_attention_score(abs(change_pct), rvol, is_breakout=True, is_circuit=is_uc)
                anomaly = {
                    "id": f"ano_{uuid.uuid4().hex[:8]}",
                    "symbol": symbol,
                    "type": "52W_HIGH_BREAKOUT",
                    "severity": "HIGH",
                    "headline": f"{symbol} testing 52-Week High at ₹{ltp:,.2f}",
                    "description": f"Price is within 0.5% of 52W High (₹{w52_high:,.2f}) with RVOL {rvol}x",
                    "attentionScore": score,
                    "deltaPct": change_pct,
                    "rvol": rvol,
                    "timestamp": now
                }

            # 5. Volume Surge
            elif rvol >= 2.2:
                score = self.calculate_attention_score(abs(change_pct), rvol, is_breakout=False, is_circuit=False)
                anomaly = {
                    "id": f"ano_{uuid.uuid4().hex[:8]}",
                    "symbol": symbol,
                    "type": "VOLUME_SURGE",
                    "severity": "HIGH" if rvol >= 3.0 else "MEDIUM",
                    "headline": f"{symbol} Unusual Volume Surge ({rvol}x RVOL)",
                    "description": f"Heavy trading volume detected ({volume:,} shares) moving {change_pct:+.2f}%",
                    "attentionScore": score,
                    "deltaPct": change_pct,
                    "rvol": rvol,
                    "timestamp": now
                }

            # 6. Significant Momentum (> 2.0% change)
            elif abs(change_pct) >= 2.0:
                score = self.calculate_attention_score(abs(change_pct), rvol, is_breakout=False, is_circuit=False)
                anomaly = {
                    "id": f"ano_{uuid.uuid4().hex[:8]}",
                    "symbol": symbol,
                    "type": "SESSION_DELTA",
                    "severity": "MEDIUM",
                    "headline": f"{symbol} Sharp Momentum {change_pct:+.2f}%",
                    "description": f"Strong price velocity moving {change_pct:+.2f}% away from previous close.",
                    "attentionScore": score,
                    "deltaPct": change_pct,
                    "rvol": rvol,
                    "timestamp": now
                }

            if anomaly:
                anomalies.append(anomaly)

        # Step 2: emit sector divergence anomalies (separate pass, non-exclusive)
        sector_anomalies = self._emit_sector_divergence_anomalies(quotes, sector_deltas, now)
        anomalies.extend(sector_anomalies)

        # Step 3: update rolling baseline volumes
        for q in quotes:
            sym = q["symbol"]
            old = self.rolling_baseline_vol.get(sym, q["volume"])
            # Exponential weighted update: 80% old, 20% new
            self.rolling_baseline_vol[sym] = round(old * 0.8 + q["volume"] * 0.2, 0)

        return anomalies

    # ── DCB / Bull-Trap helpers ───────────────────────────────────────────────

    def _update_dcb_trackers(self, symbol: str, ltp: float):
        """Updates intraday_high and post_drop_low per symbol each tick."""
        # Track intraday high
        if symbol not in self.intraday_high:
            self.intraday_high[symbol] = ltp
            self.drop_detected[symbol] = False
            self.post_drop_low[symbol] = ltp
        else:
            current_high = self.intraday_high[symbol]
            if ltp > current_high:
                # New intraday high — reset drop tracker
                self.intraday_high[symbol] = ltp
                self.drop_detected[symbol] = False
                self.post_drop_low[symbol] = ltp
            else:
                # Check if we've seen a ≥5% drop from the intraday high
                drop_from_high = (current_high - ltp) / current_high * 100
                if drop_from_high >= 5.0:
                    self.drop_detected[symbol] = True

                # Track the lowest point after the drop
                if self.drop_detected[symbol] and ltp < self.post_drop_low.get(symbol, ltp):
                    self.post_drop_low[symbol] = ltp

    def _is_dead_cat_bounce(self, symbol: str, ltp: float, rvol: float) -> bool:
        """
        DCB condition: a drop ≥5% from intraday high was observed, price has
        bounced ≥2% from the post-drop low, and RVOL is weak (< 1.2x).
        """
        if not self.drop_detected.get(symbol, False):
            return False
        post_drop_low = self.post_drop_low.get(symbol, ltp)
        if post_drop_low <= 0:
            return False
        bounce_pct = (ltp - post_drop_low) / post_drop_low * 100
        return bounce_pct >= 2.0 and rvol < 1.2

    def _is_bull_trap(self, symbol: str, ltp: float, rvol: float, rsi14: float) -> bool:
        """
        Bull-Trap condition: price is reclaiming the intraday high (within 0.5%)
        after a prior drop ≥5%, on weak RVOL (< 1.5x) and RSI-14 < 55.
        Weak conviction buying into resistance = trap.
        """
        if not self.drop_detected.get(symbol, False):
            return False
        intraday_h = self.intraday_high.get(symbol, 0)
        if intraday_h <= 0:
            return False
        near_high = ltp >= intraday_h * 0.995
        return near_high and rvol < 1.5 and rsi14 < 55.0

    # ── Sector Divergence ─────────────────────────────────────────────────────

    def _compute_sector_deltas(self, quotes: List[dict]) -> Dict[str, float]:
        """
        Groups quotes by sector and computes each stock's changePct deviation
        from its sector median.
        Returns a dict: {symbol: delta_vs_sector_median}
        """
        # Group changePct values by sector
        sector_changes: Dict[str, List[Tuple[str, float]]] = {}
        for q in quotes:
            sector = q.get("sector", "Unknown")
            sym = q["symbol"]
            chg = q.get("changePct", 0.0)
            sector_changes.setdefault(sector, []).append((sym, chg))

        deltas: Dict[str, float] = {}
        for sector, items in sector_changes.items():
            if not items:
                continue
            median_chg = float(np.median([chg for _, chg in items]))
            for sym, chg in items:
                deltas[sym] = round(chg - median_chg, 3)

        return deltas

    def _emit_sector_divergence_anomalies(
        self,
        quotes: List[dict],
        sector_deltas: Dict[str, float],
        now: int
    ) -> List[dict]:
        """
        Emits SECTOR_DIVERGENCE anomalies for stocks that deviate ≥ ±3% from
        their sector median changePct. These run in addition to the primary
        price/volume signals (non-exclusive).
        """
        anomalies = []
        quote_map = {q["symbol"]: q for q in quotes}

        for symbol, delta in sector_deltas.items():
            if abs(delta) < 3.0:
                continue

            q = quote_map.get(symbol)
            if not q:
                continue

            direction = "outperforming" if delta > 0 else "underperforming"
            severity = "HIGH" if abs(delta) >= 5.0 else "MEDIUM"
            score = min(100.0, 50.0 + abs(delta) * 6.0)

            anomalies.append({
                "id": f"ano_{uuid.uuid4().hex[:8]}",
                "symbol": symbol,
                "type": "SECTOR_DIVERGENCE",
                "severity": severity,
                "headline": (
                    f"{symbol} {direction.title()} Sector by {delta:+.2f}% "
                    f"({q['sector']} median: {q['changePct'] - delta:+.2f}%)"
                ),
                "description": (
                    f"{symbol} is moving {delta:+.2f}% relative to its {q['sector']} sector peers. "
                    f"Stock: {q['changePct']:+.2f}% | Sector median: {q['changePct'] - delta:+.2f}%. "
                    f"Possible stock-specific catalyst or sector rotation signal."
                ),
                "attentionScore": round(score, 1),
                "deltaPct": q["changePct"],
                "sectorMedianPct": round(q["changePct"] - delta, 3),
                "timestamp": now
            })

        return anomalies

    def get_sector_deltas(self, quotes: List[dict]) -> Dict[str, float]:
        """Public accessor: returns sector delta map for the given quote batch."""
        return self._compute_sector_deltas(quotes)

    # ── Attention Score ───────────────────────────────────────────────────────

    @staticmethod
    def calculate_attention_score(abs_pct_change: float, rvol: float, is_breakout: bool, is_circuit: bool) -> float:
        """
        Calculates a composite Attention Score (0 to 100).
        Weights:
        - Absolute % change: 35%
        - Relative Volume (RVOL): 30%
        - 52W Breakout: 20%
        - Circuit Lock: 15%
        """
        if is_circuit:
            return 99.0

        w_change = min(100.0, abs_pct_change * 20.0) * 0.35
        w_rvol = min(100.0, rvol * 30.0) * 0.30
        w_breakout = (100.0 if is_breakout else 0.0) * 0.20
        w_base = 15.0 # Base floor

        total_score = round(min(100.0, max(0.0, w_change + w_rvol + w_breakout + w_base)), 1)
        return total_score
