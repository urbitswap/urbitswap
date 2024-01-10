import { QueryClient } from '@tanstack/react-query'
import Urbit, {
  Message,
  Poke,
  PokeInterface,
  Scry,
  SubscriptionRequestInterface,
  Thread,
  UrbitHttpApiEvent,
  UrbitHttpApiEventType,
} from '@urbit/http-api';
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected';
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public';
import { mainnet, goerli } from 'viem/chains';
import { APP_DBUG } from '@/constants';
import type { ConnectionStatus } from '@/types/urbui';

export const queryAPI = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retry: false,
      // retryDelay: (attempt: number): number =>
      //   Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    },
  },
});

const { chains: wagmiChains, publicClient: wagmiClient } = configureChains(
  [APP_DBUG ? goerli : mainnet],
  (APP_DBUG && import.meta.env?.VITE_ALCHEMY_KEY)
    ? [alchemyProvider({apiKey: import.meta.env?.VITE_ALCHEMY_KEY}), publicProvider()]
    : [publicProvider()],
);
export const wagmiAPI = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({chains: wagmiChains})],
  publicClient: wagmiClient,
});

// simplified version of code from `tloncorp/landscape-apps`
// https://github.com/tloncorp/landscape-apps/blob/f9304a403a00cadfe0dca9ba719cb56298cf611b/ui/src/api.ts
class UrbitAPI {
  private client: Urbit | undefined;

  subscriptions: Set<string>;

  subscriptionMap: Map<number, string>;

  constructor() {
    this.subscriptions = new Set();
    this.subscriptionMap = new Map();
  }

  private async setup() {
    if (this.client) {
      return this.client;
    }

    this.client = new Urbit("", "", window.desk);
    this.client.ship = window.ship;
    this.client.verbose = false; // TODO: Key on ENV debug mode?

    // (this.client as Urbit).onOpen = () => { this.status = "connected"; };
    // this.client.onReconnect = () => { this.status = "reconnecting"; };
    // this.client.onRetry = () => { this.status = "reconnecting"; };
    // this.client.onError = (e: Error) => { this.status = "disconnected"; };

    return this.client;
  }

  private async withClient<T>(cb: (client: Urbit) => T) {
    if (!this.client) {
      const client = await this.setup();
      return cb(client);
    }

    return cb(this.client);
  }

  private async withErrorHandling<T>(cb: (client: Urbit) => Promise<T>) {
    try {
      const result = await this.withClient(cb);
      return result;
    } catch (e) {
      throw e;
    }
  }

  async scry<T>(params: Scry) {
    return this.withClient((client) => client.scry<T>(params));
  }

  async poke<T>(params: PokeInterface<T>) {
    return this.withErrorHandling((client) => client.poke<T>(params));
  }

  async subscribe(params: SubscriptionRequestInterface) {
    const subId = `${params.app}${params.path}`;
    if (this.subscriptions.has(subId)) {
      const [id] = [...this.subscriptionMap.entries()].find(
        ([k, v]) => v === subId
      ) || [0, ''];
      return Promise.resolve(id);
    }

    this.subscriptions.add(subId);
    const id = await this.withErrorHandling((client) => client.subscribe(params));
    this.subscriptionMap.set(id, subId);

    return id;
  }

  async subscribeOnce<T>(app: string, path: string, timeout?: number) {
    return this.withErrorHandling(() => this.client!.subscribeOnce<T>(app, path, timeout));
  }

  async thread<R, T>(params: Thread<T>) {
    return this.withErrorHandling(() => this.client!.thread<R, T>(params));
  }

  async unsubscribe(id: number) {
    const subId = this.subscriptionMap.get(id);
    if (subId) {
      this.subscriptions.delete(subId);
      this.subscriptionMap.delete(id);
    }

    return this.withErrorHandling(() => this.client!.unsubscribe(id));
  }

  reset() {
    this.withClient((client) => {
      client.delete().then(async () => {
        try {
          await client.reset();
          await client.eventSource();
        } catch (error: any) {
          // @ts-ignore
          client.emit('status-update', { status: 'errored' });
          // throw error;
        }
      });
    });
  }

  on<T extends UrbitHttpApiEventType>(
    event: T,
    callback: (data: UrbitHttpApiEvent[T]) => void
  ) {
    this.withClient((client) => (client as Urbit).on(event, callback));
  }
}

export const urbitAPI = new UrbitAPI();
