import { useState, useRef, useCallback, useEffect } from 'react';
import { Prize } from '@/hooks/usePrizes';

interface SpinWheelProps {
  prizes: Prize[];
  onSpinComplete: (prize: Prize) => void;
  disabled?: boolean;
}

const WHEEL_COLORS = [
  '#1a365d', '#d4a017', '#c53030', '#2d6a4f', '#6b21a8',
  '#b45309', '#0e7490', '#be185d', '#4338ca', '#15803d',
  '#dc2626', '#0284c7',
];

export function SpinWheel({ prizes, onSpinComplete, disabled }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const arc = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, size, size);

    // Draw segments
    prizes.forEach((prize, i) => {
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color || WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, Math.min(16, 200 / prizes.length))}px 'Space Grotesk', sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      const text = prize.name.length > 14 ? prize.name.slice(0, 12) + '…' : prize.name;
      ctx.fillText(text, radius - 20, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#d4a017';
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#f5d060';
    ctx.fill();
  }, [prizes]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const selectPrize = useCallback((): Prize => {
    // Weighted random based on quantity
    const totalWeight = prizes.reduce((sum, p) => sum + p.quantity, 0);
    let random = Math.random() * totalWeight;
    for (const prize of prizes) {
      random -= prize.quantity;
      if (random <= 0) return prize;
    }
    return prizes[prizes.length - 1];
  }, [prizes]);

  const spin = useCallback(() => {
    if (spinning || disabled || prizes.length === 0) return;

    setSpinning(true);
    const selectedPrize = selectPrize();
    const prizeIndex = prizes.indexOf(selectedPrize);
    const arc = 360 / prizes.length;

    // Calculate target angle so pointer (top) lands on the selected prize
    const targetAngle = 360 - (prizeIndex * arc + arc / 2);
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    const totalDegrees = fullRotations * 360 + targetAngle + (Math.random() * arc * 0.6 - arc * 0.3);

    setRotation(prev => prev + totalDegrees);

    setTimeout(() => {
      setSpinning(false);
      onSpinComplete(selectedPrize);
    }, 4200);
  }, [spinning, disabled, prizes, selectPrize, onSpinComplete]);

  if (prizes.length === 0) {
    return (
      <div className="flex items-center justify-center w-80 h-80 rounded-full bg-muted border-4 border-border">
        <p className="text-muted-foreground font-medium text-center px-8">
          No prizes available.<br />Add prizes in the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center gap-6" ref={containerRef}>
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div
          className="w-0 h-0 drop-shadow-lg"
          style={{
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '32px solid hsl(45, 100%, 55%)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}
        />
      </div>

      {/* Wheel */}
      <div
        className={`rounded-full p-2 ${spinning ? '' : 'animate-pulse-glow'}`}
        style={{
          background: 'linear-gradient(135deg, hsl(45,100%,55%), hsl(45,100%,70%))',
        }}
      >
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        className="px-10 py-4 text-lg font-bold font-heading rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: spinning
            ? 'hsl(220, 15%, 70%)'
            : 'linear-gradient(135deg, hsl(350,80%,55%), hsl(350,80%,45%))',
          color: '#ffffff',
          boxShadow: spinning ? 'none' : '0 4px 20px hsl(350 80% 55% / 0.4)',
          transform: spinning ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        {spinning ? '🎰 Spinning...' : '🎯 SPIN TO WIN!'}
      </button>
    </div>
  );
}
