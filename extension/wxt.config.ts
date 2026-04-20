import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    resolve: {
      alias: {
        '@instructure/ui-icons/svg': path.resolve(__dirname, 'node_modules/@instructure/ui-icons/svg'),
      },
    },
  }),
});
