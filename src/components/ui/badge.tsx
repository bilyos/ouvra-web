'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold leading-5 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-brand-700 text-white dark:bg-brand-300 dark:text-brand-950',
        secondary: 'bg-muted text-foreground/80',
        destructive: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30',
        outline: 'ring-1 ring-inset ring-border text-foreground/80',
        success: 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-500/30',
        warning: 'bg-sun-50 text-sun-800 ring-1 ring-inset ring-sun-200 dark:bg-sun-500/10 dark:text-sun-200 dark:ring-sun-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
