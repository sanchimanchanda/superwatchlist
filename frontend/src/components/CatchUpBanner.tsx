import React, { useState } from 'react';
import { Sparkles, Clock, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { CatchUpSummary } from '../types';

interface CatchUpBannerProps {
  summary: CatchUpSummary | null;
  onFilterChangedOnly?: () => void;
  isFilterActive?: boolean;
}

export const CatchUpBanner: React.FC<CatchUpBannerProps> = ({
  summary,
  onFilterChangedOnly,
  isFilterActive = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary) return null;

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
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--color-blue)',
            color: '#fff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-blue)',
              letterSpacing: '0.05em'
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
              marginTop: '2px'
            }}>
              {summary.headline}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
