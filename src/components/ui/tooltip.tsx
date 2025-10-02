'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md bg-gray-900/95 backdrop-blur-sm px-3 py-1.5 text-xs text-white shadow-md',
      'animate-in fade-in-0 zoom-in-95 duration-200',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150',
      'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
      'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
      'max-w-[200px] sm:max-w-xs break-words',
      'pointer-events-none select-none',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Simplified wrapper component for easier usage
interface SimpleTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  disableHoverableContent?: boolean;
  className?: string;
}

const SimpleTooltip = ({
  children,
  content,
  side = 'top',
  delay = 400,
  disableHoverableContent = true,
  className,
}: SimpleTooltipProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip
      open={open}
      onOpenChange={setOpen}
      delayDuration={delay}
      disableHoverableContent={disableHoverableContent}
    >
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn('hidden sm:block', className)}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <p className="leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};
SimpleTooltip.displayName = 'SimpleTooltip';

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
};
