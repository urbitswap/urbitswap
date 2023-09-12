import React, { useEffect, useState } from 'react';
import Urbit from '@urbit/http-api';
import { ethers } from 'ethers';
import { createRaribleSdk } from '@rarible/sdk';
import { Blockchain } from '@rarible/api-client';
import { toContractAddress, toItemId, toOrderId, toUnionAddress } from '@rarible/types';

import type {
  Collection as RaribleCollection,
  Item as RaribleItem,
  Items as RaribleItems,
  MetaContent as RaribleMetaContent,
} from '@rarible/api-client';
import type {
  IBlockchainTransaction as RaribleTransaction,
} from '@rarible/sdk-transaction';
import type {
  OrderId as RaribleOrderId,
} from '@rarible/types';

const api = new Urbit('', '', window.desk);
api.ship = window.ship;

// FIXME: Generate the provider using MetaMask in production.
// FIXME: According to Rarible docs, ethers is readonly... why?
// https://github.com/rarible/sdk#ethers
const eth = new ethers.Wallet(
  import.meta.env.VITE_WALLET_KEY,
  new ethers.providers.JsonRpcProvider(import.meta.env.VITE_ETHRPC_URL),
);
const rsdk = createRaribleSdk(eth, "testnet", {
  logs: 0,
  apiKey: import.meta.env.VITE_RARIBLE_KEY,
});

export function App() {
  const collectionAddress = toContractAddress(
    "ETHEREUM:0xa144C7E81398B90680bBb34320e062f4bFE37564"
  );
  const usdcAddress = toContractAddress(
    "ETHEREUM:0x9f853f3B6a9dD425F8Cf73eF5B90e8eBf412317b"
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [collectionName, setCollectionName] = useState<string>("");
  const [collectionItems, setCollectionItems] = useState<RaribleItem[]>([]);

  useEffect(() => {
    if (isLoading) {
      Promise.all([
        rsdk.apis.collection.getCollectionById({collection: collectionAddress}),
        rsdk.apis.item.getItemsByCollection({collection: collectionAddress}),
      ]).then(([col, colItems]: [RaribleCollection, RaribleItems]) => {
        setCollectionName(col.name);
        setCollectionItems(colItems.items);
        setIsLoading(false);
      }, (reason: any) => {
        console.log("*********** COLLECTION QUERY FAILED ***********");
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <main>
      <div className="flex flex-col items-center max-w-[1000px] mx-auto space-y-6 py-6">
        {isLoading ? (
          <h1 className="text-3xl font-bold">Loading Collection Data</h1>
        ) : (
          <React.Fragment>
            <h1 className="text-3xl font-bold">Collection: {collectionName}</h1>
            <div className={`
              grid w-full h-fit grid-cols-2 gap-4 px-4
              justify-center sm:grid-cols-[repeat(auto-fit,minmax(auto,200px))]
            `}>
              {collectionItems.map((collectionItem: RaribleItem) => (
                <div key={collectionItem.tokenId}
                  className="flex flex-col justify-center hover:cursor-pointer hover:border-2"
                  onClick={() => {
                    if (collectionItem?.bestSellOrder === undefined) {
                      rsdk.order.sell({
                        itemId: toItemId(collectionItem.id),
                        amount: 1,
                        price: "0.0005",
                        currency: {
                          "@type": "ETH",
                          "blockchain": Blockchain.ETHEREUM,
                        },
                        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
                      }).then((orderId: RaribleOrderId) => {
                        console.log("*************** ORDER SUCCEEDED ***************");
                        setIsLoading(true);
                      }, (reason: any) => {
                        console.log("**************** ORDER FAILED ****************");
                        console.log(reason);
                      });
                    } else {
                      rsdk.order.cancel({
                        orderId: toOrderId(collectionItem.bestSellOrder.id),
                      }).then((orderTxn: RaribleTransaction) => {
                        console.log("*************** CANCEL SUCCEEDED ***************");
                        setIsLoading(true);
                      }, (reason: any) => {
                        console.log("**************** CANCEL FAILED ****************");
                        console.log(reason);
                      });
                    }
                  }}
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
                </div>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </main>
  );
}
