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
  const ringStroke = size === 'sm' ? 2.5 : size === 'md' ? 3 : 3.5;
  const iconSize = size === 'sm' ? 22 : size === 'md' ? 34 : 46;
  const r = (dims / 2) - ringStroke - 4;
  const circ = 2 * Math.PI * r;

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)} data-testid="properly-loader">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <path
            d="M20 5L4 17V34H36V17L20 5Z"
            stroke="#425b58"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M15 21L18.5 24.5L25 17"
            stroke="#425b58"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              strokeDasharray: 18,
              animation: 'loader-check-draw 1.8s ease-in-out infinite',
            }}
          />
        </svg>

        <svg
          width={dims}
          height={dims}
          viewBox={`0 0 ${dims} ${dims}`}
          style={{ animation: 'loader-ring-spin 1.2s linear infinite' }}
        >
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="#e7f6f3"
            strokeWidth={ringStroke}
          />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="#425b58"
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
            style={{ transformOrigin: 'center' }}
          />
        </svg>
      </div>
      {text && (
        <p className={cn(
          "text-muted-foreground font-medium",
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}
        style={{ animation: 'loader-text-fade 2s ease-in-out infinite' }}
        >
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
