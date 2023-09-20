import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi';
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/solid';
import { useRaribleCollection, useRouteRaribleItem } from '@/state/app';
import { useModalNavigate, useChatNavigate } from '@/logic/routing';
import { makePrettyPrice } from '@/logic/utils';
import { APP_TERM, CONTRACT } from '@/constants';
import type {
  Item as RaribleItem,
  MetaContent as RaribleMetaContent,
} from '@rarible/api-client';
import type { ClassProps } from '@/types/urbui';

export function CollectionGrid({className}: ClassProps) {
  const collection = useRaribleCollection();

  return (
    <div className={cn(
      "flex flex-col items-center max-w-[1000px] mx-auto",
      className,
    )}>
      {(collection === undefined) ? (
        <h1 className="text-3xl font-bold">Loading Collection Data</h1>
      ) : (
        <div className={`
          grid w-full h-fit grid-cols-2 gap-4 px-4
          justify-center sm:grid-cols-[repeat(auto-fit,minmax(auto,200px))]
        `}>
          {collection.map((item: RaribleItem) => (
            <Link key={item.tokenId}
              to={`/item/${item.tokenId}`}
              className="flex flex-col justify-center hover:border-2"
            >
              <h3 className="text-lg text-center font-semibold">
                {item.meta?.name ?? "<Unknown Collection>"}
              </h3>
              <img className="object-contain" src={
                (item.meta?.content.find((entry: RaribleMetaContent) => (
                  entry["@type"] === "IMAGE"
                )) ?? {})?.url
              } />
              <p className="text-sm text-center">
                {(item?.bestSellOrder === undefined) ? (
                  "Unlisted"
                ) : (
                  makePrettyPrice(item.bestSellOrder.take)
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ItemPage({className}: ClassProps) {
  const [item, owners] = useRouteRaribleItem();
  const { address, isConnected } = useAccount();
  const location = useLocation();
  const modalNavigate = useModalNavigate();
  const chatNavigate = useChatNavigate();

  const owner: string = owners?.ownerships[0].owner.replace(/^.+:/g, "") ?? "";
  const isMyItem: boolean =
    (owner ?? "a").toLowerCase() === (address ?? "b").toLowerCase();
  const hasMyBid: boolean = isMyItem
    ? item?.bestSellOrder !== undefined
    : false;

  return (
    <div className={cn("max-w-[1000px] mx-auto", className)}>
      {(item === undefined) ? (
        <h1 className="text-3xl font-bold">Loading Item Data</h1>
      ) : (
        <div className="grid grid-cols-1 grid-flow-dense gap-x-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-bold underline">
              {item.meta?.name ?? "<Unknown Item>"}
            </h2>
            <h3 className="text-lg">
              <span className="font-semibold">Owner:</span>
              &nbsp;{`${owner}${!isMyItem ? "" : " (Me)"}`}
            </h3>
            <h3 className="text-lg">
              <span className="font-semibold">Value:</span>
              &nbsp;{"TODO"}
            </h3>
            <hr className="my-4" />
            <h4 className="text-md font-bold underline">
              Listing
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {(item.bestSellOrder !== undefined) && (
                <div className="grid grid-cols-3 gap-2 items-center border border-gray-800 rounded-lg p-2">
                  <div className="truncate">
                    {makePrettyPrice(item.bestSellOrder.take)}
                  </div>
                  <div className="truncate">
                    {owner}
                  </div>
                  <button className="button"
                    onClick={() => modalNavigate(`take/${0}`, {
                      state: {backgroundLocation: location}
                    })}
                    disabled={!isConnected || isMyItem}
                  >
                    <ArrowsRightLeftIcon className="w-4 h-4" />
                    &nbsp;{"Take"}
                  </button>
                </div>
              )}
            </div>
            <h4 className="text-md font-bold underline">
              Offers
            </h4>
            {/* TODO: Replicate the above. */}
          </div>
          <div className="sm:row-span-1 flex flex-col gap-4 items-center">
            <img className="object-contain border-2 border-gray-800" src={
              (item.meta?.content.find((entry: RaribleMetaContent) => (
                entry["@type"] === "IMAGE"
              )) ?? {})?.url
            } />
            <button className="w-full button"
              onClick={() => modalNavigate("bid", {
                state: {backgroundLocation: location}
              })}
              disabled={!isConnected}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              &nbsp;{`
                ${hasMyBid ? "Update" : "Post"}
                ${isMyItem ? "Listing" : "Offer"}
              `}
            </button>
            {!isMyItem && (
              <button className="w-full button" onClick={() => (
                // FIXME: Use the owner's ship name if available, otherwise
                // broadcast to this listing page.
                chatNavigate("~nec")
              )}>
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
