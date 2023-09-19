import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Location,
  useLocation,
} from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { CollectionGrid, ItemPage } from '@/app/Views';
import { BidDialog, TakeDialog, CancelDialog } from '@/app/Dialogs';
import NavBar from '@/app/NavBar';
import { urbitAPI, wagmiAPI } from '@/api';
import { APP_TERM } from '@/constants';
import type { ReactRouterState } from '@/types/urbui';

export function App() {
  return (
    <WagmiConfig config={wagmiAPI}>
      <BrowserRouter basename={`/apps/${APP_TERM}/`}>
        <RoutedApp />
      </BrowserRouter>
    </WagmiConfig>
  );
}

function RoutedApp() {
  const location = useLocation();
  const state = location.state as ReactRouterState;

  return (
    <RoutedAppRoutes state={state} location={location} />
  );
}

// NOTE: This seemingly unnecessary indirection is required to allow modals
// to overlay on top of base paths without causing those base paths to
// re-render their contents.
function RoutedAppRoutes({
  state,
  location,
}: {
  state: ReactRouterState;
  location: Location;
}) {
  return (
    <React.Fragment>
      <Routes location={state?.backgroundLocation || location}>
        <Route element={
          <React.Fragment>
            <header children={<NavBar />} />
            <main className="p-4" children={<Outlet />} />
          </React.Fragment>
        }>
          <Route path="/" element={<CollectionGrid />} />
          <Route path="/item/:itemId" element={<ItemPage />} />
        </Route>
      </Routes>
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/item/:itemId">
            <Route path="bid" element={<BidDialog />} />
            <Route path="take/:bidId" element={<TakeDialog />} />
            <Route path="cancel" element={<CancelDialog />} />
          </Route>
        </Routes>
      )}
    </React.Fragment>
  );
}
