import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { FormProvider, useForm, useController } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as DialogPrimitive from '@radix-ui/react-dialog';
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
} from '@/state/app';
import { useDismissNavigate } from '@/logic/routing';
import { tenderToCurrency } from '@/logic/utils';
import { TENDERS } from '@/constants';
import type { OrderId as RaribleOrderId } from '@rarible/types';
import type { IBlockchainTransaction as RaribleTransaction } from '@rarible/sdk-transaction';
import type { Tender } from '@/types/app';

export function OfferDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const [item, owners] = useRouteRaribleItem();
  const { address, isConnected } = useAccount();
  const { mutate: sellMutate, status: sellStatus } = useRouteRaribleItemMutation(
    "order.sell",
    { onSuccess: () => dismiss() },
  );

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      tender: TENDERS[0].value,
      amount: "0",
    },
  });
  const {register, handleSubmit, formState: {isDirty, isValid}, control} = form;
  const {field: {value: tender, onChange: tenderOnChange, ref: tenderRef}} =
    useController({name: "tender", rules: {required: true}, control});
  const onSubmit = useCallback(async ({
    tender,
    amount,
  }: {
    tender: Tender;
    amount: string;
  }) => {
    sellMutate({
      itemId: item?.id || "",
      amount: 1,
      price: amount,
      currency: tenderToCurrency(tender),
      expirationDate: new Date(Date.now() + 60 * 60 * 1000),
    });
  }, [item, sellMutate, dismiss]);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <FormProvider {...form}>
        <div className="w-5/6">
          <header className="mb-3 flex items-center">
            <h2 className="text-lg font-bold">
              {`${(item?.bestSellOrder === undefined) ? "Post" : "Rescind"} Bid`}
            </h2>
          </header>
        </div>

        {(item !== undefined) && (
          <form onSubmit={handleSubmit(onSubmit)}>
            {(item?.bestSellOrder !== undefined) ? (
              <p>
                Would you like to rescind your existing listing on this item?
              </p>
            ) : (
              <React.Fragment>
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
                  />
                </label>
                <label className="mb-3 font-semibold">
                  Amount*
                  <input type="number" step="0.0001" min="0.0001"
                    className="input my-2 block w-full py-1 px-2"
                    {...register("amount", {required: true})}
                  />
                </label>
              </React.Fragment>
            )}

            <footer className="mt-4 flex items-center justify-between space-x-2">
              <div className="ml-auto flex items-center space-x-2">
                <DialogPrimitive.Close asChild>
                  <button className="secondary-button ml-auto">
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button className="button" type="submit" disabled={!isValid || !isDirty}>
                  {sellStatus === 'loading' ? (
                    <LoadingSpinner />
                  ) : sellStatus === 'error' ? (
                    'Error'
                  ) : (
                    'Create'
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

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <p>TODO: Create Cancel Dialog</p>
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
