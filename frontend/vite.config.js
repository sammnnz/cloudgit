import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { ViteAliases } from 'vite-aliases'

export default defineConfig({
    plugins: [
        legacy(),
        react(),
        ViteAliases({
            dir: "src",
            prefix: "@",
            depth: 1,
        })
    ],
    server: {
        port: 3000,
        host: '127.0.0.1',
        hmr: true,
    },
    build: {
        outDir: "build",
        target: "es2017",
    },
});