import React, { ReactNode, createElement } from 'react';
import cn from 'classnames';
import { useParams } from 'react-router-dom';
import {
  EllipsisHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/solid';
import Popover from '@/components/Popover';
import {
  useWagmiAccount,
  useCollectionAccountKYC,
  useCollectionAccountGrant,
} from '@/state/app';
import { APP_TERM, FEATURED, QUERY } from '@/constants';
import {
  COLLECTIONBASE_ICON_MAP,
  URBITPOINT_ICON_MAP,
  capitalize,
  isMaxDate,
  makePrettyLapse,
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
  verbose = false,
  className,
  badgeClassName,
}: {
  item: RaribleItem;
  myItems: RaribleItem[] | undefined;
  myBids: RaribleOrder[] | undefined;
  verbose?: boolean;
  className?: string;
  badgeClassName?: string;
}) {
  const { collId } = useParams();
  const { isConnected } = useWagmiAccount();
  const myCollKYC = useCollectionAccountKYC();
  const myItemGrant = useCollectionAccountGrant(item?.tokenId);

  const isKYCColl: boolean = collId === FEATURED.VC;
  const isWalletKYCd: boolean = isConnected && !!myCollKYC?.kyc;
  const isItemTransferable: boolean = !!myItemGrant?.approved;

  const isUrbitCollection: boolean = collId === FEATURED.AZP;
  const urbitItemType: UrbitPointType | undefined = QUERY.POINT_TYPE.find(a =>
    a === (item.meta?.attributes ?? []).find(a => a.key === "size")?.value
  );

  return (
    <div className={cn(className, "flex flex-col items-center gap-2")}>
      {(myItems === undefined || myBids === undefined ||
          (isKYCColl && isConnected && (myCollKYC === undefined || myItemGrant === undefined))) ? (
        <EllipsisHorizontalIcon className={cn(badgeClassName, "text-black animate-ping")} />
      ) : (
        <React.Fragment>
          <div className={cn(className, "flex flex-row justify-center gap-1")}>
            {isKYCColl && (
              <Popover message={isItemTransferable
                ? "Available to Trade"
                : `Unavailable to Trade (${
                  !isConnected ? "No Wallet Connected"
                  : !isWalletKYCd ? "No KYC Submitted"
                  : "Non-compliant Transfer"
                })`
              }>
                {createElement(
                  isItemTransferable ? LockOpenIcon : LockClosedIcon,
                  {className: badgeClassName}
                )}
              </Popover>
            )}
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
          </div>
          {(isKYCColl && verbose && myItemGrant && !isItemTransferable) && (
            <p className="text-xs">
              <span className="text-red-500 font-semibold">
                ⚠️ Item Unavailable:
              </span>
              {` ${myItemGrant?.details}`}
            </p>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
