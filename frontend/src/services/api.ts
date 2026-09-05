import { Quote, SearchResult, Watchlist, CatchUpSummary } from '../types';

const API_BASE = '/api/v1';

export async function fetchWatchlists(userId = 'default_user'): Promise<Watchlist[]> {
  try {
    const res = await fetch(`${API_BASE}/watchlists?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch watchlists');
    const data = await res.json();
    return data.watchlists || [];
  } catch (err) {
    console.error('fetchWatchlists error:', err);
    return [];
  }
}

export async function createWatchlist(title: string, userId = 'default_user'): Promise<Watchlist | null> {
  try {
    const res = await fetch(`${API_BASE}/watchlists?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error('Failed to create watchlist');
    return await res.json();
  } catch (err) {
    console.error('createWatchlist error:', err);
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
    return res.ok;
  } catch (err) {
    console.error('addSymbol error:', err);
    return false;
  }
}

export async function removeSymbolFromWatchlist(watchlistId: string, symbol: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/${watchlistId}/symbols/${symbol}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('removeSymbol error:', err);
    return false;
  }
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('search error:', err);
    return [];
  }
}

export async function fetchQuotesSnapshot(): Promise<Quote[]> {
  try {
    const res = await fetch(`${API_BASE}/quotes/snapshot`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.quotes || [];
  } catch (err) {
    console.error('snapshot error:', err);
    return [];
  }
}

export async function fetchCatchUpSummary(userId = 'default_user'): Promise<CatchUpSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/catchup?userId=${userId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('catchup summary error:', err);
    return null;
  }
}

export async function triggerManualSync(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/trigger-sync`, { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('manual sync error:', err);
    return false;
  }
}
