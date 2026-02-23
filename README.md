# HTML Viewer

A hosted, stateless HTML preview tool built with Next.js.

Paste raw HTML, open preview in a new tab, and render remote assets (CDN scripts, stylesheets, images, icon libraries) without creating temporary local files.

## Features

- Paste raw HTML and preview instantly.
- Default workflow opens output in a new tab (`/preview`).
- Optional inline preview for quick checks.
- Optional base URL input for resolving relative paths.
- Trusted mode rendering with scripts enabled inside sandboxed iframe.
- Session-only state in the browser. No backend storage, no database.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 (utility classes used in app UI)
- Biome for lint/format
- pnpm package manager

## Local Development

Install dependencies:

```bash
pnpm install
```

Run dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

- `pnpm dev` - start local dev server
- `pnpm lint` - run Biome checks
- `pnpm format` - format files with Biome
- `pnpm build` - production build
- `pnpm start` - run built app

## Usage

1. Paste your HTML into the editor.
2. Optional: set Base URL if your HTML uses relative paths (`./assets/x.png`).
3. Click `Open Preview Tab`.
4. If blocked, allow popups for your domain and retry.

## Security and Constraints

- This app is for trusted HTML.
- Scripts in pasted HTML are allowed in the preview iframe sandbox.
- Remote assets are loaded by browser policy, not proxied server-side.
- Some URLs may still fail due to source-site CSP, X-Frame-Options, or CORS rules.
- Preview payload is session-scoped and not persisted server-side.
