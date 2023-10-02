import React from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletIcon } from '@heroicons/react/24/solid';
import { APP_NAME, ENV_TEST } from '@/constants';
import type { Chain } from 'viem'; // vcc/ui/node_modules/viem/types/chain.ts

export default function NavBar({className}: {className?: string}) {
  const { address, connector } = useAccount();
  const { connect } = useConnect({connector: new InjectedConnector()});
  const { disconnect } = useDisconnect();

  return (
    <nav className={cn(
      className,
      "w-full py-2 px-4 bg-white border-gray-800 border-b-2",
    )}>
      <div className="flex flex-row justify-between items-center">
        <Link to="/" className="text-3xl font-bold">
          {APP_NAME}
        </Link>
        {(ENV_TEST && address) && (
          <div className="text-center text-xs">
            <p>
              {(connector?.chains ?? [])
                .map(({name, testnet}: Chain) => `${name}${testnet ? "*" : ""}`)
                .join(", ")
              }
            </p>
            <p>{address}</p>
          </div>
        )}
        <button
          className="flex flex-row items-center space-x-2 font-semibold button"
          onClick={() => !address ? connect() : disconnect()}
        >
          <WalletIcon className={cn("h-5 w-5", address ? "text-blue" : "")} />
          {!address ? (
            <p>Connect</p>
          ) : (
            <p>Disconnect</p>
          )}
        </button>
      </div>
    </nav>
  );
}
