import React from 'react';

export const LoaderIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={`flex items-center justify-center space-x-2 ${className}`} {...props}>
    <div className="w-3 h-3 bg-current rounded-full animate-pulsing-dot"></div>
    <div className="w-3 h-3 bg-current rounded-full animate-pulsing-dot" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-3 h-3 bg-current rounded-full animate-pulsing-dot" style={{ animationDelay: '0.4s' }}></div>
  </div>
);
