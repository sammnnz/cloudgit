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
        // https://vite.dev/config/server-options.html#server-hmr
        hmr: {
            clientPort: 3000
        },
        strictPort: true,
        allowedHosts: [
            'frontend'
        ]
    },
    build: {
        outDir: "build",
        target: "es2017",
    },
    preview: {
        port: 3000
    }
});

// NOTE:
//  Description: React problem with run vite server on windows.
//  Shell: `TypeError [ERR_INVALID_URL_SCHEME]: The URL must be of scheme file`
//  Solution: https://www.reddit.com/r/tunarr/comments/1ejwktj/the_url_must_be_of_scheme_file/
//  Status: Not dangerous