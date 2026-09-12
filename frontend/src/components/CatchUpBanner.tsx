import React, { useState } from 'react';
import { Sparkles, Clock, ChevronDown, ChevronUp, Zap, Timer } from 'lucide-react';
import { CatchUpSummary, CatchUpLookback } from '../types';

const LOOKBACK_OPTIONS: { label: string; value: CatchUpLookback }[] = [
  { label: '15m', value: 15 },
  { label: '1h',  value: 60 },
  { label: '4h',  value: 240 },
  { label: 'Day', value: 390 },
];

const LOOKBACK_KEY = 'growly_catchup_lookback';

function getStoredLookback(): CatchUpLookback {
  try {
    const raw = localStorage.getItem(LOOKBACK_KEY);
    const parsed = raw ? parseInt(raw, 10) : 90;
    const valid: CatchUpLookback[] = [15, 60, 90, 240, 390];
    return valid.includes(parsed as CatchUpLookback) ? (parsed as CatchUpLookback) : 90;
  } catch {
    return 90;
  }
}

interface CatchUpBannerProps {
  summary: CatchUpSummary | null;
  onFilterChangedOnly?: () => void;
  isFilterActive?: boolean;
  onLookbackChange?: (minutes: CatchUpLookback) => void;
  lookback?: CatchUpLookback;
}

export const CatchUpBanner: React.FC<CatchUpBannerProps> = ({
  summary,
  onFilterChangedOnly,
  isFilterActive = false,
  onLookbackChange,
  lookback,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localLookback, setLocalLookback] = useState<CatchUpLookback>(
    lookback ?? getStoredLookback()
  );

  if (!summary) return null;

  const activeLookback = lookback ?? localLookback;

  const handleLookbackSelect = (val: CatchUpLookback) => {
    setLocalLookback(val);
    try { localStorage.setItem(LOOKBACK_KEY, String(val)); } catch {}
    onLookbackChange?.(val);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(56, 126, 209, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
      border: '1px solid rgba(56, 126, 209, 0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
      marginBottom: '16px',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Left: icon + headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div style={{
            background: 'var(--color-blue)',
            color: '#fff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-blue)',
              letterSpacing: '0.05em',
              flexWrap: 'wrap'
            }}>
              <span>Since You Were Away</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                <Clock size={12} />
                {summary.timeAwayMinutes} mins ago
              </span>
            </div>

            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '520px'
            }}>
              {summary.headline}
            </div>
          </div>
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          {/* ── Lookback Segmented Control ──────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}>
            <Timer size={12} style={{ color: 'var(--text-muted)', marginLeft: '4px', marginRight: '2px' }} />
            {LOOKBACK_OPTIONS.map((opt) => {
              const isActive = activeLookback === opt.value;
              return (
                <button
                  key={opt.value}
                  id={`lookback-btn-${opt.value}`}
                  onClick={() => handleLookbackSelect(opt.value)}
                  title={`Show changes from last ${opt.label}`}
                  style={{
                    background: isActive
                      ? 'var(--color-blue)'
                      : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.01em',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Filter movers toggle */}
          {onFilterChangedOnly && (
            <button
              onClick={onFilterChangedOnly}
              style={{
                background: isFilterActive ? 'var(--color-blue)' : 'var(--bg-card)',
                color: isFilterActive ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={13} />
              <span>{isFilterActive ? 'Showing Active Movers' : 'Filter Movers Only'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && summary.bulletPoints.length > 0 && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(56, 126, 209, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          {summary.bulletPoints.map((pt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-blue)' }}>▸</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
