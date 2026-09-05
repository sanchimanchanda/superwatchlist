# Product Execution Plan: Smart Market Watchlist
**Challenge:** *Code, by Groww (2026)* — 72-Hour Engineering Sprint  
**Document:** `docs/executionplan.md`  
**Market Data Feed:** Real-Time Google Finance API (1-Minute Refresh Interval)  
**Architecture:** Polyglot Microservices (Golang Gateway + Python Google API Ingest & Quant Engine + React 18 60FPS UI + PostgreSQL + Redis)  
**Author:** Lead Financial Markets Product Manager & Senior FinTech Architect  
**Status:** Approved Technical Execution Plan  
**Target Completion:** 72 Hours (End-to-End Dockerized Build)  

---

## 1. Executive Roadmap & Sprint Breakdown (72-Hour Strategy)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               72-HOUR SPRINT EXECUTION TIMELINE                                  │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┬────────────────┬────────┤
│  PHASE 0 (0-12h)│  PHASE 1 (12-28h)│ PHASE 2 (28-44h)│ PHASE 3 (44-56h)│PHASE 4 (56-64h)│PHASE 5 │
│  Contracts, DB, │ Google API Ingest│ 60 FPS Client,  │ "Catch-Up" &    │ Trader Actions │ (64-72)│
│  Polyglot Scaff,│ 1-Min Pipeline & │ 1-Min Sync Pulse│ Delta Engine UI │ & L2 Depth     │Docker &│
│  Docker Compose │ Golang Gateway   │ & Virtualization│ (Since Last Seen│ (1-Click Order)│Demo/Doc│
└─────────────────┴──────────────────┴─────────────────┴─────────────────┴────────────────┴────────┘
```

| Phase | Time Window | Focus Area | Technology Stack | Key Deliverables & Validation Gate |
|:---|:---|:---|:---|:---|
| **Phase 0** | Hour 00 – 12 | Architecture, Contracts, Database & Docker | `api/` Schemas, PostgreSQL, Redis, Docker Compose | 5-container Docker Compose boots with DB migrations & healthchecks in $<45\text{s}$. |
| **Phase 1** | Hour 12 – 28 | Google API 1-Min Ingestion & Golang Gateway | Python 3.11 Google Fetcher, Go 1.22 Gateway, Redis | Python polls Google API every 1 min, updates Redis & Pub/Sub; Go streams ticks to clients with sub-2ms Trie search. |
| **Phase 2** | Hour 28 – 44 | 60 FPS Virtualized Client & 1-Min Sync UI | React 18, Vite, TypeScript, Canvas, Sync Widget | Smooth 60 FPS scroll over 500+ tickers with live `"Next update in 35s"` countdown badge. |
| **Phase 3** | Hour 44 – 56 | "Meaningful Change" & Session Delta Engine | Python Anomaly Engine, React Session Tracker | Personalized "Since You Were Away" catch-up card & real-time Attention Scores (0–100) updated every 1 min. |
| **Phase 4** | Hour 56 – 64 | Trader Action Suite, Market Depth & Alerts | React 18, Lightweight Charts, WebSockets | 1-click Buy/Sell triggers, 5-depth L2 visual ladder, intraday candlestick charts with 1-min Google candle stitching. |
| **Phase 5** | Hour 64 – 72 | Edge-Case Hardening, Verification & Pitch | Docker multi-stage optimization, Rate limit test | Google API rate limit fallbacks verified; 1-command `docker compose up --build` works flawlessly. |

---

## 2. Detailed Work Breakdown Structure (WBS)

### 🧩 Phase 0: System Contracts, Polyglot Scaffolding & Docker Compose (Hours 0–12)

#### Objective
Establish unified cross-language data contracts (`api/`), setup PostgreSQL database schemas and Redis pub/sub channels, and configure the multi-container Docker Compose infrastructure.

#### Tasks & Specifications
1. **Define Cross-Language API Contracts (`api/`)**:
   - `Ticker`: Symbol, company name, exchange (NSE/BSE/NASDAQ), sector, market cap, 52W High/Low.
   - `Quote`: LTP, open, high, low, close, volume, VWAP, change, changePercent, tickDirection, lastUpdated, nextRefreshInSeconds.
   - `MarketDepth`: 5-level bid/ask ladder (price, orders, quantity) with total buy/sell pressure.
   - `MeaningfulChange`: Type enum (`SESSION_DELTA`, `VOLUME_SURGE`, `52W_BREAKOUT`, `CIRCUIT_LOCK`, `VWAP_CROSS`), attentionScore (0–100), headline, severity.
   - `Watchlist`: ID, title, items with LexoRank ordering, user ID.
2. **Database & Cache Architecture (`backend/db/`)**:
   - **PostgreSQL 16 Schema:**
     - `watchlists` & `watchlist_items` with LexoRank strings for $O(1)$ reordering.
     - `user_session_snapshots` storing `(user_id, symbol, ltp_snapshot, timestamp, high_seen, low_seen)` with composite index on `(user_id, timestamp DESC)`.
     - `price_alerts` with target threshold, condition (`GTE`/`LTE`), and trigger status.
   - **Redis 7 In-Memory Cache:**
     - Hash map `quotes:latest` for instant sub-millisecond REST L1/L2 snapshots (TTL 120s).
     - Pub/Sub channels `market:ticks` and `market:anomalies` connecting Python to Go.
3. **Multi-Container Docker Compose Topology (`docker-compose.yml`)**:
   - `frontend`: React SPA served via Nginx 1.25 Alpine with reverse proxy for `/api` and `/ws`.
   - `gateway`: Golang 1.22 Alpine binary (<25MB) exposing port `4000`.
   - `analytics`: Python 3.11 Slim FastAPI worker on internal port `8000` executing the 1-min Google API worker.
   - `redis`: Redis 7 Alpine on internal port `6379`.
   - `postgres`: PostgreSQL 16 Alpine on internal port `5432` with auto-running init migrations.

**Acceptance Criteria (DoD):**
- `docker compose up --build` brings up all 5 containers with verified network healthchecks.
- PostgreSQL tables are auto-migrated and populated with seed symbols (50+ Indian & Global equities).
- Redis instance responds to `PING` in $<1\text{ms}$.

---

### ⚡ Phase 1: Google API 1-Minute Ingestion & Golang Gateway (Hours 12–28)

#### Objective
Build the market data ingestion pipeline connecting to Google Finance API on a 1-minute recurring schedule, publishing updates to Redis, and streaming through the Golang WebSocket gateway to connected clients.

#### Tasks & Specifications
1. **Google Finance API Ingestion Worker (`backend/analytics/google_ingest.py`)**:
   - Scheduled 1-minute recurring polling loop with jitter and async batching across NSE/BSE symbols (e.g. `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `TATAMOTORS`, etc.).
   - Parses LTP, Open, High, Low, Previous Close, Volume, 52W High, and 52W Low.
   - Circuit breaker & fallback: If Google API rate-limits (HTTP 429), gracefully serves cached Redis quotes with a `"stale"` flag and resumes on next interval.
   - Publishes updated quote batch to Redis channel `market:ticks` and updates `quotes:latest` hash.
2. **Python Quant Anomaly Engine (`backend/analytics/anomaly_engine.py`)**:
   - Executes on every 1-minute market batch:
     - **1-Min RVOL Surge:** Flags volume surge $>2.5\times$ relative to expected intraday pace.
     - **VWAP & 52W Milestones:** Evaluates new 52W highs/lows and day breakout touches.
     - **Composite Attention Score (0–100):** Ranks urgency across the active watchlist universe.
3. **Golang Ingress & WebSocket Gateway (`backend/gateway/`)**:
   - Subscribes to Redis `market:ticks` and broadcasts 1-minute batch updates to all active WebSocket clients.
   - Manages client connection pools and 30s heartbeat ping-pongs.
   - Sub-2ms in-memory prefix Trie search for Symbol, Company Name, and Sector.
4. **Watchlist & Session REST API in Go (`backend/gateway/routes/`)**:
   - `GET /api/v1/watchlists`: Fetch user watchlists with resolved live quotes.
   - `POST /api/v1/watchlists`: Create custom watchlist.
   - `PUT /api/v1/watchlists/:id/reorder`: O(1) LexoRank reorder update in Postgres.
   - `GET /api/v1/search?q={query}`: Sub-2ms Trie symbol search.
   - `GET /api/v1/quotes/snapshot`: Instant full-universe quote snapshot.
   - `GET /api/v1/catchup?userId={id}`: Computes deltas since user's previous session timestamp.

**Acceptance Criteria (DoD):**
- Python service successfully polls Google Finance API every 60 seconds and publishes to Redis.
- Go gateway streams updates to WebSockets with $<5\text{ms}$ transit latency.
- Trie search returns instant matches for any query in $<2\text{ms}$.

---

### 🖥️ Phase 2: High-Velocity Frontend & 1-Minute Sync UI (Hours 28–44)

#### Objective
Construct an institutional-grade, dark-mode-first trading client designed for 60 FPS smoothness, instant responsiveness, and clear 1-minute sync countdown indicators.

#### Tasks & Specifications
1. **FinTech Design System (`frontend/src/styles/`)**:
   - Dark palette: `#0e1118` canvas, `#161b26` surface, `#242b3b` borders, `#00C087` uptick green, `#EB5B3C` downtick red.
   - Strict monospace tabular numbers (`font-variant-numeric: tabular-nums`) preventing price jitter.
2. **1-Minute Sync Status & Countdown Widget (`frontend/src/components/SyncStatusWidget.tsx`)**:
   - Circular progress badge with seconds countdown: `"Live Feed • Next sync in 42s"`.
   - On sync tick: Smooth green/red pulse flash on affected rows using 60 FPS RAF dispatcher.
3. **Virtualized Watchlist Table (`frontend/src/components/WatchlistTable.tsx`)**:
   - Virtualized window rendering supporting 1,000+ tickers with zero DOM degradation.
4. **HTML5 Canvas Micro-Sparklines (`frontend/src/components/Sparkline.tsx`)**:
   - Lightweight 2D Canvas rendering intraday price trajectories dynamically color-coded to net performance relative to previous close.
5. **Visual Day-Range Gradient Bar (`frontend/src/components/DayRangeBar.tsx`)**:
   - Real-time indicator illustrating LTP positioning between Day Low and Day High.

**Acceptance Criteria (DoD):**
- UI maintains steady 60 FPS scrolling and cleanly handles 1-minute batch updates.
- Sync countdown widget updates accurately every second and triggers row flashes on new market batch.

---

### 🧠 Phase 3: "Meaningful Change" & Session Delta Engine (Hours 44–56)

#### Objective
Implement the core hackathon differentiator: transforming raw data into actionable market intelligence and personalized "Since You Were Away" catch-up insights.

#### Tasks & Specifications
1. **Session Delta Tracker (`frontend/src/services/sessionTracker.ts`)**:
   - Persists session timestamp and symbol price snapshots in `localStorage` and Postgres upon blur/unload.
   - On return, queries `/api/v1/catchup` to calculate exact price move ($\Delta$), volume surge, and milestone breaches since the previous session.
2. **"Since You Were Away" Catch-Up Header Card (`frontend/src/components/CatchUpBanner.tsx`)**:
   - Natural language summary generated by the Python engine: *"Since you last checked (1h 45m ago): 3 stocks gained >2%, TCS touched a 52W High, and 1 hit Lower Circuit."*
   - Interactive quick-filter button: "Show Only Changed Stocks".
3. **Real-Time Meaningful Change Badges & Attention Score (0–100)**:
   - Dynamic badges: `⚡ RVOL 3.2x`, `🚀 52W High`, `⚠️ Upper Circuit`, `📉 VWAP Breakdown`.
   - "Needs Attention" Smart Tab automatically sorting stocks by composite Attention Score.

**Acceptance Criteria (DoD):**
- Returning to the app displays a clear, accurate diff card showing exact changes since last visit.
- Anomaly badges update dynamically on every 1-minute Google API sync.

---

### 🛠️ Phase 4: Trader Power Features & Market Depth (Hours 56–64)

#### Objective
Deliver power-trader capabilities including L2 market depth ladders, 1-click execution triggers, interactive charting, and price alert rules.

#### Tasks & Specifications
1. **5-Depth Market Ladder Modal (`frontend/src/components/MarketDepthModal.tsx`)**:
   - Top 5 Bids (Buyers) and Asks (Sellers) with visual depth bars.
   - Total Buyer/Seller percentage gauge and spread analysis.
2. **1-Click Quick Order Modal (`frontend/src/components/QuickOrderModal.tsx`)**:
   - Instant Buy/Sell trigger with Market/Limit selection, quantity presets, and simulated order execution.
3. **Interactive Candlestick Chart Drawer (`frontend/src/components/ChartDrawer.tsx`)**:
   - Lightweight Charts / Canvas candlestick chart with intraday 1-minute candles and volume bars.
4. **Price Alert Rule Engine (`frontend/src/components/AlertsManager.tsx`)**:
   - User creates conditional alert (e.g. `LTP >= 3500`).
   - Browser notification / in-app toast triggers when threshold is breached on 1-min update.

**Acceptance Criteria (DoD):**
- 1-click opens market depth and executes simulated orders in $<100\text{ms}$.
- Price alerts fire immediately when 1-minute quote exceeds specified boundary.

---

### 🛡️ Phase 5: Container Hardening, Edge-Case Resilience & Pitch (Hours 64–72)

#### Objective
Stress test edge cases, test Google API rate-limit recovery, harden Docker deployment, and prepare the 100-word submission pitch.

#### Tasks & Specifications
1. **Edge Case Verification**:
   - Google API 429 Simulation: Temporarily throttle Google API; verify Redis cache fallback with amber "Synced 2m ago" indicator.
   - Disconnect/Reconnect: Drop network, verify amber "Reconnecting" indicator, reconnect and confirm REST snapshot rebasing.
   - Upper/Lower Circuit Locks: Verify 100% unilateral depth freeze handling.
2. **Docker Production Hardening**:
   - Multi-stage build size optimization: Go binary in Alpine ($<25\text{MB}$), Python Slim ($<150\text{MB}$), Nginx ($<30\text{MB}$).
3. **Submission Readiness**:
   - Comprehensive `README.md` with 1-command startup instructions.
   - Validated 100-word product pitch and demo presentation walkthrough.

**Acceptance Criteria (DoD):**
- Fresh `git clone` and `docker compose up --build` runs end-to-end on clean machine in $<45\text{s}$.
- All edge cases pass manual and automated verification matrices.

---

## 3. Risk Management & Failure Mode Analysis (FMEA)

| Potential Risk / Failure | Severity | Likelihood | Technical Mitigation Strategy |
|:---|:---:|:---:|:---|
| **Google API Rate Limiting (429)** | High | Medium | Implement 60s caching in Redis with exponential backoff and batch requests; UI gracefully falls back to cached snapshot with a timestamp badge. |
| **High WebSocket Ingest Concurrency** | High | Low | Golang gateway utilizes `sync.Pool` for buffer recycling and non-blocking epoll sockets, maintaining $<50\text{MB}$ RAM for 10k connections. |
| **React Re-render Thrashing** on 1-min batch ingress | Medium | Low | Decouple ticks into mutable refs; throttle UI pulse flashes using `requestAnimationFrame` (capped at 60 FPS). |
| **Data Desync on Reconnection** after network drop | High | High | Immediately fetch `/api/v1/quotes/snapshot` via REST upon WebSocket reconnection to rebase state before resumption. |

---

## 4. Evaluation Matrix Alignment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GROWW HACKATHON EVALUATION ALIGNMENT                  │
├────────────────────────────────┬────────────────────────────────────────────┤
│ Dimension                      │ Implementation Proof Point                 │
├────────────────────────────────┼────────────────────────────────────────────┤
│ 1. Engineering Depth           │ Google API 1-min ingestion worker, Golang  │
│                                │ WebSocket gateway, Python quant anomaly    │
│                                │ engine, Redis Pub/Sub, PostgreSQL LexoRank.│
│ 2. Product Interpretation      │ "Since You Were Away" Catch-Up Engine,     │
│                                │ Attention Score (0-100), 1-min sync timer. │
│ 3. Edge Cases & Resilience     │ Google API 429 fallback, circuit locks,    │
│                                │ reconnect snapshot rebase, stale badges.   │
│ 4. Code Quality & Simplicity   │ Clean cross-language contracts in api/,    │
│                                │ modular microservices, O(1) LexoRank.      │
│ 5. Originality & Thought       │ Actionable signal vs noise focus, visual   │
│                                │ day-range heat bars, inline L2 depth.      │
└────────────────────────────────┴────────────────────────────────────────────┘
```
