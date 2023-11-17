import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useWagmiAccount, useUrbitTraders } from '@/state/app';
import { get } from '@/state/idb';
import { useModalNavigate } from '@/logic/routing';
import { getVersionCompatibility } from '@/logic/utils';
import { APP_DBUG } from '@/constants';

export function NewVersionWatcher() {
  const [isNewSession, setIsNewSession] = useState<boolean>(true);

  const location = useLocation();
  const modalNavigate = useModalNavigate();

  useEffect(() => {
    if (isNewSession) {
      setIsNewSession(false);
      get("version").then((idbVersion: string | undefined) => {
        const isVersAckOutdated: boolean = idbVersion === undefined
          || getVersionCompatibility(idbVersion) < (APP_DBUG ? 2 : 1);
        const isViewingDisclaimer: boolean =
          location.pathname.endsWith("disclaimer");
        if (isVersAckOutdated && !isViewingDisclaimer) {
          modalNavigate("disclaimer", {
            relative: "path",
            state: {backgroundLocation: location},
          });
        }
      });
    }
  }, [isNewSession]);

  return (null);
}

export function NewWalletWatcher() {
  const location = useLocation();
  const modalNavigate = useModalNavigate();
  const { address } = useWagmiAccount();

  const traders = useUrbitTraders();
  const currentAddress = useRef<string | undefined>(undefined);
  const sessionAddresses = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (address !== "0x" && address !== currentAddress.current) {
      const knownTrader: string | undefined = (traders ?? {})[address];
      const iamKnownTrader: boolean = !!knownTrader && knownTrader === window.our;
      const isSessionAddr: boolean = sessionAddresses.current.has(address);

      currentAddress.current = address;
      sessionAddresses.current.add(address);

      if (!iamKnownTrader && !isSessionAddr) {
        modalNavigate("assoc", {
          relative: "path",
          state: {backgroundLocation: location},
        });
      }
    }
  }, [address, location, modalNavigate]);

  return (null);
}
