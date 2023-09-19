import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { FormProvider, useForm, useController } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAccount } from 'wagmi';
import { Blockchain } from '@rarible/api-client';
import { toContractAddress, toItemId, toOrderId, toUnionAddress } from '@rarible/types';
import Dialog from '@/components/Dialog';
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

  const onSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    if (item?.bestSellOrder === undefined) {
      rsdk.order.sell({
        itemId: toItemId(item?.id ?? ""),
        amount: 1,
        price: "0.0005",
        currency: {
          "@type": "ETH",
          "blockchain": Blockchain.ETHEREUM,
        },
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
      }).then((orderId: RaribleOrderId) => {
        console.log("*************** ORDER SUCCEEDED ***************");
        dismiss();
      }, (reason: any) => {
        console.log("**************** ORDER FAILED ****************");
        console.log(reason);
      });
    } else {
      rsdk.order.cancel({
        orderId: toOrderId(item.bestSellOrder.id),
      }).then((orderTxn: RaribleTransaction) => {
        console.log("*************** CANCEL SUCCEEDED ***************");
        dismiss();
      }, (reason: any) => {
        console.log("**************** CANCEL FAILED ****************");
        console.log(reason);
      });
    }
  }, [rsdk, item, dismiss]);

  return (
    <DefaultDialog onOpenChange={onOpenChange}>
      <div className="w-5/6">
        <header className="mb-3 flex items-center">
          <h2 className="text-lg font-bold">
            Post Bid
          </h2>
        </header>
      </div>

      <form onSubmit={onSubmit}>
        {/* TODO: Implement the real dialog here. */}
        <p>Do you want to {item?.bestSellOrder ? "rescind " : "post "}
        this for 0.0005 ETH?</p>

        <footer className="mt-4 flex items-center justify-between space-x-2">
          <div className="ml-auto flex items-center space-x-2">
            <DialogPrimitive.Close asChild>
              <button className="secondary-button ml-auto">
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button className="button" type="submit">
              {item?.bestSellOrder ? "Rescind" : "Post"}
            </button>
          </div>
        </footer>
      </form>
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
