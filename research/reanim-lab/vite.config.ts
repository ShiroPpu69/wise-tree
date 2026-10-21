import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  publicDir: resolve(import.meta.dirname, '../../private/reanim-lab-assets'),
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  // A research build can contain private media: NEVER publish dist or deploy this lab.
  build: { outDir: resolve(import.meta.dirname, '../../private/reanim-lab-dist'), emptyOutDir: false },
});
