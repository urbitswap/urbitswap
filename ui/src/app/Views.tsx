import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import { Blockchain } from '@rarible/api-client';
import { toContractAddress, toItemId, toOrderId, toUnionAddress } from '@rarible/types';
import useRaribleSDK from '@/logic/useRaribleSDK';
import { CONTRACT } from '@/constants';
import type {
  Collection as RaribleCollection,
  Item as RaribleItem,
  Items as RaribleItems,
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
  const [collectionItems, setCollectionItems] = useState<RaribleItem[]>([]);

  const rsdk = useRaribleSDK();

  useEffect(() => {
    if (rsdk && isLoading) {
      Promise.all([
        rsdk.apis.collection.getCollectionById({collection: CONTRACT.COLLECTION}),
        rsdk.apis.item.getItemsByCollection({collection: CONTRACT.COLLECTION}),
      ]).then(([col, colItems]: [RaribleCollection, RaribleItems]) => {
        setCollectionItems(colItems.items);
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
          {collectionItems.map((collectionItem: RaribleItem) => (
            <Link key={collectionItem.tokenId}
              to={`/item/${collectionItem.tokenId}`}
              className="flex flex-col justify-center hover:border-2"
            >
              <h3 className="text-lg text-center font-semibold">
                {collectionItem.meta?.name ?? "<Unknown Collection>"}
              </h3>
              <img className="object-contain" src={
                (collectionItem.meta?.content.find((entry: RaribleMetaContent) => (
                  entry["@type"] === "IMAGE"
                )) ?? {})?.url
              } />
              <p className="text-sm text-center">
                {(collectionItem?.bestSellOrder === undefined) ? (
                  "Unlisted"
                ) : (
                  `${collectionItem.bestSellOrder.makePrice} ETH`
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
    <p>TODO: Item Page Here</p>
  );
}
