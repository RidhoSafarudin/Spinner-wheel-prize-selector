import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WinDialogProps {
  open: boolean;
  prizeName: string;
  onClose: () => void;
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#d4a017', '#c53030', '#2d6a4f', '#6b21a8', '#0e7490', '#f5d060'];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 2 + Math.random() * 2;
  const size = 6 + Math.random() * 8;

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 1.5,
        backgroundColor: color,
        borderRadius: '2px',
        animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
}

export function WinDialog({ open, prizeName, onClose }: WinDialogProps) {
  const [confetti, setConfetti] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setConfetti(Array.from({ length: 40 }, (_, i) => i));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading text-center animate-bounce-in">
            🎉 Congratulations! 🎉
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <p className="text-muted-foreground text-lg">You won:</p>
          <p className="text-4xl font-bold font-heading text-gold animate-bounce-in" style={{ animationDelay: '0.2s' }}>
            {prizeName}
          </p>
        </div>
        <Button onClick={onClose} size="lg" className="w-full font-heading text-lg">
          🎯 Spin Again
        </Button>
      </DialogContent>
    </Dialog>
  );
}
