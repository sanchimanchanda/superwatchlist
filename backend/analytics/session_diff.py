"""
Session Catch-Up & Delta Diffing Engine
Calculates what has meaningfully changed since a user last checked the market.
"""

import time
from typing import Dict, List, Optional

class SessionDiffEngine:
    @staticmethod
    def generate_catchup_summary(
        user_id: str,
        current_quotes: List[dict],
        session_snapshots: Optional[List[dict]] = None
    ) -> dict:
        now = int(time.time() * 1000)
        
        # Default: simulate previous session 90 minutes ago if no previous snapshots exist
        time_away_minutes = 90
        prev_time = now - (time_away_minutes * 60 * 1000)
        
        snapshot_map = {}
        if session_snapshots:
            for s in session_snapshots:
                snapshot_map[s["symbol"]] = s
                if "last_seen_timestamp" in s:
                    prev_time = s["last_seen_timestamp"]
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
        time_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

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
            "headline": headline,
            "bulletPoints": bullets,
            "totalMovedUp": len(rallied),
            "totalMovedDown": len(dropped),
            "highAttentionSymbols": [s for s, _ in (rallied + dropped)[:5]],
            "timestamp": now
        }
