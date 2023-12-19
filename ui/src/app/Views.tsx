import React, { useMemo, useEffect, useCallback } from 'react';
import cn from 'classnames';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import useRaribleSDK from '@/logic/useRaribleSDK';
import TraderName from '@/components/TraderName';
import ItemBadges from '@/components/ItemBadges';
import {
  useUrbitTraders,
  useUrbitAccountAllAddresses,
  useRaribleAccountItems,
  useRaribleAccountBids,
  useRouteRaribleItem,
  useRouteRaribleAccountItem,
} from '@/state/app';
import { useModalNavigate, useChatNavigate } from '@/logic/routing';
import {
  extractMetaImage,
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
import UrbitswapIcon from '@/components/icons/UrbitswapIcon';
import ErrorIcon from '@/components/icons/ErrorIcon';
import { APP_DBUG, APP_TERM, FEATURED } from '@/constants';
import {
  Blockchain,
  ItemsSearchSort as RaribleItemsSort,
  OrderStatus as RaribleOrderStatus,
} from '@rarible/api-client';
import type {
  Collection as RaribleCollection,
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

  const rsdk = useRaribleSDK();
  const query = decodeQuery(params);
  // https://tanstack.com/query/v4/docs/react/examples/react/load-more-infinite-scroll
  const { ref, inView } = useInView();
  const {
    status,
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    [APP_TERM, "rarible", "collections", query?.text],
    async ({ pageParam = undefined }) => {
      if (!query?.text) {
        const pageResults = await Promise.all(Object.entries(FEATURED).sort().map(
          ([_, collId]) => rsdk.apis.collection.getCollectionById({collection: collId})
        ));
        return {
          last: true,
          next: undefined,
          data: pageResults,
        };
      } else {
        const pageResults = await rsdk.apis.collection.searchCollection({
          collectionsSearchRequest: {
            filter: {text: query?.text, blockchains: [Blockchain.ETHEREUM]},
            size: 20,
            continuation: pageParam,
          },
        });
        return {
          last: (pageResults.collections.length < 20) || (pageResults.continuation === undefined),
          next: pageResults.continuation,
          data: pageResults.collections,
        };
      }
    },
    {
      getPreviousPageParam: (firstPage) => undefined,
      getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.next,
      // NOTE: This will update extremely infrequently, so we don't even bother
      // refetching the data.
      retryOnMount: false,
      refetchOnMount: false,
    },
  );

  // FIXME: This should only prompt 1 reload instead of the 2-3 that it
  // prompts now.
  useEffect(() => {
    inView && !(isFetching || isFetchingNextPage) && fetchNextPage();
  }, [inView, isFetching, isFetchingNextPage]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {(status === "loading") ? (
        <LoadingIcon />
      ) : (status === "error") ? (
        <FailureIcon />
      ) : (
        <React.Fragment>
          {!query?.text && (
            <h1 className="text-2xl text-center font-bold underline pb-4">
              Featured Collections
            </h1>
          )}
          <div className={`
            grid w-full h-fit grid-cols-2 gap-4 px-4
            justify-center sm:grid-cols-[repeat(auto-fit,minmax(auto,200px))]
          `}>
            {data.pages.map((page, index) => (
              <React.Fragment key={index}>
                {page.data.map((collection: RaribleCollection) => (
                  <div
                    key={collection.id}
                    role="link"
                    className={cn(
                      "flex flex-col justify-between p-2 gap-2 rounded-lg border-2",
                      "border-gray-200 hover:border-gray-800",
                    )}
                    onClick={() => navigate(`/${collection.id}`)}
                  >
                    <h3 className="text-lg text-center font-semibold line-clamp-1">
                      {collection.name}
                    </h3>
                    <MetaIcon src={collection} className="w-32" />
                    <div className="grid grid-cols-2 text-sm text-center">
                      {/*<div>
                        <p className="font-bold">Floor Price</p>
                        <p>
                          {(collection?.statistics?.floorPrice === undefined) ? (
                            "—"
                          ) : (
                            collection?.statistics?.floorPrice
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold">Total Volume</p>
                        <p>
                          {(collection?.statistics?.totalVolume === undefined) ? (
                            "—"
                          ) : (
                            collection?.statistics?.totalVolume
                          )}
                        </p>
                      </div>*/}
                      <div>
                        <p className="font-bold">Symbol</p>
                        <p>{collection.symbol}</p>
                      </div>
                      <div>
                        <p className="font-bold">Chain</p>
                        <p>{collection.blockchain}</p>
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

export function ItemGrid({className}: ClassProps) {
  const navigate = useNavigate();
  const { collId } = useParams();
  const [params, setParams] = useSearchParams();

  const addresses = useUrbitAccountAllAddresses();
  const myItems = useRaribleAccountItems();
  const myBids = useRaribleAccountBids();
  const rsdk = useRaribleSDK();
  const query = decodeQuery(params);
  // https://tanstack.com/query/v4/docs/react/examples/react/load-more-infinite-scroll
  const { ref, inView } = useInView();
  const {
    status,
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    // TODO: Need to include address list in the query (or at least invalidate
    // relevant queries when new personal addresses are added).
    [
      APP_TERM, "rarible", "collection", collId, "items", "paged",
      query?.base, query?.text,
      (query?.base === undefined) ? query?.sort : undefined,
    ],
    async ({ pageParam = undefined }) => {
      const queryAddresses = Array.from(addresses ?? new Set());
      const queryFilter = (item: RaribleItem): boolean => !!(
        /*(!query?.type
          || (item.meta?.attributes ?? []).find(({key, value}) =>
            key === "size" && value === query.type
          )
        ) &&*/
        (!query?.text
          || ((item.meta?.name ?? "").includes(query.text))
        )
      );

      if (query?.base === "mine") {
        const [pageIAddr, pageContinuation] = pageParam?.split(" ") ?? [0, undefined];
        const pageIndex = Number(pageIAddr);
        const pageResults = (pageIndex >= queryAddresses.length)
          ? {continuation: undefined, items: []}
          : await rsdk.apis.item.getItemsByOwner({
            owner: `ETHEREUM:${queryAddresses[pageIndex]}`,
            continuation: pageContinuation,
          });

        return {
          last: (pageIndex >= queryAddresses.length)
            || ((pageIndex === (queryAddresses.length - 1))
              && ((pageResults.items.length < 50)
                || (pageResults.continuation === undefined)
              )
            ),
          next: pageResults.continuation
            ? `${pageIndex} ${pageResults.continuation}`
            : `${pageIndex + 1}`,
          data: pageResults.items
            .filter((item) => item.collection === collId)
            .filter(queryFilter),
        };
      } else if (query?.base === "bids") {
        const pageResults = await rsdk.apis.order.getOrderBidsByMaker({
          maker: queryAddresses.map((address) => `ETHEREUM:${address}`),
          status: [RaribleOrderStatus.ACTIVE],
          continuation: pageParam,
        });
        const pageResults2 = await rsdk.apis.item.getItemByIds({
          itemIds: { ids: pageResults.orders
            .filter((o) => (
              (o.take.type["@type"] === "ERC721" || o.take.type["@type"] === "ERC721_Lazy")
              && o.take.type.contract === collId
            ))
            .map((o: RaribleOrder) => (o.take.type as RaribleERC721 | RaribleERC721Lazy))
            .map((t) => `${collId}:${t.tokenId}` as RaribleItemId)
          },
        });
        return {
          last: (pageResults.orders.length < 50) || (pageResults.continuation === undefined),
          next: pageResults.continuation,
          data: pageResults2.items.filter(queryFilter),
        };
      } else {
        const pageResults = await rsdk.apis.item.searchItems({ itemsSearchRequest: {
          size: 20,
          continuation: pageParam,
          sort: query?.sort ?? RaribleItemsSort.LOWEST_SELL,
          filter: {
            collections: ([collId] as RaribleCollectionId[]),
            deleted: false,
            names: query?.text ? [query?.text] : undefined,
            // traits: query?.type ? [{key: "size", value: query?.type}] : undefined,
          },
        }});
        return {
          last: (pageResults.items.length < 20) || (pageResults.continuation === undefined),
          next: pageResults.continuation,
          data: pageResults.items,
        };
      }
    },
    {
      enabled: !!addresses,
      getPreviousPageParam: (firstPage) => undefined,
      getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.next,
      // NOTE: Don't reload on every mount because we keep everything that's
      // been loaded between navigations and this could cause a lot of reloads
      staleTime: 2 * 60 * 1000,
    },
  );

  // FIXME: This should only prompt 1 reload instead of the 2-3 that it
  // prompts now.
  useEffect(() => {
    inView && !(isFetching || isFetchingNextPage) && fetchNextPage();
  }, [inView, isFetching, isFetchingNextPage]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
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
            {data.pages.map((page, index) => (
              <React.Fragment key={index}>
                {page.data.map((item: RaribleItem) => (
                  <div
                    key={item.tokenId}
                    role="link"
                    className={cn(
                      "flex flex-col justify-between p-2 gap-2 rounded-lg border-2",
                      "border-gray-200 hover:border-gray-800",
                    )}
                    onClick={() => navigate(`./item/${item.tokenId}`, {relative: "path"})}
                  >
                    <h3 className="text-lg text-center font-semibold line-clamp-1">
                      {makePrettyName(item)}
                    </h3>
                    <MetaIcon src={item} className="w-32" />
                    <ItemBadges
                      item={item}
                      myItems={myItems}
                      myBids={myBids}
                      badgeClassName="w-5 h-5"
                    />
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
  const modalNavigate = useModalNavigate();
  const chatNavigate = useChatNavigate();
  const {
    item, owner, bids, offer, myItems, isMyItem,
    address, isConnected,
  } = useRouteRaribleAccountItem();
  const traders = useUrbitTraders();
  const myBids = useRaribleAccountBids();

  const ownerUrbitId = useMemo(() => (
    (traders ?? {})[owner ?? "0x"]
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
          onClick={() => modalNavigate(`trade/${order?.id}`)}
          disabled={!isConnected || disabled}
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          &nbsp;{"Trade"}
        </button>
      </div>
  ), [isConnected, modalNavigate]);

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
              Active Asks
            </h4>
            <div className="flex flex-col text-sm gap-4 py-4">
              {(item.bestSellOrder === undefined) ? (
                <p>—</p>
              ) : (
                <ItemOffer
                  order={item.bestSellOrder}
                  offerType="sell"
                  disabled={isMyItem}
                />
              )}
            </div>
            <h4 className="text-md font-bold underline">
              Active Bids
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
                  disabled={!isMyItem}
                />
              )))}
            </div>
          </div>
          <div className="sm:row-span-1 flex flex-col gap-4 items-center">
            <MetaIcon src={item} className="object-contain aspect-square border-2 border-gray-800" />
            <ItemBadges
              item={item}
              myItems={myItems}
              myBids={myBids}
              badgeClassName="w-6 h-6"
            />
            <button className="button w-full gap-1"
              onClick={() => modalNavigate("offer")}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              {`${(offer !== undefined) ? "Update" : "Post"} ${isMyItem ? "Ask" : "Bid"}`}
            </button>
            {(offer !== undefined) && (
              <button className="button w-full gap-1"
                onClick={() => modalNavigate("cancel")}
              >
                <XCircleIcon className="w-4 h-4" />
                {`Rescind ${isMyItem ? "Ask" : "Bid"}`}
              </button>
            )}
            {!isMyItem && (
              <button className="w-full button gap-1"
                disabled={ownerUrbitId === undefined}
                onClick={() => ownerUrbitId && chatNavigate(ownerUrbitId)}
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                {"Message Owner"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaIcon({
  src,
  className,
}: {
  src: RaribleItem | RaribleCollection;
  className?: string;
}) {
  return (
    <img
      src={extractMetaImage(src.meta, ("name" in src) ? src.name : src.id)}
      className={cn("object-cover rounded-lg mx-auto", className)}
    />
  );
}

// FIXME: The height value used in the components below is a hack that
// assumes containment in the main content area under the navbar, which
// obviously won't work in all embedding contexts.

function LoadingIcon() {
  return (
    <div className="flex flex-col justify-center items-center h-[75vh]">
      <UrbitswapIcon className="animate-spin w-32 h-32" />
    </div>
  );
}

function FailureIcon() {
  return (
    <div className="flex flex-col justify-center items-center h-[75vh]">
      <ErrorIcon className="text-red-500 w-32 h-32" />
    </div>
  );
}
