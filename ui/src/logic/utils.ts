import { format, formatDistance } from 'date-fns';
import { MAX_DATE, CONTRACT } from '@/constants';
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
  Item as RaribleItem,
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

export function makePrettyName(item: RaribleItem, terse: boolean = false): string {
  return (item.meta?.name ?? "<Unknown>")
    .replace("with warrant", terse ? "(W)" : "(with warrant)");
}

export function makePrettyPrice(asset: RaribleAsset): string {
  // const isUSDC: boolean = assetToTender(asset.type) === "usdc";
  // const assetIdent = isUSDC
  //   ? "USDC"
  //   : asset.type["@type"];
  // const assetValue = isUSDC
  //   ? parseFloat(asset.value.toString()).toFixed(2)
  //   : asset.value.toString();
  // return `${assetValue} ${assetIdent}`;
  const assetValue = asset.value.toString();
  const assetIdent = (assetToTender(asset.type) === "usdc")
    ? "USDC"
    : asset.type["@type"];
  return `${assetValue} ${assetIdent}`;
}

export function isMaxDate(date: Date): boolean {
  return date.getTime() === MAX_DATE.getTime();
}

export function makeTerseDate(date: Date): string {
  return format(date, 'yy/MM/dd');
}

export function makeTerseDateAndTime(date: Date): string {
  return format(date, 'yy/MM/dd HH:mm');
}

export function makePrettyLapse(date: Date): string {
  return formatDistance(date, Date.now(), {addSuffix: true})
    .replace(/ a /, ' 1 ')
    .replace(/less than /, '<')
    .replace(/about /, '~')
    .replace(/almost /, '<~')
    .replace(/over /, '>~');
}

export function makeTerseLapse(date: Date): string {
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
