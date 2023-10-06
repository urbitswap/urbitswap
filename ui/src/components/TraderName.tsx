import React, { HTMLAttributes } from 'react';
import cn from 'classnames';
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

  return (
    <span className={cn(
      props?.className,
      isMe ? "text-blue-600" : "",
    )}>
      {(urbitId === undefined) ? (
        <ENSName {...props} />
      ) : (
        <ShipName name={urbitId} {...props} />
      )}
      {isMe && (<span> (me)</span>)}
    </span>
  );
}
