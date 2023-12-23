import React, {
  ChangeEvent,
  KeyboardEvent,
  createElement,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import cn from 'classnames';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BoltIcon,
  BoltSlashIcon,
  DocumentIcon,
  HomeIcon,
  RectangleGroupIcon,
  IdentificationIcon,
  LinkIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import ENSName from '@/components/ENSName';
import UrbitswapIcon from '@/components/icons/UrbitswapIcon';
import { DropdownMenu, DropdownEntry, DropdownButton } from '@/components/Dropdown';
import { useFocusContext } from '@/components/FocusContext';
import { useModalNavigate } from '@/logic/routing';
import {
  COLLECTIONBASE_ICONS,
  COLLECTIONBASE_ICON_MAP,
  COLLECTIONSORT_ICONS,
  COLLECTIONSORT_ICON_MAP,
  URBITPOINT_ICONS,
  URBITPOINT_ICON_MAP,
  capitalize,
  encodeQuery,
  decodeQuery,
} from '@/logic/utils';
import {
  useWagmiAccount,
  useWagmiConnect,
  useWagmiDisconnect,
  useRaribleCollectionMeta,
  useUrbitAccountAssocAddresses,
  useCollectionAccountKYC,
} from '@/state/app';
import { APP_TERM, QUERY } from '@/constants';
import type { Chain } from 'viem'; // node_modules/viem/types/chain.ts
import type {
  CollectionBaseish,
  CollectionSortish,
  UrbitPointTypeish,
  NavigationQuery,
  IconLabel,
} from '@/types/app';

export default function NavBar({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { focusRef, isFocused } = useFocusContext();

  const navigate = useNavigate();
  const modalNavigate = useModalNavigate();
  const { collId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const collMeta = useRaribleCollectionMeta();
  const { address, isConnected } = useWagmiAccount();
  const { connect } = useWagmiConnect();
  const { disconnect } = useWagmiDisconnect();
  const assocAddresses = useUrbitAccountAssocAddresses();
  const collectionKYC = useCollectionAccountKYC();

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const {value}: {value: string;} = event.target;
    setSearchQuery(value);
  }, [setSearchQuery]);
  const onSubmit = useCallback((newQuery: NavigationQuery | void) => {
    const newSearchParams: URLSearchParams = encodeQuery({
      ...Object.fromEntries(searchParams),
      text: searchQuery,
      ...(!newQuery ? {} : newQuery),
    });
    // NOTE: We use 'navigate' instead of 'setSearchParams' in order to enable
    // search from internal collection pages (e.g. per-item pages).
    navigate(`/${collId ?? ""}?${newSearchParams.toString()}`);
  }, [collId, navigate, searchQuery, searchParams]);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  const [searchBase, searchText, searchSort] = useMemo(() => ([
    (searchParams.get("base") ?? "") as CollectionBaseish,
    (searchParams.get("text") ?? "") as string,
    (searchParams.get("sort") ?? "")  as CollectionSortish,
  ]), [searchParams]);

  const inCollectionMode: boolean = collId !== undefined;
  const isAssociated: boolean = (assocAddresses ?? new Set()).has(address);
  const isKYCd: boolean | undefined = collectionKYC?.kyc && !collectionKYC?.noauth;

  const btnOutClass: string = "h-full small-button";
  const btnInnClass: string = "w-5";

  return (
    <nav className={cn(
      "w-full py-2 px-4 bg-white border-gray-800 border-b-2",
      className,
    )}>
      <div className={cn(
        "flex flex-row justify-between space-x-1 sm:space-x-2 items-center",
        innerClassName,
      )}>
        <DropdownMenu trigger={
          <DropdownButton title="Menu" children={<UrbitswapIcon className="h-5 w-5" />} />
        }>
          <DropdownEntry disabled children="Main Menu" />
          <DropdownEntry onSelect={() => navigate("/")}>
            <HomeIcon className="w-4 h-4" />
            <span>Go Home</span>
          </DropdownEntry>
          {inCollectionMode && (
            <DropdownEntry onSelect={() => navigate(`/${collId}`)}>
              <RectangleGroupIcon className="w-4 h-4" />
              <span>View Collection</span>
            </DropdownEntry>
          )}
          <DropdownEntry onSelect={() => modalNavigate("/disclaimer")}>
            <DocumentIcon className="w-4 h-4" />
            <span>View License</span>
          </DropdownEntry>
        </DropdownMenu>

        <div className="flex flex-row input-group flex-1 min-w-0 h-9">
          <div className="flex flex-row relative items-center flex-1 min-w-0 h-full">
            <input
              name={`${APP_TERM}-navbar-search`}
              ref={focusRef}
              value={searchQuery}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onSubmit={() => onSubmit()}
              placeholder={!inCollectionMode
                ? "Search Collections"
                : `Search ${!collMeta ? "Collection" : `'${collMeta.name}'`}`
              }
              className={cn(
                "input bg-gray-50 w-full h-full flex-1 min-w-0",
                "placeholder:font-normal focus-within:mix-blend-normal text-sm sm:text-md",
                // FIXME: Wish this was automated, but it isn't because of the
                // nesting to accommodate the floating status indicator
                inCollectionMode ? "rounded-l-lg rounded-r-none" : "rounded-lg",
              )}
            />
            <span className={cn(
              "absolute right-2 px-2 text-gray-400 small-secondary-button",
              "sm:block hidden",
            )}>
              {!isFocused ? "/" : searchQuery === "" ? "esc" : "↵"}
            </span>
          </div>
          {inCollectionMode && (
            <React.Fragment>
              <DropdownMenu
                trigger={createElement(COLLECTIONBASE_ICON_MAP[searchBase].icon, {className: btnInnClass})}
                triggerClassName={btnOutClass}
              >
                <DropdownEntry disabled children="Collection" />
                {COLLECTIONBASE_ICONS.map(({id, name, icon}: IconLabel<CollectionBaseish>) => (
                  <DropdownEntry
                    key={`base-${id}-dd`}
                    onSelect={() => onSubmit({base: id || undefined})}
                  >
                    {React.createElement(icon, {className: "w-5 h-5"})}
                    <span>{name}</span>
                  </DropdownEntry>
                ))}
              </DropdownMenu>
              <DropdownMenu
                trigger={createElement(COLLECTIONSORT_ICON_MAP[searchSort].icon, {className: btnInnClass})}
                triggerClassName={btnOutClass}
                disabled={!!searchBase}
              >
                <DropdownEntry disabled children="Sort Method" />
                {COLLECTIONSORT_ICONS.map(({id, name, icon}: IconLabel<CollectionSortish>) => (
                  <DropdownEntry
                    key={`sort-${id}-dd`}
                    onSelect={() => onSubmit({sort: id || undefined})}
                  >
                    {React.createElement(icon, {className: "w-5 h-5"})}
                    <span>{name}</span>
                  </DropdownEntry>
                ))}
              </DropdownMenu>
            </React.Fragment>
          )}
        </div>

        <DropdownMenu align="end" trigger={
          <DropdownButton
            title={!isConnected ? "Wallet"
              : <ENSName address={address} className={isConnected && "text-2xs"} />
            }
            children={<WalletIcon className="h-5 w-5" />}
            className={isConnected && "text-blue-400"}
          />
        }>
          <DropdownEntry disabled>
            <span>Wallet</span>
            {(isKYCd && (<IdentificationIcon className="w-3 h-3" />))}
            {(isAssociated && (<LinkIcon className="w-3 h-3" />))}
          </DropdownEntry>
          <DropdownEntry onSelect={() => !isConnected ? connect() : disconnect()}>
            {!isConnected ? (<BoltIcon className="w-4 h-4" />) : (<BoltSlashIcon className="w-4 h-4" />)}
            <span>{`${isConnected ? "Disc" : "C"}onnect Wallet`}</span>
          </DropdownEntry>
          <DropdownEntry onSelect={() => modalNavigate("/wallets")}>
            <ListBulletIcon className="w-4 h-4" />
            <span>See All Wallets</span>
          </DropdownEntry>
          {(isConnected && !isAssociated) && (
            <DropdownEntry onSelect={() => modalNavigate("/associate")}>
              <LinkIcon className="w-4 h-4" />
              <span>Associate @p</span>
            </DropdownEntry>
          )}
        </DropdownMenu>
      </div>
    </nav>
  );
}
