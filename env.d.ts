/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the REST API incl. the /api route prefix. Defaults to /api (proxied by the dev server). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
