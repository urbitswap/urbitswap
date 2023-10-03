import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useModalNavigate } from '@/logic/routing';
import { useWagmiAccount, useUrbitTraders } from '@/state/app';

export default function WalletWatcher() {
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
