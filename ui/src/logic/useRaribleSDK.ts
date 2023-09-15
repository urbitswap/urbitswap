import { useState, useEffect } from 'react';
import { ethers } from 'ethers'
import { useWalletClient, usePublicClient } from 'wagmi';
import { createRaribleSdk } from '@rarible/sdk';
import type { WalletClient } from '@wagmi/core'
import type { IRaribleSdk as RaribleSdk } from '@rarible/sdk';

export default function useRaribleSDK(): RaribleSdk | undefined {
  const [rsdk, setRSDK] = useState<RaribleSdk | undefined>(undefined);

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    // source: https://docs.rarible.org/getting-started/quick-start/#using-sdk
    if (walletClient) {
      const ethersSigner = walletClientToSigner(walletClient);
      const newRSDK = createRaribleSdk(ethersSigner, "testnet", {
        logs: 0,
        apiKey: import.meta.env.VITE_RARIBLE_KEY,
      });
      setRSDK(newRSDK);
    }
  }, [walletClient]);

  return rsdk;
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
