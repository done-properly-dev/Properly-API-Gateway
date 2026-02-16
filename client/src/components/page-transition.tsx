import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="page-transition" data-testid="page-transition">
      <style>{`
        @keyframes pageSlideIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .page-transition {
          animation: pageSlideIn 0.3s ease-out forwards;
        }
      `}</style>
      {children}
    </div>
  );
}
