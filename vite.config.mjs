import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      include: /\.[jt]sx?$/
    })
  ],
  esbuild: {
    loader: 'jsx',
    include: /.*\.[jt]sx?$/,
    exclude: []
  },
  envPrefix: ['VITE_', 'REACT_APP_', 'PUBLIC_'],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['e2e/**', '**/e2e/**', '**/node_modules/**', '**/dist/**']
  }
});
