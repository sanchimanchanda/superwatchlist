import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Quote } from '../types';

interface QuickOrderModalProps {
  quote: Quote;
  initialSide?: 'BUY' | 'SELL';
  onClose: () => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  quote,
  initialSide = 'BUY',
  onClose
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>(initialSide);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState(quote.ltp);
  const [isSuccess, setIsSuccess] = useState(false);

  const price = orderType === 'MARKET' ? quote.ltp : limitPrice;
  const totalAmount = quantity * price;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '420px', padding: '20px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ color: 'var(--color-green)', display: 'inline-flex', marginBottom: '12px' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Order Executed!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {side} {quantity} shares of {quote.symbol} @ ₹{price.toFixed(2)}
            </p>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>{quote.symbol}</span>
                <span className="badge badge-blue" style={{ marginLeft: '8px' }}>₹{quote.ltp.toFixed(2)}</span>
              </div>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Side Selector Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setSide('BUY')}
                style={{
                  background: side === 'BUY' ? 'var(--color-green)' : 'var(--bg-secondary)',
                  color: side === 'BUY' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                style={{
                  background: side === 'SELL' ? 'var(--color-red)' : 'var(--bg-secondary)',
                  color: side === 'SELL' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                SELL
              </button>
            </div>

            {/* Order Type */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === 'MARKET'}
                  onChange={() => setOrderType('MARKET')}
                />
                <span>Market Order</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === 'LIMIT'}
                  onChange={() => setOrderType('LIMIT')}
                />
                <span>Limit Order</span>
              </label>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px'
                }}
                className="num-tabular"
              />
            </div>

            {/* Limit Price */}
            {orderType === 'LIMIT' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Limit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || quote.ltp)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px'
                  }}
                  className="num-tabular"
                />
              </div>
            )}

            {/* Total Estimated Amount */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Total</span>
              <span className="num-tabular" style={{ fontWeight: 700 }}>
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              style={{
                width: '100%',
                background: side === 'BUY' ? 'var(--color-green)' : 'var(--color-red)',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {side} {quantity} Shares
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
