import React, { ReactNode, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
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
import { useSignMessage } from 'wagmi';
import {
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Dialog from '@/components/Dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import TraderName from '@/components/TraderName';
import ENSName from '@/components/ENSName';
import ShipName from '@/components/ShipName';
import {
  SingleSelector,
  MultiSelector,
  SelectorOption,
} from '@/components/Selector';
import {
  useWagmiAccount,
  useUrbitAssociateMutation,
  useVentureAccountKYC,
  useVentureAccountGrant,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
  useRouteRaribleItemMutation,
  useRouteRaribleOfferItemMutation,
} from '@/state/app';
import { useDismissNavigate } from '@/logic/routing';
import {
  isMaxDate,
  tenderToAsset,
  assetToTender,
  makePrettyName,
  makePrettyPrice,
} from '@/logic/utils';
import { MAX_DATE, TENDERS } from '@/constants';
import type {
  Asset as RaribleAsset,
  AssetType as RaribleAssetType,
  Order as RaribleOrder,
} from '@rarible/api-client';
import type { Address } from 'viem';
import type { TenderType } from '@/types/app';

export function OfferDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const { item, mine, offer } = useRouteRaribleAccountItem();
  const { mutate: offerMutate, status: offerStatus } =
    useRouteRaribleOfferItemMutation({onSuccess: () => dismiss()});

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
        const myAsset: RaribleAsset = mine ? offer.take : offer.make;
        const endDate: Date = new Date(offer.endedAt ?? "");
        return {
          tender: assetToTender(myAsset.type),
          amount: myAsset.value.toString(),
          expiration: isMaxDate(endDate) ? undefined : endDate,
        };
      }
    }, [mine, offer]),
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
    <DefaultDialog onOpenChange={onOpenChange}>
      <FormProvider {...form}>
        <div className="w-5/6">
          <header className="mb-3 flex items-center">
            <h2 className="text-lg font-bold">
              {`${(offer === undefined) ? "Post" : "Update"} Listing`}
            </h2>
          </header>
        </div>

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
              isDisabled={!mine || offer !== undefined}
            />
          </label>
          <label className="mb-3 font-semibold">
            Amount*
            <input type="number" autoComplete="off"
              step="0.00001"
              min={(offer !== undefined && !mine)
                ? ((mine ? offer?.makePrice : offer?.takePrice) ?? "0.00001").toString()
                : "0.00001"
              }
              max={(offer !== undefined && mine)
                ? ((mine ? offer?.makePrice : offer?.takePrice) ?? `${Number.MAX_VALUE}`).toString()
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
    </DefaultDialog>
  );
}

export function TradeDialog() {
  const navigate = useNavigate();
  const location = useLocation();
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const [hasBeenWarned, setHasBeenWarned] = useState<boolean>(false);
  const { address, item, bids, mine, offer: myOffer } = useRouteRaribleAccountItem();
  const { mutate: tradeMutate, status: tradeStatus } = useRouteRaribleItemMutation(
    `order.${mine ? "acceptBid" : "buy"}`,
    { onSuccess: () => dismiss() },
  );

  const { offerId } = useParams();
  const tradeOffer: RaribleOrder | undefined =
    [(item && item.bestSellOrder), ...(bids || [])]
    .find(o => o !== undefined && o.id === offerId);
  const tradeAsset: string | undefined = item && makePrettyName(item);
  const tradeTender: string | undefined =
    tradeOffer && makePrettyPrice(tradeOffer[mine ? "make" : "take"]);

  const onSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    (offerId !== undefined) && tradeMutate({orderId: offerId, amount: 1});
  }, [hasBeenWarned, offerId, tradeMutate]);
  const onKeep = useCallback(async (event: any) => {
    setHasBeenWarned(true);
  }, [setHasBeenWarned]);
  const onCancel = useCallback(async (event: any) => {
    // NOTE: Okay not to go through "pretrade" form here because we just
    // went through it
    navigate(`../cancel`, {
      replace: true,
      state: location.state,
    });
  }, [navigate, location.state]);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            Accept {mine ? "Bid" : "Ask"}
          </h2>
        </header>
      </div>

      {(myOffer !== undefined && !hasBeenWarned) ? (
        <React.Fragment>
          <p>
            You have an open {mine ? "ask" : "bid"} for this item. Would you
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
          <p>
            Do you really want to accept this trade?
          </p>

          {(tradeOffer !== undefined) && (
            <div className="flex flex-row justify-around items-center py-8">
              <div className="flex flex-col justify-center text-center">
                <TraderName
                  address={address}
                  className="mx-auto font-bold underline"
                />
                <p className="line-through text-sm">{mine ? tradeAsset : tradeTender}</p>
                <p className="italic text-sm">{mine ? tradeTender : tradeAsset}</p>
              </div>
              <ArrowsRightLeftIcon className="w-5 h-5" />
              <div className="flex flex-col justify-center text-center">
                <TraderName
                  address={(tradeOffer.maker.replace(/^.+:/g, "") as Address)}
                  className="mx-auto font-bold underline"
                />
                <p className="italic text-sm">{mine ? tradeAsset : tradeTender}</p>
                <p className="line-through text-sm">{mine ? tradeTender : tradeAsset}</p>
              </div>
            </div>
          )}

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
    </DefaultDialog>
  );
}

export function CancelDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

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
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            Cancel Listing
          </h2>
        </header>
      </div>

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
    </DefaultDialog>
  );
}

export function AssociateDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const { address, isConnected } = useWagmiAccount();
  const { signMessageAsync: signMessage } = useSignMessage({
    message: window.our,
  });
  const { mutate: assocMutate, status: assocStatus } = useUrbitAssociateMutation(
    { onSuccess: () => dismiss() },
  );

  const onSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    if (isConnected) {
      signMessage().then((signature: string) => (
        assocMutate({address, signature})
      ));
    }
  }, [signMessage, assocMutate, address, isConnected]);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            Associate Wallet
          </h2>
        </header>
      </div>

      <form onSubmit={onSubmit}>
        <p>
          Would you like to associate this new wallet with your Urbit ID?
        </p>

        <div className="flex flex-row justify-around items-center py-8">
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
    </DefaultDialog>
  );
}

export function PretradeDialog() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const { isConnected } = useWagmiAccount();
  const vccKYC = useVentureAccountKYC();
  const vccGrant = useVentureAccountGrant(params?.itemId ?? "");
  const isKYCd: boolean = vccKYC !== undefined && vccKYC.kyc;
  const isTransferable: boolean = vccGrant !== undefined && vccGrant?.status === "success";

  useLayoutEffect(() => {
    const { thenTo, ...newLocationState } = location.state;
    if (isConnected && isKYCd && isTransferable) {
      navigate(`../${thenTo}`, {
        replace: true,
        state: newLocationState,
      });
    }
  }, [
    isConnected,
    isKYCd,
    isTransferable,
    navigate,
    location.state,
  ]);

  const onSubmit = useCallback(async (event: any) => {
    event.preventDefault();
  }, []);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      {(vccKYC === undefined || vccGrant === undefined) ? (
        <LoadingSpinner />
      ) : (
        <React.Fragment>
          <div className="w-5/6">
            <header className="mb-3 flex items-center">
              <h2 className="text-lg font-bold">
                Before You Trade
              </h2>
            </header>
          </div>

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            {!isConnected ? (
              <React.Fragment>
                <p>
                  Please connect your crypto wallet
                  via <Link to="https://metamask.io/">Metamask</Link> in order to
                  start trading. If you don't have Metamask installed, visit their
                  website to get started:
                </p>
                <Link to="https://metamask.io/download/" className="text-2xl underline text-center">
                  Install Metamask
                </Link>
              </React.Fragment>
            ) : !isKYCd ? (
              <React.Fragment>
                <p>
                  In order to exchange assets, you'll first need to go through Venture
                  Club's <Link to="https://en.wikipedia.org/wiki/Know_your_customer">KYC</Link> process.
                  Visit our website to get started:
                </p>
                <Link to="https://ventureclub.club" className="text-2xl underline text-center">
                  Venture Club KYC
                </Link>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p>
                  TODO: Cannot transfer error message here.
                </p>
              </React.Fragment>
            )}

            <footer className="mt-4 flex items-center justify-between space-x-2">
              <div className="ml-auto flex items-center space-x-2">
                <DialogPrimitive.Close asChild>
                  <button className="secondary-button ml-auto">
                    Decline
                  </button>
                </DialogPrimitive.Close>
                <DialogPrimitive.Close asChild>
                  <button className="button">
                    Acknowledge
                  </button>
                </DialogPrimitive.Close>
              </div>
            </footer>
          </form>
        </React.Fragment>
      )}
    </DefaultDialog>
  );
}

export function DisclaimerDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const onSubmit = useCallback((event: any) => {
    event.preventDefault();
  }, []);

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

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <p>
          This is a pre-release version that may contain bugs, errors and
          other problems that could cause system or other failures, such
          as loss of assets, funds, or data. By using this software, you
          assume these risks, so proceed with caution! See the software
          license for more details on limitations and liability:
        </p>
        <Link
          to="https://raw.githubusercontent.com/sidnym-ladrut/urbits.exchange/v0.0.1/LICENSE"
          className="text-2xl underline text-center"
        >
          Urbit's Exchange License
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
