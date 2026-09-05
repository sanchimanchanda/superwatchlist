import React from 'react';

interface DayRangeBarProps {
  low: number;
  high: number;
  current: number;
  width?: number;
}

export const DayRangeBar: React.FC<DayRangeBarProps> = ({
  low,
  high,
  current,
  width = 100
}) => {
  const range = high - low || 1;
  const pct = Math.max(0, Math.min(100, ((current - low) / range) * 100));

  return (
    <div style={{ width: `${width}px`, display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{
        position: 'relative',
        height: '5px',
        background: 'var(--border-color)',
        borderRadius: '3px',
        overflow: 'visible'
      }}>
        {/* Gradient fill */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #eb5b3c 0%, #f59e0b 50%, #00c087 100%)',
          borderRadius: '3px'
        }} />
        
        {/* Current price marker */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 3px)`,
          top: '-2px',
          width: '6px',
          height: '9px',
          background: '#ffffff',
          borderRadius: '2px',
          boxShadow: '0 0 4px rgba(0,0,0,0.8)'
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: 'var(--text-muted)'
      }} className="num-tabular">
        <span>L: ₹{low.toFixed(1)}</span>
        <span>H: ₹{high.toFixed(1)}</span>
      </div>
    </div>
  );
};
