import React, { useRef, useEffect } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 110,
  height = 32,
  isPositive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 4;
    const drawHeight = height - padding * 2;
    const step = (width - padding * 2) / (data.length - 1);

    const strokeColor = isPositive ? '#00c087' : '#eb5b3c';
    const gradientColor = isPositive ? 'rgba(0, 192, 135, 0.15)' : 'rgba(235, 91, 60, 0.15)';

    // Build path
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padding + i * step;
      const y = height - padding - ((val - min) / range) * drawHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Stroke line
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.75;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill area under sparkline
    ctx.lineTo(padding + (data.length - 1) * step, height);
    ctx.lineTo(padding, height);
    ctx.closePath();
    ctx.fillStyle = gradientColor;
    ctx.fill();

  }, [data, width, height, isPositive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block'
      }}
    />
  );
};
