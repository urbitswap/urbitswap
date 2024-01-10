import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { useEffect, useRef } from 'react';
import { urbitAPI } from '@/api';
import { useUrbitContext } from '@/components/UrbitContext';

export default function useUrbitSubscription<T>({
  queryKey,
  app,
  path,
  scry,
  scryApp = app,
  options,
}: {
  queryKey: QueryKey;
  app: string;
  path: string;
  scry: string;
  scryApp?: string;
  options?: UseQueryOptions<T>;
}): ReturnType<typeof useQuery> {
  const queryClient = useQueryClient();
  const invalidate = useRef(
    debounce(
      () => {
        queryClient.invalidateQueries(queryKey);
      },
      300,
      { leading: true, trailing: true }
    )
  );

  const fetchData = async () => (
    urbitAPI.scry<T>({
      app: scryApp,
      path: scry,
    })
  );

  const { subscriptions, setSubscriptions } = useUrbitContext();
  const urbitKey = `${app} ${path}`;
  if (!subscriptions.has(urbitKey)) {
    setSubscriptions(subs => new Map(subs.set(urbitKey, -1)));
    urbitAPI.subscribe({
      app,
      path,
      event: invalidate.current,
    }).then((subId: number) =>
      setSubscriptions(subs => new Map(subs.set(urbitKey, subId)))
    );
  }

  return useQuery(queryKey, fetchData, {
    retryOnMount: false,
    refetchOnMount: false,
    ...options,
  });
}
