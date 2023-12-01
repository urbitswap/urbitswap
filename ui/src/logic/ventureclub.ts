import { add as offsetDate } from 'date-fns';
import axios from 'axios';
import type { VentureKYC, VentureTransfer } from '@/types/app';
import type { Address } from 'viem';
import type { Item as RaribleItem, Meta as RaribleItemMeta } from '@rarible/api-client';

export async function requestVentureKYC(
  wallet: Address,
): Promise<VentureKYC> {
  return axios.request({
    method: "get",
    baseURL: "https://app.ventureclub.club/",
    url: "/.netlify/functions/get-kyc",
    params: {
      wallets: wallet
    },
  });
}

export async function requestVentureTransfer(
  toWallet: Address,
  contract: Address,
  tokenId: string,
): Promise<VentureTransfer> {
  // TODO: Replace with real VCC validation query.
  const unlockDate = getVentureFakeUnlock(tokenId);
  const isUSWallet = !(/^-?\d+$/.test(toWallet?.[2]));

  if (toWallet === "0x") {
    return {
      status: "failed",
      details: "Can't transfer to a non-KYC'd wallet.",
    };
  } else if (isUSWallet && unlockDate > new Date(Date.now())) {
    return {
      status: "failed",
      details: "Can't transfer to a US-based wallet before end of lockup period.",
    };
  } else {
    return {
      status: "success",
      callId: "",
      signature: "",
      nonce: "",
      expiryBlock: "",
    };
  }
}

// TODO: Remove this function once VCC unlock periods are advertised explicitly
// in the ETH NFT attributes.
export function addVentureAttribs(item: RaribleItem): RaribleItem {
  return {
    ...item,
    meta: ({
      ...(item.meta ?? {}),
      attributes: (item.meta?.attributes ?? []).concat([{
        key: "Unlock Date",
        value: getVentureFakeUnlock(item.tokenId).toISOString(),
      }]),
    } as RaribleItemMeta),
  };
}

// TODO: Remove this function once VCC unlock periods are advertised explicitly
// in the ETH NFT attributes.
function getVentureFakeUnlock(tokenId: string | undefined): Date {
  const itemId: number = Number(tokenId ?? 0);
  const itemOffset: number = (itemId + 1) * ((itemId % 2 == 0) ? -1 : 1);
  return offsetDate(Date.now(), {days: itemOffset});
}
