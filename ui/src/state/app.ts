import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import {
  QueryKey,
  MutationFunction,
  useQuery,
  useInfiniteQuery,
  useQueries,
  useQueryClient,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import useRaribleSDK from '@/logic/useRaribleSDK';
import useUrbitSubscription from '@/logic/useUrbitSubscription';
import {
  requestVentureKYC,
  requestVentureTransfer,
  addVentureAttribs,
} from '@/logic/ventureclub';
import { wagmiAPI, urbitAPI } from '@/api';
import { APP_TERM, CONTRACT, FEATURED, TRADERS_HOST, TRADERS_HOST_FLAG } from '@/constants';
import { OrderStatus as RaribleOrderStatus } from '@rarible/api-client';
import type { Address } from 'viem';
import type {
  Collection as RaribleCollection,
  Item as RaribleItem,
  Items as RaribleItems,
  Order as RaribleOrder,
  Orders as RaribleOrders,
  Ownership as RaribleOwnership,
  Ownerships as RaribleOwnerships,
} from '@rarible/api-client';
import type {
  KYCData,
  TransferData,
  UrbitTraders,
  UrbitAssoc,
  RouteRaribleItem,
  RouteRaribleAccountItem,
  RaribleContinuation,
} from '@/types/app';

export function useWagmiAccount() {
  const { address, ...account } = useAccount();
  return {
    address: ((address ?? "0x").toLowerCase() as Address),
    ...account,
  };
}

export function useWagmiConnect() {
  return useConnect({connector: wagmiAPI.connectors?.[0]});
}

// NOTE: Purely for symmetry
export function useWagmiDisconnect() {
  return useDisconnect();
}

export function useCollectionAccountKYC(): KYCData | undefined {
  const { address } = useWagmiAccount();
  const { collId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "collection", collId, "kyc", address,
  ], [address, collId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: async () => (
      false // collId === FEATURED.VC
        ? requestVentureKYC(address)
        : {kyc: true, noauth: true}
    ),
    enabled: !!collId,
  });

  return (isLoading || isError)
    ? undefined
    : (data as KYCData);
}

export function useItemAccountGrant(): TransferData | undefined {
  const { address } = useWagmiAccount();
  const { collId, itemId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "collection", collId, "grant", address, itemId,
  ], [address, collId, itemId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: async () => (
      false // collId === FEATURED.VC
        ? requestVentureTransfer(address, address, itemId ?? "")
        : {status: "success", callId: "", signature: "", nonce: "", expiryBlock: ""}
    ),
    enabled: !!collId && !!itemId,
  });

  return (isLoading || isError)
    ? undefined
    : (data as TransferData);
}

export function useUrbitTraders(): UrbitTraders | undefined {
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "urbit", "traders", ...TRADERS_HOST
  ], []);

  const { data, isLoading, isError } = useUrbitSubscription({
    queryKey: queryKey,
    app: "swap-traders",
    path: `/swap/${TRADERS_HOST_FLAG}`,
    scry: `/${TRADERS_HOST_FLAG}`,
  });

  return (isLoading || isError)
    ? undefined
    : (data as UrbitTraders);
}

export function useUrbitAccountAssocAddresses(): Set<Address> | undefined {
  const traders = useUrbitTraders();

  return traders &&
    new Set(Object.entries(traders)
      .filter(([wlet, patp]: [string, string]) => patp === window.our)
      .map(([wlet, patp]: [string, string]) => (wlet as Address))
    );
}

export function useUrbitAccountAllAddresses(): Set<Address> | undefined {
  const { address, isConnected } = useWagmiAccount();
  const assocAddresses = useUrbitAccountAssocAddresses();

  return assocAddresses &&
    (() => {
      if (isConnected) assocAddresses.add(address);
      return assocAddresses;
    })();
}

export function useUrbitAssociateMutation(
  options?: UseMutationOptions<number, unknown, any, unknown>
) {
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "urbit", "traders", ...TRADERS_HOST
  ], []);

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({address, signature}: UrbitAssoc) => urbitAPI.poke({
      app: "swap-traders",
      mark: "swap-action",
      json: {
        traders: TRADERS_HOST_FLAG,
        update: {asoc: {addr: address, sign: signature}},
      },
    }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      return await queryClient.getQueryData(queryKey);
    },
    onError: (err, variables, oldData) =>
      queryClient.setQueryData(queryKey, oldData),
    onSettled: (_data, _error, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKey }),
    ...options,
  });
}

export function useRaribleCollectionMeta(): RaribleCollection | undefined {
  const { collId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "rarible", "collection", collId, "meta",
  ], [collId]);

  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => rsdk.apis.collection.getCollectionById(
      {collection: collId ?? ""},
    ),
    enabled: !!collId,
    // NOTE: This will update extremely infrequently, so we don't even bother
    // refetching the data.
    retryOnMount: false,
    refetchOnMount: false,
  });

  return (isLoading || isError)
    ? undefined
    : (data as RaribleCollection);
}

export function useRaribleCollectionItems(): RaribleItem[] | undefined {
  const { collId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "rarible", "collection", collId, "items", "complete",
  ], [collId]);

  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => queryRaribleContinuation(
      (c: string | undefined) => rsdk.apis.item.getItemsByCollection({
        collection: collId ?? "",
        continuation: c,
      }),
    ),
    enabled: !!collId,
  });

  return (isLoading || isError)
    ? undefined
    : (data as RaribleItem[]); // .map(addVentureAttribs);
}

export function useRaribleAccountItems(): RaribleItem[] | undefined {
  const addresses = useUrbitAccountAllAddresses();
  const addressList = Array.from(addresses ?? new Set<Address>());

  const rsdk = useRaribleSDK();
  const results = useQueries({ queries: addressList.map((address: Address) => ({
    queryKey: [APP_TERM, "rarible", "account", address, "items"],
    queryFn: () => queryRaribleContinuation(
      (c: string | undefined) => rsdk.apis.item.getItemsByOwner({
        owner: `ETHEREUM:${address}`,
        continuation: c,
      }),
    ),
    enabled: !!addresses,
    // FIXME: Applying a more strict throttle on ownership because the query
    // can be expensive (esp. if a user has multiple addresses or owns many
    // NFTs). It would be better to not retry on fetch/mount and to rely on a
    // ethers/web3 for invalidation event listener.
    staleTime: 2 * 60 * 1000,
  }))});

  return (!addresses || results.some(q => q.isLoading) || results.some(q => q.isError))
    ? undefined
    : results.reduce(
      (a, i) => a.concat(i.data as RaribleItem[]),
      ([] as RaribleItem[])
    ); // .map(addVentureAttribs);
}

export function useRaribleAccountBids(): RaribleOrder[] | undefined {
  const addresses = useUrbitAccountAllAddresses();
  const addressList = Array.from(addresses ?? new Set<Address>());

  const rsdk = useRaribleSDK();
  const results = useQueries({ queries: addressList.map((address: Address) => ({
    queryKey: [APP_TERM, "rarible", "account", address, "bids"],
    queryFn: () => queryRaribleContinuation(
      (c: string | undefined) => rsdk.apis.order.getOrderBidsByMaker({
        maker: [`ETHEREUM:${address}`],
        status: [RaribleOrderStatus.ACTIVE],
        continuation: c,
      }),
    ),
    enabled: !!addresses,
    // FIXME: We can query account bids even less frequently because all
    // modifications will come through this interface (but we still need
    // a clean way to invalidate expired bids, which could probably be done
    // by looking at expiration values instead of requerying the API).
    staleTime: 10 * 60 * 1000,
  }))});

  return (!addresses || results.some(q => q.isLoading) || results.some(q => q.isError))
    ? undefined
    : results.reduce(
      (a, i) => a.concat(i.data as RaribleOrder[]),
      ([] as RaribleOrder[])
    );
}

export function useRouteRaribleItem(): RouteRaribleItem {
  const { collId, itemId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "rarible", "collection", collId, "item", itemId,
  ], [collId, itemId]);

  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      const itemAddr: string = `${collId}:${itemId}`;
      return Promise.all([
        rsdk.apis.item.getItemById({itemId: itemAddr}),
        queryRaribleContinuation(
          (c: string | undefined) => rsdk.apis.ownership.getOwnershipsByItem({
            itemId: itemAddr,
            continuation: c,
          }),
        ),
        queryRaribleContinuation(
          (c: string | undefined) => rsdk.apis.order.getOrderBidsByItem({
            itemId: itemAddr,
            status: [RaribleOrderStatus.ACTIVE],
            continuation: c,
          }),
        ),
      ]);
    },
  });

  return (isLoading || isError)
    ? {item: undefined, owner: undefined, bids: undefined}
    : {
      item: (data[0] as RaribleItem), // addVentureAttribs(data[0] as RaribleItem),
      // @ts-ignore
      owner: (data[1].map((o: RaribleOwnership) => o.owner.replace(/^.+:/g, "").toLowerCase())[0] as Address),
      bids: (data[2] as RaribleOrder[]),
    };
}

export function useRouteRaribleAccountItem(): RouteRaribleAccountItem {
  const raribleItem = useRouteRaribleItem();
  const wagmiAccount = useWagmiAccount();
  const myRaribleItems = useRaribleAccountItems();

  return {
    ...raribleItem,
    ...wagmiAccount,
    myItems: myRaribleItems,
    offer: raribleItem.owner === wagmiAccount.address
      ? raribleItem.item?.bestSellOrder
      : (raribleItem.bids ?? []).find(o => o.maker === `ETHEREUM:${wagmiAccount.address}`),
    isMyItem: (myRaribleItems ?? []).some((i: RaribleItem) => i.id === raribleItem.item?.id),
    isAddressItem: raribleItem.owner === wagmiAccount.address,
  };
}

export function useRouteRaribleItemMutation<TResponse>(
  raribleFn: string,
  options?: UseMutationOptions<TResponse, unknown, any, unknown>
) {
  const { collId, itemId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "rarible", "collection", collId, "item", itemId,
  ], [collId, itemId]);
  const { address } = useWagmiAccount();
  const accountKey: QueryKey = useMemo(() => [
    APP_TERM, "rarible", "account", address,
  ], [address]);

  const rsdk = useRaribleSDK();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (((...args) => {
      // @ts-ignore
      const mutate: MutationFunction<TResponse, any> = raribleFn.split(".").reduce((p,c) => p && p[c] || null, rsdk);
      return mutate(...args).then((result: TResponse) => (
        // @ts-ignore
        (result?.wait === undefined || typeof(result!.wait) !== "function")
          ? result
          // @ts-ignore
          : result.wait().then((rsdkResult: any) =>
            // FIXME: The Rarible Ownership API tends to lag a few seconds
            // behind a confirmed blockchain action, so we just wait a bit
            // to avoid UI desyncs (e.g. a user not being listed as an NFT
            // owner after purchase).
            new Promise(resolve => setTimeout(() => {
              resolve(rsdkResult);
            }, 20 * 1000))
          )
      ));
    }) as MutationFunction<TResponse, any>),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      return await queryClient.getQueryData(queryKey);
    },
    onError: (err, variables, oldData) =>
      queryClient.setQueryData(queryKey, oldData),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: [APP_TERM, "rarible", "collection", collId, "items"] });
      if (["order.bid", "order.bidUpdate", "order.cancel"].includes(raribleFn)) {
        queryClient.invalidateQueries({ queryKey: [...accountKey, "bids"] });
      } if (["order.acceptBid", "order.buy"].includes(raribleFn)) {
        queryClient.invalidateQueries({ queryKey: [...accountKey, "items"] });
      }
    },
    ...options,
  });
}

// FIXME: Using a lamda captured function in this way required more code
// duplication, but it's needed as a workaround to capture/context problems
// when calling raw passed Rarible SDK functions with more recent versions
// (i.e. 0.13.50+).
function queryRaribleContinuation<
  TOutput extends RaribleContinuation,
  TResult,
>(
  queryFn: (continuation: string | undefined) => Promise<TOutput>,
  queryIn: string | undefined = undefined,
  results: TResult[] = [],
  isFinalCall: boolean = false,
): Promise<TResult[]> {
  // The limit per continuation is 50; see this example:
  // https://docs.rarible.org/getting-started/fetch-nft-data/#get-all-nfts-in-a-collection
  return isFinalCall
    ? new Promise((resolve) => resolve(results))
    : queryFn(queryIn).then((output: TOutput) => {
      const newResults: TResult[] =
        (Object.values(output).find(Array.isArray) as TResult[]);
      return queryRaribleContinuation(
        queryFn,
        output.continuation,
        results.concat(newResults),
        newResults.length < 50 || output.continuation === undefined,
      );
    });
}
