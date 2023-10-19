import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  WalletIcon,
  ChevronDownIcon,
  LinkIcon,
  IdentificationIcon,
  BoltIcon,
  BoltSlashIcon,
} from '@heroicons/react/24/solid';
import ENSName from '@/components/ENSName';
import VCCIcon from '@/components/icons/VCCIcon';
import { useModalNavigate } from '@/logic/routing';
import {
  useWagmiAccount,
  useAccountVentureKYC,
  useUrbitTraders,
} from '@/state/app';
import { APP_NAME } from '@/constants';
import type { Chain } from 'viem'; // vcc/ui/node_modules/viem/types/chain.ts

export default function NavBar({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) {
  const location = useLocation();
  const modalNavigate = useModalNavigate();
  const { address, connector } = useWagmiAccount();
  const { connect } = useConnect({connector: new InjectedConnector()});
  const { disconnect } = useDisconnect();
  const traders = useUrbitTraders();
  const vccKYC = useAccountVentureKYC();

  const isConnected: boolean = address !== "0x";
  const isAssociated: boolean = (traders ?? {})[address.toLowerCase()] !== undefined;
  const isKYCd = vccKYC !== undefined && vccKYC.kyc;

  return (
    <nav className={cn(
      "w-full py-2 px-4 bg-white border-gray-800 border-b-2",
      className,
    )}>
      <div className={cn(
        "flex flex-row justify-between items-center",
        innerClassName,
      )}>
        <Link to="/" className={cn(
          "flex flex-row items-center gap-2 font-bold",
          "text-xl sm:text-3xl",
        )}>
          <VCCIcon className={cn(
            "text-white bg-black border-black border-2 rounded-full",
            "w-8 h-8 sm:w-12 sm:h-12",
          )} />
          Trade
        </Link>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <div
              className={cn(
                "flex flex-row items-center space-x-2 font-semibold button",
                isConnected ? "text-blue-300 text-xs" : "",
              )}
            >
              <WalletIcon className="h-5 w-5" />
              {!isConnected ? (
                <p>No Wallet</p>
              ) : (
                <React.Fragment>
                  <ENSName address={address} />
                  {(isKYCd && (<IdentificationIcon className="w-3 h-3 hidden sm:block" />))}
                  {(isAssociated && (<LinkIcon className="w-3 h-3 hidden sm:block" />))}
                </React.Fragment>
              )}
              <ChevronDownIcon className="h-3 w-3" />
            </div>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="dropdown">
            <DropdownMenu.Item
              onSelect={() => !isConnected ? connect() : disconnect()}
              className="dropdown-item flex items-center"
            >
              {!isConnected ? (
                <React.Fragment>
                  <BoltIcon className="w-4 h-4" />
                  &nbsp;<span>Connect Wallet</span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <BoltSlashIcon className="w-4 h-4" />
                  &nbsp;<span>Disconnect Wallet</span>
                </React.Fragment>
              )}
            </DropdownMenu.Item>
            {(isConnected && !isKYCd) && (
              <DropdownMenu.Item
                onSelect={() => modalNavigate("pretrade", {
                  relative: "path",
                  state: {backgroundLocation: location},
                })}
                className="dropdown-item flex items-center"
              >
                <IdentificationIcon className="w-4 h-4" />
                &nbsp;<span>Submit KYC</span>
              </DropdownMenu.Item>
            )}
            {(isConnected && !isAssociated) && (
              <DropdownMenu.Item
                onSelect={() => modalNavigate("assoc", {
                  relative: "path",
                  state: {backgroundLocation: location},
                })}
                className="dropdown-item flex items-center"
              >
                <LinkIcon className="w-4 h-4" />
                &nbsp;<span>Associate @p</span>
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Arrow className="w-4 h-3 fill-gray-800" />
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
}
