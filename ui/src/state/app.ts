import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useAccount } from 'wagmi';
import {
  QueryKey,
  MutationFunction,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import useRaribleSDK from '@/logic/useRaribleSDK';
import { getOwnerAddress } from '@/logic/utils';
import { APP_TERM, CONTRACT } from '@/constants';
import type {
  Collection as RaribleCollection,
  Item as RaribleItem,
  Order as RaribleOrder,
  Orders as RaribleOrders,
  Ownership as RaribleOwnership,
  Ownerships as RaribleOwnerships,
  MetaContent as RaribleMetaContent,
} from '@rarible/api-client';
import type {
  RouteRaribleItem,
  RaribleContinuation,
} from '@/types/app';

export function useRaribleCollection(): RaribleItem[] | undefined {
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "collection",
  ], []);

  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => rsdk.apis.item.getItemsByCollection({collection: CONTRACT.COLLECTION})
  });

  return (isLoading || isError)
    ? undefined
    : (data.items as RaribleItem[]);
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
          (result: RaribleOwnerships): RaribleOwnership[] => result.ownerships,
          {itemId: itemAddr},
        ),
        queryRaribleContinuation(
          rsdk.apis.order.getOrderBidsByItem,
          (result: RaribleOrders): RaribleOrder[] => result.orders,
          {itemId: itemAddr},
        ),
      ]);
    }
  });

  return (isLoading || isError)
    ? {item: undefined, owners: undefined, bids: undefined}
    : {
      item: (data[0] as RaribleItem),
      owners: (data[1] as RaribleOwnership[]),
      bids: (data[2] as RaribleOrder[]),
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
    // @ts-ignore
    mutationFn: (raribleFn.split('.').reduce((p,c)=>p&&p[c]||null, rsdk) as MutationFunction<TResponse, any>),
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

// FIXME: This is a terrible hack, but it has the right ergonomics.
export function useRouteRaribleItemMutation2<TResponse>(
  options?: UseMutationOptions<TResponse, unknown, any, unknown>
) {
  const { item, owners, bids } = useRouteRaribleItem();
  const { address, isConnected } = useAccount();
  const activeBids = (bids ?? []).filter((o: RaribleOrder) => o.status === "ACTIVE");
  const ownerAddresses = (owners ?? []).map(getOwnerAddress);
  const isMyItem: boolean = ownerAddresses.includes((address ?? "0x").toLowerCase());
  const myOffer: RaribleOrder | undefined = isMyItem
    ? item?.bestSellOrder
    : activeBids.find(o => o.maker === `ETHEREUM:${(address ?? "0x").toLowerCase()}`);
  const hasMyOffer: boolean = myOffer !== undefined;

  return useRouteRaribleItemMutation(
    `order.${isMyItem
      ? `sell${!hasMyOffer ? "" : "Update"}`
      : `bid${!hasMyOffer ? "" : "Update"}`
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
  return (!first && queryIn.continuation === undefined)
    ? new Promise((resolve) => resolve(results))
    : queryFn(queryIn).then((result: TOutput) => queryRaribleContinuation(
      queryFn, resultFn,
      Object.assign({}, queryIn, {continuation: result.continuation}),
      results.concat(resultFn(result)), false,
    ));
}
