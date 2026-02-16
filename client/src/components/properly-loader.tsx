import React from 'react';
import { cn } from '@/lib/utils';

interface ProperlyLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  fullPage?: boolean;
}

export function ProperlyLoader({ size = 'md', text, className, fullPage = false }: ProperlyLoaderProps) {
  const dims = size === 'sm' ? 48 : size === 'md' ? 72 : 96;
  const stroke = size === 'sm' ? 2.5 : size === 'md' ? 3 : 3.5;
  const iconSize = size === 'sm' ? 20 : size === 'md' ? 30 : 40;
  const r = (dims / 2) - stroke - 4;

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)} data-testid="properly-loader">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg
          width={dims}
          height={dims}
          viewBox={`0 0 ${dims} ${dims}`}
          className="animate-[loader-spin_1.4s_ease-in-out_infinite]"
        >
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="#e7f6f3"
            strokeWidth={stroke}
          />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="#425b58"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * r * 0.7} ${Math.PI * r * 1.3}`}
          />
        </svg>

        <div
          className="absolute inset-0 flex items-center justify-center animate-[loader-pulse_1.4s_ease-in-out_infinite]"
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M16 3L4 12V27C4 27.55 4.45 28 5 28H13V20H19V28H27C27.55 28 28 27.55 28 27V12L16 3Z"
              stroke="#425b58"
              strokeWidth="2.2"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M11 17L14.5 20.5L21 13"
              stroke="#e8946a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="animate-[loader-check_1.4s_ease-in-out_infinite]"
            />
          </svg>
        </div>
      </div>
      {text && (
        <p className={cn(
          "text-muted-foreground font-medium animate-pulse",
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        {content}
      </div>
    );
  }

  return content;
}
