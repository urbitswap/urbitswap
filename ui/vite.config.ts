import packageJson from './package.json';
import { loadEnv, defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react';
import { urbitPlugin } from '@urbit/vite-plugin-urbit';
import { fileURLToPath } from 'url';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env.VITE_STORAGE_VERSION = mode === 'development'
    ? (d => `${d.getFullYear()}.${d.getMonth()}.${d.getDate()}`)(new Date(Date.now()))
    : packageJson.version;

  Object.assign(process.env, loadEnv(mode, process.cwd()));
  const SHIP_URL = process.env.SHIP_URL || process.env.VITE_SHIP_URL || 'http://localhost:8080';
  console.log(SHIP_URL);

  return defineConfig({
    plugins: [
      urbitPlugin({ base: 'urbitswap', target: SHIP_URL, secure: false }),
      reactRefresh(),
      // https://stackoverflow.com/a/77153849, https://stackoverflow.com/a/69021714
      // https://github.com/remorses/esbuild-plugins/issues/14#issuecomment-1437893495
      nodePolyfills(),
    ],
    server: {
      host: 'localhost',
      port: 3000,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      sourcemap: false,
      commonjsOptions: {
        // Needed to build web3js deps w/ mixed import/require statements
        // https://github.com/rollup/plugins/tree/master/packages/commonjs#transformmixedesmodules
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'ethers': ['ethers'],
            '@rarible/sdk': ['@rarible/sdk'],
            'urbit': ['@urbit/api', '@urbit/http-api', '@tlon/sigil-js'],
            'react-ui': ['react-select', 'react-datetime-picker'],
            'radix-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
            ],
          },
          // FIXME: The following has better size chunks, but splitting
          // up '@rarible/sdk' doesn't seem to work very easily (even if
          // only splitting off unused components, e.g. solana and tezos).
          // manualChunks: (id: string): string | void => {
          //   if (id.includes('@radix-ui')) {
          //     return 'radix-ui';
          //   } if (id.includes('@urbit') || id.includes('@tlon')) {
          //     return 'urbit';
          //   } if (id.includes('react-datetime-picker') ||
          //         id.includes('react-select')) {
          //     return 'react-ui';
          //   } if (id.match(/@rarible\/flow/)) {
          //     return '@rarible/flow';
          //   } if (id.match(/@rarible\/tezos/)) {
          //     return '@rarible/tezos';
          //   } if (id.match(/@rarible\/solana/)) {
          //     return '@rarible/solana';
          //   } if (id.includes('@rarible')) {
          //     return '@rarible/sdk';
          //   }
          // },
        },
      },
    },
  });
};
