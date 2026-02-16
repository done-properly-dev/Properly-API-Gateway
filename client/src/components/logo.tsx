import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'dark' | 'light' | 'color';
}

export function Logo({ className, showText = true, variant = 'color' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/images/logo-icon.png" 
        alt="Properly Logo" 
        className="h-8 w-auto object-contain" 
      />
      {showText && (
        <span className={cn("font-heading font-extrabold text-xl tracking-tight", textColor)}>
          Properly.
        </span>
      )}
    </div>
  );
}
