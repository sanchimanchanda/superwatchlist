/**
 * Shared Type Definitions for Smart Market Watchlist
 * Single source of truth across Golang Gateway, Python Analytics, and React Frontend.
 */

export type Exchange = 'NSE' | 'BSE' | 'NASDAQ';

export interface Ticker {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: string;
  marketCap: number;
  peRatio?: number;
  week52High: number;
  week52Low: number;
}

export interface Quote {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number;
  vwap: number;
  week52High: number;
  week52Low: number;
  marketCap: number;
  tickDirection: 1 | -1 | 0; // 1: Uptick, -1: Downtick, 0: Neutral
  isUpperCircuit: boolean;
  isLowerCircuit: boolean;
  isStale?: boolean;
  sparkline: number[]; // 20-30 intraday normalized points
  lastUpdated: number; // Unix timestamp ms
  nextRefreshInSeconds: number;
}

export interface MarketDepthLevel {
  price: number;
  orders: number;
  quantity: number;
}

export interface MarketDepth {
  symbol: string;
  bids: MarketDepthLevel[]; // Top 5 buy orders
  asks: MarketDepthLevel[]; // Top 5 sell orders
  totalBuyQty: number;
  totalSellQty: number;
  buyPressurePct: number;
  spread: number;
  timestamp: number;
}

export type AnomalyType =
  | 'SESSION_DELTA'
  | 'VOLUME_SURGE'
  | '52W_HIGH_BREAKOUT'
  | '52W_LOW_BREAKDOWN'
  | 'CIRCUIT_LOCK_UC'
  | 'CIRCUIT_LOCK_LC'
  | 'VWAP_CROSS';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MeaningfulAnomaly {
  id: string;
  symbol: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  headline: string;
  description: string;
  attentionScore: number; // 0 - 100
  deltaPct?: number;
  rvol?: number;
  timestamp: number;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  orderRank: string; // LexoRank string for O(1) reordering
  addedAt: number;
}

export interface Watchlist {
  id: string;
  userId: string;
  title: string;
  isSystem: boolean;
  items: WatchlistItem[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionSnapshot {
  userId: string;
  symbol: string;
  lastSeenPrice: number;
  lastSeenTimestamp: number;
  seenHigh: number;
  seenLow: number;
}

export interface CatchUpSummary {
  userId: string;
  previousSessionTime: number;
  timeAwayMinutes: number;
  headline: string;
  bulletPoints: string[];
  totalMovedUp: number;
  totalMovedDown: number;
  highAttentionSymbols: string[];
  anomalies: MeaningfulAnomaly[];
}

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'GTE' | 'LTE';
  isTriggered: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface WebSocketMessage<T = unknown> {
  type: 'TICK_BATCH' | 'ANOMALY_ALERT' | 'DEPTH_UPDATE' | 'HEARTBEAT_PONG';
  data: T;
  timestamp: number;
}
