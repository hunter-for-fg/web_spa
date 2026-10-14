// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// During development the REST API is proxied under /api, so no CORS setup is needed locally.
// VITE_API_PROXY_TARGET defaults to the local Azure Functions host (`func start`), but can point
// to the deployed Function App (e.g. https://hunter-rest-api.azurewebsites.net) instead.
// `npm run dev:https` (mode https) serves over HTTPS with a self-signed certificate.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: mode === 'https' ? [vue(), basicSsl()] : [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 8080,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:7071',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      // independent of personal settings in .env.local etc.
      env: {
        VITE_API_BASE_URL: '/api',
      },
    },
  }
})
