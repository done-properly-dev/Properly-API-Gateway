import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressPillarProps {
  percent: number; // 0, 20, 40, 60, 80, 100
}

const STEPS = [
  { label: 'Kick Off', value: 20 },
  { label: 'Review', value: 40 },
  { label: 'Diligence', value: 60 },
  { label: 'Commitment', value: 80 },
  { label: 'Settlement', value: 100 },
];

export function ProgressPillar({ percent }: ProgressPillarProps) {
  return (
    <div className="w-full py-6">
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between relative z-10">
          {STEPS.map((step, index) => {
            const isCompleted = percent >= step.value;
            const isCurrent = percent === step.value;
            
            return (
              <div key={step.label} className="flex flex-col items-center gap-2 group">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.2 : 1,
                    backgroundColor: isCompleted ? 'var(--color-primary)' : 'var(--color-muted)',
                    borderColor: isCompleted ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full border-4 border-background flex items-center justify-center transition-colors duration-300 shadow-sm",
                    isCompleted ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                </motion.div>
                
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 absolute -bottom-6 text-center w-20",
                  isCompleted ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
