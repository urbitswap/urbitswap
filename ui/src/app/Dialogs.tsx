import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { FormProvider, useForm, useController } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAccount } from 'wagmi';
import { Blockchain } from '@rarible/api-client';
import { toContractAddress, toItemId, toOrderId, toUnionAddress } from '@rarible/types';
import Dialog from '@/components/Dialog';
import {
  SingleSelector,
  MultiSelector,
  SelectorOption,
} from '@/components/Selector';
import useRaribleSDK from '@/logic/useRaribleSDK';
import { useDismissNavigate } from '@/logic/routing';
import { CONTRACT } from '@/constants';
import type {
  Item as RaribleItem,
  Ownerships as RaribleOwnerships,
} from '@rarible/api-client';
import type {
  IBlockchainTransaction as RaribleTransaction,
} from '@rarible/sdk-transaction';
import type { OrderId as RaribleOrderId } from '@rarible/types';

export function BidDialog() {
  const dismiss = useDismissNavigate();
  const onOpenChange = (open: boolean) => (!open && dismiss());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [item, setItem] = useState<RaribleItem | undefined>(undefined);
  const [owner, setOwner] = useState<string | undefined>(undefined);

  const rsdk = useRaribleSDK();
  const { address, isConnected } = useAccount();
  const params = useParams();

  const isMyItem: boolean =
    (owner || "0").toLowerCase() === (address || "1").toLowerCase();
  const tenderOpts = [
    {value: "eth", label: "Ethereum"},
    {value: "usdc", label: "USDC"},
  ];

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      tender: tenderOpts[0].value,
      amount: "0",
    },
  });
  const {register, handleSubmit, formState: {isValid}, control} = form;
  const {field: {value: tender, onChange: tenderOnChange, ref: tenderRef}} =
    useController({name: "tender", rules: {required: true}, control});
  const onSubmit = useCallback(async ({
    tender,
    amount,
  }: {
    tender: string;
    amount: string;
  }) => {
    // TODO: Actually use USDC if it was asked by the user
    if (item?.bestSellOrder === undefined) {
      rsdk.order.sell({
        itemId: toItemId(item?.id ?? ""),
        amount: 1,
        price: amount,
        currency: {
          "@type": "ETH",
          "blockchain": Blockchain.ETHEREUM,
        },
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
      }).then((orderId: RaribleOrderId) => {
        dismiss();
      }, (reason: any) => {
        console.log(reason);
      });
    } else {
      rsdk.order.cancel({
        orderId: toOrderId(item.bestSellOrder.id),
      }).then((orderTxn: RaribleTransaction) => {
        dismiss();
      }, (reason: any) => {
        console.log(reason);
      });
    }
  }, [rsdk, item, dismiss]);

  useEffect(() => {
    if (isLoading) {
      const itemId = `${CONTRACT.COLLECTION}:${params?.itemId || 0}`;
      Promise.all([
        rsdk.apis.item.getItemById({itemId}),
        rsdk.apis.ownership.getOwnershipsByItem({itemId}),
      ]).then(([item, owns]: [RaribleItem, RaribleOwnerships]) => {
        // TODO: This code assumes exactly one owner per NFT
        setItem(item);
        setOwner(owns.ownerships[0].owner.replace(/^.+:/g, ""));
        setIsLoading(false);
      });
    }
  }, [params?.itemId, isLoading]);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            {`${(item?.bestSellOrder === undefined) ? "Post" : "Rescind"} Bid`}
          </h2>
        </header>
      </div>

      {isLoading ? (
        <p>
          Loading...
        </p>
      ) : (
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
                  defaultValue={tenderOpts[0]}
                  isSearchable={false}
                  options={tenderOpts}
                  value={tenderOpts.find(e => e.value === tender)}
                  onChange={o => tenderOnChange(o ? o.value : o)}
                  className="my-2 w-full"
                  autoFocus
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
              <button className="button" type="submit" disabled={!isValid}>
                {item?.bestSellOrder ? "Rescind" : "Post"}
              </button>
            </div>
          </footer>
        </form>
      )}
    </DefaultDialog>
  );
}

export function TakeDialog() {
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
