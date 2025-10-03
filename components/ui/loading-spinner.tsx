'use client';

import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="載入中"
      />
      {text && (
        <p className="text-gray-600 text-sm animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
});

export default LoadingSpinner;