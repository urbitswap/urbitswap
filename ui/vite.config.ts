import { loadEnv, defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react';
import { urbitPlugin } from '@urbit/vite-plugin-urbit';
import { fileURLToPath } from 'url';
import GlobalsPolyfills from '@esbuild-plugins/node-globals-polyfill'
import NodeModulesPolyfills from '@esbuild-plugins/node-modules-polyfill'

// https://vitejs.dev/config/
export default ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd()));
  const SHIP_URL = process.env.SHIP_URL || process.env.VITE_SHIP_URL || 'http://localhost:8080';
  console.log(SHIP_URL);

  const rollupOptions = {
    output: {
      manualChunks: (id: string): string | void => {
        if (id.includes('@radix-ui')) {
          return '@radix-ui';
        } if (id.includes('@urbit') || id.includes('@tlon')) {
          return '@urbit';
        } if (id.includes('react-select')) {
          return 'react-select';
        } if (id.includes('react-datetime-picker')) {
          return 'react-datetime-picker';
        } if (id.includes('@ethersproject')) {
          return '@ethersproject';
        } if (id.includes('ethers')) {
          return 'ethers';
        } if (id.includes('@rarible/sdk')) {
          return '@rarible/sdk';
        } if (id.match(/@rarible\/flow/)) {
          return '@rarible/flow';
        } if (id.match(/@rarible\/tezos/)) {
          return '@rarible/tezos';
        } if (id.match(/@rarible\/solana/)) {
          return '@rarible/solana';
        } if (id.match(/@rarible\/[^\/]*ethereum[^\/]*/)) {
          return '@rarible/ethereum';
        } if (id.includes('@rarible')) {
          return '@rarible';
        }
      },
      // manualChunks: {
      //   '@urbit/api': ['@urbit/api'],
      //   '@urbit/http-api': ['@urbit/http-api'],
      //   '@tlon/sigil-js': ['@tlon/sigil-js'],
      //   'react-select': ['react-select'],
      //   'react-datetime-picker': ['react-datetime-picker'],
      //   'ethers': ['ethers'],
      //   '@radix-ui/react-dialog': ['@radix-ui/react-dialog'],
      //   '@radix-ui/react-dropdown-menu': ['@radix-ui/react-dropdown-menu'],
      //   '@rarible/sdk': ['@rarible/sdk'],
      // },
    },
  };

  return defineConfig({
    build: { sourcemap: false, rollupOptions },
    plugins: [urbitPlugin({ base: 'vcc-trade', target: SHIP_URL, secure: false }), reactRefresh()],
    server: { host: 'localhost', port: 3000 },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // https://stackoverflow.com/a/69021714
    // https://github.com/remorses/esbuild-plugins/issues/14#issuecomment-1437893495
    optimizeDeps: {
      esbuildOptions: {
        define: { global: 'globalThis' },
        plugins: [
          NodeModulesPolyfills(),
          GlobalsPolyfills({ process: true, buffer: true }),
        ],
      },
    },
  });
};
