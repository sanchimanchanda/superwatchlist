export type Exchange = 'NSE' | 'BSE' | 'NASDAQ';

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
  tickDirection: 1 | -1 | 0;
  isUpperCircuit: boolean;
  isLowerCircuit: boolean;
  isStale?: boolean;
  sparkline: number[];
  lastUpdated: number;
  nextRefreshInSeconds: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  marketCap: number;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  orderRank: string;
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

export interface MeaningfulAnomaly {
  id: string;
  symbol: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  headline: string;
  description: string;
  attentionScore: number;
  deltaPct?: number;
  rvol?: number;
  timestamp: number;
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
  timestamp: number;
}

export interface MarketDepthLevel {
  price: number;
  orders: number;
  quantity: number;
}

export interface MarketDepth {
  symbol: string;
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  totalBuyQty: number;
  totalSellQty: number;
  buyPressurePct: number;
  spread: number;
  timestamp: number;
}
