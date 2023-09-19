import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useWalletClient } from 'wagmi';
import { Blockchain } from '@rarible/api-client';
import { toContractAddress, toItemId, toOrderId, toUnionAddress } from '@rarible/types';
import useRaribleSDK from '@/logic/useRaribleSDK';
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/solid';
import { useModalNavigate, useChatNavigate } from '@/logic/routing';
import { CONTRACT } from '@/constants';
import type {
  Collection as RaribleCollection,
  Item as RaribleItem,
  Items as RaribleItems,
  Ownership as RaribleOwnership,
  Ownerships as RaribleOwnerships,
  MetaContent as RaribleMetaContent,
} from '@rarible/api-client';
import type {
  IBlockchainTransaction as RaribleTransaction,
} from '@rarible/sdk-transaction';
import type { IRaribleSdk as RaribleSdk } from '@rarible/sdk';
import type { OrderId as RaribleOrderId } from '@rarible/types';
import type { ClassProps } from '@/types/urbui';

export function CollectionGrid({className}: ClassProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItems] = useState<RaribleItem[]>([]);

  const rsdk = useRaribleSDK();

  useEffect(() => {
    if (rsdk && isLoading) {
      Promise.all([
        rsdk.apis.collection.getCollectionById({collection: CONTRACT.COLLECTION}),
        rsdk.apis.item.getItemsByCollection({collection: CONTRACT.COLLECTION}),
      ]).then(([col, colItems]: [RaribleCollection, RaribleItems]) => {
        setItems(colItems.items);
        setIsLoading(false);
      }, (reason: any) => {
        console.log("*********** COLLECTION QUERY FAILED ***********");
        setIsLoading(false);
      });
    }
  }, [rsdk, isLoading]);

  return (
    <div className={cn(
      "flex flex-col items-center max-w-[1000px] mx-auto",
      className,
    )}>
      {isLoading ? (
        <h1 className="text-3xl font-bold">Loading Collection Data</h1>
      ) : (
        <div className={`
          grid w-full h-fit grid-cols-2 gap-4 px-4
          justify-center sm:grid-cols-[repeat(auto-fit,minmax(auto,200px))]
        `}>
          {items.map((item: RaribleItem) => (
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
                  `${item.bestSellOrder.makePrice} ETH`
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [item, setItem] = useState<RaribleItem | undefined>(undefined);
  const [owner, setOwner] = useState<string | undefined>(undefined);

  const params = useParams();
  const modalNavigate = useModalNavigate();
  const chatNavigate = useChatNavigate();
  const location = useLocation();
  const { data: walletClient } = useWalletClient();
  const rsdk = useRaribleSDK();

  const isMyItem: boolean =
    (owner || "0").toLowerCase() === (walletClient?.account.address || "1").toLowerCase();

  useEffect(() => {
    if (rsdk && isLoading) {
      const itemId = `${CONTRACT.COLLECTION}:${params?.itemId || 0}`;
      Promise.all([
        rsdk.apis.item.getItemById({itemId}),
        rsdk.apis.ownership.getOwnershipsByItem({itemId}),
      ]).then(([item, owns]: [RaribleItem, RaribleOwnerships]) => {
        // TODO: This code assumes exactly one owner per NFT
        setItem(item);
        setOwner(owns.ownerships[0].owner.replace(/^.+:/g, ""));
        setIsLoading(false);
      });
    }
  }, [rsdk, params?.itemId, isLoading]);

  //            onClick={() => {
  //              if (rsdk) {
  //                if (collectionItem?.bestSellOrder === undefined) {
  //                  rsdk.order.sell({
  //                    itemId: toItemId(collectionItem.id),
  //                    amount: 1,
  //                    price: "0.0005",
  //                    currency: {
  //                      "@type": "ETH",
  //                      "blockchain": Blockchain.ETHEREUM,
  //                    },
  //                    expirationDate: new Date(Date.now() + 60 * 60 * 1000),
  //                  }).then((orderId: RaribleOrderId) => {
  //                    console.log("*************** ORDER SUCCEEDED ***************");
  //                    setIsLoading(true);
  //                  }, (reason: any) => {
  //                    console.log("**************** ORDER FAILED ****************");
  //                    console.log(reason);
  //                  });
  //                } else {
  //                  rsdk.order.cancel({
  //                    orderId: toOrderId(collectionItem.bestSellOrder.id),
  //                  }).then((orderTxn: RaribleTransaction) => {
  //                    console.log("*************** CANCEL SUCCEEDED ***************");
  //                    setIsLoading(true);
  //                  }, (reason: any) => {
  //                    console.log("**************** CANCEL FAILED ****************");
  //                    console.log(reason);
  //                  });
  //                }
  //              }
  //            }}

  return (
    <div className={cn("max-w-[1000px] mx-auto", className)}>
      {isLoading ? (
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
              <div className="grid grid-cols-3 gap-2 items-center border border-gray-800 rounded-lg p-2">
                <div>100.00 USDC</div>
                <div className="truncate">{owner}</div>
                <button className="button"
                  onClick={() => modalNavigate(`take/${0}`, {
                    state: {backgroundLocation: location}
                  })}
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" />
                  &nbsp;{"Take"}
                </button>
              </div>
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
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              &nbsp;{isMyItem ? "List Item" : "Place Offer"}
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
