import type {
  Item as RaribleItem,
  Order as RaribleOrder,
  Ownership as RaribleOwnership,
} from '@rarible/api-client';
import type { GetAccountResult } from '@wagmi/core';
import type { Address } from 'viem';

export type TenderType = "eth" | "usdc";
export type OfferType = "bid" | "sell";

export interface UrbitTraders {
  [wallet: string]: string;  // wallet -> @p
}

export interface RaribleContinuation {
  continuation?: string;
}

export interface RouteRaribleItem {
  item: RaribleItem | undefined;
  owner: Address | undefined;
  bids: RaribleOrder[] | undefined;
}

export type GetWagmiAccountResult = Omit<GetAccountResult, "address"> & {
  address: Address;
};

export interface RouteRaribleAccountItem extends RouteRaribleItem, GetWagmiAccountResult {
  mine: boolean;
  offer: RaribleOrder | undefined;
}
