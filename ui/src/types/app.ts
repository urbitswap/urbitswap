import type {
  Item as RaribleItem,
  Order as RaribleOrder,
  Ownership as RaribleOwnership,
} from '@rarible/api-client';

export type TenderType = "eth" | "usdc";
export type OfferType = "bid" | "sell";

export interface RaribleContinuation {
  continuation?: string;
}

export interface RouteRaribleItem {
  item: RaribleItem | undefined;
  owners: RaribleOwnership[] | undefined;
  bids: RaribleOrder[] | undefined;
}
