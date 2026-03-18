import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../backend/openapi.json',
  output: 'src/lib/client',
  plugins: [
    '@hey-api/sdk',
  ]
});
