import { format, formatDistance } from 'date-fns';
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
import type { TenderType, OfferType } from '@/types/app';

export function tenderToAsset(tender: TenderType): RaribleAssetType {
  return tender === "eth"
    ? {"@type": "ETH", "blockchain": Blockchain.ETHEREUM}
    : {"@type": "ERC20", "contract": toContractAddress(CONTRACT.USDC)};
}

export function assetToTender(asset: RaribleAssetType): TenderType {
  return (asset["@type"] === "ERC20" && asset.contract === CONTRACT.USDC)
    ? "usdc"
    : "eth";
}

export function makePrettyPrice(asset: RaribleAsset): string {
  const assetValue = asset.value.toString();
  const assetIdent = (assetToTender(asset.type) === "usdc") ? "USDC" : asset.type["@type"];
  return `${assetValue} ${assetIdent}`;
}

export function getOfferAsset(order: RaribleOrder, otype: OfferType): RaribleAsset {
  return otype === "sell" ? order.take : order.make;
}

export function getOwnerAddress(owner: RaribleOwnership): string {
  return owner.owner.replace(/^.+:/g, "").toLowerCase();
}

export function makeTerseDate(date: Date) {
  return format(date, 'yy/MM/dd');
}

export function makeTerseDateAndTime(date: Date) {
  return format(date, 'yy/MM/dd HH:mm');
}

export function makePrettyLapse(date: Date) {
  return formatDistance(date, Date.now(), {addSuffix: true})
    .replace(/ a /, ' 1 ')
    .replace(/less than /, '<')
    .replace(/about /, '~')
    .replace(/almost /, '<~')
    .replace(/over /, '>~');
}

export function makeTerseLapse(date: Date) {
  return formatDistance(date, Date.now(), {addSuffix: true})
    .replace(/ a /, ' 1 ')
    .replace(/less than /, '<')
    .replace(/about /, '~')
    .replace(/almost /, '<~')
    .replace(/over /, '>~')
    .replace(/ /, '').replace(/ago/, '')
    .replace(/minute(s)?/, 'm')
    .replace(/hour(s)?/, 'h')
    .replace(/day(s)?/, 'D')
    .replace(/month(s)?/, 'M')
    .replace(/year(s)?/, 'Y');
}
