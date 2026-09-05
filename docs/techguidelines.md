# Technology & Architecture Guidelines: Smart Market Watchlist
**System:** Institutional-Grade Real-Time Stock Market Platform  
**Document:** `docs/techguidelines.md`  
**Market Data Feed:** Real-Time Google Finance API Ingestion (1-Minute Refresh Interval)  
**Author:** Senior FinTech Full-Stack Architect (10+ Years Experience)  
**Status:** Approved Technical Standard  

---

## 1. System Architecture & Polyglot Technology Stack

To achieve sub-millisecond quote dissemination, high-throughput financial computing, live Google Finance API ingestion, and 60 FPS client rendering, the system employs a high-performance polyglot architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER (React 18 + Vite)                            │
│  - Virtualized List (TanStack Virtual / react-window)                                   │
│  - 60 FPS Decoupled RAF Tick Batching (Mutable Ring Buffers)                            │
│  - Live 1-Minute Refresh Countdown Badge ("Next sync in 35s")                           │
│  - HTML5 Canvas Mini-Sparklines & Lightweight Candlestick Charts                        │
└───────────────────────────▲───────────────────────────────────────▲─────────────────────┘
                            │ (WebSocket Streams)                   │ (REST API via Nginx)
┌───────────────────────────┴───────────────────────────────────────┴─────────────────────┐
│                       INGRESS & STREAMING GATEWAY (Golang)                              │
│  - Ultra-low latency WebSocket Server (Gorilla WebSocket / Gws)                         │
│  - In-Memory Trie Prefix Search (<2ms lookup across 10,000 tickers)                      │
│  - L1/L2 Book Aggregator & Memory Buffer Pool (`sync.Pool`)                             │
│  - Watchlist Management REST API & Auth Middleware                                      │
└───────────────────────────▲───────────────────────────────────────▲─────────────────────┘
                            │ (Redis Pub/Sub Tick Bus)              │ (gRPC / HTTP REST)
┌───────────────────────────┴───────────────────────────────────────┴─────────────────────┐
│           ANALYTICS & GOOGLE API INGESTION ENGINE (Python 3.11 + FastAPI)               │
│  - Google Finance API Ingestion Worker (Scheduled 1-Minute Recurring Loop)              │
│  - Rate Limiter with Exponential Backoff & Redis 60s TTL Cache Fallback                 │
│  - "Since You Were Away" Delta Engine & Session Catch-Up NLP Summaries                  │
│  - Quant Indicators: 1-Min RVOL Surge (>2.5x), 52W High/Low Breaches, VWAP Crosses      │
│  - Composite Attention Score Calculation (0–100 Weighted Urgency Index)                 │
└───────────────────────────▲───────────────────────────────────────▲─────────────────────┘
                            │                                       │
┌───────────────────────────┴─────────────────┐   ┌─────────────────┴─────────────────────┐
│         IN-MEMORY LAYER (Redis 7)           │   │      PERSISTENCE LAYER (PostgreSQL 16)│
│  - Sub-millisecond L1/L2 Quote Cache        │   │  - User Watchlists & Items (LexoRank) │
│  - Pub/Sub Channel for Tick Dissemination   │   │  - Session Snapshots & Price History  │
│  - Rate Limiting & Active Token Store       │   │  - Price Alerts & Trigger Rules       │
└─────────────────────────────────────────────┘   └───────────────────────────────────────┘
```

---

## 2. Technology Rationale & Component Responsibilities

| Layer / Service | Technology Selected | Core Rationale & Responsibilities |
|:---|:---|:---|
| **Streaming Gateway** | **Go (Golang 1.22)** | High-concurrency goroutines, minimal memory footprint, zero GC-pause lag. Broadcasts 1-minute updates, handles WebSocket heartbeats, and runs in-memory Trie search. |
| **Ingestion & Quant Engine**| **Python 3.11 + FastAPI** | Ingests live equity quotes from Google Finance API every 60 seconds. Computes statistical anomalies (RVOL), VWAP, 52W breakouts, and NLP summaries. |
| **Frontend Web App** | **React 18 + Vite + TS** | 60 FPS virtualized list rendering, decoupled `requestAnimationFrame` tick flashing on 1-min sync, 1-min countdown status indicator, HTML5 Canvas sparklines. |
| **Cache & Pub/Sub** | **Redis 7 (Alpine)** | Sub-millisecond in-memory cache for latest L1/L2 quotes and Redis Pub/Sub channel for inter-service communication between Python and Go. |
| **Relational Storage** | **PostgreSQL 16 (Alpine)** | ACID-compliant storage for user watchlists, fractional indexing (LexoRank) for O(1) drag-and-drop reordering, and session snapshot archives. |
| **Type Contracts** | **Shared TypeScript & JSON Schema in `api/`** | Single source of truth for all data models, ensuring strict end-to-end type safety across Go, Python, and TypeScript. |
| **Container Engine** | **Docker & Docker Compose** | 1-command startup (`docker compose up --build`), multi-stage builds (<25MB Go binary, <150MB Python slim, <30MB Nginx frontend). |

---

## 3. Engineering Guidelines by Technology

### 3.1 Google API Ingestion & Python Engine (`backend/analytics/`)
1. **1-Minute Ingestion Loop**:
   - Executes every 60 seconds with async batching across NSE/BSE/NASDAQ tickers.
   - Extracts: LTP, Day Open, High, Low, Previous Close, Volume, 52-Week High, 52-Week Low, Market Cap.
   - Normalizes data into standard schema matching `api/types.ts`.
2. **Rate Limiting & Circuit Breaker**:
   - If Google API responds with HTTP 429 or network timeout, gracefully serve the cached snapshot from Redis with `"isStale": true` and a `"lastUpdated"` timestamp.
   - Retry with exponential backoff and jitter ($1\text{s}, 2\text{s}, 4\text{s}$).
3. **Statistical Anomaly Algorithms**:
   - **RVOL (Relative Volume):** $\text{RVOL} = \frac{\text{Current Volume}}{\text{20-Day Expected Average Volume at Minute } t}$. Flag when $\text{RVOL} \ge 2.5$.
   - **Attention Score Formulation (0–100):**
     $$\text{Score} = w_1 \cdot \min(100, |\%\Delta| \times 15) + w_2 \cdot \min(100, \text{RVOL} \times 20) + w_3 \cdot \mathbb{I}_{\text{Breakout}} \times 100 + w_4 \cdot \mathbb{I}_{\text{Circuit}} \times 100$$
4. **Publishing**:
   - Publishes the updated batch to Redis channel `market:ticks` and updates hash `quotes:latest`.

---

### 3.2 Golang Streaming Gateway (`backend/gateway/`)
1. **WebSocket Fan-Out**:
   - Listens to Redis `market:ticks` channel.
   - Broadcasts the batch update to all subscribed WebSocket clients in parallel using worker goroutines and `sync.Pool` buffer reuse.
2. **In-Memory Trie Search**:
   - Prefix Trie indexing Symbol, Company Name, and Sector with $<2\text{ms}$ search latency.
3. **Watchlist REST APIs**:
   - Handles CRUD with PostgreSQL persistence and LexoRank reordering.

---

### 3.3 Frontend Client Guidelines (`frontend/src/`)
1. **1-Minute Sync Progress Bar & Countdown**:
   - Visual component displaying `"Synced • Next refresh in 35s"`.
   - Dispatches a smooth green/red highlight pulse across updated rows on arrival of each 1-minute batch without triggering full-table re-renders.
2. **60 FPS Virtualized Rendering**:
   - Virtualize all rows using `@tanstack/react-virtual` or `react-window`.
   - Numerical figures rendered with monospace tabular numbers (`font-variant-numeric: tabular-nums`).
3. **HTML5 Canvas Sparklines**:
   - Renders 30-point intraday price trajectories on `<canvas>` elements directly.

---

## 4. API & Communication Protocols

### 4.1 Real-Time WebSocket Message Schemas
```json
// 1-Minute Live Batch Tick Message (Streamed from Go Gateway)
{
  "type": "TICK_BATCH",
  "data": {
    "symbols": [
      {
        "symbol": "RELIANCE",
        "ltp": 2984.50,
        "change": 42.10,
        "changePct": 1.43,
        "dayHigh": 2995.00,
        "dayLow": 2930.00,
        "volume": 4210950,
        "vwap": 2962.30,
        "tickDirection": 1,
        "timestamp": 1725510000000,
        "nextRefreshInSeconds": 60
      }
    ],
    "batchTimestamp": 1725510000000
  }
}
```

---

## 5. Dockerized Deployment & Production Verification

All services run cohesively within Docker Compose:
- **`frontend`** (Nginx + React SPA) on `http://localhost:3000`
- **`gateway`** (Go WebSocket & REST API) on `http://localhost:4000`
- **`analytics`** (Python Google API Ingestion & Quant Engine) on internal port `8000`
- **`redis`** (In-Memory Cache) on internal port `6379`
- **`postgres`** (Relational Database) on internal port `5432`

Judges and evaluators run:
```bash
docker compose up --build
```
Everything initializes deterministically in $<45\text{ seconds}$ with automated database migrations and mock seed datasets.
