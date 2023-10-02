import React, { ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { FormProvider, useForm, useController } from 'react-hook-form';
import { useParams } from 'react-router-dom';
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
} from '@heroicons/react/24/solid';
import Dialog from '@/components/Dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  makePrettyPrice,
} from '@/logic/utils';
import { MAX_DATE, TENDERS } from '@/constants';
import type {
  Asset as RaribleAsset,
  Order as RaribleOrder,
} from '@rarible/api-client';
import type {
  IBlockchainTransaction as RaribleTransaction,
} from '@rarible/sdk-transaction';
import type { TenderType } from '@/types/app';

// TODO: Auto-close dialogs if a user account is not connected.

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
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const { offerId } = useParams();
  const { mine, offer } = useRouteRaribleAccountItem();
  const { mutate: tradeMutate, status: tradeStatus } = useRouteRaribleItemMutation(
    `order.${mine ? "acceptBid" : "buy"}`,
  );
  const { mutate: cancelMutate, status: cancelStatus } = useRouteRaribleItemMutation(
    "order.cancel",
  );

  const onSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    (offerId !== undefined) &&
      tradeMutate({orderId: offerId, amount: 1}, (offer === undefined) ? {
        onSuccess: () => dismiss(),
      } : {
        onSuccess: () => cancelMutate({orderId: offer.id}, {
          onSuccess: () => dismiss(),
        })
      });
  }, [offer, offerId, dismiss, tradeMutate, cancelMutate]);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            Accept {mine ? "Bid" : "Ask"}
          </h2>
        </header>
      </div>

      <form onSubmit={onSubmit}>
        <p>
          Do you really want to accept this {mine ? "bid" : "ask"}?
        </p>

        <footer className="mt-4 flex items-center justify-between space-x-2">
          <div className="ml-auto flex items-center space-x-2">
            <DialogPrimitive.Close asChild>
              <button className="secondary-button ml-auto">
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button className="button bg-green" type="submit">
              {(tradeStatus === "loading" || cancelStatus === "loading") ? (
                <LoadingSpinner />
              ) : (tradeStatus === "error" || cancelStatus === "error") ? (
                "Error"
              ) : (
                "Trade"
              )}
            </button>
          </div>
        </footer>
      </form>
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
