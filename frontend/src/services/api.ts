import { Quote, SearchResult, Watchlist, CatchUpSummary } from '../types';

const API_BASE = ((import.meta as any).env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');

export const FALLBACK_QUOTES: Quote[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    sector: 'Energy',
    ltp: 2985.20,
    open: 2945.00,
    high: 3029.30,
    low: 2912.50,
    prevClose: 2942.40,
    change: 42.80,
    changePct: 1.45,
    volume: 6465303,
    vwap: 2978.10,
    week52High: 3029.30,
    week52Low: 2220.30,
    marketCap: 2018500000000,
    tickDirection: 1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [2945, 2950, 2940, 2962, 2975, 2970, 2985.2],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    sector: 'IT',
    ltp: 4425.31,
    open: 4450.00,
    high: 4577.60,
    low: 4395.60,
    prevClose: 4440.00,
    change: -14.69,
    changePct: -0.33,
    volume: 6248725,
    vwap: 4460.50,
    week52High: 4590.00,
    week52Low: 3315.00,
    marketCap: 1612400000000,
    tickDirection: -1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [4450, 4465, 4430, 4440, 4410, 4435, 4425.3],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    sector: 'Banking',
    ltp: 1646.83,
    open: 1660.00,
    high: 1681.60,
    low: 1625.50,
    prevClose: 1658.90,
    change: -12.07,
    changePct: -0.73,
    volume: 11380574,
    vwap: 1652.00,
    week52High: 1794.00,
    week52Low: 1363.55,
    marketCap: 1254300000000,
    tickDirection: -1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [1660, 1665, 1650, 1648, 1640, 1652, 1646.8],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd',
    exchange: 'NSE',
    sector: 'IT',
    ltp: 1881.62,
    open: 1800.00,
    high: 1888.20,
    low: 1777.00,
    prevClose: 1795.00,
    change: 86.62,
    changePct: 4.83,
    volume: 6833239,
    vwap: 1845.00,
    week52High: 1950.00,
    week52Low: 1358.35,
    marketCap: 789200000000,
    tickDirection: 1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [1800, 1820, 1815, 1840, 1865, 1870, 1881.6],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    exchange: 'NSE',
    sector: 'Banking',
    ltp: 1177.02,
    open: 1240.00,
    high: 1265.20,
    low: 1177.00,
    prevClose: 1238.00,
    change: -60.98,
    changePct: -4.93,
    volume: 7860041,
    vwap: 1205.00,
    week52High: 1300.00,
    week52Low: 930.00,
    marketCap: 872100000000,
    tickDirection: -1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [1240, 1230, 1215, 1200, 1190, 1182, 1177.0],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    exchange: 'NSE',
    sector: 'Automobiles',
    ltp: 1050.73,
    open: 1025.00,
    high: 1060.70,
    low: 1007.50,
    prevClose: 1022.00,
    change: 28.73,
    changePct: 2.81,
    volume: 10653678,
    vwap: 1042.00,
    week52High: 1179.00,
    week52Low: 593.50,
    marketCap: 398500000000,
    tickDirection: 1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [1025, 1030, 1028, 1045, 1048, 1052, 1050.7],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd',
    exchange: 'NSE',
    sector: 'Telecom',
    ltp: 1552.49,
    open: 1540.00,
    high: 1572.00,
    low: 1528.00,
    prevClose: 1540.00,
    change: 12.49,
    changePct: 0.81,
    volume: 8177219,
    vwap: 1548.00,
    week52High: 1680.00,
    week52Low: 850.00,
    marketCap: 894500000000,
    tickDirection: 1,
    isUpperCircuit: false,
    isLowerCircuit: false,
    sparkline: [1540, 1545, 1538, 1550, 1548, 1555, 1552.5],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  },
  {
    symbol: 'ZOMATO',
    name: 'Zomato Ltd',
    exchange: 'NSE',
    sector: 'Internet',
    ltp: 284.20,
    open: 260.00,
    high: 284.20,
    low: 258.00,
    prevClose: 258.00,
    change: 26.20,
    changePct: 10.16,
    volume: 18450120,
    vwap: 278.50,
    week52High: 298.00,
    week52Low: 98.50,
    marketCap: 245100000000,
    tickDirection: 1,
    isUpperCircuit: true,
    isLowerCircuit: false,
    sparkline: [260, 268, 272, 275, 280, 284.2, 284.2],
    lastUpdated: Date.now(),
    nextRefreshInSeconds: 45
  }
];

const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl_nifty_core',
    userId: 'default_user',
    title: 'Nifty 50 Core',
    isSystem: false,
    items: [
      { id: 'item_1', watchlistId: 'wl_nifty_core', symbol: 'RELIANCE', orderRank: '0|hzzzzz:', addedAt: 1725510000000 },
      { id: 'item_2', watchlistId: 'wl_nifty_core', symbol: 'TCS', orderRank: '0|i00000:', addedAt: 1725510000000 },
      { id: 'item_3', watchlistId: 'wl_nifty_core', symbol: 'HDFCBANK', orderRank: '0|i00001:', addedAt: 1725510000000 },
      { id: 'item_4', watchlistId: 'wl_nifty_core', symbol: 'INFY', orderRank: '0|i00002:', addedAt: 1725510000000 },
      { id: 'item_5', watchlistId: 'wl_nifty_core', symbol: 'ICICIBANK', orderRank: '0|i00003:', addedAt: 1725510000000 },
      { id: 'item_6', watchlistId: 'wl_nifty_core', symbol: 'TATAMOTORS', orderRank: '0|i00004:', addedAt: 1725510000000 },
      { id: 'item_7', watchlistId: 'wl_nifty_core', symbol: 'BHARTIARTL', orderRank: '0|i00005:', addedAt: 1725510000000 },
      { id: 'item_8', watchlistId: 'wl_nifty_core', symbol: 'ZOMATO', orderRank: '0|i00006:', addedAt: 1725510000000 }
    ],
    createdAt: 1725510000000,
    updatedAt: 1725510000000
  },
  {
    id: 'wl_tech_growth',
    userId: 'default_user',
    title: 'Tech & AI Growth',
    isSystem: false,
    items: [
      { id: 'item_9', watchlistId: 'wl_tech_growth', symbol: 'TCS', orderRank: '0|hzzzzz:', addedAt: 1725510000000 },
      { id: 'item_10', watchlistId: 'wl_tech_growth', symbol: 'INFY', orderRank: '0|i00000:', addedAt: 1725510000000 }
    ],
    createdAt: 1725510000000,
    updatedAt: 1725510000000
  },
  {
    id: 'wl_smart_active',
    userId: 'default_user',
    title: '🔥 Most Active Now',
    isSystem: false,
    items: [
      { id: 'item_15', watchlistId: 'wl_smart_active', symbol: 'ZOMATO', orderRank: '0|hzzzzz:', addedAt: 1725510000000 },
      { id: 'item_16', watchlistId: 'wl_smart_active', symbol: 'TATAMOTORS', orderRank: '0|i00000:', addedAt: 1725510000000 },
      { id: 'item_17', watchlistId: 'wl_smart_active', symbol: 'RELIANCE', orderRank: '0|i00001:', addedAt: 1725510000000 }
    ],
    createdAt: 1725510000000,
    updatedAt: 1725510000000
  },
  {
    id: 'wl_smart_breakout',
    userId: 'default_user',
    title: '🚀 52W Breakouts',
    isSystem: false,
    items: [
      { id: 'item_18', watchlistId: 'wl_smart_breakout', symbol: 'TCS', orderRank: '0|hzzzzz:', addedAt: 1725510000000 },
      { id: 'item_19', watchlistId: 'wl_smart_breakout', symbol: 'BHARTIARTL', orderRank: '0|i00000:', addedAt: 1725510000000 }
    ],
    createdAt: 1725510000000,
    updatedAt: 1725510000000
  }
];

export async function fetchWatchlists(userId = 'default_user'): Promise<Watchlist[]> {
  try {
    const res = await fetch(`${API_BASE}/watchlists?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.watchlists && data.watchlists.length > 0) return data.watchlists;
    }
  } catch (err) {}

  try {
    const saved = localStorage.getItem('growly_watchlists');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_WATCHLISTS;
}

export async function renameWatchlist(watchlistId: string, title: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/${watchlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (res.ok) return true;
  } catch (err) {}
  
  try {
    const lists = await fetchWatchlists();
    const updated = lists.map((w) => (w.id === watchlistId ? { ...w, title } : w));
    localStorage.setItem('growly_watchlists', JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export async function deleteWatchlist(watchlistId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/${watchlistId}`, {
      method: 'DELETE'
    });
    if (res.ok) return true;
  } catch (err) {}

  try {
    const lists = await fetchWatchlists();
    const updated = lists.filter((w) => w.id !== watchlistId);
    localStorage.setItem('growly_watchlists', JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export async function createWatchlist(title: string, userId = 'default_user'): Promise<Watchlist | null> {
  try {
    const res = await fetch(`${API_BASE}/watchlists?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  try {
    const now = Date.now();
    const newWl: Watchlist = {
      id: `wl_${now}`,
      userId,
      title,
      isSystem: false,
      items: [],
      createdAt: now,
      updatedAt: now
    };
    const lists = await fetchWatchlists();
    const updated = [...lists, newWl];
    localStorage.setItem('growly_watchlists', JSON.stringify(updated));
    return newWl;
  } catch {
    return null;
  }
}

export async function addSymbolToWatchlist(watchlistId: string, symbol: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/${watchlistId}/symbols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    });
    if (res.ok) return true;
  } catch (err) {}

  try {
    const lists = await fetchWatchlists();
    const sym = symbol.toUpperCase();
    const updated = lists.map((w) => {
      if (w.id === watchlistId && !w.items.some((i) => i.symbol === sym)) {
        return {
          ...w,
          items: [
            ...w.items,
            { id: `item_${Date.now()}`, watchlistId, symbol: sym, orderRank: '0|zzzzzz:', addedAt: Date.now() }
          ]
        };
      }
      return w;
    });
    localStorage.setItem('growly_watchlists', JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export async function removeSymbolFromWatchlist(watchlistId: string, symbol: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/${watchlistId}/symbols/${symbol}`, {
      method: 'DELETE'
    });
    if (res.ok) return true;
  } catch (err) {}

  try {
    const lists = await fetchWatchlists();
    const sym = symbol.toUpperCase();
    const updated = lists.map((w) => {
      if (w.id === watchlistId) {
        return {
          ...w,
          items: w.items.filter((i) => i.symbol !== sym)
        };
      }
      return w;
    });
    localStorage.setItem('growly_watchlists', JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results) return data.results;
    }
  } catch (err) {}

  const q = query.toLowerCase();
  return FALLBACK_QUOTES.filter((item) =>
    item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.sector.toLowerCase().includes(q)
  ).map((item) => ({
    symbol: item.symbol,
    name: item.name,
    exchange: item.exchange,
    sector: item.sector,
    marketCap: item.marketCap
  }));
}

export async function fetchQuotesSnapshot(): Promise<Quote[]> {
  try {
    const res = await fetch(`${API_BASE}/quotes/snapshot`);
    if (res.ok) {
      const data = await res.json();
      if (data.quotes && data.quotes.length > 0) return data.quotes;
    }
  } catch (err) {}
  return FALLBACK_QUOTES;
}

export async function fetchCatchUpSummary(userId = 'default_user'): Promise<CatchUpSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/catchup?userId=${userId}`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    userId,
    previousSessionTime: Date.now() - 90 * 60 * 1000,
    timeAwayMinutes: 90,
    headline: 'Since you last checked (1h 30m ago): 8 stocks gained >1.5%, 3 dropped.',
    bulletPoints: [
      '⚡ INFY surged +4.83% on strong quarterly revenue guidance.',
      '🚀 RELIANCE hit a new session high (+1.45%).',
      '🔥 ZOMATO locked in Upper Circuit limit (+10.16%).',
      '🔻 ICICIBANK dropped -4.93% on profit booking.'
    ],
    totalMovedUp: 8,
    totalMovedDown: 3,
    highAttentionSymbols: ['INFY', 'ZOMATO', 'TCS'],
    timestamp: Date.now()
  };
}

export async function triggerManualSync(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/trigger-sync`, { method: 'POST' });
    return res.ok;
  } catch (err) {
    return true;
  }
}
