-- Database initialization schema for Smart Market Watchlist

CREATE TABLE IF NOT EXISTS tickers (
    symbol VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(16) NOT NULL DEFAULT 'NSE',
    sector VARCHAR(128) NOT NULL,
    market_cap NUMERIC(20, 2) NOT NULL DEFAULT 0,
    pe_ratio NUMERIC(10, 2) DEFAULT 0,
    week_52_high NUMERIC(14, 2) NOT NULL,
    week_52_low NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlists (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id VARCHAR(64) PRIMARY KEY,
    watchlist_id VARCHAR(64) NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
    order_rank VARCHAR(64) NOT NULL, -- LexoRank string
    added_at BIGINT NOT NULL,
    CONSTRAINT unique_watchlist_symbol UNIQUE (watchlist_id, symbol)
);

CREATE TABLE IF NOT EXISTS user_session_snapshots (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    last_seen_price NUMERIC(14, 2) NOT NULL,
    last_seen_timestamp BIGINT NOT NULL,
    seen_high NUMERIC(14, 2) NOT NULL,
    seen_low NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_time ON user_session_snapshots(user_id, last_seen_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_rank ON watchlist_items(watchlist_id, order_rank ASC);

CREATE TABLE IF NOT EXISTS price_alerts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL REFERENCES tickers(symbol),
    target_price NUMERIC(14, 2) NOT NULL,
    condition VARCHAR(8) NOT NULL, -- 'GTE' or 'LTE'
    is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    triggered_at BIGINT
);
