import Urbit from "@urbit/http-api";
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected';
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public';
import { mainnet, goerli } from 'viem/chains';

export const urbitAPI = new Urbit('', '', window.desk);
urbitAPI.ship = window.ship;

const { chains: wagmiChains, publicClient: wagmiClient } = configureChains(
  [goerli/*, mainnet*/],
  [alchemyProvider({apiKey: import.meta.env?.VITE_ALCHEMY_KEY}), publicProvider()],
);
export const wagmiAPI = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({chains: wagmiChains})],
  publicClient: wagmiClient,
});
