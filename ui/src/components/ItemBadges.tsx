import React, { ReactNode, createElement } from 'react';
import cn from 'classnames';
import { useParams } from 'react-router-dom';
import {
  EllipsisHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/solid';
import Popover from '@/components/Popover';
// import { useUrbitNetworkLayer, useVentureAccountGrant } from '@/state/app';
import { APP_TERM, FEATURED, QUERY } from '@/constants';
import {
  COLLECTIONBASE_ICON_MAP,
  URBITPOINT_ICON_MAP,
  capitalize,
  isMaxDate,
  makePrettyLapse,
  getItemUnlock,
} from '@/logic/utils';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
} from '@rarible/api-client';
import type {
  CollectionBase,
  UrbitPointType,
  IconLabel,
} from '@/types/app';

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
  const { collId } = useParams();
  // const myItemGrant = useVentureAccountGrant(item.tokenId ?? "");
  // const myItemLayer = useUrbitNetworkLayer(item.meta?.name ?? "");

  const isUrbitCollection: boolean = collId === FEATURED.AZP;
  const urbitItemType: UrbitPointType | undefined = QUERY.POINT_TYPE.find(a =>
    a === (item.meta?.attributes ?? []).find(a => a.key === "size")?.value
  );
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
          {isUrbitCollection && (
            <Popover message={`${URBITPOINT_ICON_MAP[(urbitItemType ?? "")].name} ID`}>
              {createElement(
                URBITPOINT_ICON_MAP[urbitItemType ?? ""].icon,
                {className: badgeClassName},
              )}
            </Popover>
          )}
          {myItems.some((i: RaribleItem) => i.id === item.id) && (
            <Popover message={COLLECTIONBASE_ICON_MAP["mine"].name}>
              {createElement(COLLECTIONBASE_ICON_MAP["mine"].icon, {className: badgeClassName})}
            </Popover>
          )}
          {myBids.some((o: RaribleOrder) =>
            (o.take.type["@type"] === "ERC721" || o.take.type["@type"] === "ERC721_Lazy")
            && `${o.take.type?.contract}:${o.take.type?.tokenId}` === item.id
          ) && (
            <Popover message={COLLECTIONBASE_ICON_MAP["bids"].name}>
              {createElement(COLLECTIONBASE_ICON_MAP["bids"].icon, {className: badgeClassName})}
            </Popover>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
