import React, { useRef, useEffect } from 'react';
import { X, TrendingUp, BarChart2 } from 'lucide-react';
import { Quote } from '../types';

interface ChartDrawerProps {
  quote: Quote;
  onClose: () => void;
}

export const ChartDrawer: React.FC<ChartDrawerProps> = ({ quote, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Synthesize 25 1-minute intraday candles around quote sparkline
    const spark = quote.sparkline || [];
    if (spark.length < 2) return;

    const candles = spark.map((p, i) => {
      const open = i > 0 ? spark[i - 1] : p * 0.998;
      const close = p;
      const high = Math.max(open, close) + p * 0.002;
      const low = Math.min(open, close) - p * 0.002;
      const vol = Math.floor(Math.random() * 80000) + 10000;
      return { open, close, high, low, vol };
    });

    const minPrice = Math.min(...candles.map((c) => c.low));
    const maxPrice = Math.max(...candles.map((c) => c.high));
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = 14;
    const spacing = 22;
    const chartHeight = 220;
    const volHeight = 60;

    // Draw candles
    candles.forEach((c, i) => {
      const x = 30 + i * spacing;
      const isUp = c.close >= c.open;
      const color = isUp ? '#00c087' : '#eb5b3c';

      const yHigh = chartHeight - ((c.high - minPrice) / priceRange) * chartHeight + 10;
      const yLow = chartHeight - ((c.low - minPrice) / priceRange) * chartHeight + 10;
      const yOpen = chartHeight - ((c.open - minPrice) / priceRange) * chartHeight + 10;
      const yClose = chartHeight - ((c.close - minPrice) / priceRange) * chartHeight + 10;

      // Wick
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyY = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
      ctx.fillRect(x, bodyY, candleWidth, bodyHeight);

      // Volume bar
      const maxVol = 100000;
      const barH = (c.vol / maxVol) * volHeight;
      ctx.fillStyle = isUp ? 'rgba(0, 192, 135, 0.3)' : 'rgba(235, 91, 60, 0.3)';
      ctx.fillRect(x, height - barH, candleWidth, barH);
    });

    // Horizontal Price Lines (Grid)
    ctx.strokeStyle = '#263248';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + i * (chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();

      const priceVal = maxPrice - (i / 4) * priceRange;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`₹${priceVal.toFixed(1)}`, width - 65, y - 3);
    }

  }, [quote]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '700px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{quote.symbol}</span>
              <span className="badge badge-blue">{quote.exchange}</span>
              <span className="badge badge-purple">1-Min Candles</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{quote.name} • {quote.sector}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="num-tabular" style={{ fontSize: '20px', fontWeight: 700 }}>
                ₹{quote.ltp.toFixed(2)}
              </div>
              <div className={`badge ${quote.change >= 0 ? 'badge-green' : 'badge-red'}`}>
                {quote.change >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Canvas Chart Area */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '300px', display: 'block' }} />
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '16px', fontSize: '11px', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Day VWAP</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px' }}>₹{quote.vwap.toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Day Volume</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px' }}>{quote.volume.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>52W High</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-green)' }}>₹{quote.week52High.toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>52W Low</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-red)' }}>₹{quote.week52Low.toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Market Cap</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px' }}>₹{(quote.marketCap / 1e9).toFixed(1)}B</div>
          </div>
        </div>
      </div>
    </div>
  );
};
