import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneCelebrationProps {
  pillarName: string;
  onClose: () => void;
  isOpen: boolean;
}

const CONFETTI_COLORS = ['#425b58', '#ffece1', '#e7f6f3', '#e8946a', '#9ab3a5', '#c4a8d4'];

export function MilestoneCelebration({ pillarName, onClose, isOpen }: MilestoneCelebrationProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="milestone-celebration">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes celebrationFadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes checkmarkPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .confetti-particle {
          position: absolute;
          top: -20px;
          border-radius: 50%;
          animation: confettiFall linear forwards;
          pointer-events: none;
        }
        .celebration-content {
          animation: celebrationFadeIn 0.4s ease-out forwards;
        }
        .checkmark-pop {
          animation: checkmarkPop 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>

      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <div className="relative celebration-content text-center space-y-6 bg-white rounded-2xl shadow-2xl p-10 mx-4 max-w-md" data-testid="celebration-card">
        <div className="checkmark-pop inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#e7f6f3]">
          <CheckCircle2 className="h-12 w-12 text-[#425b58]" data-testid="celebration-checkmark" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-[#425b58]" data-testid="celebration-heading">
            {pillarName} Complete!
          </h2>
          <p className="text-muted-foreground text-base" data-testid="celebration-message">
            Ripper! You're making great progress on your settlement journey. Keep it up, legend!
          </p>
        </div>

        <Button
          onClick={onClose}
          className="bg-[#425b58] hover:bg-[#425b58]/90 text-white px-8 rounded-full"
          data-testid="celebration-continue"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
