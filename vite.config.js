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
                assetFileNames: 'assets/[name][extname]',
                chunkFileNames: 'assets/[name].js',
                entryFileNames(chunkInfo) {
                    return chunkInfo.name === 'index'
                        ? 'assets/client.js'
                        : 'assets/[name].js';
                }
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
