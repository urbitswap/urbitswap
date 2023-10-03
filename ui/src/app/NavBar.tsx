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
  BoltIcon,
  BoltSlashIcon,
} from '@heroicons/react/24/solid';
import ENSName from '@/components/ENSName';
import VCCIcon from '@/components/icons/VCCIcon';
import { useModalNavigate } from '@/logic/routing';
import { useWagmiAccount, useUrbitTraders } from '@/state/app';
import { APP_NAME, ENV_TEST } from '@/constants';
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

  const isConnected = address !== "0x";

  return (
    <nav className={cn(
      "w-full py-2 px-4 bg-white border-gray-800 border-b-2",
      className,
    )}>
      <div className={cn(
        "flex flex-row justify-between items-center",
        innerClassName,
      )}>
        <Link to="/" className="text-3xl font-bold flex flex-row items-center gap-2">
          <VCCIcon className="w-12 h-12 border-black border-2 rounded-full" />
          Club {/*Trade (?)*/}
        </Link>
        {/*(ENV_TEST && address) && (
          <div className="text-center text-xs">
            <p>
              {(connector?.chains ?? [])
                .map(({name, testnet}: Chain) => `${name}${testnet ? "*" : ""}`)
                .join(", ")
              }
            </p>
            <p>{address}</p>
          </div>
        )*/}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger aria-label="TODO">
            <div
              className={cn(
                "flex flex-row items-center space-x-2 font-semibold button",
                isConnected ? "text-blue-300 text-xs" : "",
              )}
            >
              <WalletIcon className={cn("h-5 w-5", )} />
              {!isConnected ? (
                <p>Wallet</p>
              ) : (
                <ENSName address={address} />
              )}
              <ChevronDownIcon className="h-3 w-3" />
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="dropdown" align="end">
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
            {(isConnected && ((traders ?? {})[address.toLowerCase()] === undefined)) && (
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
            <DropdownMenu.Arrow className="w-4 h-3 fill-white" />
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
}
