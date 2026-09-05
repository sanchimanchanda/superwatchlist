import { Quote } from '../types';

const SESSION_KEY = 'smart_watchlist_last_session';

export function saveSessionSnapshot(quotes: Quote[]) {
  try {
    const snapshot = {
      timestamp: Date.now(),
      quotes: quotes.map((q) => ({
        symbol: q.symbol,
        ltp: q.ltp,
        high: q.high,
        low: q.low
      }))
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch (err) {
    // Ignore localStorage errors
  }
}

export function getPreviousSessionSnapshot() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}
