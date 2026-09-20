import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FSenglish Calendar',
    short_name: 'FSenglish',
    description: 'Turn Friends Seminary English schedule files into Canvas calendar items.',
    homepage_url: 'https://github.com/TTkindboy/eng-canvas-bridge',
  },
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
