'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-md bg-gray-200/80 dark:bg-gray-800/80',
        className
      )}
      {...props}
    />
  );
});
Skeleton.displayName = 'Skeleton';

export { Skeleton };
