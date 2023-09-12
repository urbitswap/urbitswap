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

  return defineConfig({
    build: { sourcemap: false },
    plugins: [urbitPlugin({ base: 'vcc-trade', target: SHIP_URL, secure: false }), reactRefresh()],
    server: { host: 'localhost', port: 3000 },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // https://stackoverflow.com/a/69021714
    // https://github.com/remorses/esbuild-plugins/issues/14#issuecomment-1437893495
    optimizeDeps: {
      esbuildOptions: {
        define: {global: 'globalThis'},
        plugins: [
          NodeModulesPolyfills(),
          GlobalsPolyfills({process: true, buffer: true}),
        ],
      },
    },
  });
};
