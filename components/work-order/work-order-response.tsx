'use client';

import { useEffect, memo, useMemo } from 'react';

interface WorkOrderResponseProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const WorkOrderResponse = memo(function WorkOrderResponse({ 
  message, 
  type, 
  onClose, 
  autoHide = false,
  autoHideDelay = 5000 
}: WorkOrderResponseProps) {
  
  useEffect(() => {
    if (autoHide && type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, type, autoHideDelay, onClose]);

  // Memoize classes to prevent unnecessary recalculations
  const classes = useMemo(() => {
    const baseClasses = "mt-6 max-w-2xl mx-auto p-4 rounded-[var(--radius-base)] text-center font-[var(--font-weight-medium)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-standard)]";
    
    const typeClasses = type === 'success'
      ? 'bg-[rgba(var(--color-success-rgb),var(--status-bg-opacity))] text-[var(--color-success)] border border-[rgba(var(--color-success-rgb),var(--status-border-opacity))]'
      : 'bg-[rgba(var(--color-error-rgb),var(--status-bg-opacity))] text-[var(--color-error)] border border-[rgba(var(--color-error-rgb),var(--status-border-opacity))]';
    
    return `${baseClasses} ${typeClasses}`;
  }, [type]);

  return (
    <div className={classes}>
      <div className="flex items-center justify-between">
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus:outline-none focus:opacity-100"
          aria-label="關閉訊息"
          type="button"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
});

export default WorkOrderResponse;