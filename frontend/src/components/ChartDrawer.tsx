import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Quote } from '../types';

interface ChartDrawerProps {
  quote: Quote;
  onOpenOrder?: (quote: Quote, side: 'BUY' | 'SELL') => void;
  onClose: () => void;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
}

export const ChartDrawer: React.FC<ChartDrawerProps> = ({ quote, onOpenOrder, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '5M' | '15M' | '1D'>('1M');

  // Timeframe config: candle count & interval in minutes (1D uses day-offset labels)
  const tfConfig: Record<'1M' | '5M' | '15M' | '1D', { count: number; intervalMin: number }> = {
    '1M':  { count: 60, intervalMin: 1  },
    '5M':  { count: 48, intervalMin: 5  },
    '15M': { count: 24, intervalMin: 15 },
    '1D':  { count: 30, intervalMin: 0  }, // 0 = use day labels
  };

  // Generate realistic OHLCV candles based on selected timeframe
  const candles: Candle[] = useMemo(() => {
    const { count, intervalMin } = tfConfig[selectedTimeframe];

    const spark = quote.sparkline && quote.sparkline.length >= 2
      ? quote.sparkline
      : [
          quote.prevClose,
          quote.open,
          (quote.open + quote.high) / 2,
          quote.low,
          (quote.low + quote.ltp) / 2,
          quote.high,
          quote.ltp
        ];

    const generated: Candle[] = [];
    const highCap = quote.high || quote.ltp * 1.01;
    const lowCap = quote.low || quote.ltp * 0.99;

    // Seed the noise differently per timeframe so charts look distinct
    const tfSeed = selectedTimeframe === '1M' ? 1.0 : selectedTimeframe === '5M' ? 1.7 : selectedTimeframe === '15M' ? 2.3 : 3.1;

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const sparkIndex = Math.min(spark.length - 1, Math.floor(progress * (spark.length - 1)));
      const targetLtp = spark[sparkIndex];

      const noise = (Math.sin(i * tfSeed) * 0.002 + (i % 3 === 0 ? 0.0015 : -0.0015)) * targetLtp;
      const openPrice: number = i === 0 ? (quote.open || targetLtp * 0.998) : generated[i - 1].close;
      const closePrice: number = i === count - 1 ? quote.ltp : Math.max(lowCap, Math.min(highCap, targetLtp + noise));
      const highPrice: number = Math.min(highCap, Math.max(openPrice, closePrice) + Math.abs(noise) * 0.8 + 0.5);
      const lowPrice: number = Math.max(lowCap, Math.min(openPrice, closePrice) - Math.abs(noise) * 0.8 - 0.5);
      const volume: number = Math.floor((quote.volume / count) * (0.6 + Math.random() * 0.8));

      let timeStr: string;
      if (selectedTimeframe === '1D') {
        // Show last N trading days (approx)
        const daysAgo = count - 1 - i;
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        timeStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else {
        const totalMinutes = 9 * 60 + 15 + i * intervalMin;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }

      generated.push({
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        close: closePrice,
        volume,
        time: timeStr
      });
    }
    return generated;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, selectedTimeframe]);

  // Render Canvas Candlestick Chart
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

    const minPrice = Math.min(...candles.map((c) => c.low));
    const maxPrice = Math.max(...candles.map((c) => c.high));
    const priceRange = Math.max(1, maxPrice - minPrice);

    const leftPadding = 15;
    const rightPadding = 65;
    const availableWidth = width - leftPadding - rightPadding;
    const candleWidth = Math.max(6, Math.floor((availableWidth / candles.length) * 0.65));
    const spacing = availableWidth / candles.length;
    const chartHeight = 220;
    const volHeight = 55;

    // Horizontal Price Lines (Grid)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 15 + i * (chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(leftPadding, y);
      ctx.lineTo(width - rightPadding, y);
      ctx.stroke();

      const priceVal = maxPrice - (i / 4) * priceRange;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`₹${priceVal.toFixed(2)}`, width - 58, y + 3);
    }

    // Draw Candlesticks & Volume Bars
    const maxVol = Math.max(...candles.map((c) => c.volume)) || 1;

    candles.forEach((c, i) => {
      const x = leftPadding + i * spacing + (spacing - candleWidth) / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? '#00c087' : '#eb5b3c';

      const yHigh = 15 + chartHeight - ((c.high - minPrice) / priceRange) * chartHeight;
      const yLow = 15 + chartHeight - ((c.low - minPrice) / priceRange) * chartHeight;
      const yOpen = 15 + chartHeight - ((c.open - minPrice) / priceRange) * chartHeight;
      const yClose = 15 + chartHeight - ((c.close - minPrice) / priceRange) * chartHeight;

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

      // Volume bar at bottom
      const barH = (c.volume / maxVol) * volHeight;
      ctx.fillStyle = isUp ? 'rgba(0, 192, 135, 0.25)' : 'rgba(235, 91, 60, 0.25)';
      ctx.fillRect(x, height - barH, candleWidth, barH);
    });

    // VWAP Trendline overlay
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    candles.forEach((c, i) => {
      const x = leftPadding + i * spacing + spacing / 2;
      const avgPrice = (c.open + c.high + c.low + c.close) / 4;
      const y = 15 + chartHeight - ((avgPrice - minPrice) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

  }, [candles, quote, selectedTimeframe]);

  const isUp = quote.change >= 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '740px', maxWidth: '95vw', padding: '24px', animation: 'fadeIn 0.2s ease-out' }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>{quote.symbol}</span>
              <span className="badge badge-blue">{quote.exchange}</span>
              <span className="badge badge-purple">Live Candlesticks</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {quote.name} • {quote.sector}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="num-tabular" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{quote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`badge ${isUp ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '2px' }}>
                {isUp ? '+' : ''}{quote.changePct.toFixed(2)}% ({isUp ? '+' : ''}₹{quote.change.toFixed(2)})
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close chart"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Timeframe Bar & Indicators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          background: 'var(--bg-secondary)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['1M', '5M', '15M', '1D'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  background: selectedTimeframe === tf ? 'var(--bg-card)' : 'transparent',
                  color: selectedTimeframe === tf ? 'var(--color-green)' : 'var(--text-muted)',
                  border: selectedTimeframe === tf ? '1px solid var(--border-color)' : 'none',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }} /> VWAP Line
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: '#00c087', borderRadius: '50%' }} /> Bull Candle
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: '#eb5b3c', borderRadius: '50%' }} /> Bear Candle
            </span>
          </div>
        </div>

        {/* Canvas Candlestick Chart Area */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '300px', display: 'block' }} />
        </div>

        {/* Quick Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '14px', fontSize: '11px', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Day VWAP</div>
            <div className="num-tabular" style={{ fontWeight: 700, marginTop: '2px' }}>₹{quote.vwap.toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Day Volume</div>
            <div className="num-tabular" style={{ fontWeight: 700, marginTop: '2px' }}>{quote.volume.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>52W High</div>
            <div className="num-tabular" style={{ fontWeight: 700, marginTop: '2px', color: 'var(--color-green)' }}>₹{quote.week52High.toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>52W Low</div>
            <div className="num-tabular" style={{ fontWeight: 700, marginTop: '2px', color: 'var(--color-red)' }}>₹{quote.week52Low.toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Market Cap</div>
            <div className="num-tabular" style={{ fontWeight: 700, marginTop: '2px' }}>₹{(quote.marketCap / 1e9).toFixed(1)}B</div>
          </div>
        </div>

        {/* 1-Click Fast Execution Strip */}
        {onOpenOrder && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrder(quote, 'BUY');
              }}
              style={{
                flex: 1,
                background: 'var(--color-green)',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              BUY {quote.symbol}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrder(quote, 'SELL');
              }}
              style={{
                flex: 1,
                background: 'var(--color-red)',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              SELL {quote.symbol}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
