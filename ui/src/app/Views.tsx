import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi';
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import UrbitIcon from '@/components/icons/UrbitIcon';
import TraderName from '@/components/TraderName';
import {
  useRaribleCollection,
  useRaribleItems,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
} from '@/state/app';
import { useModalNavigate, useChatNavigate } from '@/logic/routing';
import { isMaxDate, makePrettyPrice, makePrettyLapse } from '@/logic/utils';
import { APP_TERM, CONTRACT } from '@/constants';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
  MetaContent as RaribleMetaContent,
} from '@rarible/api-client';
import type { Address } from 'viem';
import type { OfferType } from '@/types/app';
import type { ClassProps } from '@/types/urbui';

export function CollectionGrid({className}: ClassProps) {
  const collection = useRaribleCollection();
  const myItems = useRaribleItems();

  return (
    <div className={cn(
      "flex flex-col items-center max-w-[1000px] mx-auto",
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
                "flex flex-col justify-center p-2 rounded-lg border-2",
                (myItems ?? []).some((i: RaribleItem) => i.id === item.id)
                  ? "border-green-200 hover:border-green-600"
                  : "border-gray-200 hover:border-gray-800",
              )}
            >
              <h3 className="text-lg text-center font-semibold">
                {item.meta?.name ?? "<Unknown Collection>"}
              </h3>
              <img className="object-contain" src={
                (item.meta?.content.find((entry: RaribleMetaContent) => (
                  entry["@type"] === "IMAGE"
                )) ?? {})?.url
              } />
              <div className="grid grid-cols-2 text-sm text-center">
                <div>
                  <p className="font-bold">Best Sale</p>
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
    <div className={cn("max-w-[1000px] mx-auto", className)}>
      {(item === undefined) ? (
        <LoadingIcon />
      ) : (
        <div className="grid grid-cols-1 grid-flow-dense gap-x-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-bold underline">
              {item.meta?.name ?? "<Unknown Item>"}
            </h2>
            <h3 className="text-md">
              <span className="font-semibold">Owner:</span>&nbsp;
              {owner && (
                <React.Fragment>
                  <TraderName address={owner}  />&nbsp;
                  {mine && (
                    <span className="">(Me)</span>
                  )}
                </React.Fragment>
              )}
            </h3>
            {/* TODO: Value should be derived from recent sales and all
            active offers/bids.
            <h3 className="text-md">
              <span className="font-semibold">Value:</span>
              &nbsp;{"TODO"}
            </h3>
            */}
            <hr className="my-4" />
            <h4 className="text-md font-bold underline">
              Sale(s)
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {(item.bestSellOrder !== undefined) && (
                <ItemOffer
                  order={item.bestSellOrder}
                  offerType="sell"
                  disabled={mine}
                />
              )}
            </div>
            <h4 className="text-md font-bold underline">
              Bid(s)
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {/* TODO: Sort highest to lowest price (converted to USD) */}
              {(bids ?? []).map((bid: RaribleOrder) => (
                <ItemOffer
                  key={bid.id}
                  order={bid}
                  offerType="bid"
                  disabled={!mine}
                />
              ))}
            </div>
          </div>
          <div className="sm:row-span-1 flex flex-col gap-4 items-center">
            <img className={cn(
              "object-contain rounded-lg border-2",
              mine ? "border-green-600" : "border-gray-800",
            )} src={
              (item.meta?.content.find((entry: RaribleMetaContent) => (
                entry["@type"] === "IMAGE"
              )) ?? {})?.url
            } />
            <button className="w-full button"
              onClick={() => modalNavigate("offer", {
                state: {backgroundLocation: location}
              })}
              disabled={!isConnected}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              &nbsp;{`${(offer !== undefined) ? "Update" : "Post"}
                ${mine ? "Sale" : "Bid"}
              `}
            </button>
            {(offer !== undefined) && (
              <button className="w-full button"
                onClick={() => modalNavigate("cancel", {
                  state: {backgroundLocation: location}
                })}
              >
                <XCircleIcon className="w-4 h-4" />
                &nbsp;{`Rescind ${mine ? "Sale" : "Bid"}`}
              </button>
            )}
            {!mine && (
              <button className="w-full button"
                onClick={() => (
                  // FIXME: Use the owner's ship name if available, otherwise
                  // broadcast to this listing page.
                  chatNavigate("~nec")
                )}
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                &nbsp;{"Contact Owner"}
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
    <div className="flex flex-col items-center space-y-6 py-8">
      <UrbitIcon className="animate-spin w-48 h-48 fill-stone-900" />
    </div>
  );
}
