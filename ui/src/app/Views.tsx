import React, { useMemo, useCallback } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import VCCIcon from '@/components/icons/VCCIcon';
import TraderName from '@/components/TraderName';
import {
  useUrbitTraders,
  useRaribleCollection,
  useRaribleAccountItems,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
} from '@/state/app';
import { useModalNavigate, useChatNavigate } from '@/logic/routing';
import {
  isMaxDate,
  makePrettyName,
  makePrettyPrice,
  makePrettyLapse,
} from '@/logic/utils';
import { APP_TERM, CONTRACT } from '@/constants';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
  MetaContent as RaribleMetaContent,
  MetaAttribute as RaribleMetaAttrib,
} from '@rarible/api-client';
import type { Address } from 'viem';
import type { OfferType } from '@/types/app';
import type { ClassProps } from '@/types/urbui';

export function CollectionGrid({className}: ClassProps) {
  const collection = useRaribleCollection();
  const myItems = useRaribleAccountItems();

  return (
    <div className={cn(
      "flex flex-col items-center",
      className,
    )}>
      {(collection === undefined) ? (
        <LoadingIcon />
      ) : (
        <div className={`
          grid w-full h-fit grid-cols-2 gap-4 px-4
          justify-center sm:grid-cols-[repeat(auto-fit,minmax(auto,200px))]
        `}>
          {collection.map((item: RaribleItem) => (
            <Link key={item.tokenId}
              to={`/item/${item.tokenId}`}
              className={cn(
                "flex flex-col justify-between p-2 gap-2 rounded-lg border-2",
                (myItems ?? []).some((i: RaribleItem) => i.id === item.id)
                  ? "border-blue-300 hover:border-blue-600"
                  : "border-gray-200 hover:border-gray-800",
              )}
            >
              <h3 className="text-lg text-center font-semibold line-clamp-1">
                {makePrettyName(item)}
              </h3>
              <img className="object-cover rounded-lg aspect-square" src={
                (item.meta?.content.find((entry: RaribleMetaContent) => (
                  entry["@type"] === "IMAGE"
                )) ?? {})?.url
              } />
              <div className="grid grid-cols-2 pt-2 text-sm text-center">
                <div>
                  <p className="font-bold">Live Ask</p>
                  <p>
                    {(item?.bestSellOrder === undefined) ? (
                      "—"
                    ) : (
                      makePrettyPrice(item.bestSellOrder.take)
                    )}
                  </p>
                </div>
                <div>
                  <p className="font-bold">Best Bid</p>
                  <p>
                    {(item?.bestBidOrder === undefined) ? (
                      "—"
                    ) : (
                      makePrettyPrice(item.bestBidOrder.make)
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ItemPage({className}: ClassProps) {
  const location = useLocation();
  const modalNavigate = useModalNavigate();
  const chatNavigate = useChatNavigate();
  const {
    item, owner, bids, mine, offer,
    address, isConnected,
  } = useRouteRaribleAccountItem();
  const traders = useUrbitTraders();

  // NOTE: `isMyItem` differs from `mine` in that the former is relative to
  // all user accounts/wallets while the latter is only active relative to
  // the currently active wallet
  const myItems = useRaribleAccountItems();
  const isMyItem = (myItems ?? []).some((i: RaribleItem) => i.id === item?.id);

  const ownerUrbitId = useMemo(() => (
    (traders ?? {})[owner ?? ""]
  ), [owner, traders]);

  const ItemOffer = useCallback(({
      order,
      offerType,
      disabled,
    } : {
      order: RaribleOrder;
      offerType: OfferType;
      disabled: boolean;
    }) => (
      <div className={cn(
        "grid grid-cols-4 gap-2 items-center",
        "border border-gray-800 rounded-lg p-2",
      )}>
        <div className="truncate" children={makePrettyPrice(
          (offerType === "sell") ? order.take : order.make
        )} />
        <TraderName address={
          (order.maker.replace(/^.+:/g, "") as Address)
        } />
        <div children={isMaxDate(new Date(order?.endedAt || ""))
          ? "never"
          : makePrettyLapse(new Date(order?.endedAt || ""))
        } />
        <button className="button"
          onClick={() => modalNavigate(`trade/${order?.id}`, {
            state: {backgroundLocation: location}
          })}
          disabled={!isConnected || disabled}
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          &nbsp;{"Trade"}
        </button>
      </div>
  ), [isConnected, modalNavigate, location]);

  return (
    <div className={cn(className)}>
      {(item === undefined) ? (
        <LoadingIcon />
      ) : (
        <div className="grid grid-cols-1 grid-flow-dense gap-x-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-bold underline">
              {makePrettyName(item)}
            </h2>
            <h3 className="text-md">
              <span className="font-semibold">Owner:</span>&nbsp;
              {owner && (
                <TraderName address={owner} />
              )}
            </h3>
            {/* TODO: Value should be derived from recent sales and all
            active asks/bids.
            <h3 className="text-md">
              <span className="font-semibold">Value:</span>
              &nbsp;{"TODO"}
            </h3>
            */}
            <hr className="my-2" />
            <div className="text-sm">
              {(item.meta?.attributes ?? []).map((attrib: RaribleMetaAttrib) => (
                <p key={attrib.key}>
                  <span className="font-semibold italic">
                    {attrib?.key || "<unknown>"}:
                  </span>&nbsp;
                  {attrib?.value || "<unknown>"}
                </p>
              ))}
            </div>
            <hr className="my-2" />
            <h4 className="text-md font-bold underline">
              Active Ask(s)
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {(item.bestSellOrder === undefined) ? (
                <p>—</p>
              ) : (
                <ItemOffer
                  order={item.bestSellOrder}
                  offerType="sell"
                  disabled={mine}
                />
              )}
            </div>
            <h4 className="text-md font-bold underline">
              Active Bid(s)
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {/* TODO: Sort highest to lowest price (converted to USD) */}
              {((bids ?? []).length === 0) ? (
                <p>—</p>
              ) : ((bids ?? []).map((bid: RaribleOrder) => (
                <ItemOffer
                  key={bid.id}
                  order={bid}
                  offerType="bid"
                  disabled={!mine}
                />
              )))}
            </div>
          </div>
          <div className="sm:row-span-1 flex flex-col gap-4 items-center">
            <img className={cn(
              "object-contain aspect-square rounded-lg border-2",
              isMyItem ? "border-blue-600" : "border-gray-800",
            )} src={
              (item.meta?.content.find((entry: RaribleMetaContent) => (
                entry["@type"] === "IMAGE"
              )) ?? {})?.url
            } />
            <button className="w-full button"
              onClick={() => modalNavigate("offer", {
                state: {backgroundLocation: location}
              })}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              &nbsp;{`${(offer !== undefined) ? "Update" : "Post"}
                ${isMyItem ? "Ask" : "Bid"}
              `}
            </button>
            {(offer !== undefined) && (
              <button className="w-full button"
                onClick={() => modalNavigate("cancel", {
                  state: {backgroundLocation: location}
                })}
              >
                <XCircleIcon className="w-4 h-4" />
                &nbsp;{`Rescind ${isMyItem ? "Ask" : "Bid"}`}
              </button>
            )}
            {!isMyItem && (
              <button className="w-full button"
                disabled={ownerUrbitId === undefined}
                onClick={() => (
                  (ownerUrbitId !== undefined) && chatNavigate(ownerUrbitId)
                )}
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                &nbsp;{"Message Owner"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingIcon() {
  return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-98px)]">
      <VCCIcon className="animate-ping w-32 h-32" />
    </div>
  );
}
