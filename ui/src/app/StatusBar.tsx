import React, { useState, useEffect, useCallback } from 'react';
import cn from 'classnames';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { urbitAPI } from '@/api';
import { APP_DBUG, TRADERS_HOST } from '@/constants';
import LoadingComponent from '@/components/LoadingComponent';
import ShipName from '@/components/ShipName';
import { useConnectivityCheck } from '@/state/vitals';
import type { ConnectionStatus, Class2Props } from '@/types/urbui';
import type {
  DeferredRenderProps,
  DeferredPrecheckProps,
  DeferredPrecheckReport,
} from '@/types/utils';

export default function StatusBar(props: Class2Props) {
  const BaseRender = useCallback((props: Class2Props) => null, []);

  const HerShipCheck = useCallback((props: Class2Props) => (
    <HerShipStatus render={BaseRender} props={props} />
  ), []);
  const OurShipCheck = useCallback((props: Class2Props) => (
    <OurShipStatus render={HerShipCheck} props={props} />
  ), []);
  const MarketplaceCheck = useCallback((props: Class2Props) => (
    <MarketplaceStatus render={OurShipCheck} props={props} />
  ), []);

  return (<MarketplaceCheck {...props} />);
}

function MarketplaceStatus<P extends Class2Props>(props: DeferredRenderProps<null, P>) {
  const [marketConn, setMarketConn] = useState<ConnectionStatus>("connected");
  const [errorCount, setErrorCount] = useState<number>(0);

  // NOTE: This implements something like exponential backoff in the
  // error case (following the same algorithm as "@urbit/http-api").
  const pulseOkay = useCallback((c: number) => 20 * 1000, []);
  const pulseError = useCallback((c: number) => Math.min(5000, Math.pow(2, Math.max(c, 1) - 1) * 750), []);

  useEffect(() => {
    if (errorCount >= 3) {
      setMarketConn("disconnected");
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, pulseOkay(errorCount));
      // NOTE: The following is used to easily test the error case:
      // fetch("https://this-website-does-not-exist-and-hopefully-never-will.com/", {
      fetch(`https://${!APP_DBUG ? "" : "testnet-"}api.rarible.org/`, {
        method: "get",
        mode: "no-cors",
        cache: "no-cache",
        signal: controller.signal,
      }).then((response: any) => {
        clearTimeout(timeoutId);
        setMarketConn("connected");
        setTimeout(() => {
          setErrorCount(c => (c === 0) ? -1 : 0);
        }, pulseOkay(errorCount));
      }).catch((error: any) => {
        clearTimeout(timeoutId);
        setMarketConn("reconnecting");
        setTimeout(() => {
          setErrorCount(c => Math.max(c, 0) + 1);
        }, pulseError(errorCount));
      });
    }
  }, [errorCount]);

  const onClick = useCallback(() => {
    setMarketConn("reconnecting");
    setErrorCount(0);
  }, []);

  const marketChecks: DeferredPrecheckReport[] = [
    {
      status: (marketConn === "connected"),
      render: () => (
        <ErrorBanner status={marketConn} onClick={onClick} {...(props?.props ?? {})}>
          <span>Cannot reach the NFT marketplace.</span>
        </ErrorBanner>
      ),
    },
  ];

  return (<LoadingComponent checks={marketChecks} render={props} />);
}

function OurShipStatus<P extends Class2Props>(props: DeferredRenderProps<null, P>) {
  // FIXME: It would be better if all local state for this component was
  // made global instead.
  const [ourConn, setOurConn] = useState<ConnectionStatus>("connected");
  useEffect(() => {
    urbitAPI.onOpen = () => setOurConn("connected");
    urbitAPI.onReconnect = () => setOurConn("reconnecting");
    urbitAPI.onRetry = () => setOurConn("reconnecting");
    urbitAPI.onError = (e: Error) => setOurConn("disconnected");
  }, []);

  const onClick = useCallback(() => {
    setOurConn("reconnecting");
    urbitAPI.delete().then(async () => {
      try {
        await urbitAPI.reset();
        await urbitAPI.eventSource();
      } catch (error: any) {
        // NOTE: Give the user a chance to see that a reconnect was
        // attempted (important in the case of an immediate rejection).
        setTimeout(() => setOurConn("disconnected"), 3 * 1000);
      }
    });
  }, []);

  const ourChecks: DeferredPrecheckReport[] = [
    {
      status: (ourConn === "connected"),
      render: () => (
        <ErrorBanner status={ourConn} onClick={onClick} {...(props?.props ?? {})}>
          <span>Cannot reach host ship </span>
          <ShipName name={window.our} full={false} />
        </ErrorBanner>
      ),
    },
  ];

  return (<LoadingComponent checks={ourChecks} render={props} />);
}

function HerShipStatus<P extends Class2Props>(props: DeferredRenderProps<null, P>) {
  const {
    data: connection,
    refetch: refetchConnection,
    showConnection,
  } = useConnectivityCheck(TRADERS_HOST[0], {
    waitToDisplay: 5 * 1000,
    staleTime: 60 * 1000,
  });

  const herConn: ConnectionStatus = (!connection?.status || ("pending" in connection?.status))
    ? "reconnecting"
    : (connection?.status.complete === 'yes')
      ? "connected"
      : "disconnected";

  // FIXME: I fear that this isn't really working... needs to be tested more thoroughly
  // in real and fake cases
  // FIXME: May want to call "refetchConnection" with a regular interval to continue
  // monitoring the connection with the host
  const onClick = useCallback(() => {
    refetchConnection();
  }, [refetchConnection]);

  const herChecks: DeferredPrecheckReport[] = [
    {
      status: (herConn === "connected" || !showConnection),
      render: () => (
        <ErrorBanner status={herConn} onClick={onClick} {...(props?.props ?? {})}>
          <span>Cannot reach broker ship </span>
          <ShipName name={TRADERS_HOST[0]} full={false} />
        </ErrorBanner>
      ),
    },
  ];

  return (<LoadingComponent checks={herChecks} render={props} />);
}

function ErrorBanner({
  status,
  onClick,
  children,
  className,
  innerClassName,
}: {
  status: ConnectionStatus;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn(
      "w-full bg-yellow py-1 px-2",
      "text-sm font-medium text-black dark:text-white",
      className
    )}>
      <div className={cn(
        "flex items-center justify-between",
        innerClassName,
      )}>
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <div children={children} />
        </div>
        <button
          onClick={onClick}
          disabled={status === "reconnecting"}
          className="small-button"
        >
          {`Reconnect${(status === "disconnected") ? "" : "ing..."}`}
        </button>
      </div>
    </div>
  );
}
