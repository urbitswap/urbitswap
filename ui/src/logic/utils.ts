import React, {createElement} from 'react';
import cn from 'classnames';
import { format, formatDistance } from 'date-fns';
import seedrandom from 'seedrandom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  GlobeAltIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  ViewfinderCircleIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import { APP_DBUG, APP_VERSION, MAX_DATE, CONTRACT, QUERY } from '@/constants';
import {
    Blockchain as RaribleBlockchain,
    ItemsSearchSort as RaribleItemSort,
} from '@rarible/api-client';
import { toContractAddress } from '@rarible/types';
import type {
  RequestCurrency as RaribleCurrency,
} from '@rarible/sdk';
import type {
  Asset as RaribleAsset,
  AssetType as RaribleAssetType,
  Item as RaribleItem,
  Meta as RaribleItemMeta,
  CollectionMeta as RaribleCollectionMeta,
  MetaContent as RaribleMetaContent,
  MetaAttribute as RaribleMetaAttrib,
  Order as RaribleOrder,
  Ownership as RaribleOwnership,
} from '@rarible/api-client';
import type {
  CollectionBaseish,
  CollectionSort,
  CollectionSortish,
  UrbitPointTypeish,
  TenderType,
  OfferType,
  NavigationQuery,
  IconLabel,
} from '@/types/app';
import type { Callable } from '@/types/utils';

export const COLLECTIONBASE_ICONS: IconLabel<CollectionBaseish>[] = [
  {id: "", name: "Full Collection", icon: ViewfinderCircleIcon},
  {id: "mine", name: "Owned Asset", icon: WalletIcon},
  {id: "bids", name: "Bid Asset", icon: TagIcon},
];
export const COLLECTIONBASE_ICON_MAP: Record<CollectionBaseish, IconLabel> = COLLECTIONBASE_ICONS.reduce(
  (a, i) => {a[i.id] = i; return a;},
  ({} as Record<CollectionBaseish, IconLabel>),
);
export const COLLECTIONSORT_ICONS: IconLabel<CollectionSortish>[] = [{
    id: ""/*RaribleItemSort.LOWEST_SELL*/,
    name: "Ask Price Descending",
    icon: genSortIcon(CurrencyDollarIcon, false)
  }, {
    id: RaribleItemSort.HIGHEST_SELL,
    name: "Ask Price Ascending",
    icon: genSortIcon(CurrencyDollarIcon, true)
  }, {
    id: RaribleItemSort.HIGHEST_BID,
    name: "Bid Price Descending",
    icon: genSortIcon(TagIcon, false),
  }, {
    id: RaribleItemSort.LOWEST_BID,
    name: "Bid Price Ascending",
    icon: genSortIcon(TagIcon, true),
  }, {
    id: RaribleItemSort.LATEST,
    name: "NFT Age Ascending",
    icon: genSortIcon(ClockIcon, true),
  }, {
    id: RaribleItemSort.EARLIEST,
    name: "NFT Age Decending",
    icon: genSortIcon(ClockIcon, false),
  },
];
export const COLLECTIONSORT_ICON_MAP: Record<CollectionSortish, IconLabel> = COLLECTIONSORT_ICONS.reduce(
  (a, i) => {a[i.id] = i; return a;},
  ({} as Record<CollectionSortish, IconLabel>),
);
export const URBITPOINT_ICONS: IconLabel<UrbitPointTypeish>[] = [
  {id: "", name: "Point Type", icon: FunnelIcon},
  {id: "galaxy", name: "Galaxy", icon: SparklesIcon},
  {id: "star", name: "Star", icon: StarIcon},
  {id: "planet", name: "Planet", icon: GlobeAltIcon},
];
export const URBITPOINT_ICON_MAP: Record<UrbitPointTypeish, IconLabel> = URBITPOINT_ICONS.reduce(
  (a, i) => {a[i.id] = i; return a;},
  ({} as Record<UrbitPointTypeish, IconLabel>),
);

export function capitalize(word: string): string {
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

export function genRateLimiter(maxReqs: number, perSecs: number) {
  let frameStart: number = 0;
  let frameCount: number = 0;
  let frameQueue: Callable[] = [];
  let untilNext: number = 0;

  // https://stackoverflow.com/a/33946793
  return function limiter(func: Callable) {
    func && frameQueue.push(func);
    untilNext = perSecs * 1000 - (Date.now() - frameStart);
    if (untilNext <= 0) {
      frameStart = Date.now();
      frameCount = 0;
    }
    if (++frameCount <= maxReqs) {
      (frameQueue.shift() ?? (() => null))();
    } else {
      APP_DBUG && func &&
        console.log(`deferring ${func.name} for ${untilNext/ 1000}s`);
      setTimeout(limiter, untilNext);
    }
  };
}

export function tenderToAsset(tender: TenderType): RaribleAssetType {
  return tender === "eth"
    ? {"@type": "ETH", "blockchain": RaribleBlockchain.ETHEREUM}
    : {"@type": "ERC20", "contract": toContractAddress(CONTRACT.USDC)};
}

export function assetToTender(asset: RaribleAssetType): TenderType {
  return (asset["@type"] === "ERC20" && asset.contract === CONTRACT.USDC)
    ? "usdc"
    : "eth";
}

export function extractMetaImage(
  meta: RaribleItemMeta | RaribleCollectionMeta | undefined,
  text: string | undefined,
): string {
  const metaImageUrl: string | undefined = (meta?.content.find(
    (e: RaribleMetaContent) => e["@type"] === "IMAGE"
  ) ?? {})?.url;

  if (metaImageUrl) {
    return metaImageUrl;
  } else {
    const imageText: string = text ?? meta?.name ?? "";
    const imageColorBG: number = Math.floor(seedrandom(imageText)() * (0xFFFFFF - 0x0 + 1) + 0x0);
    const imageColorFG: number = ((num: number) => {
      num >>>= 0;
      const b = num & 0xFF, g = (num & 0xFF00) >>> 8, r = (num & 0xFF0000) >>> 16;
      return (0xFF - b) << 0 | (0xFF - g) << 8 | (0xFF - r) << 16;
    })(imageColorBG);

    return `https://placehold.co/400/${
      [imageColorBG, imageColorFG].map(c => c.toString(16).padStart(6, "0")).join("/")
    }/png?text=${
      encodeURIComponent(imageText)
    }`;
  }
}

export function makePrettyName(item: RaribleItem): string {
  return item.meta?.name ?? "<Unknown>";
}

export function makePrettyPrice(asset: RaribleAsset): string {
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

export function encodeQuery(query: NavigationQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query?.base) {
    params.set("base", encodeURIComponent(query.base));
  } if (query?.text) {
    params.set("text", encodeURIComponent(query.text));
  } if (query?.sort) {
    params.set("sort", encodeURIComponent(query.sort));
  }

  return params;
}

export function decodeQuery(query: URLSearchParams): NavigationQuery {
  return {
    base: QUERY.COLLECTION_BASE.find(s => s === decodeURIComponent(query.get("base") ?? "")),
    text: decodeURIComponent(query.get("text") ?? "") || undefined,
    sort: Object.values(RaribleItemSort).find(
      s => s === decodeURIComponent(query.get("sort") ?? "")
    ) as CollectionSort | undefined,
  };
}

export function getVersionTuple(version: string): number[] {
  const versionArray: number[] = version.split(".").map((vis: string) => {
    const vii: number = parseInt(vis, 10);
    return isNaN(vii) ? -1 : vii;
  });
  return versionArray
    .concat(new Array(Math.max(0, 3 - versionArray.length)).fill(-1))
    .slice(0, 3);
}

export function getVersionCompatibility(version: string): number {
  const appVersion: number[] = getVersionTuple(APP_VERSION);
  const argVersion: number[] = getVersionTuple(version);

  return (appVersion.some(v => v < 0) || argVersion.some(v => v < 0))
    ? -1
    : appVersion.reduce((a, v, i) => (
      (i === (a + 1) && v === argVersion[i]) ? i : a
    ), -1);
}

export function getItemUnlock(item: RaribleItem): Date {
  const itemUnlockAttrib: string | undefined = (item.meta?.attributes ?? []).find(
    (m: RaribleMetaAttrib) => m.key.match(/[uU]nlock/)
  )?.value;
  return (itemUnlockAttrib === undefined)
    ? MAX_DATE
    : new Date(Date.parse(itemUnlockAttrib));
}

function genSortIcon(SortTypeIcon: typeof TagIcon, isAscending: boolean): typeof TagIcon {
  // @ts-ignore
  return ({className, ...props}) => {
    return createElement("div", {className: "relative"},
      createElement(
        isAscending ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
        {className, ...props}
      ),
      createElement(
        SortTypeIcon,
        {className: cn("w-3 h-3 absolute -bottom-0.5 -left-0.5"), ...props}
      ),
    );
  };
}
