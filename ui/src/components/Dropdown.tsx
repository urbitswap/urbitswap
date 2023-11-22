import React from 'react';
import cn from 'classnames';
import * as BaseDropdownMenu from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu';

export function DropdownMenu({
  trigger,
  children,
  className,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseDropdownMenu.Root>
      <BaseDropdownMenu.Trigger>
        {trigger}
      </BaseDropdownMenu.Trigger>
      <BaseDropdownMenu.Content className={cn("dropdown", className)}>
        {children}
        <BaseDropdownMenu.Arrow className="w-4 h-3 fill-gray-800" />
      </BaseDropdownMenu.Content>
    </BaseDropdownMenu.Root>
  );
}

export function DropdownEntry(dprops: DropdownMenuItemProps) {
  const { disabled, className, ...props } = dprops;
  return (
    <BaseDropdownMenu.Item
      disabled={disabled}
      className={cn(
        "dropdown-item flex items-center space-x-2",
        !disabled ? "" : "cursor-default text-gray-300 hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}
