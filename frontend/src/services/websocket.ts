import { Quote, MeaningfulAnomaly } from '../types';

type TickCallback = (quotes: Quote[]) => void;
type AnomalyCallback = (anomaly: MeaningfulAnomaly) => void;

export class MarketWebSocketClient {
  private socket: WebSocket | null = null;
  private tickCallbacks: Set<TickCallback> = new Set();
  private anomalyCallbacks: Set<AnomalyCallback> = new Set();
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private retryCount = 0;
  private isExplicitClose = false;

  connect() {
    this.isExplicitClose = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected successfully');
      this.retryCount = 0;
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
      } catch (err) {
        // Ignored JSON parse errors
      }
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      if (!this.isExplicitClose) {
        const delay = Math.min(15000, 1000 * Math.pow(1.5, this.retryCount));
        this.retryCount++;
        console.log(`WebSocket closed. Reconnecting in ${Math.round(delay)}ms...`);
        this.reconnectTimeout = window.setTimeout(() => this.connect(), delay);
      }
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
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
    if (this.socket) this.socket.close();
  }
}

export const wsClient = new MarketWebSocketClient();
