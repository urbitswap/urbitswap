import { useCallback, useMemo } from 'react';
import {
  NavigateOptions,
  To,
  useLocation,
  useNavigate,
} from 'react-router';
import { ReactRouterState } from '@/types/urbui';

/**
 * Returns an imperative method for navigating while preserving the navigation
 * state underneath the overlay
 */
export function useModalNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (to: To, opts?: NavigateOptions) => {
      if (location.state) {
        navigate(to, {...(opts || {}), state: location.state});
        return;
      }
      navigate(to, opts);
    },
    [navigate, location.state]
  );
}

export function useDismissNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ReactRouterState | null;

  return useCallback(() => {
    if (state?.backgroundLocation) {
      // we want to replace the current location with the background location
      // so that the user won't navigate back to the modal if they hit the back button
      navigate(state.backgroundLocation, { replace: true });
    }
  }, [navigate, state]);
}

export function useChatNavigate() {
  const { origin } = window.location;

  return useCallback((ship: string) => {
    const href = `${origin}/apps/talk/dm/${ship}`;
    return window.open(href, "_blank");
  }, [origin]);
}
