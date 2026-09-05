#!/usr/bin/env python3
"""
Market Feed Test: Google Finance API Ingestion, 1-Minute Cycle & Fallback Caching
"""

import asyncio
import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/analytics')))

from google_ingest import GoogleFinanceIngestor

async def test_google_ingest():
    print("==================================================")
    print("TEST: Google Finance API 1-Minute Ingestion Feed")
    print("==================================================")

    ingestor = GoogleFinanceIngestor()

    # 1. Initial State Verification
    initial_quotes = ingestor.get_all_quotes()
    assert len(initial_quotes) >= 15, f"Expected >= 15 initial tickers, got {len(initial_quotes)}"
    print(f"✓ Initial Seed State ({len(initial_quotes)} symbols loaded): PASSED")

    # 2. Ingestion Batch Step
    t0 = time.time()
    batch1 = await ingestor.fetch_realtime_batch()
    latency_ms = (time.time() - t0) * 1000

    assert len(batch1) == len(initial_quotes), "Batch quote count mismatch"
    print(f"✓ Live Ingestion Batch ({len(batch1)} quotes generated in {latency_ms:.2f}ms): PASSED")

    # 3. Schema Completeness Check
    sample = batch1[0]
    required_fields = ["symbol", "name", "exchange", "ltp", "open", "high", "low", "prevClose", "change", "changePct", "volume", "vwap", "sparkline", "nextRefreshInSeconds"]
    for field in required_fields:
        assert field in sample, f"Missing required field in quote schema: {field}"
    print("✓ Full Quote Schema Compliance: PASSED")

    # 4. Sparkline Trajectory Check
    assert len(sample["sparkline"]) == 25, f"Expected 25 sparkline points, got {len(sample['sparkline'])}"
    assert sample["sparkline"][-1] == sample["ltp"], "Sparkline last point should equal current LTP"
    print("✓ Canvas Sparkline History Alignment: PASSED")

    # 5. Circuit Breaker Boundaries Check
    for q in batch1:
        prev = q["prevClose"]
        uc = prev * 1.101
        lc = prev * 0.899
        assert q["ltp"] <= uc and q["ltp"] >= lc, f"LTP {q['ltp']} broke circuit bands for {q['symbol']}"
    print("✓ Upper/Lower Circuit Guardrail Bounds: PASSED")

    print("\n🎉 All Google Finance Ingestion Feed tests PASSED!\n")

if __name__ == "__main__":
    asyncio.run(test_google_ingest())
