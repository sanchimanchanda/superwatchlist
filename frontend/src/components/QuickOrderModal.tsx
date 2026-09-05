import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import { Quote } from "../types";

interface QuickOrderModalProps {
  quote: Quote;
  initialSide?: "BUY" | "SELL";
  availableFunds: number;
  currentHoldingQty?: number;
  onExecuteOrder: (order: {
    symbol: string;
    name: string;
    side: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT";
    quantity: number;
    price: number;
    totalAmount: number;
  }) => void;
  onClose: () => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  quote,
  initialSide = "BUY",
  availableFunds,
  currentHoldingQty = 0,
  onExecuteOrder,
  onClose
}) => {
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(quote.ltp);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastExecuted, setLastExecuted] = useState<{ side: string; qty: number; price: number; total: number } | null>(null);

  // Update limit price default if quote updates
  useEffect(() => {
    if (orderType === "MARKET") {
      setLimitPrice(quote.ltp);
    }
  }, [quote.ltp, orderType]);

  const price = orderType === "MARKET" ? quote.ltp : (limitPrice > 0 ? limitPrice : quote.ltp);
  const totalAmount = Math.max(0, quantity * price);
  const isInsufficientFunds = side === "BUY" && totalAmount > availableFunds;
  const isInsufficientHoldings = side === "SELL" && quantity > currentHoldingQty;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || price <= 0) return;
    if (isInsufficientFunds || isInsufficientHoldings) return;

    onExecuteOrder({
      symbol: quote.symbol,
      name: quote.name,
      side,
      orderType,
      quantity,
      price,
      totalAmount
    });

    setLastExecuted({ side, qty: quantity, price, total: totalAmount });
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1300);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "440px", padding: "22px" }}>
        {isSuccess && lastExecuted ? (
          <div style={{ textAlign: "center", padding: "28px 10px", animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ color: "var(--color-green)", display: "inline-flex", marginBottom: "12px" }}>
              <CheckCircle2 size={52} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
              {lastExecuted.side === "BUY" ? "Purchase Successful!" : "Sell Order Executed!"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" }}>
              {lastExecuted.side} <strong>{lastExecuted.qty} shares</strong> of {quote.symbol} @ ₹{lastExecuted.price.toFixed(2)}
            </p>
            <div style={{
              display: "inline-block",
              background: "var(--bg-secondary)",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "13px",
              color: "var(--text-muted)"
            }}>
              Total Value: <strong style={{ color: "var(--text-primary)" }}>₹{lastExecuted.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 700 }}>{quote.symbol}</span>
                  <span className="badge badge-blue">{quote.exchange}</span>
                  <span className="num-tabular" style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "4px" }}>
                    LTP: ₹{quote.ltp.toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {quote.name}
                </div>
              </div>
              <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Side Selector Toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setSide("BUY")}
                style={{
                  background: side === "BUY" ? "var(--color-green)" : "var(--bg-secondary)",
                  color: side === "BUY" ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide("SELL")}
                style={{
                  background: side === "SELL" ? "var(--color-red)" : "var(--bg-secondary)",
                  color: side === "SELL" ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                SELL
              </button>
            </div>

            {/* Order Type */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "14px", fontSize: "13px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === "MARKET"}
                  onChange={() => setOrderType("MARKET")}
                />
                <span>Market Order</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === "LIMIT"}
                  onChange={() => setOrderType("LIMIT")}
                />
                <span>Limit Order</span>
              </label>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Quantity</label>
                {side === "SELL" && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Available in Holdings: <strong style={{ color: "var(--text-primary)" }}>{currentHoldingQty}</strong>
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                style={{
                  width: "100%",
                  background: "var(--bg-secondary)",
                  border: isInsufficientHoldings ? "1px solid var(--color-red)" : "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px"
                }}
                className="num-tabular"
              />
              {isInsufficientHoldings && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-red)", fontSize: "11px", marginTop: "4px" }}>
                  <AlertCircle size={12} /> You only hold {currentHoldingQty} shares of {quote.symbol}.
                </div>
              )}
            </div>

            {/* Limit Price */}
            {orderType === "LIMIT" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Limit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "14px"
                  }}
                  className="num-tabular"
                />
              </div>
            )}

            {/* Financial Summary & Balance Check */}
            <div style={{
              background: "var(--bg-secondary)",
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
              fontSize: "13px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Execution Price</span>
                <span className="num-tabular" style={{ fontWeight: 600 }}>₹{price.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Estimated Total</span>
                <span className="num-tabular" style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "12px"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
                  <Wallet size={12} /> Available Funds
                </span>
                <span className="num-tabular" style={{ color: isInsufficientFunds ? "var(--color-red)" : "var(--color-green)", fontWeight: 600 }}>
                  ₹{availableFunds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {isInsufficientFunds && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-red)", fontSize: "11px", marginTop: "6px" }}>
                  <AlertCircle size={12} /> Insufficient margin balance. Required: ₹{totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isInsufficientFunds || isInsufficientHoldings || quantity <= 0}
              style={{
                width: "100%",
                background: (isInsufficientFunds || isInsufficientHoldings || quantity <= 0)
                  ? "var(--bg-secondary)"
                  : side === "BUY" ? "var(--color-green)" : "var(--color-red)",
                color: (isInsufficientFunds || isInsufficientHoldings || quantity <= 0) ? "var(--text-muted)" : "#fff",
                border: "none",
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: (isInsufficientFunds || isInsufficientHoldings || quantity <= 0) ? "not-allowed" : "pointer",
                transition: "background 0.15s"
              }}
            >
              {side} {quantity} Shares (₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
