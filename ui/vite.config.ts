import { loadEnv, defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react';
import { urbitPlugin } from '@urbit/vite-plugin-urbit';
import { fileURLToPath } from 'url';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd()));
  const SHIP_URL = process.env.SHIP_URL || process.env.VITE_SHIP_URL || 'http://localhost:8080';
  console.log(SHIP_URL);

  return defineConfig({
    plugins: [
      urbitPlugin({ base: 'vcc-trade', target: SHIP_URL, secure: false }),
      reactRefresh(),
      // Current Solution: https://stackoverflow.com/a/77153849
      // Old Solution: https://stackoverflow.com/a/69021714
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
      // rollupOptions: {
      //   // output: {
      //   //   manualChunks: {
      //   //     '@urbit/api': ['@urbit/api'],
      //   //     '@urbit/http-api': ['@urbit/http-api'],
      //   //     '@tlon/sigil-js': ['@tlon/sigil-js'],
      //   //     'react-select': ['react-select'],
      //   //     'react-datetime-picker': ['react-datetime-picker'],
      //   //     'ethers': ['ethers'],
      //   //     '@radix-ui/react-dialog': ['@radix-ui/react-dialog'],
      //   //     '@radix-ui/react-dropdown-menu': ['@radix-ui/react-dropdown-menu'],
      //   //     '@rarible/sdk': ['@rarible/sdk'],
      //   //   },
      //   // //   manualChunks: (id: string): string | void => {
      //   // //     if (id.includes('@radix-ui')) {
      //   // //       return '@radix-ui';
      //   // //     } if (id.includes('@urbit') || id.includes('@tlon')) {
      //   // //       return '@urbit';
      //   // //     } if (id.includes('react-select')) {
      //   // //       return 'react-select';
      //   // //     } if (id.includes('react-datetime-picker')) {
      //   // //       return 'react-datetime-picker';
      //   // //     // TODO: May need to combine with '@rarible'
      //   // //     } if (id.includes('ethers')) {
      //   // //       return 'ethers';
      //   // //     } if (id.match(/@rarible\/flow/)) {
      //   // //       return '@rarible/flow';
      //   // //     } if (id.match(/@rarible\/tezos/)) {
      //   // //       return '@rarible/tezos';
      //   // //     } if (id.match(/@rarible\/solana/)) {
      //   // //       return '@rarible/solana';
      //   // //     } if (id.includes('@rarible')) {
      //   // //       return '@rarible/sdk';
      //   // //     }
      //   // //   },
      //   // },
      // },
    },
  });
};
