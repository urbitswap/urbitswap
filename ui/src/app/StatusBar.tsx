import React, { useState, useEffect, useCallback } from 'react';
import cn from 'classnames';
import { urbitAPI } from '@/api';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import type { ConnectionStatus } from '@/types/urbui';

// TODO: Make this a sequence, with different error messages/button
// actions at each stage:
// - connected to the Rarible website?
//   > message: Unable to connect to NFT marketplace.
//   > button: Reconnect (Attempt to re-establish connection)
// - connected to the local Urbit ship?
//   > message: Unable to connect to Urbit host ship.
//   > button: Reconnect (Current behavior below)
// - local Urbit ship connected to the master list remote?
//   > message: Unable to connect to master ship.
//   > button: Retry (Shut down peer connection and reopen?)

export default function StatusBar({
  className,
  innerClassName,
}: {
  className?: string;
  innerClassName?: string;
}) {
  // FIXME: It would be better if all local state for this component was
  // made global instead.
  const [urbitConn, setUrbitConn] = useState<ConnectionStatus>("connected");
  useEffect(() => {
    urbitAPI.onOpen = () => setUrbitConn("connected");
    urbitAPI.onReconnect = () => setUrbitConn("reconnecting");
    urbitAPI.onRetry = () => setUrbitConn("reconnecting");
    urbitAPI.onError = (e: Error) => setUrbitConn("disconnected");
  }, []);

  const onClick = useCallback(() => {
    setUrbitConn("reconnecting");
    urbitAPI.delete().then(async () => {
      try {
        await urbitAPI.reset();
        await urbitAPI.eventSource();
      } catch (error: any) {
        // NOTE: Give the user a chance to see that a reconnect was
        // attempted, even in the case of an immediate rejection.
        setTimeout(() => (
          setUrbitConn("disconnected")
        ), 3000);
      }
    });
  }, []);

  return (urbitConn === "connected") ? null : (
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
          <span>You are currently offline.</span>
        </div>
        <button className="small-button" onClick={onClick} disabled={urbitConn === "reconnecting"}>
          {(urbitConn === "disconnected") ? "Reconnect" : "Reconnecting..."}
        </button>
      </div>
    </div>
  );
}
