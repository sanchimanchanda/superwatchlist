import React from "react";
import { X, TrendingUp, TrendingDown, Briefcase, History, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Position, ExecutedOrder, Quote } from "../types";

interface PositionsModalProps {
  funds: number;
  positions: Position[];
  orderHistory: ExecutedOrder[];
  quotesMap: Record<string, Quote>;
  onExitPosition: (position: Position) => void;
  onResetBalance: () => void;
  onClose: () => void;
}

export const PositionsModal: React.FC<PositionsModalProps> = ({
  funds,
  positions,
  orderHistory,
  quotesMap,
  onExitPosition,
  onResetBalance,
  onClose
}) => {
  const totalInvested = positions.reduce((acc, p) => acc + p.totalInvested, 0);
  
  const currentPortfolioValue = positions.reduce((acc, p) => {
    const quote = quotesMap[p.symbol] || quotesMap[p.symbol.toUpperCase()];
    const ltp = quote ? quote.ltp : p.avgBuyPrice;
    return acc + p.quantity * ltp;
  }, 0);

  const totalPnL = currentPortfolioValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const totalNetWorth = funds + currentPortfolioValue;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "680px", maxWidth: "95vw", padding: "24px", maxHeight: "88vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "var(--color-blue)", color: "#fff", padding: "8px", borderRadius: "var(--radius-md)" }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800 }}>Portfolio & Trade Book</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Live position valuations & order execution history</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={onResetBalance}
              title="Reset capital back to ₹10,00,000"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <RefreshCw size={12} /> Reset ₹10L
            </button>
            <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Portfolio Valuation Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "22px" }}>
          <div style={{ background: "var(--bg-secondary)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Available Cash</div>
            <div className="num-tabular" style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-green)", marginTop: "4px" }}>
              ₹{funds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Invested Value</div>
            <div className="num-tabular" style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
              ₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Value</div>
            <div className="num-tabular" style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
              ₹{currentPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total P&L</div>
            <div className="num-tabular" style={{ fontSize: "16px", fontWeight: 700, color: totalPnL >= 0 ? "var(--color-green)" : "var(--color-red)", marginTop: "4px" }}>
              {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalPnLPct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Section 1: Active Open Positions */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Briefcase size={15} color="var(--color-blue)" /> Open Positions ({positions.length})
          </h3>
          {positions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "13px" }}>
              No active holdings. Click "BUY" on any stock in the watchlist to take a position.
            </div>
          ) : (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Symbol</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Avg Price</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Current LTP</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Current Value</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>P&L</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const quote = quotesMap[p.symbol] || quotesMap[p.symbol.toUpperCase()];
                    const ltp = quote ? quote.ltp : p.avgBuyPrice;
                    const posVal = p.quantity * ltp;
                    const posPnL = posVal - p.totalInvested;
                    const posPnLPct = p.totalInvested > 0 ? (posPnL / p.totalInvested) * 100 : 0;
                    return (
                      <tr key={p.symbol} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                          {p.symbol}
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>{p.name}</div>
                        </td>
                        <td className="num-tabular" style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                          {p.quantity}
                        </td>
                        <td className="num-tabular" style={{ padding: "10px 12px", textAlign: "right" }}>
                          ₹{p.avgBuyPrice.toFixed(2)}
                        </td>
                        <td className="num-tabular" style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                          ₹{ltp.toFixed(2)}
                        </td>
                        <td className="num-tabular" style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                          ₹{posVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="num-tabular" style={{ padding: "10px 12px", textAlign: "right", color: posPnL >= 0 ? "var(--color-green)" : "var(--color-red)", fontWeight: 600 }}>
                          {posPnL >= 0 ? "+" : ""}₹{posPnL.toFixed(2)} ({posPnLPct.toFixed(2)}%)
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => onExitPosition(p)}
                            style={{
                              background: "rgba(235, 91, 60, 0.15)",
                              color: "var(--color-red)",
                              border: "1px solid rgba(235, 91, 60, 0.3)",
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Exit / Sell
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Order History */}
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <History size={15} color="var(--color-purple)" /> Executed Orders History ({orderHistory.length})
          </h3>
          {orderHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "13px" }}>
              No orders placed in this session yet.
            </div>
          ) : (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: "200px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "6px 12px" }}>Time</th>
                    <th style={{ padding: "6px 12px" }}>Symbol</th>
                    <th style={{ padding: "6px 12px" }}>Side</th>
                    <th style={{ padding: "6px 12px", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "6px 12px", textAlign: "right" }}>Price</th>
                    <th style={{ padding: "6px 12px", textAlign: "right" }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td className="num-tabular" style={{ padding: "8px 12px", color: "var(--text-muted)" }}>
                        {new Date(o.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: 700 }}>{o.symbol}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span className={`badge ${o.side === "BUY" ? "badge-green" : "badge-red"}`} style={{ fontSize: "10px" }}>
                          {o.side} {o.orderType}
                        </span>
                      </td>
                      <td className="num-tabular" style={{ padding: "8px 12px", textAlign: "right" }}>{o.quantity}</td>
                      <td className="num-tabular" style={{ padding: "8px 12px", textAlign: "right" }}>₹{o.price.toFixed(2)}</td>
                      <td className="num-tabular" style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                        ₹{o.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
