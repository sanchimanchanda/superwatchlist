#!/usr/bin/env python3
"""
API Test: Session Delta & Catch-Up Intelligence Summary
"""

import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/analytics')))

from session_diff import SessionDiffEngine

def test_session_catchup():
    print("==================================================")
    print("TEST: 'Since You Were Away' Catch-Up Intelligence")
    print("==================================================")

    now = int(time.time() * 1000)

    mock_quotes = [
        {"symbol": "TCS", "ltp": 4580.00, "prevClose": 4400.00, "week52High": 4590.00, "isUpperCircuit": False, "isLowerCircuit": False},
        {"symbol": "ZOMATO", "ltp": 285.00, "prevClose": 250.00, "week52High": 298.00, "isUpperCircuit": True, "isLowerCircuit": False},
        {"symbol": "INFY", "ltp": 1750.00, "prevClose": 1820.00, "week52High": 1950.00, "isUpperCircuit": False, "isLowerCircuit": False},
        {"symbol": "RELIANCE", "ltp": 2980.00, "prevClose": 2980.00, "week52High": 3050.00, "isUpperCircuit": False, "isLowerCircuit": False}
    ]

    mock_snapshots = [
        {"symbol": "TCS", "last_seen_price": 4420.00, "last_seen_timestamp": now - (120 * 60 * 1000)}, # 2h ago
        {"symbol": "ZOMATO", "last_seen_price": 255.00, "last_seen_timestamp": now - (120 * 60 * 1000)},
        {"symbol": "INFY", "last_seen_price": 1810.00, "last_seen_timestamp": now - (120 * 60 * 1000)},
        {"symbol": "RELIANCE", "last_seen_price": 2975.00, "last_seen_timestamp": now - (120 * 60 * 1000)}
    ]

    summary = SessionDiffEngine.generate_catchup_summary(
        user_id="test_trader",
        current_quotes=mock_quotes,
        session_snapshots=mock_snapshots
    )

    # 1. Validate Time Away Calculation
    assert summary["timeAwayMinutes"] == 120, f"Expected 120m away, got {summary['timeAwayMinutes']}"
    print(f"✓ Time-Away Calculation ({summary['timeAwayMinutes']} mins elapsed): PASSED")

    # 2. Validate Movers Breakdown
    assert summary["totalMovedUp"] >= 2, f"Expected >= 2 rallied stocks, got {summary['totalMovedUp']}"
    assert summary["totalMovedDown"] >= 1, f"Expected >= 1 dropped stock, got {summary['totalMovedDown']}"
    print(f"✓ Gainers/Losers Classification ({summary['totalMovedUp']} up, {summary['totalMovedDown']} down): PASSED")

    # 3. Validate Natural Language Headline
    assert "Since you last checked" in summary["headline"]
    assert "stocks gained" in summary["headline"]
    print(f"✓ Natural Language Narrative Summary: \"{summary['headline']}\" (PASSED)")

    # 4. Validate Bullet Points
    assert len(summary["bulletPoints"]) >= 2, "Missing bullet points"
    print(f"✓ Actionable Highlights ({len(summary['bulletPoints'])} bullets generated): PASSED")

    print("\n🎉 All Session Catch-Up Intelligence tests PASSED!\n")

if __name__ == "__main__":
    test_session_catchup()
