import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        assetsDir: 'assets',
        emptyOutDir: true,
        outDir: '../dist/client',
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name][extname]',
                chunkFileNames: 'assets/[name].js',
                entryFileNames: 'assets/client.js'
            }
        }
    },
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'preact'
    },
    publicDir: false,
    root: 'client'
});
