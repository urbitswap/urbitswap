import React, { ReactNode } from 'react';
import cn from 'classnames';
import * as Popover from '@radix-ui/react-popover';
import {
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  LockClosedIcon,
  LockOpenIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  SparklesIcon,
  StarIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import {
  useUrbitNetworkLayer,
  useVentureAccountGrant,
  useRaribleAccountItems,
  useRaribleAccountBids,
} from '@/state/app';
import { APP_TERM, CONTRACT } from '@/constants';
import {
  isMaxDate,
  makePrettyLapse,
  getItemUnlock,
} from '@/logic/utils';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
} from '@rarible/api-client';

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
  const myBids = useRaribleAccountBids();
  // const myItemGrant = useVentureAccountGrant(item.tokenId ?? "");
  const myItemLayer = useUrbitNetworkLayer(item.meta?.name ?? "");

  const itemType: string | undefined =
    (item.meta?.attributes ?? []).find(a => a.key === "size")?.value;
  // const itemUnlock: Date = getItemUnlock(item);
  // const itemTransferable: boolean = myItemGrant !== undefined
  //   && myItemGrant?.status === "success";

  return (
    <div className={cn(className, "flex flex-row justify-center gap-1 items")}>
      {(myItems === undefined || myBids === undefined || myItemLayer === undefined) ? (
        <EllipsisHorizontalIcon className={cn(badgeClassName, "text-black animate-ping")} />
      ) : (
        <React.Fragment>
          {/*(itemUnlock < new Date(Date.now())) ? (
            <BadgePopover
              message="Available for General Purchase"
              children={<LockOpenIcon className={badgeClassName} />}
            />
          ) : (
            <BadgePopover
              message={`Lockup Period Ends ${
                isMaxDate(itemUnlock) ? "???" : makePrettyLapse(itemUnlock)
              } (${itemTransferable ? "A" : "Una"}vailable to You)`}
              children={<LockClosedIcon className={badgeClassName} />}
            />
          )*/}
          {<BadgePopover
            message={
              (myItemLayer[0].toUpperCase() + myItemLayer.slice(1)).replace("-", " ")
            }
            children={
              (myItemLayer === "layer-1") ? (<LockOpenIcon className={badgeClassName} />)
              : (<LockClosedIcon className={badgeClassName} />)
            }
          />}
          {<BadgePopover
            message={`${!itemType
              ? "Unknown"
              : itemType[0].toUpperCase() + itemType.slice(1)
            } ID`}
            children={
              (itemType === "galaxy") ? (<SparklesIcon className={badgeClassName} />)
              : (itemType === "star") ? (<StarIcon className={badgeClassName} />)
              : (itemType === "planet") ? (<GlobeAltIcon className={badgeClassName} />)
              : (<QuestionMarkCircleIcon className={badgeClassName} />)
            }
          />}
          {myItems.some((i: RaribleItem) => i.id === item.id) && (
            <BadgePopover
              message="Owned by Me"
              children={<WalletIcon className={badgeClassName} />}
            />
          )}
          {myBids.some((o: RaribleOrder) =>
            (o.take.type["@type"] === "ERC721" || o.take.type["@type"] === "ERC721_Lazy")
            && `${o.take.type?.contract}:${o.take.type?.tokenId}` === item.id
          ) && (
            <BadgePopover
              message="Has my Bid"
              children={<TagIcon className={badgeClassName} />}
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
          className="p-0.5 rounded-md hover:bg-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" sideOffset={5}>
          <div className={cn(
            "text-sm text-center rounded-lg py-1 px-2 border-2",
            "border-gray-200 bg-white shadow-md",
          )}>
            <span className="mb-2 font-semibold">
              {message}
            </span>
          </div>
          <Popover.Arrow className="w-2 h-1 fill-gray-200" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
