import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function versionPlugin(): Plugin {
  return {
    name: 'version-plugin',
    generateBundle() {
      const buildInfo = {
        version: Date.now().toString(),
        builtAt: new Date().toISOString(),
      };
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(buildInfo, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now().toString()),
  },
  server: {
    port: 5173,
    host: true,
  },
});
