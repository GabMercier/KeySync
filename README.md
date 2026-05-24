# KeySync

A harmonic song matcher for DJs. Find songs in compatible keys for seamless mixing, based on the Camelot wheel system.

## Stack

- Next.js 15 (static export)
- React 19
- Tailwind CSS + Radix UI

## Local development

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Deployment

Hosted on Cloudflare Pages — pushes to `main` deploy automatically.

For a local production build:

```bash
pnpm build
```

Outputs a static site to `out/`.
