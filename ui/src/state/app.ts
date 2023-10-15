import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useAccount } from 'wagmi';
import {
  QueryKey,
  MutationFunction,
  useQuery,
  useQueries,
  useQueryClient,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import useRaribleSDK from '@/logic/useRaribleSDK';
import useUrbitSubscription from '@/logic/useUrbitSubscription';
import { urbitAPI } from '@/api';
import { APP_TERM, CONTRACT, TRADERS_HOST, TRADERS_HOST_FLAG } from '@/constants';
import type { Address } from 'viem';
import type {
  Item as RaribleItem,
  Items as RaribleItems,
  Order as RaribleOrder,
  Orders as RaribleOrders,
  Ownership as RaribleOwnership,
  Ownerships as RaribleOwnerships,
} from '@rarible/api-client';
import type {
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

export function useUrbitTraders(): UrbitTraders | undefined {
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "traders", ...TRADERS_HOST
  ], []);

  const { data, isLoading, isError } = useUrbitSubscription({
    queryKey: queryKey,
    app: "vcc-traders",
    path: `/${TRADERS_HOST_FLAG}`,
    scry: `/${TRADERS_HOST_FLAG}`,
  });

  return (isLoading || isError)
    ? undefined
    : (data as UrbitTraders);
}

export function useAccountAddresses(): Address[] {
  const { address, isConnected } = useWagmiAccount();
  const traders = useUrbitTraders();

  return (!isConnected ? [] : [address]).concat(
    Object.entries(traders ?? {})
      .filter(([wlet, patp]: [string, string]) => patp === window.our)
      .map(([wlet, patp]: [string, string]) => (wlet as Address))
  );
}

export function useUrbitAssociateMutation(
  options?: UseMutationOptions<number, unknown, any, unknown>
) {
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "traders", ...TRADERS_HOST
  ], []);

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({address, signature}: UrbitAssoc) => urbitAPI.poke({
      app: "vcc-traders",
      mark: "vcc-action",
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

export function useRaribleCollection(): RaribleItem[] | undefined {
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "collection",
  ], []);

  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => queryRaribleContinuation(
      rsdk.apis.item.getItemsByCollection,
      {collection: CONTRACT.COLLECTION},
    ),
  });

  return (isLoading || isError)
    ? undefined
    : (data as RaribleItem[]);
}

export function useRaribleAccountItems(): RaribleItem[] | undefined {
  const addresses = useAccountAddresses();

  const rsdk = useRaribleSDK();
  const results = useQueries({ queries: addresses.map((address: Address) => ({
    queryKey: [APP_TERM, "items", address],
    queryFn: () => queryRaribleContinuation(
      rsdk.apis.item.getItemsByOwner,
      {owner: `ETHEREUM:${address}`},
    ),
  }))});

  return (results.some(q => q.isLoading) || results.some(q => q.isError))
    ? undefined
    : results.reduce(
      (a, i) => a.concat(i.data as RaribleItem[]),
      ([] as RaribleItem[])
    );
}

export function useRouteRaribleItem(): RouteRaribleItem {
  const { itemId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "item", itemId,
  ], [itemId]);

  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      const itemAddr: string = `${CONTRACT.COLLECTION}:${itemId}`;
      return Promise.all([
        rsdk.apis.item.getItemById({itemId: itemAddr}),
        queryRaribleContinuation(
          rsdk.apis.ownership.getOwnershipsByItem,
          {itemId: itemAddr},
        ),
        queryRaribleContinuation(
          rsdk.apis.order.getOrderBidsByItem,
          {itemId: itemAddr},
        ),
      ]);
    },
  });

  return (isLoading || isError)
    ? {item: undefined, owner: undefined, bids: undefined}
    : {
      item: (data[0] as RaribleItem),
      // @ts-ignore
      owner: (data[1].map((o: RaribleOwnership) => o.owner.replace(/^.+:/g, "").toLowerCase())[0] as Address),
      // @ts-ignore
      bids: (data[2].filter((o: RaribleOrder) => o.status === "ACTIVE") as RaribleOrder[]),
    };
}

export function useRouteRaribleAccountItem(): RouteRaribleAccountItem {
  const raribleItem = useRouteRaribleItem();
  const wagmiAccount = useWagmiAccount();

  return {
    ...raribleItem,
    ...wagmiAccount,
    mine: raribleItem.owner === wagmiAccount.address,
    offer: raribleItem.owner === wagmiAccount.address
      ? raribleItem.item?.bestSellOrder
      : (raribleItem.bids ?? []).find(o => o.maker === `ETHEREUM:${wagmiAccount.address}`),
  };
}

export function useRouteRaribleItemMutation<TResponse>(
  raribleFn: string,
  options?: UseMutationOptions<TResponse, unknown, any, unknown>
) {
  const { itemId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "item", itemId,
  ], [itemId]);

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
            // FIXME: The Rarible Ownership API tends to follow a confirmed
            // blockchain action with a slight delay, so we just wait a bit
            // to avoid weird desyncs this can cause with the UI (e.g. a user
            // not being listed as an NFT owner after purchase).
            new Promise(resolve => setTimeout(() => {
              resolve(rsdkResult);
            }, 10 * 1000))
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
      if (["order.acceptBid", "order.buy"].includes(raribleFn)) {
        queryClient.invalidateQueries({ queryKey: [APP_TERM, "items"] });
      }
    },
    ...options,
  });
}

export function useRouteRaribleOfferItemMutation<TResponse>(
  options?: UseMutationOptions<TResponse, unknown, any, unknown>
) {
  const { mine, offer } = useRouteRaribleAccountItem();

  return useRouteRaribleItemMutation(
    `order.${mine
      ? `sell${offer === undefined ? "" : "Update"}`
      : `bid${offer === undefined ? "" : "Update"}`
    }`,
    options,
  );
}

function queryRaribleContinuation<
  TInput extends RaribleContinuation,
  TOutput extends RaribleContinuation,
  TResult,
>(
  queryFn: (params: TInput) => Promise<TOutput>,
  queryIn: TInput,
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
        Object.assign({}, queryIn, {continuation: output.continuation}),
        results.concat(newResults),
        newResults.length < 50 || output.continuation === undefined,
      );
    });
}

export function useVentureIsAccountKYCd(): boolean | undefined {
  const { address } = useWagmiAccount();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "venture", "kyc", address,
  ], [address]);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      return address !== "0x0";
    },
  });

  return (isLoading || isError)
    ? undefined
    : (data as boolean);
}
