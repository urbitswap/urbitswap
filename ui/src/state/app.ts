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
  Ownerships as RaribleOwnerships,
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
    [RaribleItem, RaribleOwnerships] | [undefined, undefined] {
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
        rsdk.apis.ownership.getOwnershipsByItem({itemId: itemAddr}),
      ]);
    }
  });

  return (isLoading || isError)
    ? [undefined, undefined]
    : (data as [RaribleItem, RaribleOwnerships]);
}
