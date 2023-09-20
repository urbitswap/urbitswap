import { CONTRACT } from '@/constants';
import type {
  Asset as RaribleAsset,
  AssetType as RaribleAssetType,
  Order as RaribleOrder,
} from '@rarible/api-client';

export function makePrettyPrice(asset: RaribleAsset): string {
  return asset.value.toString() + " " + (
    (asset.type["@type"] === "ERC20" && asset.type.contract === CONTRACT.USDC)
      ? "USDC"
      : asset.type["@type"]
  );
}
