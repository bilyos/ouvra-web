'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[15px] text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'hover:border-gray-300 dark:hover:border-gray-700 focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-[3px] focus-visible:ring-brand-600/15 dark:focus-visible:border-brand-300 dark:focus-visible:ring-brand-300/20',
          'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
          error && 'border-red-500 hover:border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/15',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
