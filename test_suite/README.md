# Backend Test Suite & Validation Harness (`test_suite/`)

This directory contains the automated test suites, integration benchmarks, and validation harnesses for all backend services.

## Test Suite Structure
- `unit/`: Unit tests for individual algorithms (Trie search, LexoRank, RVOL formula, Attention Score).
- `integration/`: Inter-service communication tests (Python -> Redis Pub/Sub -> Golang Gateway -> WebSocket).
- `api/`: REST API contract validation and CRUD tests.
- `market_feed/`: Google Finance API 1-minute ingestion, parsing, rate-limiting, and cache fallback tests.
- `benchmarks/`: High-throughput latency and tick stress tests (1,000+ ticks/sec).
