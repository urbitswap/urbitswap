import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';

interface UrbitContext {
  subscriptions: Map<string, number>;
  setSubscriptions: React.Dispatch<React.SetStateAction<Map<string, number>>>;
}

const UrbitContext = React.createContext({
  subscriptions: new Map<string, number>(),
  setSubscriptions: (_subscriptions: Map<string, number>) => null,
} as UrbitContext);

export function UrbitProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState(new Map<string, number>());

  const contextValue = useMemo(() => ({
    subscriptions,
    setSubscriptions,
  }), [subscriptions, setSubscriptions]);

  return (
    <UrbitContext.Provider value={contextValue} children={children} />
  );
}

export function useUrbitContext() {
  const {
    subscriptions,
    setSubscriptions,
  } = useContext(UrbitContext);

  return {
    subscriptions,
    setSubscriptions,
  };
}
