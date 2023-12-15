import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useEventListener } from 'usehooks-ts';

interface FocusContext {
  focusRef: React.RefObject<HTMLInputElement> | null;
  isFocused: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

const FocusContext = React.createContext({
  focusRef: null,
  isFocused: false,
  setIsFocused: (_isFocused: boolean) => null,
} as FocusContext);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);
  const focusRef = useRef<HTMLInputElement | null>(null);

  const contextValue = useMemo(() => ({
    focusRef,
    isFocused,
    setIsFocused,
  }), [focusRef, isFocused, setIsFocused]);

  return (
    <FocusContext.Provider value={contextValue} children={children} />
  );
}

export function useFocusContext() {
  const {
    focusRef,
    isFocused,
    setIsFocused,
  } = useContext(FocusContext);

  return {
    focusRef,
    isFocused,
    setIsFocused,
  };
}

export function FocusContextWatcher() {
  const {
    focusRef,
    isFocused,
    setIsFocused,
  } = useFocusContext();

  useEventListener("keydown", (event) => {
    if (event.key === "/" && !isFocused) {
      event.preventDefault();
      focusRef?.current?.focus();
    } if (event.key === "Escape" && isFocused) {
      event.preventDefault();
      focusRef?.current?.blur();
    }
  });

  useEventListener("focusin", (event) => {
    if(event.target === focusRef?.current) {
      setIsFocused(true);
    }
  });

  useEventListener("focusout", (event) => {
    if(event.target === focusRef?.current) {
      setIsFocused(false);
    }
  });

  return null;
}
