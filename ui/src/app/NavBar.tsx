import React, {
  ChangeEvent,
  KeyboardEvent,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import cn from 'classnames';
import { useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  BoltIcon,
  BoltSlashIcon,
  ChevronDownIcon,
  IdentificationIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import ENSName from '@/components/ENSName';
import UrbitswapIcon from '@/components/icons/UrbitswapIcon';
import { useModalNavigate } from '@/logic/routing';
import { encodeQuery, decodeQuery } from '@/logic/utils';
import {
  useWagmiAccount,
  useVentureAccountKYC,
  useUrbitTraders,
} from '@/state/app';
import type { Chain } from 'viem'; // node_modules/viem/types/chain.ts
import type {
  CollectionBase,
  UrbitPointType,
  UrbitLayer,
  NavigationQuery,
} from '@/types/app';

export default function NavBar({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) {
  const [query, setQuery] = useState<string>("");
  const [params, setParams] = useSearchParams();

  const location = useLocation();
  const navigate = useNavigate();
  const modalNavigate = useModalNavigate();
  const { address, connector } = useWagmiAccount();
  const { connect } = useConnect({connector: new InjectedConnector()});
  const { disconnect } = useDisconnect();
  const traders = useUrbitTraders();
  const vccKYC = useVentureAccountKYC();

  const isConnected: boolean = address !== "0x";
  const isAssociated: boolean = (traders ?? {})[address.toLowerCase()] !== undefined;
  const isKYCd: boolean = vccKYC !== undefined && vccKYC.kyc;

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const {value}: {value: string;} = event.target;
    setQuery(value);
  }, [setQuery]);
  const onSubmit = useCallback(() => {
    // FIXME: Placeholder until there are better UX elements
    const navQuery = getNavigationQuery(query);
    const queryParams = encodeQuery(navQuery);
    navigate(`/?${queryParams.toString()}`);
  }, [query, navigate]);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  // NOTE: Useful primarily to restore a query after reloading a page or
  // navigating back
  useEffect(() => {
    const currQuery: NavigationQuery = getNavigationQuery(query);
    const paramsQuery: NavigationQuery = decodeQuery(params);
    setQuery(encodeQuery({...currQuery, ...paramsQuery}).toString().replace("=", ":"));
  }, [params]);

  return (
    <nav className={cn(
      "w-full py-2 px-4 bg-white border-gray-800 border-b-2",
      className,
    )}>
      <div className={cn(
        "flex flex-row justify-between space-x-4 items-center",
        innerClassName,
      )}>
        <Link to="/" className="flex flex-row items-center gap-2 font-bold">
          <UrbitswapIcon className="w-12 h-12 sm:w-14 sm:h-14" />
          <span className="hidden sm:block">swap</span>
        </Link>

        <div className="flex flex-row gap-2 flex-1 min-w-0">
          <label className="relative flex w-full items-center flex-1 min-w-0">
            <span className="sr-only">Search Prefences</span>
            <span className={cn(
              "absolute inset-y-[3px] left-0 h-8 w-8",
              "flex items-center pl-2",
              "text-gray-400"
            )}>
              <MagnifyingGlassIcon
                className="h-5 w-5"
                style={{transform: "rotateY(180deg)"}}
              />
            </span>
            <input
              className={cn(
                "input h-9 w-full bg-gray-50 pl-8 flex-1 min-w-0",
                "placeholder:font-normal focus-within:mix-blend-normal text-sm sm:text-md",
              )}
              placeholder={"Search"}
              value={query}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onSubmit={onSubmit}
            />
          </label>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <div
              className={cn(
                "flex flex-row items-center space-x-2 font-semibold button text-sm sm:text-md",
                isConnected ? "text-blue-400 text-xs" : "",
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
          <DropdownMenu.Content align="end" alignOffset={16} className="dropdown">
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

function getNavigationQuery(query: string): NavigationQuery {
  return query.split(" ").reduce((a, i) => {
    const nextPart = i.split(":");
    const nextKey = (nextPart.length === 1) ? "name" : nextPart[0];
    const nextValue = (nextPart.length === 1) ? nextPart[0] : nextPart.slice(1).join(":");
    return {[nextKey]: nextValue, ...a};
  }, {});
}
