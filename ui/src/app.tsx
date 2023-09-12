import React, { useEffect, useState } from 'react';
import Urbit from '@urbit/http-api';
import { ethers } from 'ethers';
import { createRaribleSdk } from '@rarible/sdk';
import { toUnionAddress } from '@rarible/types';

const api = new Urbit('', '', window.desk);
api.ship = window.ship;

const ethProvider = new ethers.Wallet(
  import.meta.env.VITE_WALLET_KEY,
  new ethers.providers.JsonRpcProvider(import.meta.env.VITE_ETHRPC_URL),
);
const raribleSdk = createRaribleSdk(ethProvider, "testnet", {
  logs: 0,
  apiKey: import.meta.env.VITE_RARIBLE_KEY,
});

export function App() {
  const [goethBalance, setGoethBalance] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const balance = await raribleSdk.balances.getBalance(
          toUnionAddress(`ETHEREUM:${ethProvider.address}`),
          {
            "@type": "ETH",
            "blockchain": "ETHEREUM",
          },
      );
      setGoethBalance(balance.toString());
    };
    fetchData();
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="max-w-md space-y-6 py-20">
        <h1 className="text-3xl font-bold">Welcome to vcc-trade</h1>
        <p>GoETH Wallet Balance: {goethBalance ?? "<loading>"}</p>
      </div>
    </main>
  );
}
