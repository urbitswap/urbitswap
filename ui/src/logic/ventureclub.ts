import type { VentureTransfer } from '@/types/app';
import type { Address } from 'viem';

export async function requestVentureTransfer(
  toWallet: Address,
  contract: Address,
  nftId: string,
): Promise<VentureTransfer> {
  return {
    state: "success",
    callId: "",
    signature: "",
    nonce: "",
    expiryBlock: "",
  };
}
