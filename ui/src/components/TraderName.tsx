import React, { HTMLAttributes } from 'react';
import ENSName from '@/components/ENSName';
import ShipName from '@/components/ShipName';
import { useUrbitTraders } from '@/state/app';
import type { Address } from 'viem';

type EntityNameProps = {
  address: Address;
  full?: boolean;
  showAlias?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

export default function EntityName(props: EntityNameProps) {
  const traders = useUrbitTraders();
  const urbitId = (traders ?? {})[props.address.toLowerCase()];

  return (urbitId === undefined) ? (
    <ENSName {...props} />
  ) : (
    <ShipName name={urbitId} {...props} />
  );
}
