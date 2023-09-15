import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Location,
  useLocation,
} from 'react-router-dom';
import Urbit from '@urbit/http-api';
import { WagmiConfig, createConfig } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { mainnet, goerli } from 'viem/chains';
import { CollectionGrid } from '@/app/Views';
import NavBar from '@/app/NavBar';
import { APP_TERM } from '@/constants';
import type { ReactRouterState } from '@/types/urbui';

const api = new Urbit('', '', window.desk);
api.ship = window.ship;

// const config = createConfig({
//   autoConnect: true,
//   publicClient: createPublicClient({
//     chain: goerli,
//     transport: http(),
//   }),
// });

export function App() {
  return (
    <BrowserRouter basename={`/apps/${APP_TERM}/`}>
        <RoutedApp />
    </BrowserRouter>
  );
}

function RoutedApp() {
  const location = useLocation();
  const state = location.state as ReactRouterState;

  return (
    <RoutedAppRoutes state={state} location={location} />
  );
}

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
          <Route path="/item/:itemid" element={<p children="Item" />} />
        </Route>
      </Routes>
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/item/:itemid">
            <Route path="bid" element={<p children="Bid" />} />
            <Route path="take" element={<p children="Take" />} />
            <Route path="cancel" element={<p children="Cancel" />} />
          </Route>
        </Routes>
      )}
    </React.Fragment>
  );
}
