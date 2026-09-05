# Product & Engineering Requirements: Smart Market Watchlist
**Challenge:** *Code, by Groww (2026)* — Engineering Build Challenge  
**Theme:** *Build a Smart Market Watchlist*  
**Market Data Feed:** Real-Time Google Finance API Ingestion (1-Minute Refresh Cadence)  
**Architecture:** 100% Dockerized Polyglot System (Golang + Python + React 18 + PostgreSQL + Redis)  
**Document Version:** 1.2.0  
**Status:** Approved Specification  

---

## 1. Executive Summary & Problem Context

Traditional stock market watchlists are static grids of numbers (LTP, % Change, Volume) that flood users with raw data without communicating context. When a trader or investor opens their app after 2 hours, 1 day, or over a weekend, they are forced to mentally compute what moved, why it moved, and what requires immediate attention.

### The Mission
Build an institutional-grade, fully containerized end-to-end **Smart Market Watchlist** that transforms passive ticker monitoring into an active **Market Intelligence & Attention Engine**. Powered by **live market data from Google Finance API at a 1-minute refresh cadence**, the platform empowers users to instantly comprehend:
1. **What has *meaningfully changed*** since they last checked.
2. **What deserves their attention right now** (actionable signals vs. market noise).
3. **Frictionless execution** with real-time quotes, deep market microstructure visualization, and instant order triggers.
4. **Zero-Friction 1-Command Deployment** via Docker and Docker Compose (`docker compose up --build`).

---

## 2. Evaluation Criteria & Strategic Philosophy

Aligned with Groww’s core engineering commandments (*"User ko maza ana chahiye"*, *"Deliver reliable products"*, *"Obsess over design"*, *"Fear being generic"*):

| Dimension | Evaluation Standard | Implementation Strategy |
|:---|:---|:---|
| **🧠 Product & Problem Interpretation** | Understanding beyond the obvious brief. | "Since You Were Away" Catch-up brief, dynamic Attention Score, multi-dimensional change triggers (Price, Volume, Volatility, VWAP, Circuit limits). |
| **⚡ Engineering Depth** | Architecture, correctness, reliability, scalability. | Google API 1-minute batch ingestion, 60 FPS UI list virtualization, Golang WebSocket gateway, Python quant engine, Redis Pub/Sub, multi-stage Docker. |
| **🛡️ Edge Cases & Resilience** | Failures, race conditions, stale/conflicting data. | Google API rate limiting / quota protection, stale cache fallback with "Stale Data (Updated 2m ago)" indicator, reconnect snapshot reconciliation. |
| **✨ Code Quality & Simplicity** | Maintainability without over-engineering. | Modular decoupled structure (`frontend/`, `backend/`, `api/`, `agent/`), strict cross-language contracts, O(1) LexoRank ordering. |
| **💡 Originality & Thoughtfulness** | Independent design choices and trade-offs. | 1-minute live synchronization countdown timer, visual day-range heat maps, micro-sparkline canvas rendering, contextual smart tags. |

---

## 3. Product Requirements Document (PRD)

### 3.1 Market Data Ingestion: Google API (1-Minute Cadence)
The system connects to **Google Finance API** to ingest real-time market data across Indian and Global equities (NSE/BSE/NASDAQ):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    1-MINUTE GOOGLE API MARKET PIPELINE                      │
│                                                                             │
│  ┌───────────────────────┐   1-Min Interval   ┌──────────────────────────┐  │
│  │   Google Finance API  │ ─────────────────► │ Python Ingestion Worker  │  │
│  │   (Real-Time Feeds)   │   (Batch Poll)     │ - Rate-Limit Throttling  │  │
│  └───────────────────────┘                    │ - Schema Normalization   │  │
│                                               └────────────┬─────────────┘  │
│                                                            │                │
│                                             Publish Batch  ▼                │
│                                               ┌──────────────────────────┐  │
│                                               │ Redis Pub/Sub & L1 Cache │  │
│                                               └────────────┬─────────────┘  │
│                                                            │                │
│                         ┌──────────────────────────────────┴─────────────┐  │
│                         ▼                                                ▼  │
│          ┌─────────────────────────────┐                  ┌──────────────┴──────────────┐
│          │ Python Quant Anomaly Engine │                  │ Golang Streaming Gateway    │
│          │ - 1-Min RVOL Surge Analysis │                  │ - WebSocket Broadcast to UI │
│          │ - Attention Score (0-100)   │                  │ - Sub-2ms Trie Search       │
│          └─────────────────────────────┘                  └─────────────────────────────┘
```

1. **Ingestion Specs:**
   - **Polling Interval:** Exactly 60 seconds (1 minute) with jitter to prevent burst spikes.
   - **Data Fields Ingested:** Symbol, Last Traded Price (LTP), Open, High, Low, Previous Close, Volume, 52W High, 52W Low, P/E, Market Cap.
   - **Batching & Rate-Limiting:** Batch requests grouped into concurrent workers with exponential backoff and Redis 60s TTL caching.
   - **UI Synchronization Timer:** Frontend displays a live pulse countdown: `"Next Sync in 42s"` and timestamp `"Updated: 10:15 AM"`.

---

### 3.2 Defining "Meaningful Change" (The Delta Engine)
A change is defined as "meaningful" when market dynamics shift beyond routine random-walk noise. Evaluated on every 1-minute Google API sync:

1. **Session Delta ("Since Last Checked"):**
   - Tracks timestamp and price snapshot of user's previous session.
   - Highlights net price movement ($\Delta$), new high/low breaches, and status changes during user's absence.
2. **Volume & Momentum Anomalies:**
   - Detects abnormal 1-minute volume surges relative to rolling average ($>2.5\times$ RVOL).
3. **Technical Breakouts & Milestones:**
   - 52-Week High / 52-Week Low breakout or retest.
   - Day High / Day Low breaches and VWAP crosses.
4. **Market Microstructure & Circuit Events:**
   - Upper Circuit (UC) / Lower Circuit (LC) price band locks.
5. **Smart Attention Rank (0–100):**
   - Weighted composite index scoring urgency so the most volatile or critical stocks float to the top of the "Needs Attention" filter.

---

### 3.3 Core Feature Specifications

#### F-01: Multi-Watchlist Management & Customization
- **Multi-Tab Support:** Create, rename, duplicate, reorder (drag & drop), and delete custom watchlists (up to 20 tabs).
- **System Smart Watchlists:**
  - *🔥 Most Active Now* (High RVOL & Momentum).
  - *🚀 Breakout Watch* (Crossing 52W Highs or Day Highs).
  - *⚠️ Circuit Locked* (Stocks locked at UC/LC).
  - *⚡ Since Last Checked* (Filtered list of symbols with $>1.5\%$ movement since previous visit).
- **Customizable Column Views:** Toggle columns (LTP, % Change, Delta Since Last Visit, Day Range Bar, Sparkline, Volume, VWAP, 52W Range, Market Cap).
- **Fractional Indexing (LexoRank):** Instant O(1) drag-and-drop item reordering.

#### F-02: Real-Time Market Quotes & Visual Micro-Interactions
- **1-Minute Batch Pulse:** On each 1-minute sync, tickers flash Green (`#00C087`) on upticks or Red (`#EB5B3C`) on downticks via 60 FPS RAF.
- **Live Sync Countdown Indicator:** Circular pulse badge showing seconds remaining until next Google API refresh (`"Synced • Next update in 35s"`).
- **Intraday Sparklines:** Ultra-fast HTML5 Canvas sparklines color-coded to net performance relative to previous close.
- **Visual Day-Range Bar:** Horizontal gradient bar showing exactly where current LTP stands between today's Low and High.
- **Tabular Monospace Typography:** Zero horizontal jitter during live price updates.

#### F-03: "Catch-Up" / Since-You-Were-Away Experience
- **Session Timestamp Diffing:** When returning to the app, a subtle header card summarizes:
  > *"Since you last checked (2h ago): 4 stocks rallied >2%, 1 hit 52W High (TCS), and INFY locked in Upper Circuit."*
- **Visual Delta Pill:** Each row features a secondary badge showing `Δ since last seen` (e.g. `+1.8% since 11:30 AM`).

#### F-04: Instant Symbol Search & Autocomplete
- **Sub-50ms Search:** In-memory Trie prefix search across Ticker, Company Name, Sector, and Exchange (NSE/BSE/NASDAQ).
- **1-Click Action:** Add/remove toggle directly from search results with watchlist destination picker.

#### F-05: Trader Action Suite (Fast Execution & Depth)
- **1-Click Quick Buy/Sell:** Hover action revealing instant order modal with market/limit presets.
- **5-Depth Market Ladder (L2 Data):** Visualized bid/ask ladder showing top 5 buyers/sellers with real-time volume bars.
- **Mini-to-Pro Charting:** Inline expander or modal with candlestick charts (Lightweight Charts) and volume bars.
- **Price Alerts:** Set instant conditional alert thresholds (e.g., *Alert when LTP > ₹3,200*).

---

## 4. System Architecture & Dockerized Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER COMPOSE TOPOLOGY                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     CONTAINER: growly-frontend                     │  │
│  │  - Multi-stage build (Node.js 20 Alpine -> Nginx 1.25 Alpine)         │  │
│  │  - Serves compiled React 18 SPA (Vite + TypeScript)                   │  │
│  │  - Nginx Reverse Proxy for /api and /ws (Port 3000 / 80)              │  │
│  │  - Virtualized List, Canvas Sparklines, 1-Min Sync Countdown Widget   │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │ (Internal Bridge Network: growly-net)
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                     CONTAINER: growly-gateway (Golang)             │  │
│  │  - Low-latency WebSocket Server (Port 4000)                           │  │
│  │  - In-Memory Trie Prefix Search (<2ms lookup)                         │  │
│  │  - Watchlist CRUD REST API & Session Handlers                         │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │ (Redis Pub/Sub Tick Bus)             │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                     CONTAINER: growly-analytics (Python 3.11)      │  │
│  │  - Google Finance API Ingestion Worker (1-Minute Refresh Cadence)     │  │
│  │  - Quant Anomaly Engine (RVOL, VWAP, 52W Breakouts, Attention Score)  │  │
│  │  - "Since You Were Away" Session Catch-Up Diff Engine                 │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │         DATA CONTAINERS: growly-redis & growly-postgres         │  │
│  │  - Redis 7: Sub-ms Quote Cache & Pub/Sub Channel                      │  │
│  │  - PostgreSQL 16: User Watchlists (LexoRank) & Session Snapshots      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Comprehensive Docker Specifications

### 5.1 Multi-Stage Dockerfile Strategy
- **`frontend/Dockerfile`**: Node.js builder + Nginx runner with SPA fallback & WebSocket proxy.
- **`backend/gateway/Dockerfile`**: Multi-stage Go 1.22 builder to minimal Alpine binary (<25MB).
- **`backend/analytics/Dockerfile`**: Python 3.11 Slim with virtualenv and Google Finance fetcher.
- **`docker-compose.yml`**: Connects `frontend`, `gateway`, `analytics`, `redis`, and `postgres` with health checks.

---

## 6. Edge Cases & Resilience Strategy

| Edge Case / Failure Mode | Failure Behavior | System Mitigation & Recovery |
|:---|:---|:---|
| **Google API Rate Limit / 429** | Google temporarily throttles requests. | Exponential backoff with jitter; serve cached snapshot from Redis with amber "Cached (Synced 2m ago)" badge. |
| **Network Disconnection** | Socket drops, data halts. | Exponential backoff reconnect with jitter (1s, 2s, 4s... max 15s). UI switches to amber "Reconnecting" pill; quotes display dimmed timestamp. |
| **Reconnect Snapshot Desync** | Client misses 1-min updates while offline. | Immediate REST `/api/v1/quotes/snapshot` fetch on reconnect to rebase state before resuming stream. |
| **Upper/Lower Circuit Lock** | 0 sellers or 0 buyers; price fixed. | Visual "UC / LC Locked" badge; bid/ask ladder shows 100% unilateral depth; tick flash disabled. |
| **Cross-Device Race Conditions** | Watchlist edited on mobile & web. | Optimistic updates with vector timestamp conflict resolution (Last-Write-Wins with server timestamp validation). |
| **Market Closed / Pre-Market** | Inactive trading session. | Header indicates "Market Closed (Showing Closing Prices)"; displays Post-Market / Pre-Market indicator. |

---

## 7. Hackathon Deliverables & 100-Word Product Pitch

### 7.1 Deliverables Checklist
- [x] **Requirement Specification:** `docs/requirement.md`
- [x] **Technical Guidelines:** `docs/techguidelines.md`
- [x] **72-Hour Execution Plan:** `docs/executionplan.md`
- [ ] **API Architecture & Contracts:** `api/` type definitions and route specs
- [ ] **Golang Streaming Gateway:** `backend/gateway/` real-time feed, search index, and watchlist REST API
- [ ] **Python Google API & Quant Engine:** `backend/analytics/` 1-min Google Finance fetcher and anomaly engine
- [ ] **Frontend Application:** `frontend/` virtualized, dark-mode real-time watchlist UI with 1-min sync countdown & Catch-Up intelligence
- [ ] **1-Command Docker Setup:** `docker compose up --build`

### 7.2 1-Command Startup for Evaluators
```bash
docker compose up --build
```
- **Web Client UI:** `http://localhost:3000`
- **REST API Endpoints:** `http://localhost:4000/api/v1`
- **WebSocket Streaming Feed:** `ws://localhost:4000/ws`
- **Service Healthcheck:** `http://localhost:4000/health`

### 7.3 Official 100-Word Product Pitch Draft
> *Traditional stock watchlists drown traders in numbers without explaining what moved or why. We built the **Smart Market Watchlist** — an institutional-grade intelligence engine designed for modern capital markets. Ingesting live market data via **Google Finance API on a 1-minute refresh cadence**, it features a real-time **Meaningful Change Detector** and a **"Since You Were Away" Catch-Up Mode** that surfaces volume surges, 52-week breakouts, and circuit locks instantly. Engineered with a Golang WebSocket gateway, Python quant engine, 60 FPS virtualized UI, and PostgreSQL/Redis, it runs entirely containerized in Docker with zero setup.* (98 words)
