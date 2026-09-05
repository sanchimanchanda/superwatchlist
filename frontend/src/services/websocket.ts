import { Quote, MeaningfulAnomaly } from '../types';
import { FALLBACK_QUOTES } from './api';

type TickCallback = (quotes: Quote[]) => void;
type AnomalyCallback = (anomaly: MeaningfulAnomaly) => void;

export class MarketWebSocketClient {
  private socket: WebSocket | null = null;
  private tickCallbacks: Set<TickCallback> = new Set();
  private anomalyCallbacks: Set<AnomalyCallback> = new Set();
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private fallbackInterval: number | null = null;
  private retryCount = 0;
  private isExplicitClose = false;
  private liveQuotes: Quote[] = [...FALLBACK_QUOTES];

  connect() {
    this.isExplicitClose = false;
    
    // Attempt WebSocket connection
    try {
      const explicitUrl = (import.meta as any).env.VITE_WS_URL;
      let wsUrl: string;
      if (explicitUrl) {
        wsUrl = explicitUrl;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/ws`;
      }

      // If running on static vercel.app without dedicated backend, start fallback simulator
      if (window.location.hostname.includes('vercel.app')) {
        this.startFallbackSimulator();
        return;
      }

      console.log(`Connecting to WebSocket at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.retryCount = 0;
        this.stopFallbackSimulator();
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'TICK_BATCH' && payload.data?.symbols) {
            this.tickCallbacks.forEach((cb) => cb(payload.data.symbols));
          } else if (payload.type === 'ANOMALY_ALERT' && payload.data) {
            this.anomalyCallbacks.forEach((cb) => cb(payload.data));
          }
        } catch (err) {}
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitClose) {
          const delay = Math.min(10000, 1000 * Math.pow(1.5, this.retryCount));
          this.retryCount++;
          if (this.retryCount > 2) {
            this.startFallbackSimulator();
          }
          this.reconnectTimeout = window.setTimeout(() => this.connect(), delay);
        }
      };

      this.socket.onerror = () => {
        if (this.retryCount > 1) {
          this.startFallbackSimulator();
        }
      };
    } catch {
      this.startFallbackSimulator();
    }
  }

  private startFallbackSimulator() {
    if (this.fallbackInterval) return;
    console.log('Starting Client-Side Live Ingestion Stream Simulator');
    
    this.fallbackInterval = window.setInterval(() => {
      // Simulate real-time 1-minute Google Finance price update batch
      const updated = this.liveQuotes.map((q) => {
        const delta = (Math.random() - 0.48) * (q.ltp * 0.004);
        const newLtp = Math.max(1, Math.round((q.ltp + delta) * 100) / 100);
        const change = Math.round((newLtp - q.prevClose) * 100) / 100;
        const changePct = Math.round((change / q.prevClose) * 10000) / 100;
        const newHigh = Math.max(q.high, newLtp);
        const newLow = Math.min(q.low, newLtp);
        const sparkline = [...q.sparkline.slice(1), newLtp];

        return {
          ...q,
          ltp: newLtp,
          change,
          changePct,
          high: newHigh,
          low: newLow,
          volume: q.volume + Math.floor(Math.random() * 25000),
          tickDirection: (newLtp >= q.ltp ? 1 : -1) as 1 | -1,
          sparkline,
          lastUpdated: Date.now()
        };
      });

      this.liveQuotes = updated;
      this.tickCallbacks.forEach((cb) => cb(updated));

      // Randomly emit real-time meaningful anomaly alert
      if (Math.random() > 0.7) {
        const randomStock = updated[Math.floor(Math.random() * updated.length)];
        const isUp = randomStock.changePct >= 0;
        const alert: MeaningfulAnomaly = {
          id: `anom_${Date.now()}`,
          symbol: randomStock.symbol,
          type: isUp ? 'RVOL_SURGE' : 'VOLATILITY_SPIKE',
          severity: 'HIGH',
          headline: `${randomStock.symbol} ${isUp ? 'Surging on Heavy Inflow' : 'Sudden Selling Pressure'} (${isUp ? '+' : ''}${randomStock.changePct.toFixed(2)}%)`,
          description: `Relative volume spiked to ${(2.5 + Math.random() * 2).toFixed(1)}x with high buy/sell velocity.`,
          attentionScore: Math.floor(75 + Math.random() * 20),
          timestamp: Date.now()
        };
        this.anomalyCallbacks.forEach((cb) => cb(alert));
      }
    }, 15000);
  }

  private stopFallbackSimulator() {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  onTick(cb: TickCallback) {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  onAnomaly(cb: AnomalyCallback) {
    this.anomalyCallbacks.add(cb);
    return () => this.anomalyCallbacks.delete(cb);
  }

  disconnect() {
    this.isExplicitClose = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopHeartbeat();
    this.stopFallbackSimulator();
    if (this.socket) this.socket.close();
  }
}

export const wsClient = new MarketWebSocketClient();
