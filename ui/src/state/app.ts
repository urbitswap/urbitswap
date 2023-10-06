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
      await queryClient.cancelQueries(queryKey);
      return await queryClient.getQueryData(queryKey);
    },
    onError: (err, variables, oldData) =>
      queryClient.setQueryData(queryKey, oldData),
    onSettled: (_data, _error, variables) =>
      queryClient.invalidateQueries(queryKey),
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
      (result: RaribleItems): RaribleItem[] => result.items,
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
      (result: RaribleItems): RaribleItem[] => result.items,
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
          (result: RaribleOwnerships): Address[] => (result.ownerships.map(o => (
            o.owner.replace(/^.+:/g, "").toLowerCase()
          )) as Address[]),
          {itemId: itemAddr},
        ),
        queryRaribleContinuation(
          rsdk.apis.order.getOrderBidsByItem,
          (result: RaribleOrders): RaribleOrder[] => result.orders.filter(o => (
            o.status === "ACTIVE"
          )),
          {itemId: itemAddr},
        ),
      ]);
    }
  });

  return (isLoading || isError)
    ? {item: undefined, owner: undefined, bids: undefined}
    : {
      item: (data[0] as RaribleItem),
      owner: (data[1][0] as Address),
      bids: (data[2] as RaribleOrder[]),
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
  const queryRouteKey: QueryKey = useMemo(() => [
    APP_TERM, "item", itemId,
  ], [itemId]);
  const queryItemsKey: QueryKey = useMemo(() => [
    APP_TERM, "items"
  ], []);

  const rsdk = useRaribleSDK();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (((...args) => {
      // @ts-ignore
      const mutate: MutationFunction<TResponse, any> = raribleFn.split(".").reduce((p,c) => p && p[c] || null, rsdk);
      return mutate(...args).then((result: TResponse) => (
        // @ts-ignore
        (result?.wait && typeof(result.wait) === "function") ? result.wait() : result
      ));
    }) as MutationFunction<TResponse, any>),
    onMutate: async (variables) => {
      await queryClient.cancelQueries(queryRouteKey);
      return await queryClient.getQueryData(queryRouteKey);
    },
    onError: (err, variables, oldData) =>
      queryClient.setQueryData(queryRouteKey, oldData),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries(queryRouteKey);
      queryClient.invalidateQueries(queryItemsKey);
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
  resultFn: (result: TOutput) => TResult[],
  queryIn: TInput,
  results: TResult[] = [],
  first: boolean = true,
): Promise<TResult[]> {
  // The limit per continuation is 50; see this example:
  // https://docs.rarible.org/getting-started/fetch-nft-data/#get-all-nfts-in-a-collection
  return (!first && queryIn.continuation === undefined)
    ? new Promise((resolve) => resolve(results))
    : queryFn(queryIn).then((result: TOutput) => queryRaribleContinuation(
      queryFn, resultFn,
      Object.assign({}, queryIn, {continuation: result.continuation}),
      results.concat(resultFn(result)), false,
    ));
}
