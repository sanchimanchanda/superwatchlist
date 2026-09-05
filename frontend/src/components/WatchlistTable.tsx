import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart2,
  Trash2,
  Sparkles,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Quote } from '../types';
import { Sparkline } from './Sparkline';
import { DayRangeBar } from './DayRangeBar';

interface WatchlistTableProps {
  quotes: Quote[];
  onOpenDepth: (quote: Quote) => void;
  onOpenChart: (quote: Quote) => void;
  onOpenOrder: (quote: Quote, side: 'BUY' | 'SELL') => void;
  onRemoveSymbol?: (symbol: string) => void;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  quotes,
  onOpenDepth,
  onOpenChart,
  onOpenOrder,
  onRemoveSymbol
}) => {
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, 'up' | 'down'>>({});

  // Flash row or LTP on quote update
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;
    const newFlashes: Record<string, 'up' | 'down'> = {};
    quotes.forEach((q) => {
      if (q.tickDirection === 1) newFlashes[q.symbol] = 'up';
      else if (q.tickDirection === -1) newFlashes[q.symbol] = 'down';
    });

    setFlashingSymbols(newFlashes);
    const timer = setTimeout(() => setFlashingSymbols({}), 1200);
    return () => clearTimeout(timer);
  }, [quotes]);

  if (!quotes || quotes.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No securities in this view</div>
        <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
          Use the global search bar above to find and add equities, or switch to another watchlist tab.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Company & Symbol</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>LTP (₹)</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Change (%)</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Intraday Trend</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Day Range</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Signals & Attention</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Volume</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const isUp = q.change >= 0;
              const flashClass = flashingSymbols[q.symbol] === 'up' ? 'flash-up' : flashingSymbols[q.symbol] === 'down' ? 'flash-down' : '';
              
              // Signal badges
              const isNear52WHigh = q.ltp >= q.week52High * 0.995;
              const isCircuit = q.isUpperCircuit || q.isLowerCircuit;
              const isHighMomentum = Math.abs(q.changePct) >= 2.0;

              return (
                <tr
                  key={q.symbol}
                  className={flashClass}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Symbol & Name (Clickable to open chart) */}
                  <td
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                    onClick={() => onOpenChart(q)}
                    title="Click to view interactive chart"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{q.symbol}</span>
                          <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 5px' }}>{q.exchange}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {q.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* LTP */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }} className="num-tabular">
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      ₹{q.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {q.isStale && (
                      <div style={{ fontSize: '10px', color: 'var(--color-amber)' }}>Cached</div>
                    )}
                  </td>

                  {/* % Change */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }} className="num-tabular">
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      background: isUp ? 'var(--color-green-bg)' : 'var(--color-red-bg)',
                      color: isUp ? 'var(--color-green)' : 'var(--color-red)'
                    }}>
                      {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      <span>{isUp ? '+' : ''}{q.changePct.toFixed(2)}%</span>
                    </div>
                  </td>

                  {/* Sparkline Canvas (Clickable to open chart) */}
                  <td
                    style={{ padding: '14px 16px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => onOpenChart(q)}
                    title="Click to view interactive chart"
                  >
                    <div style={{ display: 'inline-block' }}>
                      <Sparkline data={q.sparkline} isPositive={isUp} width={100} height={28} />
                    </div>
                  </td>

                  {/* Day Range Bar */}
                  <td style={{ padding: '14px 16px' }}>
                    <DayRangeBar low={q.low} high={q.high} current={q.ltp} width={110} />
                  </td>

                  {/* Signals & Attention Badges */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {isNear52WHigh && (
                        <span className="badge badge-purple" title="Within 0.5% of 52W High">
                          <Sparkles size={11} /> 52W High
                        </span>
                      )}
                      {isCircuit && (
                        <span className="badge badge-amber">
                          <AlertTriangle size={11} /> {q.isUpperCircuit ? 'UC Lock' : 'LC Lock'}
                        </span>
                      )}
                      {isHighMomentum && (
                        <span className="badge badge-green">
                          <Zap size={11} /> Momentum
                        </span>
                      )}
                      {!isNear52WHigh && !isCircuit && !isHighMomentum && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Steady</span>
                      )}
                    </div>
                  </td>

                  {/* Volume */}
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }} className="num-tabular">
                    {q.volume.toLocaleString()}
                  </td>

                  {/* Action Buttons */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {/* Buy Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOrder(q, 'BUY');
                        }}
                        style={{
                          background: 'var(--color-green-bg)',
                          color: 'var(--color-green)',
                          border: '1px solid rgba(0, 192, 135, 0.3)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        B
                      </button>

                      {/* Sell Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOrder(q, 'SELL');
                        }}
                        style={{
                          background: 'var(--color-red-bg)',
                          color: 'var(--color-red)',
                          border: '1px solid rgba(235, 91, 60, 0.3)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        S
                      </button>

                      {/* Depth Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDepth(q);
                        }}
                        title="View L2 Market Depth"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 6px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Layers size={13} />
                      </button>

                      {/* Chart Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChart(q);
                        }}
                        title="View Candlestick Chart"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 6px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <BarChart2 size={13} />
                      </button>

                      {/* Remove from Watchlist */}
                      {onRemoveSymbol && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSymbol(q.symbol);
                          }}
                          title="Remove from Watchlist"
                          style={{
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
