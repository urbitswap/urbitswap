import React, {
  ReactNode,
  createElement,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import cn from 'classnames';
import { FormProvider, useForm, useController } from 'react-hook-form';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cell as CellRef,
  Column as ColumnRef,
  ColumnDef,
  ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import DateTimePicker from 'react-datetime-picker';
// FIXME: There's an issue with the CSS where 'active' and 'now' tiles are
// having their default background colors overridden by Tailwindcss
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import '@/styles/DateTimePicker.css';
import { useNetwork, useSwitchNetwork, useSignMessage } from 'wagmi';
import {
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';
import Dialog from '@/components/Dialog';
import Popover from '@/components/Popover';
import LoadingComponent from '@/components/LoadingComponent';
import TraderName from '@/components/TraderName';
import ENSName from '@/components/ENSName';
import ShipName from '@/components/ShipName';
import LoadingIcon from '@/components/icons/LoadingIcon';
import UrbitswapIcon from '@/components/icons/UrbitswapIcon';
import {
  SingleSelector,
  MultiSelector,
  SelectorOption,
} from '@/components/Selector';
import {
  useWagmiAccount,
  useWagmiConnect,
  useUrbitTraders,
  useUrbitAssociateMutation,
  useCollectionAccountKYC,
  useItemAccountGrant,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
  useRouteRaribleItemMutation,
} from '@/state/app';
import { get, set } from '@/state/idb';
import { useDismissNavigate } from '@/logic/routing';
import {
  assetToTender,
  capitalize,
  genTestWallets,
  isMaxDate,
  makePrettyName,
  makePrettyPrice,
  tenderToAsset,
  useCopy,
} from '@/logic/utils';
import {
  APP_VERSION,
  FEATURED,
  MAX_DATE,
  TENDERS,
  TRADERS_HOST,
  TREASURY,
} from '@/constants';
import { BigNumber } from 'bignumber.js';
import { toBigNumber } from '@rarible/types';
import type { BigNumber as BigNumberString } from '@rarible/types';
import type { BigNumber as BigNumberNumber } from '@rarible/utils';
import type {
  Item as RaribleItem,
  Asset as RaribleAsset,
  AssetType as RaribleAssetType,
  Order as RaribleOrder,
} from '@rarible/api-client';
import type { Address } from 'viem';
import type { TenderType, UrbitKnownWallet } from '@/types/app';
import type {
  DeferredRenderProps,
  DeferredPrecheckProps,
  DeferredPrecheckReport,
} from '@/types/utils';

export function OfferDialog() {
  const OfferDialogRender = useCallback(() => {
    const dismiss = useDismissNavigate();
    const { item, owner, offer, address, isAddressItem, isMyItem } = useRouteRaribleAccountItem();
    const { mutate: offerMutate, status: offerStatus } = useRouteRaribleItemMutation(
      `order.${isAddressItem
        ? `sell${offer === undefined ? "" : "Update"}`
        : `bid${offer === undefined ? "" : "Update"}`
      }`,
      { onSuccess: () => dismiss() },
    );

    const form = useForm({
      mode: "onChange",
      defaultValues: useMemo(() => {
        if (offer === undefined) {
          return {
            tender: TENDERS[0].value,
            amount: "0",
            expiration: undefined,
          };
        } else {
          const myAsset: RaribleAsset = isAddressItem ? offer.take : offer.make;
          const endDate: Date = new Date(offer.endedAt ?? "");
          return {
            tender: assetToTender(myAsset.type),
            amount: myAsset.value.toString(),
            expiration: isMaxDate(endDate) ? undefined : endDate,
          };
        }
      }, [isAddressItem, offer]),
    });
    const {register, handleSubmit, formState: {isDirty, isValid}, control} = form;
    const {field: {value: tender, onChange: tenderOnChange, ref: tenderRef}} =
      useController({name: "tender", rules: {required: true}, control});
    const {field: {value: expiration, onChange: expirationOnChange}} =
      useController({name: "expiration", rules: {required: false}, control});
    const onSubmit = useCallback(async ({
      tender,
      amount,
      expiration,
    }: {
      tender: TenderType;
      amount: string;
      expiration: Date | undefined;
    }) => {
      offerMutate({
        orderId: offer?.id || "",
        itemId: item?.id || "",
        amount: 1,
        price: amount,
        currency: tenderToAsset(tender),
        expirationDate: expiration ?? MAX_DATE,
      });
    }, [item, offer, offerMutate]);

    return (
      <DialogBody head={`${(offer === undefined) ? "Post" : "Update"} ${isMyItem ? "Ask" : "Bid"}`}>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="mb-3 font-semibold">
              Tender*
              <SingleSelector
                ref={tenderRef}
                options={TENDERS}
                value={TENDERS.find(e => e.value === tender)}
                onChange={o => tenderOnChange(o ? o.value : o)}
                className="my-2 w-full"
                isSearchable={false}
                isClearable={false}
                isDisabled={!isAddressItem || offer !== undefined}
              />
            </label>
            <label className="mb-3 font-semibold">
              Amount*
              <input type="number" autoComplete="off"
                step="0.00001"
                min={(offer !== undefined && !isAddressItem)
                  ? ((isAddressItem ? offer?.makePrice : offer?.takePrice) ?? "0.00001").toString()
                  : "0.00001"
                }
                max={(offer !== undefined && isAddressItem)
                  ? ((isAddressItem ? offer?.makePrice : offer?.takePrice) ?? `${Number.MAX_VALUE}`).toString()
                  : Number.MAX_VALUE
                }
                className="input my-2 block w-full py-1 px-2"
                {...register("amount", {required: true})}
              />
            </label>
            <label className="mb-3 font-semibold">
              Expiration (Default: Never)
              <DateTimePicker
                minDate={new Date(Date.now())}
                value={expiration}
                onChange={expirationOnChange}
                className="input w-full"
                disableClock={true}
                disabled={offer !== undefined}
              />
            </label>

            <footer className="mt-4 flex items-center justify-between space-x-2">
              <div className="ml-auto flex items-center space-x-2">
                <DialogPrimitive.Close asChild>
                  <button className="secondary-button ml-auto">
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button className="button" type="submit"
                  disabled={!isValid || !isDirty}
                >
                  {(offerStatus === "loading") ? (
                    <LoadingIcon />
                  ) : (offerStatus === "error") ? (
                    "Error"
                  ) : (
                    (offer !== undefined) ? "Update" : "Create"
                  )}
                </button>
              </div>
            </footer>
          </form>
        </FormProvider>
      </DialogBody>
    );
  }, []);

  return (<TradeChecksDialog render={OfferDialogRender} />);
}

export function TradeDialog() {
  const TradeDialogRender = useCallback(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const dismiss = useDismissNavigate();

    const [hasBeenWarned, setHasBeenWarned] = useState<boolean>(false);
    const { item, bids, isAddressItem, offer: myOffer } = useRouteRaribleAccountItem();
    const { mutate: tradeMutate, status: tradeStatus } = useRouteRaribleItemMutation(
      `order.${isAddressItem ? "acceptBid" : "buy"}`,
      { onSuccess: () => dismiss() },
    );

    const { offerId } = useParams();
    const tradeOffer: RaribleOrder | undefined =
      [(item && item.bestSellOrder), ...(bids || [])]
      .find(o => o !== undefined && o.id === offerId);
    const tradeTender: RaribleAsset | undefined =
      tradeOffer && tradeOffer[isAddressItem ? "make" : "take"];

    const onSubmit = useCallback(async (event: any) => {
      event.preventDefault();
      (offerId !== undefined) && tradeMutate({
        orderId: offerId,
        amount: 1,
        originFees: [TREASURY],
      });
    }, [offerId, tradeMutate]);
    const onKeep = useCallback(async (event: any) => {
      setHasBeenWarned(true);
    }, [setHasBeenWarned]);
    const onCancel = useCallback(async (event: any) => {
      navigate("../cancel", {relative: "path", state: location.state});
    }, [navigate, location.state]);

    const TradeRow = useCallback(({
        title,
        content,
        info,
      } : {
        title?: string;
        content?: React.ReactNode;
        info?: React.ReactNode;
      }) => (
        <div className="flex flex-row justify-between">
          <div className="flex flex-row space-x-1">
            <p className="font-semibold">{title ?? "<unknown>"}</p>
            {(info !== undefined) && (
              <Popover message={info}>
                <QuestionMarkCircleIcon className="w-4 h-4" />
              </Popover>
            )}
          </div>
          {content ?? "—"}
        </div>
    ), []);

    return (
      <DialogBody head={`${isAddressItem ? "Sell" : "Buy"} NFT`}>
        {(myOffer !== undefined && !hasBeenWarned) ? (
          <React.Fragment>
            <p>
              You have an open {isAddressItem ? "ask" : "bid"} for this item. Would you
              like to rescind it before proceeding? If kept open, it will
              reactivate if/when you transfer this item.
            </p>

            <footer className="mt-4 flex items-center justify-between space-x-2">
              <div className="ml-auto flex items-center space-x-2">
                <button className="secondary-button ml-auto" onClick={onKeep}>
                  Keep Open
                </button>
                <button className="button" onClick={onCancel}>
                  Rescind It
                </button>
              </div>
            </footer>
          </React.Fragment>
        ) : (
          <form onSubmit={onSubmit}>
            {(tradeOffer !== undefined) && (
              <div className="flex flex-col">
                <TradeRow title="Asset" content={item && makePrettyName(item)} />
                <TradeRow
                  title={isAddressItem ? "Bidder" : "Asker"}
                  content={tradeOffer && (
                    <TraderName address={(tradeOffer.maker.replace(/^.+:/g, "") as Address)}/>
                  )}
                />
                <hr className="my-2" />
                <TradeRow
                  title={`${isAddressItem ? "Bid" : "Ask"} Price`}
                  content={tradeTender && makePrettyPrice(tradeTender)}
                />
                <TradeRow
                  title="App Fee"
                  content={`${(TREASURY.value / 100)}%`}
                  info={// FIXME: The link here can't be clicked on b/c of dialog embed.
                  <p>
                    Fees fund app development via the <a
                    href="https://urbitswap.com">Urbitswap DAO</a>
                  </p>}
                />
                <hr className="my-2" />
                <TradeRow
                  title={`You ${isAddressItem ? "Receive" : "Pay"}`}
                  content={tradeTender && makePrettyPrice({
                    ...tradeTender,
                    value: ((n: BigNumberNumber): BigNumberString => toBigNumber(
                      n.plus(n.times((isAddressItem ? -1 : 1) * (TREASURY.value / 10000))).toString(10)
                    ))(new BigNumber(tradeTender.value)),
                  })}
                />
              </div>
            )}

            <p className="text-sm text-center">
              (Trades generally take between 45-120+ seconds to process.)
            </p>

            <footer className="mt-4 flex items-center justify-between space-x-2">
              <div className="ml-auto flex items-center space-x-2">
                <DialogPrimitive.Close asChild>
                  <button className="secondary-button ml-auto">
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button className="button bg-green" type="submit">
                  {(tradeStatus === "loading") ? (
                    <LoadingIcon />
                  ) : (tradeStatus === "error") ? (
                    "Error"
                  ) : (
                    "Trade"
                  )}
                </button>
              </div>
            </footer>
          </form>
        )}
      </DialogBody>
    );
  }, []);

  return (<TradeChecksDialog render={TradeDialogRender} />);
}

export function CancelDialog() {
  const CancelDialogRender = useCallback(() => {
    const dismiss = useDismissNavigate();
    const { offer } = useRouteRaribleAccountItem();
    const { mutate: cancelMutate, status: cancelStatus } = useRouteRaribleItemMutation(
      "order.cancel",
      { onSuccess: () => dismiss() },
    );

    const onSubmit = useCallback(async (event: any) => {
      event.preventDefault();
      (offer !== undefined) && cancelMutate({orderId: offer.id});
    }, [offer, cancelMutate]);

    return (
      <DialogBody head="Cancel Listing">
        <form onSubmit={onSubmit}>
          <p>
            Do you really want to rescind your listing?
          </p>

          <p className="mt-4 text-sm text-center">
            (Cancellations generally take between 45-120+ seconds to process.)
          </p>

          <footer className="mt-4 flex items-center justify-between space-x-2">
            <div className="ml-auto flex items-center space-x-2">
              <DialogPrimitive.Close asChild>
                <button className="secondary-button ml-auto">
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button className="button bg-red" type="submit">
                {cancelStatus === "loading" ? (
                  <LoadingIcon />
                ) : cancelStatus === "error" ? (
                  "Error"
                ) : (
                  "Rescind"
                )}
              </button>
            </div>
          </footer>
        </form>
      </DialogBody>
    );
  }, []);

  return (<TradeChecksDialog render={CancelDialogRender} />);
}

export function AssociateDialog() {
  const AssociateDialogRender = useCallback(() => {
    const dismiss = useDismissNavigate();
    const { address } = useWagmiAccount();
    const { signMessageAsync: signMessage } = useSignMessage({
      message: window.our,
    });
    const { mutate: assocMutate, status: assocStatus } = useUrbitAssociateMutation(
      { onSuccess: () => dismiss() },
    );

    const onSubmit = useCallback(async (event: any) => {
      event.preventDefault();
      signMessage().then((signature: string) => (
        assocMutate({address, signature})
      ));
    }, [signMessage, assocMutate, address]);

    return (
      <DialogBody head="Associate Wallet">
        <form onSubmit={onSubmit}>
          <p>
            Would you like to associate this new wallet with your Urbit ID?
          </p>

          <div className="flex flex-row justify-around items-center py-4">
            <ShipName name={window.our} full={false} />
            <ArrowsRightLeftIcon className="w-5 h-5" />
            <ENSName address={address} full={false} />
          </div>

          <footer className="mt-4 flex items-center justify-between space-x-2">
            <div className="ml-auto flex items-center space-x-2">
              <DialogPrimitive.Close asChild>
                <button className="secondary-button ml-auto">
                  Decline
                </button>
              </DialogPrimitive.Close>
              <button className="button" type="submit">
                {assocStatus === "loading" ? (
                  <LoadingIcon />
                ) : assocStatus === "error" ? (
                  "Error"
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </footer>
        </form>
      </DialogBody>
    );
  }, []);

  return (<WalletChecksDialog render={AssociateDialogRender} />);
}

export function KnownWalletsDialog() {
  const [localAddresses, setLocalAddresses] = useState<Set<Address> | undefined>(undefined);
  const urbitAddressMap = useUrbitTraders();
  useEffect(() => {
    get("addresses").then((idbAddresses: Set<Address> | undefined) => {
      const loadedIdbAddresses = idbAddresses ?? new Set();
      setLocalAddresses(loadedIdbAddresses);
    });
  }, []);

  // NOTE: Need to store the statically-calculated rows as hook state because
  // the table library detects a re-render based on data reference (which
  // changes every render when using a raw/non-stateful array).
  const tableRows = useMemo<UrbitKnownWallet[]>(() => {
    const newTableRows: UrbitKnownWallet[] =
      [...(localAddresses ?? new Set()).values()].map((addr) => ({
        ship: window.our,
        wallet: addr,
        source: ([window.our, "$browser"] as [string, string]),
      })).concat(
        (Object.entries(urbitAddressMap ?? {}) as [Address, string][]).map(([addr, ship]) => ({
          ship: ship,
          wallet: addr,
          source: TRADERS_HOST,
        }))
      );
    return newTableRows;
    // return genTestWallets(100);
  }, [localAddresses, urbitAddressMap]);
  const tableCols = useMemo<ColumnDef<UrbitKnownWallet, any>[]>(() => {
    const colHelper = createColumnHelper<UrbitKnownWallet>();
    return [
      colHelper.accessor("ship", {
        header: () => (<span className="font-medium">Ship</span>),
        cell: (info) => (<ShipName name={info.getValue()} full={false} />),
      }),
      colHelper.accessor("wallet", {
        header: () => (<span className="font-medium">Wallet</span>),
        cell: (info) => (<ENSName address={info.getValue()} full={false} />),
      }),
      // FIXME: It would be better to just use `source` as the accessor, but
      // this causes the table library to use a different sort ordering for
      // this column (i.e. desc => asc => none, instead of asc => desc => none).
      colHelper.accessor((row) => row.source.join("/"), {
        id: "source",
        header: () => (<span className="font-medium">Source</span>),
        cell: (info) => (
          <div className="truncate">
            <ShipName name={info.getValue().split("/")[0]} full={false} />
            <span>{`/${info.getValue().split("/")[1]}`}</span>
          </div>
        ),
      }),
    ];
  }, []);

  const [tableColumnFilters, setTableColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data: tableRows,
    columns: tableCols,
    state: { columnFilters: tableColumnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setTableColumnFilters,
  });
  const ColumnFilter = useCallback(({column}: {column: ColumnRef<any>}) => {
    // NOTE: We use a callback memo instead of a top-level memo in order to more
    // easily and directly target each individual column's `getFacetedUniqueValues()`
    // (which is otherwise hard to memoize because it's embedded in the table)
    const columnFilteredValues = useMemo<SelectorOption[]>(() => (
      Array.from(column.getFacetedUniqueValues().keys()).sort().map(value => ({
        value: value,
        label: column.id !== "wallet" ? value : `${value.slice(0, 5)}…${value.slice(-4)}`
      }))
    ), [column.getFacetedUniqueValues()]);
    return (
      <SingleSelector
        options={columnFilteredValues}
        value={columnFilteredValues.find(e => e.value === (column.getFilterValue() ?? ''))}
        onChange={o => column.setFilterValue(o ? o.value : o)}
        placeholder={capitalize(column.id)}
        className="my-1 w-full flex-1 min-w-0 text-xs"
        isSearchable={true}
        isClearable={true}
      />
    );
  }, []);
  const ColumnCell = useCallback(({cell}: {cell: CellRef<any, any>}) => {
    const { didCopy, doCopy } = useCopy(cell.getValue());
    return (
      <div onClick={doCopy} className="hover:bg-blue-100">
        {didCopy ? (
          "Copied!"
        ) : (
          flexRender(cell.column.columnDef.cell, cell.getContext())
        )}
      </div>
    );
  }, []);

  return (
    <DefaultDialog>
      {(localAddresses === undefined || urbitAddressMap === undefined) ? (
        <DialogLoad
          title="Known Wallets"
          stage={1 + [localAddresses, urbitAddressMap].filter(i => i !== undefined).length}
          total={2}
        />
      ) : (
        <DialogBody head="Known Wallets" className="h-[60vh]">
          <div className="h-full overflow-y-scroll">
            <table className="table-fixed w-full text-left rtl:text-right">
              <thead className="sticky top-0 text-base sm:text-lg bg-white">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="flex">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="flex min-w-full space-x-1 px-1 bg-white">
                        <ColumnFilter column={header.column} />
                        <button onClick={header.column.getToggleSortingHandler()}>
                          {{asc: "↑", desc: "↓"}[header.column.getIsSorted() as string] ?? "○"}
                        </button>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="text-sm sm:text-base">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="odd:bg-gray-50 even:bg-gray-100 border-b first:border-t-2">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="font-mono">
                        <ColumnCell cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogBody>
      )}
    </DefaultDialog>
  );
}

export function DisclaimerDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => {
    if (!open) {
      set("version", APP_VERSION)
        .catch((err) => console.log(err))
        .finally(() => dismiss());
    }
  };

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center text-red-500 gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <h2 className="text-lg font-bold">
            Disclaimer
          </h2>
        </header>
      </div>

      <div className="flex flex-col gap-4">
        <p>
          This is unaudited prerelease software that may contain bugs,
          errors and other problems that could cause system or other
          failures, such as loss of assets, funds, or data. By using
          this software, you assume all of these risks. See the software
          license for more details on limitations and liability:
        </p>
        <Link
          to="https://raw.githubusercontent.com/sidnym-ladrut/urbitswap/v0.0.1/LICENSE.txt"
          className="text-2xl underline text-center"
        >
          Software License
        </Link>

        <footer className="mt-4 flex items-center justify-between space-x-2">
          <div className="ml-auto flex items-center space-x-2">
            <DialogPrimitive.Close asChild>
              <button className="button">
                Acknowledge
              </button>
            </DialogPrimitive.Close>
          </div>
        </footer>
      </div>
    </DefaultDialog>
  );
}

function TradeChecksDialog<P extends {}>(props: DeferredRenderProps<null, P>) {
  const TradeChecksDialogRender = useCallback(function<P extends {}>(pops: DeferredRenderProps<null, P>) {
    const { address, owner, item, isMyItem, isAddressItem } = useRouteRaribleAccountItem();
    const collKYC = useCollectionAccountKYC();
    const itemGrant = useItemAccountGrant();
    const dialogProps = useRef({stage: 0, total: 0, title: "Trade"});

    const tradeChecks: DeferredPrecheckReport[] = [
      {
        status: (item === undefined || owner === undefined)
          ? undefined
          : !(isMyItem && !isAddressItem),
        render: () => (
          <DialogBody head="Wrong Wallet for Item">
            <p>
              This item is owned by one of your other crypto wallets. Please
              change to the appropriate wallet to continue (see below).
            </p>
            <div className="flex flex-row justify-around items-center py-4">
              <ENSName address={address} full={false} />
              <ArrowRightIcon className="w-5 h-5" />
              <ENSName address={owner ?? "0x"} full={false} />
            </div>
            <DialogFoot />
          </DialogBody>
        ),
      }, {
        status: collKYC?.kyc,
        render: () => (
          <DialogBody head="Collection Requires KYC">
            <p>
              In order to exchange this collection's assets, you'll first need
              to go through a collection-specific <Link
              to="https://en.wikipedia.org/wiki/Know_your_customer">KYC</Link> process.
              Visit the collection's website to get started.
            </p>
            {collKYC?.details && (
              <div>
                <h1 className="text-lg font-semibold">Collection-specific Notification</h1>
                <p className="italic">{collKYC.details}</p>
              </div>
            )}
            <DialogFoot close="Decline">
              <Link to="https://ventureclub.club" target="_blank" className="button">
                Submit KYC
              </Link>
            </DialogFoot>
          </DialogBody>
        ),
      }, {
        status: itemGrant?.status && (itemGrant?.status === "success"),
        render: () => (
          <DialogBody head="Unapproved Collection Trade">
            <p>
              TODO: Error message for when an item is not transferable.
            </p>
          </DialogBody>
        ),
      },
    ];

    return (
      <LoadingComponent
        checks={tradeChecks}
        render={pops}
        prerender={{render: DialogLoad, props: dialogProps.current}}
      />
    );
  }, []);

  return (
    <WalletChecksDialog render={TradeChecksDialogRender<P>} props={props} />
  );
}

function WalletChecksDialog<P extends {}>(props: DeferredRenderProps<null, P>) {
  const { address, isConnected } = useWagmiAccount();
  const { chain, chains } = useNetwork();
  const {
    connect: connectWallet,
    isLoading: isConnectLoading,
    isError: isConnectError,
  } = useWagmiConnect();
  const {
    switchNetwork,
    isLoading: isSwitchLoading,
    isError: isSwitchError,
  } = useSwitchNetwork();

  const dialogProps = useRef({stage: 0, total: 0, title: "Wallet"});
  const lastAddress = useRef<Address>(address);
  // From the official MetaMask's source:
  // https://github.com/MetaMask/metamask-onboarding/blob/v1.0.1/src/index.ts#L169
  const isInstalled: boolean = Boolean(
    (window as any)?.ethereum && (window as any)?.ethereum?.isMetaMask
  );

  // NOTE: For cases when no wallet is connected and this dialog is then used
  // to connect (need to update `lastAddress` while keeping the dialog open).
  useEffect(() => {
    if (isConnected && lastAddress.current === "0x") {
      lastAddress.current = address;
    }
  }, [isConnected]);

  const walletChecks: DeferredPrecheckReport[] = [
    {
      status: isInstalled,
      render: () => (
        <DialogBody head="MetaMask Not Detected">
          <p>
            You don't have <Link to="https://metamask.io/">
            Metamask</Link> installed on this browser, which
            is required to enable trading. Please visit the MetaMask website
            for installation instructions.
          </p>
          <DialogFoot close="Decline">
            <Link to="https://metamask.io/download/" target="_blank" className="button">
              Install Metamask
            </Link>
          </DialogFoot>
        </DialogBody>
      ),
    }, {
      status: isConnected,
      render: () => (
        <DialogBody head="No Wallet Connected">
          <p>
            Please connect your crypto wallet through <Link
            to="https://metamask.io/">Metamask</Link> in order to start trading.
          </p>
          <DialogFoot>
            <button className="button" onClick={() => connectWallet()}>
              {isConnectLoading ? (
                <LoadingIcon />
              ) : isConnectError ? (
                "Error"
              ) : (
                "Connect"
              )}
            </button>
          </DialogFoot>
        </DialogBody>
      ),
    },  {
      status: (lastAddress.current === "0x")
        ? undefined
        : address === lastAddress.current,
      render: () => (
        <DialogBody head="Active Wallet Changed">
          <p>
            Your wallet address has changed since opening this dialog (see the
            change below). Please reconnect the old wallet or refresh the
            dialog to continue.
          </p>
          <div className="flex flex-row justify-around items-center py-4">
            <ENSName address={address} full={false} />
            <ArrowRightIcon className="w-5 h-5" />
            <ENSName address={lastAddress.current} full={false} />
          </div>
          <DialogFoot />
        </DialogBody>
      ),
    },  {
      status: chain !== undefined && !chain.unsupported,
      render: () => (
        <DialogBody head="Invalid Blockchain Network">
          <p>
            Your crypto wallet is connected to the wrong network. Please switch
            to the "{chains?.[0]?.name ?? "<Unknown>"}" network and try again.
          </p>
          <DialogFoot>
            <button className="button" onClick={() => switchNetwork?.(chains?.[0]?.id || -1)}>
              {isSwitchLoading ? (
                <LoadingIcon />
              ) : isSwitchError ? (
                "Error"
              ) : (
                "Switch"
              )}
            </button>
          </DialogFoot>
        </DialogBody>
      ),
    },
  ];

  return (
    <DefaultDialog>
      <LoadingComponent
        checks={walletChecks}
        render={props}
        prerender={{render: DialogLoad, props: dialogProps.current}}
      />
    </DefaultDialog>
  );
}

function DialogLoad({
  stage,
  total,
  title,
}: {
  stage: number;
  total: number;
  title: string;
}) {
  return (
    <DialogBody
      head={`Loading ${title}...`}
      className="flex flex-col gap-4 justify-center items-center"
    >
      <UrbitswapIcon className="animate-spin w-20 h-20" />
      <p className="italic">Check {stage}/{total}</p>
    </DialogBody>
  );
}

function DialogBody({
  head,
  children,
  className,
}: {
  head: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <React.Fragment>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            {head}
          </h2>
        </header>
      </div>
      <div className={cn("flex flex-col gap-4", className)}>
        {children}
      </div>
    </React.Fragment>
  );
}

function DialogFoot({
  children,
  close,
}: {
  children?: React.ReactNode;
  close?: string;
}) {
  return (
    <footer className="flex items-center justify-between space-x-2">
      <div className="ml-auto flex items-center space-x-2">
        <DialogPrimitive.Close asChild>
          <button className="secondary-button ml-auto">
            {close ?? "Dismiss"}
          </button>
        </DialogPrimitive.Close>
        {children}
      </div>
    </footer>
  );
}

// FIXME: Gross duplication of '@/components/Dialog' content, but needed in
// order to minimize edits to 'landscape-apps' files.
type DialogCloseLocation = 'default' | 'none' | 'lightbox' | 'app' | 'header';
interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  containerClass?: string;
  close?: DialogCloseLocation;
}
type DialogProps = DialogPrimitive.DialogProps &
  DialogContentProps & {
    trigger?: ReactNode;
  };

function DefaultDialog(props: DialogProps) {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  return (
    <Dialog defaultOpen modal
      containerClass="w-full sm:max-w-lg"
      onOpenChange={onOpenChange}
      {...props}
    />
  );
}
