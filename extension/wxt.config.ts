import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    define: {
      'process.env.GITHUB_PULL_REQUEST_PREVIEW': JSON.stringify(false),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    resolve: {
      alias: {
        '@instructure/ui-icons/svg': path.resolve(__dirname, 'node_modules/@instructure/ui-icons/svg'),
      },
    },
  }),
});
