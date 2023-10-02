import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useAccount } from 'wagmi';
import { useModalNavigate } from '@/logic/routing';
import { useUrbitTraders } from '@/state/app';

export default function WalletWatcher() {
  const location = useLocation();
  const modalNavigate = useModalNavigate();
  const { address } = useAccount();

  const traders = useUrbitTraders();
  const currentAddress = useRef<string | undefined>(undefined);
  const sessionAddresses = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newAddress: string = address ?? "";
    if (newAddress !== "" && newAddress !== currentAddress.current) {
      const knownTrader: string | undefined = (traders ?? {})[newAddress];
      const iamKnownTrader: boolean = !!knownTrader && knownTrader === window.our;
      const isSessionAddr: boolean = sessionAddresses.current.has(newAddress);

      currentAddress.current = newAddress;
      sessionAddresses.current.add(newAddress);

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
