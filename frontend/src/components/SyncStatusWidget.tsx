import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio } from 'lucide-react';

interface SyncStatusWidgetProps {
  lastUpdated: number;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const SyncStatusWidget: React.FC<SyncStatusWidgetProps> = ({
  lastUpdated,
  onManualSync,
  isSyncing = false
}) => {
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdated) / 1000);
      const remaining = Math.max(0, 60 - (elapsed % 60));
      setSecondsLeft(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatLastUpdated = (ts: number) => {
    if (!ts) return 'Connecting...';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      padding: '8px 14px',
      borderRadius: 'var(--radius-md)',
      fontSize: '13px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isSyncing ? 'var(--color-amber)' : 'var(--color-green)',
          boxShadow: `0 0 8px ${isSyncing ? 'var(--color-amber)' : 'var(--color-green)'}`,
          animation: 'pulse 1.5s infinite'
        }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Google Finance Feed</span>
      </div>

      <div style={{ color: 'var(--text-muted)' }}>•</div>

      <div style={{ color: 'var(--text-secondary)' }}>
        Synced: <span className="num-tabular" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatLastUpdated(lastUpdated)}</span>
      </div>

      <div style={{ color: 'var(--text-muted)' }}>•</div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: secondsLeft <= 10 ? 'var(--color-amber)' : 'var(--color-green)',
        fontWeight: 600
      }}>
        <Radio size={14} className={isSyncing ? 'spin' : ''} />
        <span className="num-tabular">Next sync in {secondsLeft}s</span>
      </div>

      {onManualSync && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManualSync();
          }}
          disabled={isSyncing}
          title="Force 1-Minute Live Refresh"
          style={{
            background: isSyncing ? 'var(--bg-secondary)' : 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: isSyncing ? 'var(--color-amber)' : 'var(--text-primary)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            marginLeft: '6px',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            if (!isSyncing) e.currentTarget.style.borderColor = 'var(--color-green)';
          }}
          onMouseLeave={(e) => {
            if (!isSyncing) e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
};
