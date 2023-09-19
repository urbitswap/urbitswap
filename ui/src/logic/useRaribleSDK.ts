import { useState, useMemo } from 'react';
import { ethers } from 'ethers'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { createRaribleSdk } from '@rarible/sdk';
import { ENV_TEST } from '@/constants';
import type { WalletClient } from '@wagmi/core'
import type { IRaribleSdk as RaribleSdk } from '@rarible/sdk';

export default function useRaribleSDK(): RaribleSdk {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => createRaribleSdk(
    (isConnected && walletClient) ? walletClientToSigner(walletClient) : undefined,
    ENV_TEST ? "testnet" : "prod",
    {
      logs: 0,
      apiKey: import.meta.env.VITE_RARIBLE_KEY,
    },
  ), [isConnected, walletClient]);
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
