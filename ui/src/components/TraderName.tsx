import React, { HTMLAttributes } from 'react';
import ENSName from '@/components/ENSName';
import ShipName from '@/components/ShipName';

type EntityNameProps = {
  address: string;
  full?: boolean;
  showAlias?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

export default function EntityName(props: EntityNameProps) {
  // TODO: Use the Urbit name store here to figure out if the given
  // trader should be listed using their @p of their ETH address

  return (
    <ENSName {...props} />
  );
}