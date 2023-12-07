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
import LoadingSpinner from '@/components/LoadingSpinner';
import TraderName from '@/components/TraderName';
import ENSName from '@/components/ENSName';
import ShipName from '@/components/ShipName';
import UrbitswapIcon from '@/components/icons/UrbitswapIcon';
import {
  SingleSelector,
  MultiSelector,
  SelectorOption,
} from '@/components/Selector';
import {
  useWagmiAccount,
  useUrbitAssociateMutation,
  useCollectionAccountKYC,
  useItemAccountGrant,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
  useRouteRaribleItemMutation,
} from '@/state/app';
import { set } from '@/state/idb';
import { useDismissNavigate } from '@/logic/routing';
import {
  isMaxDate,
  tenderToAsset,
  assetToTender,
  makePrettyName,
  makePrettyPrice,
} from '@/logic/utils';
import {
  APP_VERSION,
  FEATURED,
  MAX_DATE,
  TREASURY,
  TENDERS,
} from '@/constants';
import { BigNumber } from "bignumber.js";
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
import type { TenderType } from '@/types/app';

// FIXME: Figure out a better way of doing hook/component deferment. Ideally,
// each of the trade dialogs would do all the wallet checks before the trade
// checks in a more seamless way.

export function OfferDialog() {
  return (<WalletTypeDialog content={OfferDialogHelper1} />);
}
function OfferDialogHelper1() {
  return (<TradeTypeDialog content={OfferDialogHelper2} />);
}
function OfferDialogHelper2() {
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
                  <LoadingSpinner />
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
}

export function TradeDialog() {
  return (<WalletTypeDialog content={TradeDialogHelper1} />);
}
function TradeDialogHelper1() {
  return (<TradeTypeDialog content={TradeDialogHelper2} />);
}
function TradeDialogHelper2() {
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
                  <LoadingSpinner />
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
}

export function CancelDialog() {
  return (<WalletTypeDialog content={CancelDialogHelper1} />);
}
function CancelDialogHelper1() {
  return (<TradeTypeDialog content={CancelDialogHelper2} />);
}
function CancelDialogHelper2() {
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

        <footer className="mt-4 flex items-center justify-between space-x-2">
          <div className="ml-auto flex items-center space-x-2">
            <DialogPrimitive.Close asChild>
              <button className="secondary-button ml-auto">
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button className="button bg-red" type="submit">
              {cancelStatus === "loading" ? (
                <LoadingSpinner />
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
}

export function AssociateDialog() {
  return (<WalletTypeDialog content={AssociateDialogHelper1} />);
}
function AssociateDialogHelper1() {
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
                <LoadingSpinner />
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

      <form className="flex flex-col gap-4">
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
      </form>
    </DefaultDialog>
  );
}

interface CheckReport {
  status: boolean | undefined;
  report: React.ForwardRefRenderFunction<null, {}>;
}

function TradeTypeDialog({content}: {content: React.ForwardRefRenderFunction<null, {}>}) {
  const { status, report } = useTradeChecks();
  return createElement(!status ? report : content);
}

function WalletTypeDialog({content}: {content: React.ForwardRefRenderFunction<null, {}>}) {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());
  const { status, report } = useWalletChecks();

  return createElement(
    DefaultDialog,
    { onOpenChange: onOpenChange },
    createElement(!status ? report : content),
  );
}

function useTradeChecks(): CheckReport {
  const { address, owner, item, isMyItem, isAddressItem } = useRouteRaribleAccountItem();
  const collKYC = useCollectionAccountKYC();
  const itemGrant = useItemAccountGrant();

  const tradeChecks: CheckReport[] = [
    {
      status: (item === undefined || owner === undefined)
        ? undefined
        : !(isMyItem && !isAddressItem),
      report: () => (
        <DialogBody head="Validating Item Ownership">
          <p>
            This item is owned by one of your other crypto wallets. Please
            change to the appropriate wallet to continue (see below).
          </p>
          <div className="flex flex-row justify-around items-center py-4">
            <ENSName address={address} full={false} />
            <ArrowRightIcon className="w-5 h-5" />
            <ENSName address={owner ?? "0x"} full={false} />
          </div>
          <DialogFooter />
        </DialogBody>
      ),
    }, {
      status: collKYC?.kyc,
      report: () => (
        <DialogBody head="Checking Collection KYC">
          <p>
            In order to exchange assets in this collection, you'll first need
            to go through a collection-specific <Link
            to="https://en.wikipedia.org/wiki/Know_your_customer">KYC</Link> process.
            Visit their website to get started.
          </p>
          <DialogFooter close="Decline">
            <Link to="https://ventureclub.club" target="_blank" className="button">
              Submit KYC
            </Link>
          </DialogFooter>
        </DialogBody>
      ),
    }, {
      status: itemGrant?.status && (itemGrant?.status === "success"),
      report: () => (
        <DialogBody head="Validating Collection Trade">
          <p>
            TODO: Error message for when an item is not transferable.
          </p>
        </DialogBody>
      ),
    },
  ];

  const [currCheck, currIndex]: [CheckReport | undefined, number] = (() => {
    const index: number = tradeChecks.findIndex((check: CheckReport) => !check.status);
    return [(index === -1) ? undefined : tradeChecks[index], index];
  })();

  return {
    status: !currCheck || currCheck.status,
    report: (currCheck?.status === true) ? () => true
      : (currCheck?.status === false) ? currCheck.report
      : () => (<DialogLoadingBody type="Trade" step={currIndex + 1} total={tradeChecks.length} />),
  };
}

function useWalletChecks(): CheckReport {
  const { address, isConnected } = useWagmiAccount();
  const { chain, chains } = useNetwork();
  const { switchNetwork, isLoading: isSwitchLoading, isError: isSwitchError } = useSwitchNetwork();
  const lastAddress = useRef<Address>(address);

  const walletChecks: CheckReport[] = [
    {
      status: isConnected,
      report: () => (
        <DialogBody head="Checking Wallet Connectivity">
          <p>
            Please connect your crypto wallet
            via <Link to="https://metamask.io/">Metamask</Link> in order to
            start trading. If you don't have Metamask installed, visit their
            website to get started.
          </p>
          <DialogFooter close="Decline">
            <Link to="https://metamask.io/download/" target="_blank" className="button">
              Install
            </Link>
          </DialogFooter>
        </DialogBody>
      ),
    },  {
      status: address === lastAddress.current,
      report: () => (
        <DialogBody head="Checking Wallet Consistency">
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
          <DialogFooter />
        </DialogBody>
      ),
    },  {
      status: chain !== undefined && !chain.unsupported,
      report: () => (
        <DialogBody head="Checking Blockchain Network">
          <p>
            Your crypto wallet is connected to the wrong network. Please switch
            to the "{chains?.[0]?.name ?? "<Unknown>"}" network and try again.
          </p>
          <DialogFooter>
            <button className="button" onClick={() => switchNetwork?.(chains?.[0]?.id || -1)}>
              {isSwitchLoading ? (
                <LoadingSpinner />
              ) : isSwitchError ? (
                "Error"
              ) : (
                "Switch"
              )}
            </button>
          </DialogFooter>
        </DialogBody>
      ),
    },
  ];

  const [currCheck, currIndex]: [CheckReport | undefined, number] = (() => {
    const index: number = walletChecks.findIndex((check: CheckReport) => !check.status);
    return [(index === -1) ? undefined : walletChecks[index], index];
  })();

  return {
    status: !currCheck || currCheck.status,
    report: (currCheck?.status === true) ? () => true
      : (currCheck?.status === false) ? currCheck.report
      : () => (<DialogLoadingBody type="Wallet" step={currIndex + 1} total={walletChecks.length} />),
  };
}

function DialogLoadingBody({type, step, total}: {type: string; step: number; total: number;}) {
  return (
    <DialogBody head={`Loading ${type}...`} className="justify-center items-center">
      <UrbitswapIcon className="animate-spin w-20 h-20" />
      <p className="italic">Check {step}/{total}</p>
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

function DialogFooter({
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
  return (
    <Dialog defaultOpen modal containerClass="w-full sm:max-w-lg" {...props} />
  );
}
