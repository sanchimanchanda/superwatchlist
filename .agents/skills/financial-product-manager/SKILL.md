---
name: financial-product-manager
description: >-
  Expertise of a seasoned Financial Product Manager specializing in capital markets,
  equities, derivatives, and high-engagement Stock Watchlist UX/UI and architecture.
---

# Financial Product Manager Skill: Capital Markets & Stock Watchlist

## 🎯 Role Overview
As a Principal / Lead Product Manager with extensive experience in FinTech and Financial Markets, this skill guides the creation of institutional-grade and consumer-friendly stock trading platforms, focusing specifically on **Stock Watchlist Creation, Market Intelligence, and Real-Time Trader UX**.

---

## 🏛️ Core Financial Domain Expertise

### 1. Market Mechanics & Data Feeds
- **Tick-by-Tick & L1/L2/L3 Market Depth**:
  - L1 (Top of book): Best Bid / Best Ask (BBO), Last Traded Price (LTP), Volume, Day Open/High/Low/Close (OHLC), Net Change & % Change.
  - L2 (5-level / 20-level market depth): Bid/Ask quantities, order counts, spread analysis, buyer/seller ratio.
  - L3 (Order by order): Full depth queue, microstructure analysis.
- **Trading Sessions & Status**:
  - Pre-market auction (order collection & discovery), Regular Trading hours, Post-market closing session.
  - Circuit Breakers & Price Bands: Upper Circuit (UC) / Lower Circuit (LC), Volatility halt mechanisms, trade-for-trade (T2T) segments.
- **Corporate Actions & Fundamentals**:
  - Ex-date / Record-date adjustments for stock splits, dividends, rights issues, bonus shares, earnings announcements, quarterly results badges.

---

## 📋 Stock Watchlist: Product Requirements & UX Architecture

### 1. Multi-Watchlist Management
- **Hierarchical Tabs & Categorization**:
  - Support for 5–20 customizable watchlists per user (e.g., "Nifty 50 Core", "Tech Momentum", "Breakout Scans", "High Dividend", "F&O Active").
  - Seamless tab creation, renaming, reordering (drag & drop), duplication, and deletion.
  - Pre-built System Watchlists: Indices overview, Top Gainers/Losers, 52-Week Highs/Lows, Most Active by Volume/Value.

### 2. Fast Symbol Discovery & Search
- **Instant Search / Autocomplete (<50ms response)**:
  - Multi-attribute search: Ticker symbol, Company Name, ISIN, Exchange (NSE, BSE, NASDAQ, NYSE), Asset Class (Equity, ETF, Index, Futures, Options).
  - Highlighting matching query strings and recent searches.
  - 1-click "Add to Watchlist" toggle with instant visual feedback and multi-watchlist selector.

### 3. High-Density Real-Time UI / Data Columns
- **Key Metrics Displayed Per Row**:
  - Symbol & Company Name with Exchange and Sector badge.
  - LTP (Last Traded Price) with tick animation (Green pulse for uptick, Red pulse for downtick).
  - Absolute Change & Percentage Change (color-coded badge).
  - Real-time Sparkline (Mini intraday line chart displaying trend relative to previous close).
  - Day Range Bar (visual indicator of where LTP sits between Day Low and Day High).
  - 52-Week Range indicator and Volume metrics.
- **Customizable Columns**:
  - User can toggle and reorder columns: Open, High, Low, Prev Close, VWAP, ATP, P/E, Market Cap, 1-Month Return, RSI(14).

### 4. Interactive Quick Actions & Trader Workflow
- **Row Hover / Swipe Actions**:
  - Quick **Buy** and **Sell** buttons triggering order entry modal.
  - **Depth Modal / Drawer**: 5-depth bid/ask ladder with visual volume bars.
  - **Interactive Chart Trigger**: Jump straight to full Candlestick Chart (TradingView / Lightweight Charts) with technical indicators.
  - **Price Alerts Trigger**: Fast alert setup (e.g., "Alert when Reliance > 3000").
  - **Pin to Top / Reorder**: Drag-handle for custom watchlist arrangement.

### 5. Filter, Sort, & Screener Capabilities
- **Dynamic Sorting**: Instant client-side sorting by % Change (Asc/Desc), LTP, Volume, Alphabetical, or Custom Drag Order.
- **Tagging & Color Labels**: Allow traders to flag stocks with colored tags (e.g., Green = Buy Candidate, Red = Watch for breakdown, Yellow = Earnings soon).
- **Market Heatmap Mode**: Option to toggle watchlist view from list table to interactive tree map/tile heatmap sized by market cap or volume.

---

## 🔒 Edge Cases, Resilience & User Trust
1. **Network Disconnection / Reconnection**:
   - Distinct visual state for stale data (grayed-out status with "Reconnecting..." badge).
   - Re-sync snapshot on reconnect to prevent displaying ghost prices.
2. **Circuit Limit Locks**:
   - Visual indicator when a stock hits Upper Circuit or Lower Circuit with zero sellers/buyers.
3. **Optimistic Updates & Cloud Sync**:
   - Reordering and adding/removing symbols must reflect instantly on the UI while syncing asynchronously with the backend database.
   - Cross-tab / cross-device synchronization via WebSockets or BroadcastChannel.
