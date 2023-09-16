import Urbit from "@urbit/http-api";
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected';
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public';
import { mainnet, goerli } from 'viem/chains';
import { ENV_TEST } from '@/constants';

export const urbitAPI = new Urbit('', '', window.desk);
urbitAPI.ship = window.ship;

const { chains: wagmiChains, publicClient: wagmiClient } = configureChains(
  [ENV_TEST ? goerli : mainnet],
  (ENV_TEST && import.meta.env?.VITE_ALCHEMY_KEY)
    ? [alchemyProvider({apiKey: import.meta.env?.VITE_ALCHEMY_KEY}), publicProvider()]
    : [publicProvider()],
);
export const wagmiAPI = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({chains: wagmiChains})],
  publicClient: wagmiClient,
});
