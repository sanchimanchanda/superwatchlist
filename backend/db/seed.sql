-- Seed dataset with realistic Indian and Global equities
INSERT INTO tickers (symbol, name, exchange, sector, market_cap, pe_ratio, week_52_high, week_52_low) VALUES
('RELIANCE', 'Reliance Industries Ltd', 'NSE', 'Energy & Petrochemicals', 2018500000000.00, 28.4, 3024.90, 2220.30),
('TCS', 'Tata Consultancy Services Ltd', 'NSE', 'Information Technology', 1612400000000.00, 33.1, 4590.00, 3315.00),
('HDFCBANK', 'HDFC Bank Ltd', 'NSE', 'Banking & Financials', 1254300000000.00, 19.5, 1794.00, 1363.55),
('INFY', 'Infosys Ltd', 'NSE', 'Information Technology', 789200000000.00, 27.8, 1950.00, 1358.35),
('ICICIBANK', 'ICICI Bank Ltd', 'NSE', 'Banking & Financials', 872100000000.00, 18.2, 1300.00, 930.00),
('BHARTIARTL', 'Bharti Airtel Ltd', 'NSE', 'Telecommunications', 894500000000.00, 52.6, 1680.00, 850.00),
('SBIN', 'State Bank of India', 'NSE', 'Public Sector Banking', 742100000000.00, 11.4, 912.00, 555.00),
('TATAMOTORS', 'Tata Motors Ltd', 'NSE', 'Automobiles', 398500000000.00, 16.8, 1179.00, 593.50),
('ITC', 'ITC Ltd', 'NSE', 'FMCG & Consumer', 612400000000.00, 29.3, 515.00, 399.30),
('LT', 'Larsen & Toubro Ltd', 'NSE', 'Engineering & Capital Goods', 518400000000.00, 37.2, 3919.90, 2850.00),
('HINDUNILVR', 'Hindustan Unilever Ltd', 'NSE', 'FMCG & Consumer', 645200000000.00, 58.1, 3035.00, 2172.05),
('BAJFINANCE', 'Bajaj Finance Ltd', 'NSE', 'NBFC & Financials', 452100000000.00, 31.4, 8192.00, 6150.00),
('SUNPHARMA', 'Sun Pharmaceutical Industries Ltd', 'NSE', 'Healthcare & Pharma', 421000000000.00, 38.5, 1960.00, 1110.00),
('MARUTI', 'Maruti Suzuki India Ltd', 'NSE', 'Automobiles', 382400000000.00, 28.9, 13680.00, 9750.00),
('WIPRO', 'Wipro Ltd', 'NSE', 'Information Technology', 285400000000.00, 24.2, 580.00, 375.00),
('TITAN', 'Titan Company Ltd', 'NSE', 'Consumer Durables', 325400000000.00, 88.4, 3886.95, 3055.00),
('ADANIENT', 'Adani Enterprises Ltd', 'NSE', 'Diversified & Infrastructure', 342100000000.00, 94.2, 3350.00, 2150.00),
('TATASTEEL', 'Tata Steel Ltd', 'NSE', 'Metals & Mining', 198500000000.00, 45.1, 184.60, 114.60),
('KOTAKBANK', 'Kotak Mahindra Bank Ltd', 'NSE', 'Banking & Financials', 362400000000.00, 22.1, 1925.00, 1540.00),
('ZOMATO', 'Zomato Ltd', 'NSE', 'Internet & E-Commerce', 245100000000.00, 120.5, 298.00, 98.50),
('AAPL', 'Apple Inc', 'NASDAQ', 'Technology & Consumer Electronics', 3450000000000.00, 34.2, 237.23, 164.08),
('NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Semiconductors & AI', 3120000000000.00, 54.1, 140.76, 45.50),
('GOOGL', 'Alphabet Inc', 'NASDAQ', 'Internet & AI', 2150000000000.00, 24.8, 191.75, 129.40),
('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Software & Cloud', 3200000000000.00, 36.5, 468.35, 309.45),
('TSLA', 'Tesla Inc', 'NASDAQ', 'Automotive & Clean Tech', 780000000000.00, 62.4, 271.00, 138.80)
ON CONFLICT (symbol) DO NOTHING;

-- Seed default user watchlists
INSERT INTO watchlists (id, user_id, title, is_system, created_at, updated_at) VALUES
('wl_nifty_core', 'default_user', 'Nifty 50 Core', false, 1725510000000, 1725510000000),
('wl_tech_growth', 'default_user', 'Tech & AI Growth', false, 1725510000000, 1725510000000),
('wl_smart_active', 'default_user', 'Most Active Now', true, 1725510000000, 1725510000000),
('wl_smart_breakout', 'default_user', '52W Breakouts', true, 1725510000000, 1725510000000)
ON CONFLICT (id) DO NOTHING;

-- Seed default watchlist items with LexoRank strings
INSERT INTO watchlist_items (id, watchlist_id, symbol, order_rank, added_at) VALUES
('item_1', 'wl_nifty_core', 'RELIANCE', '0|hzzzzz:', 1725510000000),
('item_2', 'wl_nifty_core', 'TCS', '0|i00000:', 1725510000000),
('item_3', 'wl_nifty_core', 'HDFCBANK', '0|i00001:', 1725510000000),
('item_4', 'wl_nifty_core', 'INFY', '0|i00002:', 1725510000000),
('item_5', 'wl_nifty_core', 'ICICIBANK', '0|i00003:', 1725510000000),
('item_6', 'wl_nifty_core', 'TATAMOTORS', '0|i00004:', 1725510000000),
('item_7', 'wl_nifty_core', 'BHARTIARTL', '0|i00005:', 1725510000000),
('item_8', 'wl_nifty_core', 'ZOMATO', '0|i00006:', 1725510000000),

('item_9', 'wl_tech_growth', 'TCS', '0|hzzzzz:', 1725510000000),
('item_10', 'wl_tech_growth', 'INFY', '0|i00000:', 1725510000000),
('item_11', 'wl_tech_growth', 'WIPRO', '0|i00001:', 1725510000000),
('item_12', 'wl_tech_growth', 'NVDA', '0|i00002:', 1725510000000),
('item_13', 'wl_tech_growth', 'GOOGL', '0|i00003:', 1725510000000),
('item_14', 'wl_tech_growth', 'MSFT', '0|i00004:', 1725510000000),
('item_15', 'wl_tech_growth', 'AAPL', '0|i00005:', 1725510000000)
ON CONFLICT (id) DO NOTHING;
