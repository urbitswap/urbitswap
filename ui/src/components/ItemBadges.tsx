import React, { ReactNode } from 'react';
import cn from 'classnames';
import * as Popover from '@radix-ui/react-popover';
import {
  ArrowPathIcon,
  LockClosedIcon,
  LockOpenIcon,
  TagIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { useRaribleAccountItems } from '@/state/app';
import { isMaxDate, makePrettyLapse, getItemUnlock } from '@/logic/utils';
import type { Item as RaribleItem } from '@rarible/api-client';

export default function ItemBadges({
  item,
  className,
  badgeClassName,
}: {
  item: RaribleItem;
  className?: string;
  badgeClassName?: string;
}) {
  const myItems = useRaribleAccountItems();

  const itemUnlock = getItemUnlock(item);

  return (
    <div className={cn(className, "flex flex-row justify-center gap-2 items")}>
      {(myItems === undefined) ? (
        <ArrowPathIcon className={cn(badgeClassName, "animate-spin")} />
      ) : (
        <React.Fragment>
          {myItems.some((i: RaribleItem) => i.id === item.id) && (
            <BadgePopover
              message="Owned by Me"
              children={<StarIcon className={badgeClassName} />}
            />
          )}
          {(itemUnlock < new Date(Date.now())) ? (
            <BadgePopover
              message="Available for General Purchase"
              children={<LockOpenIcon className={badgeClassName} />}
            />
          ) : (
            <BadgePopover
              message={`Lockup Period Ends ${
                isMaxDate(itemUnlock) ? "???" : makePrettyLapse(itemUnlock)
              }`}
              children={<LockClosedIcon className={badgeClassName} />}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
}

function BadgePopover({
  children,
  message,
}: {
  children: React.ReactNode;
  message: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="p-0.5 rounded-md hover:bg-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" sideOffset={5}>
          <div className="text-sm text-center rounded-lg border-2 border-blue-300 bg-white py-1 px-2 shadow-xl">
            <span className="mb-2 font-semibold">
              {message}
            </span>
          </div>
          <Popover.Arrow className="w-2 h-1 fill-blue-300" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
