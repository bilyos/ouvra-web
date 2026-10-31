'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[96px] w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500',
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
Textarea.displayName = 'Textarea';

export { Textarea };
