import React, { HTMLAttributes } from 'react';
import { useEnsName } from 'wagmi';
import { truncateAddress } from '@/logic/utils';
// import { useCalm } from '@/state/settings';
import type { Address } from 'viem';

type ENSNameProps = {
  address: Address;
  full?: boolean;
  showAlias?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

export default function ENSName({
  address,
  full = false,
  showAlias = false,
  ...props
}: ENSNameProps) {
  const { data: ensName, isSuccess } = useEnsName({address: address});
  const citedAddress = full ? address : truncateAddress(address);
  const calm = {disableNicknames: true}; // useCalm();

  return (
    <span
      title={(calm.disableNicknames && isSuccess) ? (ensName || "") : undefined}
      {...props}
    >
      {!calm.disableNicknames && showAlias ? (
        <span title={citedAddress}>{ensName}</span>
      ) : (
        <span title={address}>{citedAddress}</span>
      )}
    </span>
  );
}
