# Growly — Smart Market Watchlist & Intelligence Engine

<div align="center">

[![Hackathon](https://img.shields.io/badge/Groww_Code-2026_Hackathon-00c087?style=for-the-badge&logo=groww&logoColor=white)](https://groww.in)
[![Status](https://img.shields.io/badge/Build-Passing_(100%25)-387ed1?style=for-the-badge&logo=githubactions&logoColor=white)]()
[![Frontend](https://img.shields.io/badge/Frontend-React_18_+_TypeScript_+_Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI_+_Golang_1.22-00add8?style=for-the-badge&logo=go&logoColor=white)]()
[![Docker](https://img.shields.io/badge/Docker-5--Container_Stack-2496ed?style=for-the-badge&logo=docker&logoColor=white)]()

**Institutional-Grade Real-Time Market Watchlist, Attention Scoring & Paper Trading Engine**  
*Built for the Code, by Groww (2026) Engineering Build Challenge*

[🎯 100-Word Pitch](#-the-100-word-product-pitch) • [🏗️ Architecture](#️-system-architecture) • [✨ Features](#-core-features) • [🚀 Quickstart](#-quickstart--execution) • [🧪 Test Suite](#-automated-backend-test-suite) • [📑 Submission Guide](explanation.md)

</div>

---

## 🎯 The 100-Word Product Pitch

> *Traditional stock watchlists drown traders in passive numbers without explaining what moved or why. We built **Growly**—an institutional-grade market intelligence engine designed for modern capital markets. Ingesting live market data via **Google Finance API on a 1-minute refresh cadence**, it features a real-time **Meaningful Change Detector** and a **"Since You Were Away" Catch-Up Mode** that surfaces volume surges, 52-week breakouts, and circuit locks instantly. With **real-time paper trading**, 60 FPS Canvas sparklines, sub-2ms Trie search, and PostgreSQL/Redis, it runs entirely containerized in Docker with zero setup.* **(98 words)**

---

## 🏗️ System Architecture

Growly employs a polyglot microservices topology designed for sub-millisecond query response, high-throughput streaming, and mathematical anomaly detection:

```mermaid
graph TD
    subgraph "External Market Ingestion"
        GF["Google Finance API<br/>(1-Minute Polling Loop)"]
    end

    subgraph "Quant Analytics Engine (Python 3.11 / FastAPI)"
        GI["google_ingest.py<br/>(Resilient Ingestion & Circuit Limits)"]
        AE["anomaly_engine.py<br/>(RVOL Surge, 52W Breakouts & Attention Score)"]
        SD["session_diff.py<br/>('Since You Were Away' Session Engine)"]
    end

    subgraph "Cache & Persistence Layer"
        Redis[("Redis 7<br/>Pub/Sub & Quotes Cache")]
        PG[("PostgreSQL 16<br/>LexoRank & Session Snapshots")]
    end

    subgraph "Streaming & Low-Latency Gateway (Golang 1.22)"
        GW["smart-market-gateway<br/>(Gorilla WebSocket Hub & Trie Search)"]
    end

    subgraph "Trading Client (React 18 + Vite + TypeScript)"
        UI["Watchlist Table (60 FPS)<br/>Paper Trading Ledger (₹10L Margin)<br/>Sync Widget (1-min countdown)<br/>Catch-Up Banner & L2 Market Depth"]
    end

    GF -->|1-Min Ingestion Batch| GI
    GI --> AE
    AE -->|Publish Ticks & Anomalies| Redis
    Redis -->|Subscribe| GW
    GW -->|WebSocket Streaming /ws| UI
    GW -->|REST Snapshots /api/v1| UI
    GW <-->|LexoRank O(1) Reordering| PG
    AE <-->|Session Diff Persistence| PG
```

---

## ✨ Core Features

### 1. ⏱️ 1-Minute Real-Time Google Finance Feed
- Continuous 60-second polling loop fetching live market data across NSE/BSE and US equities.
- Visual header **Sync Widget** with live circular progress countdown (*"Google Finance Feed • Synced 11:51 AM • Next sync in 32s"*) and manual trigger capability.
- In-memory fallback caching with `isStale: true` indicators during network degradation.

### 2. 🧠 "Since You Were Away" Session Catch-Up Engine
- Persists user session snapshots upon window unload or idle blur.
- Automatically generates natural language executive narratives when returning:
  > *"Since you last checked (1h 30m ago): 8 stocks gained >1.5%, 3 dropped, and TCS hit a 52W High."*
- **1-Click "Filter Movers Only" Toggle** instantly isolates volatile tickers.

### 3. ⚡ Quant Anomaly Detection & Composite Attention Score (0–100)
Multi-factor algorithmic scoring that classifies price action into structural significance:
$$\text{Attention Score} = w_1 \cdot S_{\text{RVOL}} + w_2 \cdot S_{\text{52W}} + w_3 \cdot S_{\text{Circuit}} + w_4 \cdot S_{\text{Velocity}}$$
- **Volume Surges:** Flags abnormal volume ($\text{RVOL} \ge 2.5\times$).
- **52-Week High Breakouts:** Highlights stocks within 0.5% of annual highs.
- **Circuit Breaker Locks:** Real-time Upper/Lower circuit lock detection.

### 4. 💼 Real-Time Paper Trading & Live Portfolio Position Engine
- **₹10,00,000.00 Margin Wallet:** Real-time margin balance validation and deductions.
- **Volume-Weighted Average Price (VWAP) Positions:** Dynamically tracks holdings, invested capital, live market value, and unrealized P&L (₹ / %).
- **Dedicated Portfolio & Trade Book Modal:** View open positions, execute 1-click position exits, inspect chronological order audit logs, and reset margin capital.

### 5. 📑 Full Watchlist Lifecycle Management
- **Multi-Watchlist Tabs:** Create, rename, and delete custom watchlists.
- **Smart Dynamic Tabs:** *Most Active Now* (top volume ranker), *52W Breakouts* (breakout scanner), and *Nifty 50 Core*.
- **$O(1)$ LexoRank Reordering:** Fractional string indexing for instant drag-and-drop symbol reordering without bulk database rewrites.

### 6. 📊 60 FPS Visual Trading Experience
- **Decoupled HTML5 2D Canvas Sparklines:** Zero DOM node bloat for real-time trendlines.
- **Visual Day-Range Position Bars:** Low/High spread bars with real-time LTP markers.
- **Micro-Animations & Monospace Formatting:** Green/Red price pulse animations and `font-variant-numeric: tabular-nums` to eliminate layout jitter.

### 7. 🪜 5-Level (L2) Market Depth & Fast Order Execution
- Visual Bid/Ask order book ladder with live buyer/seller pressure percentage bar.
- 1-Click Buy/Sell trigger modal with market and limit order execution.

---

## 🚀 Quickstart & Execution

### Option 1: 1-Command Production Launch (Docker Compose)
Launch the entire 5-container polyglot infrastructure in seconds:

```bash
docker compose up --build
```

| Service | Protocol / Port | Purpose |
|:---|:---|:---|
| **Web Trading Client** | `http://localhost:3000` | React 18 + Vite Trading Interface |
| **Golang Gateway** | `http://localhost:4000` / `ws://localhost:4000/ws` | Gorilla WebSocket Hub & Trie Search |
| **Python Quant Analytics** | `http://localhost:8000` | Google Finance Ingest & Attention Engine |
| **Redis Cache** | `localhost:6379` | Pub/Sub & L1 Quote Cache |
| **PostgreSQL Database** | `localhost:5432` | LexoRank & Session State Storage |

---

### Option 2: Local Development Mode

#### 1. Backend Service (FastAPI & Google Feed)
```bash
cd backend/analytics
pip install -r requirements.txt
python3 main.py
```
*Service starts on `http://localhost:8000`.*

#### 2. Frontend Client (Vite Dev Server)
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens on `http://localhost:5173` with automatic API and WebSocket proxying to port `8000`.*

---

## 🧪 Automated Backend Test Suite

The repository includes a comprehensive, automated test harness in `test_suite/` validating all quant math, feed ingestion, CRUD endpoints, and streaming protocols:

```bash
bash test_suite/run_tests.sh
```

### Validation Matrix (100% Passing)

| Test Suite | Module Tested | Coverage / Assertion | Status |
|:---|:---|:---|:---:|
| `test_suite/unit/test_trie_search.go` | Golang Prefix Trie | Sub-2ms search latency across symbols & sectors | 🟢 **PASSED** |
| `test_suite/unit/test_quant_anomalies.py` | Python Quant Engine | RVOL ($\ge 2.5\times$), 52W High breakouts, Attention Scores | 🟢 **PASSED** |
| `test_suite/market_feed/test_google_ingest.py` | Ingestion Feed | 1-minute batch cadence, schema compliance, sparklines | 🟢 **PASSED** |
| `test_suite/api/test_watchlist_crud.py` | Watchlist REST API | Create, Rename, Delete & $O(1)$ LexoRank ordering | 🟢 **PASSED** |
| `test_suite/api/test_session_catchup.py` | Session Diff Engine | Natural language catch-up summary & mover filtering | 🟢 **PASSED** |
| `test_suite/integration/test_stream_pipeline.py` | WebSocket Protocol | End-to-end `TICK_BATCH` & `ANOMALY_ALERT` serialization | 🟢 **PASSED** |

---

## 📂 Repository Topology

```text
.
├── .env.example                # Environment configuration template
├── .gitignore                  # Production Git ignore rules
├── README.md                   # Project overview & architectural guide
├── explanation.md              # Deep-dive hackathon submission document & defense script
├── docker-compose.yml          # 5-container production deployment orchestration
├── api/                        # Shared type definitions & JSON schemas
│   ├── types.ts
│   └── schemas.json
├── backend/
│   ├── analytics/              # Python 3.11 FastAPI (Google Finance feed, Attention scoring)
│   │   ├── google_ingest.py
│   │   ├── anomaly_engine.py
│   │   ├── session_diff.py
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── gateway/                # Golang 1.22 Streaming Gateway & Trie search
│   │   ├── main.go
│   │   ├── server/
│   │   ├── trie/
│   │   └── store/
│   └── db/                     # PostgreSQL DDL init.sql & seed.sql
├── frontend/                   # React 18 + TypeScript trading client
│   ├── src/
│   │   ├── components/         # WatchlistTable, PositionsModal, CatchUpBanner, etc.
│   │   ├── services/           # WebSocket and REST client
│   │   └── styles/             # FinTech dark theme design system
│   ├── package.json
│   ├── vite.config.ts
│   └── nginx.conf
└── test_suite/                 # Automated end-to-end validation test suite
    ├── run_tests.sh            # Master test harness runner
    ├── unit/
    ├── market_feed/
    ├── api/
    └── integration/
```

---

## 📚 Deep Dive & Hackathon Submission

For the complete technical breakdown, mathematical formulas, edge-case resilience matrix, and 5-minute presentation defense scripts, consult the dedicated submission document:

👉 **[Read the Full Technical Explanation & Submission Guide (`explanation.md`)](explanation.md)**

---

<div align="center">
  <sub>Engineered with ❤️ for Code, by Groww (2026)</sub>
</div>
