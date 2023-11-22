import React, { ReactNode } from 'react';
import cn from 'classnames';
import * as BasePopover from '@radix-ui/react-popover';

export default function Popover({
  message,
  children,
  className,
}: {
  message: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger asChild>
        <button
          className="p-0.5 rounded-md hover:bg-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </button>
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Content className="z-40" side="top" sideOffset={5}>
          <div className={cn(
            "text-sm text-center font-semibold rounded-lg py-1 px-2 border-2",
            "border-gray-200 bg-white shadow-md",
            className,
          )}>
            {message}
          </div>
          <BasePopover.Arrow className="w-2 h-1 fill-gray-200" />
        </BasePopover.Content>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
