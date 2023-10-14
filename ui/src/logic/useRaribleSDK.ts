import { useState, useMemo } from 'react';
import { ethers } from 'ethers'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { createRaribleSdk } from '@rarible/sdk';
import { genRateLimiter } from '@/logic/utils';
import { ENV_TEST } from '@/constants';
import type { WalletClient } from '@wagmi/core'
import type { IRaribleSdk as RaribleSdk } from '@rarible/sdk';
import type { Callable, Args } from '@/types/utils'

type MiddlewarePromise = Promise<[
  Callable,
  void | ((p: Promise<any>) => Promise<any>)
]>;

export default function useRaribleSDK(): RaribleSdk {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => createRaribleSdk(
    (isConnected && walletClient) ? walletClientToSigner(walletClient) : undefined,
    ENV_TEST ? "testnet" : "prod",
    {
      logs: 0,
      apiKey: import.meta.env.VITE_RARIBLE_KEY,
      // NOTE: Each 'middleware' is a function that provides a tuple of:
      //   (wrapped API call, callback on API results (promise or value))
      // Usage examples can be found in:
      //   rarible-sdk/packages/sdk/src/common/middleware/middleware.test.ts
      middlewares: [reportRaribleCall, limitRaribleCall],
    },
  ), [isConnected, walletClient]);
}

async function reportRaribleCall(fn: Callable, args: Args): MiddlewarePromise
{
  return [
    (...argz: any[]) => {
      ENV_TEST && console.log(fn.name);
      return fn(...argz);
    },
    async (res: Promise<any>) => {
      // ENV_TEST && console.log(await res);
      return res;
    },
  ];
}

const limitRarible = genRateLimiter(5, 6);
async function limitRaribleCall(fn: Callable, args: Args): MiddlewarePromise
{
  return [
    (...argz: any[]) => fn(...argz),
    async (res: Promise<any>) => (
      new Promise(resolve => limitRarible(resolve)).then(() => res)
    ),
  ];
}

// source: https://wagmi.sh/core/ethers-adapters
function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}
