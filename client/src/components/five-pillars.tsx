import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import type { Matter } from '@shared/schema';

const PILLAR_CONFIG = [
  { key: 'pillarPreSettlement' as const, label: 'Pre-Settlement', short: 'Pre', description: 'Contract review & searches' },
  { key: 'pillarExchange' as const, label: 'Exchange', short: 'Exchange', description: 'Contracts exchanged' },
  { key: 'pillarConditions' as const, label: 'Conditions', short: 'Conditions', description: 'Finance & inspections' },
  { key: 'pillarPreCompletion' as const, label: 'Pre-Completion', short: 'Pre-Comp', description: 'Final checks & adjustments' },
  { key: 'pillarSettlement' as const, label: 'Settlement', short: 'Settle', description: 'Keys in hand!' },
];

type PillarStatus = 'not_started' | 'in_progress' | 'complete';

function getStatusIcon(status: PillarStatus) {
  if (status === 'complete') return <CheckCircle2 className="h-5 w-5 text-white" />;
  if (status === 'in_progress') return <Loader2 className="h-5 w-5 text-white animate-spin" />;
  return <Circle className="h-5 w-5 text-gray-400" />;
}

function getStatusColors(status: PillarStatus) {
  if (status === 'complete') return 'bg-primary border-primary';
  if (status === 'in_progress') return 'bg-primary/70 border-primary/70 ring-4 ring-primary/20';
  return 'bg-gray-100 border-gray-200';
}

interface FivePillarsProps {
  matter: Matter;
  variant?: 'full' | 'compact';
}

export function FivePillars({ matter, variant = 'full' }: FivePillarsProps) {
  const pillars = PILLAR_CONFIG.map(p => ({
    ...p,
    status: (matter[p.key] || 'not_started') as PillarStatus,
  }));

  const completedCount = pillars.filter(p => p.status === 'complete').length;
  const progressPercent = Math.round((completedCount / pillars.length) * 100);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5" data-testid="five-pillars-compact">
        {pillars.map((pillar, i) => (
          <div
            key={pillar.key}
            className={`h-2 flex-1 rounded-full transition-all ${
              pillar.status === 'complete'
                ? 'bg-primary'
                : pillar.status === 'in_progress'
                ? 'bg-primary/50'
                : 'bg-gray-200'
            }`}
            title={`${pillar.label}: ${pillar.status.replace('_', ' ')}`}
            data-testid={`pillar-bar-${i}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="five-pillars-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-lg">Your Settlement Journey</h3>
        <span className="text-sm font-medium text-primary">{progressPercent}% complete</span>
      </div>

      <div className="relative">
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative z-10 flex justify-between">
          {pillars.map((pillar, i) => (
            <div key={pillar.key} className="flex flex-col items-center text-center" style={{ width: '20%' }}>
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${getStatusColors(pillar.status)}`}
                data-testid={`pillar-icon-${i}`}
              >
                {getStatusIcon(pillar.status)}
              </div>
              <span className={`text-xs font-medium mt-2 ${
                pillar.status === 'not_started' ? 'text-gray-400' : 'text-foreground'
              }`}>
                <span className="hidden sm:inline">{pillar.label}</span>
                <span className="sm:hidden">{pillar.short}</span>
              </span>
              {pillar.status === 'in_progress' && (
                <span className="text-[10px] text-primary font-medium mt-0.5">Current</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-[#e7f6f3] rounded-lg p-3">
        {pillars.find(p => p.status === 'in_progress') ? (
          <p className="text-sm text-primary">
            <strong>Currently:</strong> {pillars.find(p => p.status === 'in_progress')?.description}
          </p>
        ) : completedCount === pillars.length ? (
          <p className="text-sm text-primary font-medium">
            Congratulations! Settlement is complete. Time to celebrate!
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Your settlement journey hasn't started yet.</p>
        )}
      </div>
    </div>
  );
}
