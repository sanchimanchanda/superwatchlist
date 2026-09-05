#!/usr/bin/env python3
"""
Unit Test: Quant Anomaly & Attention Score Engine
"""

import sys
import os

# Add analytics directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/analytics')))

from anomaly_engine import AnomalyEngine

def test_anomaly_engine():
    print("==================================================")
    print("TEST: Quant Anomaly & Attention Score Formulae")
    print("==================================================")

    engine = AnomalyEngine()

    mock_quotes = [
        {
            "symbol": "TCS",
            "ltp": 4580.00,
            "prevClose": 4440.00,
            "changePct": 3.15,
            "volume": 6_500_000,
            "week52High": 4590.00, # Near 52W High
            "week52Low": 3315.00,
            "vwap": 4520.00,
            "isUpperCircuit": False,
            "isLowerCircuit": False
        },
        {
            "symbol": "ZOMATO",
            "ltp": 285.00,
            "prevClose": 258.00,
            "changePct": 10.46,
            "volume": 45_000_000,
            "week52High": 298.00,
            "week52Low": 98.50,
            "vwap": 278.00,
            "isUpperCircuit": True, # Upper Circuit Lock
            "isLowerCircuit": False
        },
        {
            "symbol": "HDFCBANK",
            "ltp": 1655.00,
            "prevClose": 1658.00,
            "changePct": -0.18,
            "volume": 2_100_000,
            "week52High": 1794.00,
            "week52Low": 1363.55,
            "vwap": 1656.00,
            "isUpperCircuit": False,
            "isLowerCircuit": False
        }
    ]

    anomalies = engine.analyze_batch(mock_quotes)
    print(f"Generated {len(anomalies)} anomalies from batch.")

    # 1. Validate 52W High Breakout Detection
    tcs_ano = next((a for a in anomalies if a["symbol"] == "TCS"), None)
    assert tcs_ano is not None, "FAILED: TCS 52W breakout not detected"
    assert tcs_ano["type"] == "52W_HIGH_BREAKOUT", f"Expected 52W_HIGH_BREAKOUT, got {tcs_ano['type']}"
    print(f"✓ 52W High Breakout Detection (TCS, Score: {tcs_ano['attentionScore']}): PASSED")

    # 2. Validate Upper Circuit Lock Detection
    zomato_ano = next((a for a in anomalies if a["symbol"] == "ZOMATO"), None)
    assert zomato_ano is not None, "FAILED: ZOMATO Circuit lock not detected"
    assert zomato_ano["type"] == "CIRCUIT_LOCK_UC", f"Expected CIRCUIT_LOCK_UC, got {zomato_ano['type']}"
    assert zomato_ano["attentionScore"] >= 95.0, f"Circuit lock score should be >= 95, got {zomato_ano['attentionScore']}"
    print(f"✓ Upper Circuit Lock Detection (ZOMATO, Score: {zomato_ano['attentionScore']}): PASSED")

    # 3. Validate Normal Stock Does Not Trigger False Positive
    hdfc_ano = next((a for a in anomalies if a["symbol"] == "HDFCBANK"), None)
    assert hdfc_ano is None, "FAILED: Low volatility stock triggered false anomaly"
    print("✓ False Positive Filter (HDFCBANK correctly filtered): PASSED")

    # 4. Attention Score Range Test
    for a in anomalies:
        score = a["attentionScore"]
        assert 0.0 <= score <= 100.0, f"Attention score {score} outside [0, 100]"
    print("✓ Attention Score Bounds ([0, 100] scale): PASSED")

    print("\n🎉 All Quant Anomaly & Attention Score tests PASSED!\n")

if __name__ == "__main__":
    test_anomaly_engine()
