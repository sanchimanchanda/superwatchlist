"""
Session Catch-Up & Delta Diffing Engine
Calculates what has meaningfully changed since a user last checked the market.
Supports configurable lookback windows: 15m / 1h / 4h / Full Day (390m).
"""

import time
from typing import Dict, List, Optional


# Valid lookback window options in minutes
VALID_LOOKBACK_MINUTES = {15, 60, 240, 390}
DEFAULT_LOOKBACK_MINUTES = 90


class SessionDiffEngine:
    @staticmethod
    def generate_catchup_summary(
        user_id: str,
        current_quotes: List[dict],
        session_snapshots: Optional[List[dict]] = None,
        lookback_minutes: int = DEFAULT_LOOKBACK_MINUTES
    ) -> dict:
        """
        Generates a natural-language catch-up summary for a user.

        Args:
            user_id: Unique identifier for the user session.
            current_quotes: Live quote batch from the ingestor.
            session_snapshots: Previously saved snapshots ({symbol, last_seen_price, last_seen_timestamp}).
                               If None, falls back to a simulated window using lookback_minutes.
            lookback_minutes: How far back to diff when no real snapshot is available.
                              One of: 15, 60, 240, 390 (or any positive int for flexibility).
        """
        now = int(time.time() * 1000)

        # Clamp lookback to a sane range
        effective_lookback = max(1, min(lookback_minutes, 1440))

        # Determine the reference timestamp
        time_away_minutes = effective_lookback
        prev_time = now - (effective_lookback * 60 * 1000)

        snapshot_map: Dict[str, dict] = {}
        if session_snapshots:
            for s in session_snapshots:
                snapshot_map[s["symbol"]] = s
            # If real snapshots exist, use their timestamp to compute actual time away
            if snapshot_map:
                # Take the earliest last_seen_timestamp across all symbols
                timestamps = [
                    s["last_seen_timestamp"]
                    for s in session_snapshots
                    if "last_seen_timestamp" in s
                ]
                if timestamps:
                    prev_time = min(timestamps)
                    time_away_minutes = max(1, int((now - prev_time) / (60 * 1000)))

        rallied = []
        dropped = []
        breakouts = []
        circuit_locked = []
        bullets = []

        for q in current_quotes:
            sym = q["symbol"]
            cur_ltp = q["ltp"]
            prev_price = snapshot_map.get(sym, {}).get("last_seen_price", q["prevClose"])

            if prev_price <= 0:
                prev_price = q["prevClose"]

            delta_pct = round(((cur_ltp - prev_price) / prev_price) * 100, 2)

            if q["isUpperCircuit"] or q["isLowerCircuit"]:
                circuit_locked.append(sym)

            if cur_ltp >= q["week52High"] * 0.995:
                breakouts.append(sym)

            if delta_pct >= 1.5:
                rallied.append((sym, delta_pct))
            elif delta_pct <= -1.5:
                dropped.append((sym, delta_pct))

        # Format natural language headline
        hours = time_away_minutes // 60
        mins = time_away_minutes % 60
        if hours > 0:
            time_str = f"{hours}h {mins}m" if mins > 0 else f"{hours}h"
        else:
            time_str = f"{mins}m"

        headline = f"Since you last checked ({time_str} ago): {len(rallied)} stocks gained >1.5%, {len(dropped)} dropped"
        if breakouts:
            headline += f", and {breakouts[0]} hit a 52W High."
        else:
            headline += "."

        # Build bullet highlights
        if rallied:
            top_gainers = sorted(rallied, key=lambda x: x[1], reverse=True)[:3]
            gainers_str = ", ".join([f"{s} ({d:+.1f}%)" for s, d in top_gainers])
            bullets.append(f"Top Movers Up: {gainers_str}")

        if dropped:
            top_losers = sorted(dropped, key=lambda x: x[1])[:3]
            losers_str = ", ".join([f"{s} ({d:+.1f}%)" for s, d in top_losers])
            bullets.append(f"Top Movers Down: {losers_str}")

        if breakouts:
            bullets.append(f"52-Week Breakout Watch: {', '.join(breakouts)}")

        if circuit_locked:
            bullets.append(f"Circuit Locked: {', '.join(circuit_locked)}")

        if not bullets:
            bullets.append("Markets moved steadily within normal volatility bands.")

        return {
            "userId": user_id,
            "previousSessionTime": prev_time,
            "timeAwayMinutes": time_away_minutes,
            "lookbackMinutes": effective_lookback,
            "headline": headline,
            "bulletPoints": bullets,
            "totalMovedUp": len(rallied),
            "totalMovedDown": len(dropped),
            "highAttentionSymbols": [s for s, _ in (rallied + dropped)[:5]],
            "timestamp": now
        }
