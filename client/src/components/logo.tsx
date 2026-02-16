import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'dark' | 'light' | 'color';
}

export function Logo({ className, showText = true, variant = 'color' }: LogoProps) {
  const filterClass = variant === 'light' ? 'brightness-0 invert' : '';
  
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src="/images/properly-logo.png" 
        alt="Properly" 
        className={cn("h-8 w-auto object-contain", filterClass)} 
      />
    </div>
  );
}
