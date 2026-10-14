# AGENTS.md

Instructions for coding agents working in this repository.

Before making any change, read [architecture.md](architecture.md). It describes the purpose of this
web frontend for Hunter, the technology stack, the code layout, the patterns to follow (e.g. for
session pages, tables and maps), the conventions, and the build and deployment to Azure Static Web
Apps.

Quick reference:

- Install: `npm install`
- Run locally: `npm run dev` (http://localhost:8080, `/api` proxied to the REST API)
- Verify a change: `npm run type-check && npm run lint && npm test && npm run build`

If your change alters the structure, conventions or deployment described in
[architecture.md](architecture.md), update that file in the same change.
