import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        assetsDir: 'assets',
        emptyOutDir: true,
        outDir: '../dist/client',
        rollupOptions: {
            input: {
                index: fileURLToPath(
                    new URL('./client/index.html', import.meta.url)
                ),
                'rock-editor': fileURLToPath(
                    new URL('./client/rock-editor.html', import.meta.url)
                ),
                'scenario-editor': fileURLToPath(
                    new URL('./client/scenario-editor.html', import.meta.url)
                )
            },
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js'
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
