import React, { useMemo, useEffect, useCallback } from 'react';
import cn from 'classnames';
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import useRaribleSDK from '@/logic/useRaribleSDK';
import TraderName from '@/components/TraderName';
import ItemBadges from '@/components/ItemBadges';
import {
  useUrbitTraders,
  useUrbitAccountAddresses,
  useRaribleCollection,
  useRaribleAccountItems,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
} from '@/state/app';
import { useModalNavigate, useChatNavigate } from '@/logic/routing';
import {
  isMaxDate,
  makePrettyName,
  makePrettyPrice,
  makePrettyLapse,
  encodeQuery,
  decodeQuery,
} from '@/logic/utils';
import {
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/solid';
import UrbitsExchangeIcon from '@/components/icons/UrbitsExchangeIcon';
import ErrorIcon from '@/components/icons/ErrorIcon';
import { APP_TERM, CONTRACT } from '@/constants';
import {
  ItemsSearchSort as RaribleItemsSort,
  OrderStatus as RaribleOrderStatus,
} from '@rarible/api-client';
import type {
  CollectionId as RaribleCollectionId,
  Item as RaribleItem,
  Order as RaribleOrder,
  MetaContent as RaribleMetaContent,
  MetaAttribute as RaribleMetaAttrib,
  EthErc721AssetType as RaribleERC721,
  EthErc721LazyAssetType as RaribleERC721Lazy,
} from '@rarible/api-client';
import { ItemId as RaribleItemId } from "@rarible/types";
import type { Address } from 'viem';
import type { OfferType } from '@/types/app';
import type { ClassProps } from '@/types/urbui';

export function CollectionGrid({className}: ClassProps) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // const collection = useRaribleCollection();

  const addresses = useUrbitAccountAddresses();
  const rsdk = useRaribleSDK();
  const query = decodeQuery(params);
  // https://tanstack.com/query/v4/docs/react/examples/react/load-more-infinite-scroll
  const { ref, inView } = useInView();
  const {
    status,
    data,
    error,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    // TODO: Need to include address list in the query (or at least invalidate
    // relevant queries when new personal addresses are added).
    [APP_TERM, "rarible", "pcollection", query?.base, query?.name, query?.type],
    async ({ pageParam = undefined }) => {
      if (query?.base === "mine") {
        // TODO: Need to further filter by name and traits
        // TODO: Need to get items for all addresses (ideally sequentially;
        // will require some finessing with continuations)
        const res = await rsdk.apis.item.getItemsByOwner({
          owner: `ETHEREUM:${(addresses ?? [])[0]}`,
          continuation: pageParam,
        });
        return {
          prevCursor: undefined,
          nextCursor: res.continuation,
          data: res.items.filter((item) => item.collection === CONTRACT.AZIMUTH),
        };
      } else if (query?.base === "bids") {
        // TODO: Need to further filter by name and traits
        const res = await rsdk.apis.order.getOrderBidsByMaker({
          maker: addresses!.map((address) => `ETHEREUM:${address}`),
          status: [RaribleOrderStatus.ACTIVE],
          continuation: pageParam,
        });
        const res2 = await rsdk.apis.item.getItemByIds({
          itemIds: { ids: res.orders
            .filter((o) => (
              (o.take.type["@type"] === "ERC721" || o.take.type["@type"] === "ERC721_Lazy")
              && o.take.type.contract === CONTRACT.AZIMUTH
            ))
            .map((o: RaribleOrder) => (o.take.type as RaribleERC721 | RaribleERC721Lazy))
            .map((t) => `${CONTRACT.AZIMUTH}:${t.tokenId}` as RaribleItemId)
          },
        });
        return {
          prevCursor: undefined,
          nextCursor: res.continuation,
          data: res2.items,
        };
      } else { /* fall back to "all" */
        const res = await rsdk.apis.item.searchItems({ itemsSearchRequest: {
          size: 20,
          sort: RaribleItemsSort.LOWEST_SELL,
          continuation: pageParam,
          filter: {
            collections: ([CONTRACT.AZIMUTH] as RaribleCollectionId[]),
            deleted: false,
            names: query?.name ? [query?.name] : undefined,
            traits: query?.type ? [{key: "size", value: query?.type}] : undefined,
            // sellPriceFrom: (queryBase !== "active") ? undefined : Number.MIN_VALUE,
            // sellPriceTo: (queryBase !== "active") ? undefined : Number.MAX_VALUE,
            // sellCurrency?: string;
            // bidPriceFrom: (queryBase !== "active") ? undefined : Number.MIN_VALUE,
            // bidPriceTo: (queryBase !== "active") ? undefined : Number.MAX_VALUE,
            // bidCurrency?: string;
            // bidPlatforms?: Array<Platform>;
          },
        }});
        // FIXME: This causes the first and last pages to use the same ID value
        // (i.e. undefined), which can cause issues in React.
        return {
          prevCursor: undefined,
          nextCursor: res.continuation,
          data: res.items,
        };
      }
    },
    {
      enabled: !!addresses,
      getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      // NOTE: Don't reload on every mount because we keep everything that's
      // been loaded and this could cause a lot of reloads
      staleTime: 2 * 60 * 1000,
    },
  );

  useEffect(() => {
    inView && fetchNextPage();
  }, [inView]);

  return (
    <div className={cn(
      "flex flex-col items-center",
      className,
    )}>
      {(status === "loading") ? (
        <LoadingIcon />
      ) : (status === "error") ? (
        <FailureIcon />
      ) : (
        <React.Fragment>
          <div className={`
            grid w-full h-fit grid-cols-2 gap-4 px-4
            justify-center sm:grid-cols-[repeat(auto-fit,minmax(auto,200px))]
          `}>
            {data.pages.map((page) => (
              <React.Fragment key={page.nextCursor}>
                {page.data.map((item: RaribleItem) => (
                  <div
                    key={item.tokenId}
                    role="link"
                    className={cn(
                      "flex flex-col justify-between p-2 gap-2 rounded-lg border-2",
                      "border-gray-200 hover:border-gray-800",
                    )}
                    onClick={() => navigate(`/item/${item.tokenId}`)}
                  >
                    <h3 className="text-lg text-center font-semibold line-clamp-1">
                      {makePrettyName(item)}
                    </h3>
                    <img className="object-cover rounded-lg w-32 mx-auto" src={
                      (item.meta?.content.find((entry: RaribleMetaContent) => (
                        entry["@type"] === "IMAGE"
                      )) ?? {})?.url
                    } />
                    <ItemBadges item={item} badgeClassName="w-5 h-5" />
                    <div className="grid grid-cols-2 text-sm text-center">
                      <div>
                        <p className="font-bold">Live Ask</p>
                        <p>
                          {(item?.bestSellOrder === undefined) ? (
                            "—"
                          ) : (
                            makePrettyPrice(item.bestSellOrder.take)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold">Best Bid</p>
                        <p>
                          {(item?.bestBidOrder === undefined) ? (
                            "—"
                          ) : (
                            makePrettyPrice(item.bestBidOrder.make)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          <EllipsisHorizontalIcon ref={ref} className={cn(
            "animate-ping mt-6 h-8 w-8",
            (isFetching || isFetchingNextPage) ? "visible" : "invisible"
          )} />
        </React.Fragment>
      )}
    </div>
  );
}

export function ItemPage({className}: ClassProps) {
  const location = useLocation();
  const modalNavigate = useModalNavigate();
  const chatNavigate = useChatNavigate();
  const {
    item, owner, bids, mine, offer,
    address, isConnected,
  } = useRouteRaribleAccountItem();
  const traders = useUrbitTraders();

  // NOTE: `isMyItem` differs from `mine` in that the former is relative to
  // all user accounts/wallets while the latter is only active relative to
  // the currently active wallet
  const myItems = useRaribleAccountItems();
  const isMyItem = (myItems ?? []).some((i: RaribleItem) => i.id === item?.id);

  const ownerUrbitId = useMemo(() => (
    (traders ?? {})[owner ?? ""]
  ), [owner, traders]);

  const ItemOffer = useCallback(({
      order,
      offerType,
      disabled,
    } : {
      order: RaribleOrder;
      offerType: OfferType;
      disabled: boolean;
    }) => (
      <div className={cn(
        "grid grid-cols-4 gap-2 items-center",
        "border border-gray-800 rounded-lg p-2",
      )}>
        <div className="truncate" children={makePrettyPrice(
          (offerType === "sell") ? order.take : order.make
        )} />
        <TraderName address={
          (order.maker.replace(/^.+:/g, "") as Address)
        } />
        <div children={isMaxDate(new Date(order?.endedAt || ""))
          ? "never"
          : makePrettyLapse(new Date(order?.endedAt || ""))
        } />
        <button className="button"
          onClick={() => modalNavigate("pretrade", {
            state: {backgroundLocation: location, thenTo: `trade/${order?.id}`}
          })}
          disabled={!isConnected || disabled}
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          &nbsp;{"Trade"}
        </button>
      </div>
  ), [isConnected, modalNavigate, location]);

  return (
    <div className={cn(className)}>
      {(item === undefined) ? (
        <LoadingIcon />
      ) : (
        <div className="grid grid-cols-1 grid-flow-dense gap-x-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-bold underline">
              {makePrettyName(item)}
            </h2>
            <h3 className="flex flex-row text-md">
              <span className="font-semibold">Owner:</span>&nbsp;
              {owner && (
                <TraderName address={owner} />
              )}
            </h3>
            {/* TODO: Value should be derived from recent sales and all
            active asks/bids.
            <h3 className="text-md">
              <span className="font-semibold">Value:</span>
              &nbsp;{"TODO"}
            </h3>
            */}
            {/*
            <hr className="my-2" />
            <div className="text-sm">
              {(item.meta?.attributes ?? []).map((attrib: RaribleMetaAttrib) => (
                <p key={attrib.key}>
                  <span className="font-semibold italic">
                    {attrib?.key || "<unknown>"}:
                  </span>&nbsp;
                  {attrib?.value || "<unknown>"}
                </p>
              ))}
            </div>
            */}
            <hr className="my-2" />
            <h4 className="text-md font-bold underline">
              Active Ask(s)
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {(item.bestSellOrder === undefined) ? (
                <p>—</p>
              ) : (
                <ItemOffer
                  order={item.bestSellOrder}
                  offerType="sell"
                  disabled={mine}
                />
              )}
            </div>
            <h4 className="text-md font-bold underline">
              Active Bid(s)
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {/* TODO: Sort highest to lowest price (converted to USD) */}
              {((bids ?? []).length === 0) ? (
                <p>—</p>
              ) : ((bids ?? []).map((bid: RaribleOrder) => (
                <ItemOffer
                  key={bid.id}
                  order={bid}
                  offerType="bid"
                  disabled={!mine}
                />
              )))}
            </div>
          </div>
          <div className="sm:row-span-1 flex flex-col gap-4 items-center">
            <img className={cn(
              "object-contain aspect-square rounded-lg border-2 border-gray-800",
            )} src={
              (item.meta?.content.find((entry: RaribleMetaContent) => (
                entry["@type"] === "IMAGE"
              )) ?? {})?.url
            } />
            <ItemBadges item={item} badgeClassName="w-6 h-6" />
            <button className="w-full button"
              onClick={() => modalNavigate("pretrade", {
                state: {backgroundLocation: location, thenTo: "offer"}
              })}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              &nbsp;{`${(offer !== undefined) ? "Update" : "Post"}
                ${isMyItem ? "Ask" : "Bid"}
              `}
            </button>
            {(offer !== undefined) && (
              <button className="w-full button"
                onClick={() => modalNavigate("pretrade", {
                  state: {backgroundLocation: location, thenTo: "cancel"}
                })}
              >
                <XCircleIcon className="w-4 h-4" />
                &nbsp;{`Rescind ${isMyItem ? "Ask" : "Bid"}`}
              </button>
            )}
            {!isMyItem && (
              <button className="w-full button"
                disabled={ownerUrbitId === undefined}
                onClick={() => (
                  (ownerUrbitId !== undefined) && chatNavigate(ownerUrbitId)
                )}
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                &nbsp;{"Message Owner"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingIcon() {
  // FIXME: The height value given here is a hack that assumes working in the
  // main content area under the navbar and obviously won't work in all
  // embedding contexts.
  return (
    <div className="flex flex-col justify-center items-center h-[75vh]">
      <UrbitsExchangeIcon className="animate-spin w-32 h-32" />
    </div>
  );
}

function FailureIcon() {
  // FIXME: The height value given here is a hack that assumes working in the
  // main content area under the navbar and obviously won't work in all
  // embedding contexts.
  return (
    <div className="flex flex-col justify-center items-center h-[75vh]">
      <ErrorIcon className="text-red-500 w-32 h-32" />
    </div>
  );
}
