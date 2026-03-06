import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SpinWheel } from '@/components/SpinWheel';
import { WinDialog } from '@/components/WinDialog';
import { useActivePrizes, useSpinPrize, useSpinHistory, Prize } from '@/hooks/usePrizes';
import { Gift, History, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { data: prizes = [], isLoading } = useActivePrizes();
  const { data: history = [] } = useSpinHistory();
  const spinPrize = useSpinPrize();
  const [winPrize, setWinPrize] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSpinComplete = async (prize: Prize) => {
    try {
      const result = await spinPrize.mutateAsync(prize.id);
      if (result.success) {
        setWinPrize(result.prize_name!);
      } else {
        toast({
          title: 'Oops!',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to process spin. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="gradient-navy text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-gold" />
            <h1 className="text-2xl font-bold font-heading text-gold">
              Prize Spinner
            </h1>
          </div>
          <Link
            to="/admin"
            className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: 'hsl(var(--gold))' }}
          >
            <Shield className="w-4 h-4" />
            Admin
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-6 lg:p-12">
        {/* Wheel Section */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl lg:text-4xl font-bold font-heading text-center">
            Spin & <span className="text-gold">Win!</span>
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            Putar Spinner nya Untuk Memilih Hadiah!.
          </p>
          {isLoading ? (
            <div className="w-80 h-80 rounded-full bg-muted animate-pulse" />
          ) : (
            <SpinWheel
              prizes={prizes}
              onSpinComplete={handleSpinComplete}
              disabled={spinPrize.isPending}
            />
          )}
        </div>

        {/* History Section */}
        <div className="w-full max-w-sm lg:max-w-xs">
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gold" />
              <h3 className="font-heading font-bold text-lg">Recent Wins</h3>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No spins yet. Be the first!
              </p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {history.slice(0, 15).map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                  >
                    <span className="font-medium truncate mr-2">🎁 {h.prize_name}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(h.spun_at), 'MMM d, HH:mm')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Win Dialog */}
      <WinDialog
        open={!!winPrize}
        prizeName={winPrize || ''}
        onClose={() => setWinPrize(null)}
      />
    </div>
  );
};

export default Index;
