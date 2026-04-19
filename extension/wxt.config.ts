import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  vite: () => ({
    resolve: {
      alias: {
        '@instructure/ui-icons/svg': path.resolve(__dirname, 'node_modules/@instructure/ui-icons/svg'),
      },
    },
  }),
});
