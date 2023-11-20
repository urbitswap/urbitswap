import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useWagmiAccount, useUrbitAccountAssocAddresses } from '@/state/app';
import { get, update } from '@/state/idb';
import { useModalNavigate } from '@/logic/routing';
import { getVersionCompatibility } from '@/logic/utils';
import { APP_DBUG } from '@/constants';
import type { Address } from 'viem';

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

  const { address, isConnected } = useWagmiAccount();
  const lastAddress = useRef<string | undefined>(isConnected ? address : undefined);
  const assocAddresses = useUrbitAccountAssocAddresses();

  useEffect(() => {
    if (assocAddresses !== undefined) {
      update("addresses", (idbAddresses: Set<string> | undefined) => {
        const newIdbAddresses = idbAddresses ?? new Set();
        assocAddresses.forEach((a: Address) => newIdbAddresses.add(a));
        return newIdbAddresses;
      });
    }
  }, [assocAddresses]);

  useEffect(() => {
    // NOTE: This can cause unnecessary prompts in cases where a user is
    // using a new client and hasn't downloaded the Urbit address list yet.
    if (isConnected && address !== lastAddress.current) {
      update("addresses", (idbAddresses: Set<string> | undefined) => {
        const newIdbAddresses = idbAddresses ?? new Set();
        if (!newIdbAddresses.has(address)) {
          lastAddress.current = address;
          newIdbAddresses.add(address);
        }
        return newIdbAddresses;
      }).then(() => {
        // FIXME: This is a bit hacky, but we use `lastAddress` ref to
        // signal from previous promise if `address` is new.
        const isAddressNew: boolean = address === lastAddress.current;
        lastAddress.current = address;
        if (isAddressNew) {
          modalNavigate("assoc", {
            relative: "path",
            state: {backgroundLocation: location},
          });
        }
      });
    }
  }, [address]);

  return (null);
}
