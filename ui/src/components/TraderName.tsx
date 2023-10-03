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
  const isMe = urbitId === window.our;

  return (urbitId === undefined) ? (
    <React.Fragment>
      <ENSName className={isMe ? "text-blue-600" : ""} {...props} />
      {isMe && (<span className={isMe ? "text-blue-600" : ""}> (me)</span>)}
    </React.Fragment>
  ) : (
    <React.Fragment>
      <ShipName name={urbitId} className={isMe ? "text-blue-600" : ""} {...props} />
      {isMe && (<span className={isMe ? "text-blue-600" : ""}> (me)</span>)}
    </React.Fragment>
  );
}
