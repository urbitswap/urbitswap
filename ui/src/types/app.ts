import { QUERY } from '@/constants';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
  Ownership as RaribleOwnership,
} from '@rarible/api-client';
import type { GetAccountResult } from '@wagmi/core';
import type { Address } from 'viem';

export type TenderType = "eth" | "usdc";
export type OfferType = "bid" | "sell";
export type UrbitLayer = "locked" | "layer-2" | "layer-1";
export type CollectionBase = typeof QUERY.COLLECTION_BASE[number];
export type UrbitPointType = typeof QUERY.POINT_TYPE[number];
export type GetWagmiAccountResult = Omit<GetAccountResult, "address"> & {
  address: Address;
};

export interface NavigationQuery {
  base?: CollectionBase;
  type?: UrbitPointType;
  name?: string;
}

export interface VentureKYC {
  kyc: boolean;
  details?: string;
}

export type VentureTransfer = VentureTransferDenial | VentureTransferGrant;
export interface VentureTransferDenial {
  status: "failed";
  details: string;
}
export interface VentureTransferGrant {
  status: "success";
  callId: string;
  signature: string;
  nonce: string;
  expiryBlock: string;
}

export interface UrbitTraders {
  [wallet: string]: string;  // wallet -> @p
}

export interface UrbitAssoc {
  address: Address;
  signature: string;
}

export interface RaribleContinuation {
  continuation?: string;
}

export interface RouteRaribleItem {
  item: RaribleItem | undefined;
  owner: Address | undefined;
  bids: RaribleOrder[] | undefined;
}

export interface RouteRaribleAccountItem extends RouteRaribleItem, GetWagmiAccountResult {
  mine: boolean;
  offer: RaribleOrder | undefined;
}
