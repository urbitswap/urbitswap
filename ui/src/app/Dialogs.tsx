import React, { ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { FormProvider, useForm, useController } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as DialogPrimitive from '@radix-ui/react-dialog';
import DateTimePicker from 'react-datetime-picker';
// FIXME: There's an issue with the CSS where 'active' and 'now' tiles are
// having their default background colors overridden by Tailwindcss
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import '@/styles/DateTimePicker.css';
import { useAccount } from 'wagmi';
import Dialog from '@/components/Dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  SingleSelector,
  MultiSelector,
  SelectorOption,
} from '@/components/Selector';
import {
  useRouteRaribleItem,
  useRouteRaribleItemMutation,
  useRouteRaribleItemMutation2,
} from '@/state/app';
import { useDismissNavigate } from '@/logic/routing';
import {
  tenderToAsset,
  assetToTender,
  getOfferAsset,
  makePrettyPrice,
  getOwnerAddress,
} from '@/logic/utils';
import { TENDERS } from '@/constants';
import type {
  Asset as RaribleAsset,
  Order as RaribleOrder,
} from '@rarible/api-client';
import type {
  IBlockchainTransaction as RaribleTransaction,
} from '@rarible/sdk-transaction';
import type { TenderType } from '@/types/app';

export function OfferDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const { item, owners, bids } = useRouteRaribleItem();
  const { address, isConnected } = useAccount();
  const activeBids = (bids ?? []).filter((o: RaribleOrder) => o.status === "ACTIVE");
  const ownerAddresses = (owners ?? []).map(getOwnerAddress);
  const isMyItem: boolean = ownerAddresses.includes((address ?? "0x").toLowerCase());
  const myOffer: RaribleOrder | undefined = isMyItem
    ? item?.bestSellOrder
    : activeBids.find(o => o.maker === `ETHEREUM:${(address ?? "0x").toLowerCase()}`);
  const hasMyOffer: boolean = myOffer !== undefined;

  const { mutate: offerMutate, status: offerStatus } =
    useRouteRaribleItemMutation2({onSuccess: () => dismiss()});

  // TODO: Enable users to set 'never' for expiration date (maybe if date is undefined?
  // need special handling for the UX)
  // TODO: Make default expiration for a listing 'never' (?)
  const form = useForm({
    mode: "onChange",
    defaultValues: useMemo(() => {
      if (myOffer === undefined) { // FIXME: appeasing TypeScript
        return {
          tender: TENDERS[0].value,
          amount: "0",
          expiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
      } else {
        const myAsset: RaribleAsset = getOfferAsset(myOffer, isMyItem ? "sell" : "bid");
        return {
          tender: assetToTender(myAsset.type),
          amount: myAsset.value.toString(),
          expiration: new Date(myOffer?.endedAt ?? ""),
        };
      }
    }, [item, owners, bids]),
  });
  const {register, handleSubmit, formState: {isDirty, isValid}, control} = form;
  const {field: {value: tender, onChange: tenderOnChange, ref: tenderRef}} =
    useController({name: "tender", rules: {required: true}, control});
  const {field: {value: expiration, onChange: expirationOnChange}} =
    useController({name: "expiration", rules: {required: true}, control});
  const onSubmit = useCallback(async ({
    tender,
    amount,
    expiration,
  }: {
    tender: TenderType;
    amount: string;
    expiration: Date;
  }) => {
    offerMutate({
      orderId: myOffer?.id || "",
      itemId: item?.id || "",
      amount: 1,
      price: amount,
      currency: tenderToAsset(tender),
      expirationDate: expiration,
    });
  }, [item, bids, offerMutate]);

  // TODO: If we are selling, only allow the listing to go lower.
  // If we are buying, only allow the listing to go higher.
  // (These are requirements of the Rarible interface.)
  /*
    max={!hasMyOffer
      ? Number.MAX_VALUE
      : ((isMyItem ? myOffer?.makePrice : myOffer?.takePrice) ?? {}).toString()
    }
  */

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <FormProvider {...form}>
        <div className="w-5/6">
          <header className="mb-3 flex items-center">
            <h2 className="text-lg font-bold">
              {`${!hasMyOffer ? "Post" : "Update"} Listing`}
            </h2>
          </header>
        </div>

        {(item !== undefined) && (
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
                isDisabled={hasMyOffer}
              />
            </label>
            <label className="mb-3 font-semibold">
              Amount*
              <input type="number" step="0.001"
                className="input my-2 block w-full py-1 px-2"
                {...register("amount", {required: true})}
              />
            </label>
            <label className="mb-3 font-semibold">
              Expiration*
              <DateTimePicker
                minDate={new Date(Date.now())}
                value={expiration}
                onChange={expirationOnChange}
                className="input w-full"
                disableClock={true}
                calendarIcon={null}
                disabled={hasMyOffer}
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
                    hasMyOffer ? "Update" : "Create"
                  )}
                </button>
              </div>
            </footer>
          </form>
        )}
      </FormProvider>
    </DefaultDialog>
  );
}

export function TradeDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <p>TODO: Create Take Dialog</p>
    </DefaultDialog>
  );
}

export function CancelDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const { item, owners, bids } = useRouteRaribleItem();
  const { address, isConnected } = useAccount();
  const activeBids = (bids ?? []).filter((o: RaribleOrder) => o.status === "ACTIVE");
  const ownerAddresses = (owners ?? []).map(getOwnerAddress);
  const isMyItem: boolean = ownerAddresses.includes((address ?? "0x").toLowerCase());
  const myOffer: RaribleOrder | undefined = isMyItem
    ? item?.bestSellOrder
    : activeBids.find(o => o.maker === `ETHEREUM:${(address ?? "0x").toLowerCase()}`);

  const { mutate: cancelMutate, status: cancelStatus } = useRouteRaribleItemMutation(
    "order.cancel", {onSuccess: () => dismiss()},
  );

  // FIXME: This doesn't properly block until the cancellation has been processed
  // by the blockchain; need to inject some form of 'Promise' or monitor
  // cancellation.
  const onSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    (myOffer !== undefined) && cancelMutate({orderId: myOffer.id});
  }, [item, bids, cancelMutate]);

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
          Do you really want to cancel your this listing?
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
                "Cancel"
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
