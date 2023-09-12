import React, { useEffect, useState } from 'react';
import Urbit from '@urbit/http-api';
import { ethers } from 'ethers';
import { createRaribleSdk } from '@rarible/sdk';
import { toUnionAddress } from '@rarible/types';

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
  const collectionAddress = "ETHEREUM:0xa144C7E81398B90680bBb34320e062f4bFE37564";

  // TODO: Use @rarible/types
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [collectionName, setCollectionName] = useState<string | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<object[] | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const colArgs = {collection: collectionAddress};
      const col = await rsdk.apis.collection.getCollectionById(colArgs);
      const colItems = await rsdk.apis.item.getItemsByCollection(colArgs);

      setCollectionName(col.name);
      setCollectionItems(colItems.items);
      setIsLoading(false);
    };
    fetchData();
  }, []);

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
              {collectionItems.map((collectionItem: object) => (
                <div className="flex flex-col justify-center" key={collectionItem.tokenId}>
                  <h3 className="text-lg text-center font-semibold">{collectionItem.meta.name}</h3>
                  <img className="object-contain" src={
                    collectionItem.meta.content.find((entry: object) => (
                      entry["@type"] === "IMAGE"
                    )).url
                  } />
                </div>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </main>
  );
}
