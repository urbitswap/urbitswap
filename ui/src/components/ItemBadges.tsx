import React, { ReactNode } from 'react';
import cn from 'classnames';
import {
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  LockClosedIcon,
  LockOpenIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import Popover from '@/components/Popover';
import { useUrbitNetworkLayer, useVentureAccountGrant } from '@/state/app';
import { APP_TERM, CONTRACT } from '@/constants';
import { capitalize, isMaxDate, makePrettyLapse, getItemUnlock } from '@/logic/utils';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
} from '@rarible/api-client';

export default function ItemBadges({
  item,
  myItems,
  myBids,
  className,
  badgeClassName,
}: {
  item: RaribleItem;
  myItems: RaribleItem[] | undefined;
  myBids: RaribleOrder[] | undefined;
  className?: string;
  badgeClassName?: string;
}) {
  // const myItemGrant = useVentureAccountGrant(item.tokenId ?? "");
  // const myItemLayer = useUrbitNetworkLayer(item.meta?.name ?? "");

  // FIXME: This is needs to be specialized to the Azimuth/Urbit NFT collection
  const itemType: string | undefined =
    (item.meta?.attributes ?? []).find(a => a.key === "size")?.value;
  // const itemUnlock: Date = getItemUnlock(item);
  // const itemTransferable: boolean = myItemGrant !== undefined
  //   && myItemGrant?.status === "success";

  return (
    <div className={cn(className, "flex flex-row justify-center gap-1 items")}>
      {(myItems === undefined || myBids === undefined) ? (
        <EllipsisHorizontalIcon className={cn(badgeClassName, "text-black animate-ping")} />
      ) : (
        <React.Fragment>
          {/*(itemUnlock < new Date(Date.now())) ? (
            <Popover
              trigger={<LockOpenIcon className={badgeClassName} />}
              content="Available for General Purchase"
            />
          ) : (
            <Popover
              trigger={<LockClosedIcon className={badgeClassName} />}
              content={`Lockup Period Ends ${
                isMaxDate(itemUnlock) ? "???" : makePrettyLapse(itemUnlock)
              } (${itemTransferable ? "A" : "Una"}vailable to You)`}
            />
          )*/}
          {true && (
            <Popover message={`${!itemType ? "Unknown" : capitalize(itemType)} ID`}>
              {(itemType === "galaxy") ? (<SparklesIcon className={badgeClassName} />)
                : (itemType === "star") ? (<StarIcon className={badgeClassName} />)
                : (itemType === "planet") ? (<GlobeAltIcon className={badgeClassName} />)
                : (<QuestionMarkCircleIcon className={badgeClassName} />)
              }
            </Popover>
          )}
          {myItems.some((i: RaribleItem) => i.id === item.id) && (
            <Popover message="Owned by Me">
              <WalletIcon className={badgeClassName} />
            </Popover>
          )}
          {myBids.some((o: RaribleOrder) =>
            (o.take.type["@type"] === "ERC721" || o.take.type["@type"] === "ERC721_Lazy")
            && `${o.take.type?.contract}:${o.take.type?.tokenId}` === item.id
          ) && (
            <Popover message="Has my Bid">
              <TagIcon className={badgeClassName} />
            </Popover>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
