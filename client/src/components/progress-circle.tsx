import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  percent: number; // 0 to 100
}

export function ProgressCircle({ percent }: ProgressCircleProps) {
  const circumference = 2 * Math.PI * 90; // Radius 90
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-48 h-48">
        {/* Background Ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="90"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="96"
            cy="96"
            r="90"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-primary"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <span className="text-4xl font-bold font-heading text-foreground">{percent}%</span>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Complete</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
