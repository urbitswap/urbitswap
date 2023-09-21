import { CONTRACT } from '@/constants';
import { Blockchain } from '@rarible/api-client';
import {
  toContractAddress,
  toItemId,
  toOrderId,
  toUnionAddress,
} from '@rarible/types';
import type {
  RequestCurrency as RaribleCurrency,
} from '@rarible/sdk';
import type {
  Asset as RaribleAsset,
  AssetType as RaribleAssetType,
  Order as RaribleOrder,
  Ownership as RaribleOwnership,
} from '@rarible/api-client';
import type { Tender } from '@/types/app';

export function tenderToCurrency(tender: Tender): RaribleCurrency {
  return tender === "eth"
    ? {"@type": "ETH", "blockchain": Blockchain.ETHEREUM}
    : {"@type": "ERC20", "contract": toContractAddress(CONTRACT.USDC)};
}

export function makePrettyPrice(asset: RaribleAsset): string {
  return asset.value.toString() + " " + (
    (asset.type["@type"] === "ERC20" && asset.type.contract === CONTRACT.USDC)
      ? "USDC"
      : asset.type["@type"]
  );
}

export function getOwnerAddress(owner: RaribleOwnership): string {
  return owner.owner.replace(/^.+:/g, "").toLowerCase();
}
