# Lumo / JulaZone

E-commerce platform built with Next.js 14 and Supabase, with an AI shopping assistant powered by Google Gemini (via Genkit).

## Features

- Customer storefront, multi-seller marketplace, and admin dashboard
- AI shopping assistant (Gemini 2.0 Flash, OpenAI fallback)
- Supabase auth (email + phone OTP), Postgres, and Storage
- Capacitor wrapper for Android

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#      SUPABASE_SERVICE_ROLE_KEY, GOOGLE_API_KEY (or GEMINI_API_KEY)

# 3. Run
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (via `scripts/run-build.mjs`) |
| `npm start` | Production server |
| `npm test` | Vitest |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run pages:deploy` | Cloudflare Pages deploy |
| `npm run android:build` | Android debug APK |
| `npm run android:release` | Android release AAB |

Requires Node 20.

## Tech stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **UI:** Tailwind CSS + Radix UI
- **Backend:** Supabase (Postgres, Auth, Storage)
- **AI:** Google Gemini 2.0 Flash via Genkit; OpenAI as fallback
- **Mobile:** Capacitor 7 → Android
- **Deploy:** Vercel (primary), Cloudflare Pages

## Documentation

All project docs live under [`docs/`](./docs/INDEX.md) — see the index for setup, auth, admin, deployment, migrations, and security guides.

## Environment

See `.env.example` (development) and `.env.production.example` (Vercel deployment).
