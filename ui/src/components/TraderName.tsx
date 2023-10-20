import React, { HTMLAttributes } from 'react';
import cn from 'classnames';
import ENSName from '@/components/ENSName';
import ShipName from '@/components/ShipName';
import { useUrbitTraders } from '@/state/app';
import EthereumIcon from '@/components/icons/EthereumIcon';
import { APP_DBUG } from '@/constants';
import type { Address } from 'viem';

type EntityNameProps = {
  address: Address;
  full?: boolean;
  showAlias?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

export default function EntityName(props: EntityNameProps) {
  const traders = useUrbitTraders();
  const urbitId = (traders ?? {})[props.address.toLowerCase()];
  const ethUrl = `https://${!APP_DBUG ? "" : "goerli."}etherscan.io/address/${props.address}`;
  const isMe = urbitId === window.our;

  return (
    <span className={cn(
      "flex flex-row items-center space-x-0.5",
      isMe && "text-blue-300",
      props?.className,
    )}>
      {(urbitId === undefined) ? (
        <ENSName {...props} />
      ) : (
        <ShipName name={urbitId} {...props} />
      )}
      {isMe && (<span>(me)</span>)}
      <a href={ethUrl} target="_blank" rel="noopener noreferrer" className={cn(
        "p-0.5 rounded-md hover:bg-gray-200",
      )}>
        <EthereumIcon className="h-4 w-4" />
      </a>
    </span>
  );
}
