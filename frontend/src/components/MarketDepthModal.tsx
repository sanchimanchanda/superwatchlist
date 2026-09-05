import React from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Quote } from '../types';

interface MarketDepthModalProps {
  quote: Quote;
  onClose: () => void;
}

export const MarketDepthModal: React.FC<MarketDepthModalProps> = ({ quote, onClose }) => {
  // Generate realistic 5-depth bid & ask ladder around LTP
  const ltp = quote.ltp;
  const spread = Math.max(0.05, ltp * 0.0005);
  
  const bids = [
    { price: round(ltp - spread * 1), orders: 18, qty: 1420 },
    { price: round(ltp - spread * 2), orders: 42, qty: 3850 },
    { price: round(ltp - spread * 3), orders: 75, qty: 8900 },
    { price: round(ltp - spread * 4), orders: 110, qty: 14200 },
    { price: round(ltp - spread * 5), orders: 205, qty: 26500 },
  ];

  const asks = [
    { price: round(ltp + spread * 1), orders: 22, qty: 1820 },
    { price: round(ltp + spread * 2), orders: 51, qty: 4200 },
    { price: round(ltp + spread * 3), orders: 68, qty: 7800 },
    { price: round(ltp + spread * 4), orders: 130, qty: 15400 },
    { price: round(ltp + spread * 5), orders: 188, qty: 22100 },
  ];

  function round(val: number) {
    return Math.round(val * 100) / 100;
  }

  const totalBuyQty = bids.reduce((acc, b) => acc + b.qty, 0);
  const totalSellQty = asks.reduce((acc, a) => acc + a.qty, 0);
  const buyPct = Math.round((totalBuyQty / (totalBuyQty + totalSellQty)) * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700 }}>{quote.symbol}</span>
              <span className="badge badge-blue">{quote.exchange}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{quote.name}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="num-tabular" style={{ fontSize: '18px', fontWeight: 700 }}>
                ₹{quote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`badge ${quote.change >= 0 ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '2px' }}>
                {quote.change >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%
              </div>
            </div>

            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Total Buyer / Seller Pressure Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>
            <span style={{ color: 'var(--color-green)' }}>Buyers ({buyPct}%)</span>
            <span style={{ color: 'var(--color-red)' }}>Sellers ({100 - buyPct}%)</span>
          </div>
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${buyPct}%`, background: 'var(--color-green)' }} />
            <div style={{ width: `${100 - buyPct}%`, background: 'var(--color-red)' }} />
          </div>
        </div>

        {/* 5-Depth Ladder */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
          {/* Bid Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Bid Price</span>
              <span>Orders</span>
              <span>Qty</span>
            </div>
            {bids.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }} className="num-tabular">
                <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>₹{b.price.toFixed(2)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{b.orders}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.qty.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontWeight: 700, color: 'var(--color-green)' }} className="num-tabular">
              <span>Total Qty</span>
              <span>{totalBuyQty.toLocaleString()}</span>
            </div>
          </div>

          {/* Ask Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Ask Price</span>
              <span>Orders</span>
              <span>Qty</span>
            </div>
            {asks.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }} className="num-tabular">
                <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>₹{a.price.toFixed(2)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{a.orders}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.qty.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontWeight: 700, color: 'var(--color-red)' }} className="num-tabular">
              <span>Total Qty</span>
              <span>{totalSellQty.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* OHLC & Volume Summary */}
        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', fontSize: '11px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Open</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px' }}>₹{quote.open.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>High</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-green)' }}>₹{quote.high.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Low</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-red)' }}>₹{quote.low.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Prev Close</div>
            <div className="num-tabular" style={{ fontWeight: 600, marginTop: '2px' }}>₹{quote.prevClose.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
