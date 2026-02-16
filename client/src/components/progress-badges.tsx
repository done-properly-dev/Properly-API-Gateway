import React from 'react';
import { Award, Star, Trophy, Medal, Shield, Crown, Lock } from 'lucide-react';
import type { Matter } from '@shared/schema';

interface ProgressBadgesProps {
  matter: Matter;
}

const BADGE_CONFIG = [
  {
    id: 'getting_started',
    title: 'Getting Started',
    icon: Star,
    check: (_m: Matter) => true,
  },
  {
    id: 'contract_signed',
    title: 'Contract Signed',
    icon: Award,
    check: (m: Matter) => m.pillarPreSettlement === 'complete',
  },
  {
    id: 'exchange_champion',
    title: 'Exchange Champion',
    icon: Trophy,
    check: (m: Matter) => m.pillarExchange === 'complete',
  },
  {
    id: 'conditions_met',
    title: 'Conditions Met',
    icon: Shield,
    check: (m: Matter) => m.pillarConditions === 'complete',
  },
  {
    id: 'almost_there',
    title: 'Almost There',
    icon: Medal,
    check: (m: Matter) => m.pillarPreCompletion === 'complete',
  },
  {
    id: 'settled',
    title: 'Settled!',
    icon: Crown,
    check: (m: Matter) => m.pillarSettlement === 'complete',
  },
];

export function ProgressBadges({ matter }: ProgressBadgesProps) {
  return (
    <div data-testid="progress-badges">
      <style>{`
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(66, 91, 88, 0.2); }
          50% { box-shadow: 0 0 0 6px rgba(66, 91, 88, 0); }
        }
        .badge-earned {
          animation: badgePulse 3s ease-in-out infinite;
        }
      `}</style>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Achievements</h4>
      <div className="grid grid-cols-3 gap-3">
        {BADGE_CONFIG.map((badge) => {
          const earned = badge.check(matter);
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                earned
                  ? 'bg-[#e7f6f3] border border-[#c8e0db] badge-earned'
                  : 'bg-gray-50 border border-gray-100 opacity-50'
              }`}
              data-testid={`badge-${badge.id}`}
            >
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${
                earned ? 'bg-[#425b58]' : 'bg-gray-200'
              }`}>
                <Icon className={`h-5 w-5 ${earned ? 'text-[#ffece1]' : 'text-gray-400'}`} />
                {!earned && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-tight ${earned ? 'text-[#425b58]' : 'text-gray-400'}`}>
                {badge.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
