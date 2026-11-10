import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const BUILD_VERSION = Date.now().toString();
const BUILT_AT = new Date().toISOString();

function versionPlugin(): Plugin {
  return {
    name: 'version-plugin',
    generateBundle() {
      const buildInfo = {
        version: BUILD_VERSION,
        builtAt: BUILT_AT,
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
    __BUILD_TIMESTAMP__: JSON.stringify(BUILD_VERSION),
  },
  server: {
    port: 5173,
    host: true,
  },
});
