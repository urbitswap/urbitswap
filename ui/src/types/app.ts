import React from 'react';
import { TagIcon } from '@heroicons/react/24/solid';
import { QUERY } from '@/constants';
import { ItemsSearchSort as RaribleItemSort } from '@rarible/api-client';
import type {
  Item as RaribleItem,
  Order as RaribleOrder,
  Ownership as RaribleOwnership,
} from '@rarible/api-client';
import type { GetAccountResult } from '@wagmi/core';
import type { Address } from 'viem';

export type TenderType = "eth" | "usdc";
export type OfferType = "bid" | "sell";
export type CollectionBase = typeof QUERY.COLLECTION_BASE[number];
export type CollectionSort = Exclude<RaribleItemSort, RaribleItemSort.TRAIT | RaribleItemSort.LOWEST_SELL>;
export type CollectionBaseish = CollectionBase | "";
export type CollectionSortish = CollectionSort | "";

export type UrbitLayer = "locked" | "layer-2" | "layer-1";
export type UrbitPointType = typeof QUERY.POINT_TYPE[number];
export type UrbitPointTypeish = UrbitPointType | "";

export type GetWagmiAccountResult = Omit<GetAccountResult, "address"> & {
  address: Address;
};

export interface DeferredRender<T = null, P = {}> {
  render: React.ForwardRefRenderFunction<T, P>;
  props?: P;
}

export interface NavigationQuery {
  base?: CollectionBase;
  text?: string;
  sort?: CollectionSort;
}

export interface IconLabel<IdType extends string = string> {
  id: IdType;
  name: string;
  icon: typeof TagIcon;
}

export interface KYCData {
  kyc: boolean;
  details?: string;
  noauth?: boolean;
}

export type TransferData = TransferDenial | TransferGrant;
export interface TransferDenial {
  status: "failed";
  details: string;
}
export interface TransferGrant {
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
  offer: RaribleOrder | undefined;
  myItems: RaribleItem[] | undefined;
  isMyItem: boolean;
  isAddressItem: boolean;
}
