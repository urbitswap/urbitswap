import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { useEffect, useRef } from 'react';
import { urbitAPI } from '@/api';

export default function useUrbitSubscription({
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
  options?: UseQueryOptions;
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
    urbitAPI.scry({
      app: scryApp,
      path: scry,
    })
  );

  useEffect(() => {
    urbitAPI.subscribe({
      app,
      path,
      event: invalidate.current,
    });
  }, [app, path, queryClient, queryKey]);

  return useQuery(queryKey, fetchData, {
    retryOnMount: false,
    refetchOnMount: false,
    ...options,
  });
}
