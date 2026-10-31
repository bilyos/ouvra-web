'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-brand-800 dark:hover:bg-brand-200',
        accent:
          'bg-sun-400 text-gray-950 hover:bg-sun-300 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]',
        secondary:
          'bg-muted text-foreground hover:bg-gray-200 dark:hover:bg-gray-800',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        outline:
          'border border-border bg-card text-foreground hover:border-gray-300 hover:bg-paper dark:hover:border-gray-700',
        ghost:
          'bg-transparent text-foreground/80 hover:bg-muted hover:text-foreground',
        link: 'bg-transparent px-0 text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3 text-[13px]',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
