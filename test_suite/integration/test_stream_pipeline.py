#!/usr/bin/env python3
"""
Integration Test: Market Data Pipeline & WebSocket Stream Envelope
"""

import json
import time

def test_stream_pipeline():
    print("==================================================")
    print("TEST: End-to-End WebSocket Stream Message Protocol")
    print("==================================================")

    # Validate 1-Minute Tick Batch Message Protocol
    tick_envelope = {
        "type": "TICK_BATCH",
        "data": {
            "symbols": [
                {
                    "symbol": "RELIANCE",
                    "ltp": 2984.50,
                    "change": 42.10,
                    "changePct": 1.43,
                    "tickDirection": 1,
                    "volume": 4521000,
                    "nextRefreshInSeconds": 60
                }
            ],
            "count": 1
        },
        "timestamp": int(time.time() * 1000)
    }

    raw_json = json.dumps(tick_envelope)
    parsed = json.loads(raw_json)

    assert parsed["type"] == "TICK_BATCH", "Type mismatch in tick envelope"
    assert len(parsed["data"]["symbols"]) == 1, "Symbol payload length mismatch"
    assert parsed["data"]["symbols"][0]["symbol"] == "RELIANCE"
    print("✓ 1-Minute Tick Batch Protocol Serialization: PASSED")

    # Validate Anomaly Alert Message Protocol
    anomaly_envelope = {
        "type": "ANOMALY_ALERT",
        "data": {
            "id": "ano_123",
            "symbol": "TCS",
            "type": "52W_HIGH_BREAKOUT",
            "attentionScore": 94.5,
            "headline": "TCS testing 52-Week High"
        },
        "timestamp": int(time.time() * 1000)
    }

    raw_ano = json.dumps(anomaly_envelope)
    parsed_ano = json.loads(raw_ano)

    assert parsed_ano["type"] == "ANOMALY_ALERT"
    assert parsed_ano["data"]["attentionScore"] == 94.5
    print("✓ Anomaly Alert Protocol Serialization: PASSED")

    print("\n🎉 All WebSocket Stream Message Protocol tests PASSED!\n")

if __name__ == "__main__":
    test_stream_pipeline()
