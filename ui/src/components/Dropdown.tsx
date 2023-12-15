import React from 'react';
import cn from 'classnames';
import * as BaseDropdownMenu from '@radix-ui/react-dropdown-menu';
import { ALIGN_OPTIONS } from '@radix-ui/react-popper';
import type { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

type RadixAlign = typeof ALIGN_OPTIONS[number];

export function DropdownMenu({
  trigger,
  children,
  className,
  align = "center",
  disabled = false,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: RadixAlign;
  disabled?: boolean;
}) {
  return (
    <BaseDropdownMenu.Root>
      <BaseDropdownMenu.Trigger disabled={disabled}>
        {trigger}
      </BaseDropdownMenu.Trigger>
      <BaseDropdownMenu.Content align={align} className={cn("dropdown", className)}>
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

export function DropdownButton({
  title,
  children,
  className
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string | boolean;
}) {
  return (
    <div className={cn(
      "button flex flex-row items-center space-x-2",
      "font-semibold text-sm sm:text-md",
      className,
    )}>
      {children}
      <div className="hidden sm:block">
        {title}
      </div>
      <ChevronDownIcon className="h-3 w-3" />
    </div>
  );
}
