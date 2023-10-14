import { useState, useCallback, useMemo } from 'react';
import {
  QueryKey,
  QueryFunctionContext,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { ethers } from 'ethers'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { createRaribleSdk } from '@rarible/sdk';
import { ENV_TEST } from '@/constants';
import type { WalletClient } from '@wagmi/core'
import type { IRaribleSdk as RaribleSdk } from '@rarible/sdk';

export default function useRaribleQuery() {
  return 0;
}


// export default function useRaribleQuery({
//   queryKey,
//   queryFn,
//   queryArgs,
//   options,
// }: {
//   queryKey: QueryKey;
//   queryFn: (rsdk: RaribleSDK) => Promise;
//   options?: UseQueryOptions;
// }): ReturnType<typeof useQuery> {
//   const rsdk = useRaribleSDK();
//
//   const fetchData = useCallback((con: QueryFunctionContext): Promise => (
//
//   ), [rsdk]);
//
//   const queryClient = useQueryClient();
//   const invalidate = useRef(() => {
//     debounce(
//       () => {
//         queryClient.invalidateQueries(queryKey);
//       },
//       300,
//       { leading: true, trailing: true }
//     )
//   });
//
//   const fetchData = async () => (
//     urbitAPI.scry({
//       app: scryApp,
//       path: scry,
//     })
//   );
//
//   useEffect(() => {
//     urbitAPI.subscribe({
//       app,
//       path,
//       event: invalidate.current,
//     });
//   }, [app, path, queryClient, queryKey]);
//
//   return useQuery(queryKey, fetchData, {
//     retryOnMount: false,
//     refetchOnMount: false,
//     ...options,
//   });
// }
//
// export function useRaribleSDK(): RaribleSdk {
//   const { isConnected } = useAccount();
//   const { data: walletClient } = useWalletClient();
//
//   return useMemo(() => createRaribleSdk(
//     (isConnected && walletClient) ? walletClientToSigner(walletClient) : undefined,
//     ENV_TEST ? "testnet" : "prod",
//     {
//       logs: 0,
//       apiKey: import.meta.env.VITE_RARIBLE_KEY,
//       middlewares: [], // TODO:
//     },
//   ), [isConnected, walletClient]);
// }
//
// function queryRaribleContinuation<
//   TInput extends RaribleContinuation,
//   TOutput extends RaribleContinuation,
//   TResult,
// >(
//   queryFn: (params: TInput) => Promise<TOutput>,
//   resultFn: (result: TOutput) => TResult[],
//   queryIn: TInput,
//   results: TResult[] = [],
//   first: boolean = true,
// ): Promise<TResult[]> {
//   // The limit per continuation is 50; see this example:
//   // https://docs.rarible.org/getting-started/fetch-nft-data/#get-all-nfts-in-a-collection
//   return (!first && queryIn.continuation === undefined)
//     ? new Promise((resolve) => resolve(results))
//     : queryFn(queryIn).then((result: TOutput) => queryRaribleContinuation(
//       queryFn, resultFn,
//       Object.assign({}, queryIn, {continuation: result.continuation}),
//       results.concat(resultFn(result)), false,
//     ));
// }
//
// // source: https://wagmi.sh/core/ethers-adapters
// function walletClientToSigner(walletClient: WalletClient) {
//   const { account, chain, transport } = walletClient;
//   const network = {
//     chainId: chain.id,
//     name: chain.name,
//     ensAddress: chain.contracts?.ensRegistry?.address,
//   };
//   const provider = new ethers.providers.Web3Provider(transport, network);
//   const signer = provider.getSigner(account.address);
//   return signer;
// }
