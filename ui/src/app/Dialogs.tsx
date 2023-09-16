import React, { ReactNode, useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import Dialog from '@/components/Dialog';
import { useDismissNavigate } from '@/logic/routing';

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
