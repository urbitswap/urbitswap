import React, {
  ChangeEvent,
  KeyboardEvent,
  useState,
  useEffect,
  useCallback,
} from 'react';
import cn from 'classnames';
import { useNavigate, useParams } from "react-router-dom";
import { WalletIcon } from '@heroicons/react/24/solid';
import { APP_NAME } from '@/constants';


export default function NavBar({className}: {className?: string}) {
  return (
    <nav className={cn(
      className,
      "w-full sticky top-0 z-20 py-2 px-4",
      "border-black border-b",
    )}>
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-3xl font-bold">
          {APP_NAME}
        </h1>
        <div className="flex flex-row items-center space-x-2 font-semibold button">
          <WalletIcon className="h-5 w-5" />
          <p>Wallet</p>
        </div>
      </div>
    </nav>
  );
}
