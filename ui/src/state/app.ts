import { useMemo } from 'react';
import { useParams } from 'react-router';
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
import { APP_TERM, CONTRACT } from '@/constants';
import type {
  Collection as RaribleCollection,
  Item as RaribleItem,
  Ownership as RaribleOwnership,
  MetaContent as RaribleMetaContent,
} from '@rarible/api-client';

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

export function useRouteRaribleItem():
    [RaribleItem, RaribleOwnership[]] | [undefined, undefined] {
  const { itemId } = useParams();
  const queryKey: QueryKey = useMemo(() => [
    APP_TERM, "item", itemId,
  ], [itemId]);

  // TODO: `rsdk.api.ownership` returns a continuation, which is not properly
  // explored/exhausted by these API calls
  const rsdk = useRaribleSDK();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      const itemAddr: string = `${CONTRACT.COLLECTION}:${itemId}`;
      return Promise.all([
        rsdk.apis.item.getItemById({itemId: itemAddr}),
        rsdk.apis.ownership.getOwnershipsByItem({itemId: itemAddr}),
      ]);
    }
  });

  return (isLoading || isError)
    ? [undefined, undefined]
    : ([data[0], data[1].ownerships] as [RaribleItem, RaribleOwnership[]]);
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
