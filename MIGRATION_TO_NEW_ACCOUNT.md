# Migrating lumo-app to a New GitHub Account

Runbook for moving this repo off `lillybaba1` and re-pointing Vercel, Supabase,
and Cloudflare at the new home.

The repo move itself is the easy part. The parts that actually break things are
the credentials and the callback URLs — those are covered in detail below.

---

## 0. Do this first: revoke the two leaked API keys

Two **real Google AI (Gemini) API keys** are committed to this repository and are
present in git history (commit `ee53c38`). Moving the repo does not remove them —
history travels with the clone, and a fresh public repo re-exposes them.

| Key | Location | Kind |
|---|---|---|
| `AIzaSyAMjqMK7DF89wwcDl-o49xXpIWypd8vgbI` | `SECURITY_CHECKLIST.md:37,45,57` | `GOOGLE_API_KEY` — **secret** |
| `AIzaSyDuv1E5IhFNQJ6eBmOw3XSiWyyCdlNlSmU` | `docs/archive/status/ENVIRONMENT_SETUP_STATUS.md:8` | `GOOGLE_API_KEY` — **secret** |

Revoke both at <https://aistudio.google.com/apikey> (or Google Cloud Console →
APIs & Services → Credentials) and issue a replacement. Do it before you push
anywhere new. `ENVIRONMENT_SETUP_STATUS.md` even notes "will be revoked and
replaced later" — that never happened.

A third key, `AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng`, appears in several docs.
That one is `NEXT_PUBLIC_FIREBASE_API_KEY`, which is public by design and ships in
the browser bundle — it does **not** need revoking, but it should have HTTP
referrer restrictions set in the Google Cloud console.

**Make the new repository private.** If it must be public, scrub history with
`git filter-repo` before the first push — after revoking, not instead of it.

---

## 1. Move the repository

Nothing about the code is tied to the account; only the remote URL and some
documentation links are. `scripts/repoint-repo.sh` does both:

```bash
./scripts/repoint-repo.sh <new-github-owner>            # rewrite docs + show next steps
./scripts/repoint-repo.sh <new-github-owner> --remote   # also repoint origin
```

Manual equivalent:

```bash
# 1. Create an EMPTY repo under the new account (no README, no .gitignore)
# 2. Repoint and push everything, branches and tags included
git remote set-url origin https://github.com/<new-owner>/lumo-app.git
git push -u origin --all
git push origin --tags
```

If the old account is locked and you cannot even read from it, you still have a
complete copy in this working tree — `git push` from here works regardless of the
old account's state, because all history is local.

> **Note on forking:** do not use GitHub's "Fork" button. A fork stays linked to
> the restricted upstream. Push to a fresh empty repo instead.

### GitHub Actions is currently disabled on the old account

Every CI job on the old account now fails 1–3 seconds after starting, with no
log output at all (log downloads 404). That is the runner never starting, not a
test failure — GitHub suspends Actions on accounts with an unresolved billing
problem. Nothing in the workflow files is wrong.

Expect this to clear by itself once the repo lives under an account in good
standing. Do not "fix" `ci.yaml` in response to these failures; there is nothing
to fix. Re-run the workflows after the move to get a real signal.

### Re-add the CI secrets

`.github/workflows/` needs these repository secrets re-created under the new
account (Settings → Secrets and variables → Actions). They do not transfer.

- `ci.yaml` — `FIREBASE_SERVICE_ACCOUNT_BASE64`, `NEXT_PUBLIC_FIREBASE_*`, `GOOGLE_API_KEY`
  (all optional; the build falls back to mock values)
- `deploy-vercel.yml` — `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
  `FIREBASE_SERVICE_ACCOUNT_BASE64` (**required**, or master pushes fail to deploy)

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` change if you create a new Vercel
project — read the new values from `.vercel/project.json` after running
`vercel link`.

---

## 2. Vercel

### First: five Vercel projects are deploying this repo

CI checks on a recent PR showed the `heiliges-projects` Vercel account building
this same repository **five times** on every push:

| Project | Looks like |
|---|---|
| `lumo-app` | the real one — matches `PRODUCTION_URLS.md` |
| `lumo-app-q69v` | abandoned import |
| `lumo-app-16qo` | abandoned import |
| `lumo-app-zdhi-supabase` | abandoned import |
| `lumo-app-jnhu-supa` | abandoned import |

The random suffixes are what Vercel appends when you re-import a repo whose
project name is taken, so these are almost certainly leftovers from repeated
setup attempts. Each one consumes build minutes on every push, and each holds
its own copy of your environment variables — including secrets.

Before migrating, confirm which project actually serves production, then delete
the rest. Do that *first*: it is much cheaper than carrying four dead projects
into the new account, and it removes four stale copies of your service-role key.

Check each project's Settings → Domains — the one holding your production
domain is the keeper.

### Option A — same Vercel account, repoint Git (recommended)

Keeps the project, its environment variables, and its domain. Least disruptive.

1. Vercel → Project → Settings → Git → **Disconnect** the old repository.
2. Connect the new `<new-owner>/lumo-app`. Install the Vercel GitHub App on the
   new account when prompted.
3. Redeploy.

**Caveat:** if you signed into Vercel *using* the restricted GitHub account, add
an email/password or alternate login **before** disconnecting, or you can lock
yourself out of your own dashboard.

### Option B — new Vercel project

Import the new repo, then set every variable in §4. The deployment URL changes,
which means Supabase Auth URLs must be updated (§3) or logins and email
verification will break.

Point any custom domain at the new project before deleting the old one.

---

## 3. Supabase

The Supabase project (`edsuvnlbviosnyxbjptx`) is **not** tied to GitHub. If your
Supabase account is fine, you do not need to migrate data at all — you only need
to update the Auth URLs to match the new Vercel domain.

### Update Auth URLs — required whenever the deployment URL changes

Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://<new-deployment>.vercel.app`
- **Redirect URLs:**
  - `https://<new-deployment>.vercel.app/auth/callback`
  - `https://<new-deployment>.vercel.app/login`
  - `https://<new-deployment>.vercel.app/signup`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/login`
  - `http://localhost:3000/signup`

Add the custom domain too, if you have one. `PRODUCTION_URLS.md` still lists the
old `lumo-app-heiliges-projects.vercel.app` — update it once the new URL exists.

There is a helper at `scripts/configure-supabase-urls.sh`.

### If you must also move Supabase accounts

Only necessary if the Supabase account itself is affected. Materially bigger job
with downtime:

1. Create the new project; note its URL, anon key, and service-role key.
2. Rebuild schema — apply `supabase/migrations/*.sql` (15 files, timestamp order),
   then `migrations/*.sql` (26 files, numeric order). Watch the duplicate `020_*`
   and `009_*` prefixes; check them against the old schema.
3. Move data with `pg_dump --data-only` → `psql`, or the dashboard's backup
   restore. Take the app offline first so nothing is written mid-dump.
4. Recreate storage buckets (product images, boutique images) **and** their RLS
   policies — see `005_boutique_images_storage.sql` and
   `20250124_create_product_images_storage.sql`. Bucket contents are not covered
   by `pg_dump`; copy objects separately.
5. Re-do the Auth URL configuration above.
6. Swap the three `*SUPABASE*` variables everywhere (§4).

Users' passwords survive a project migration only if `auth.users` is moved with
its encrypted columns intact. Verify a test login before cutting over.

---

## 4. Environment variables

`.env.example` was missing 13 variables the code actually reads; it has been
updated as part of this migration work. Full inventory below — 35 variables are
referenced across `src/`, `scripts/`, and `netlify/`.

### Required — the app is broken without these

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | changes only if you move Supabase projects |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ditto |
| `SUPABASE_SERVICE_ROLE_KEY` | ditto — **secret**, server-only |
| `NEXT_PUBLIC_SITE_URL` | **must** be set — see the warning below |
| `MODEMPAY_SECRET_KEY` | payments |
| `MODEMPAY_WEBHOOK_SECRET` | webhook endpoint rejects all events without it |
| `MODEMPAY_PUBLIC_KEY` / `NEXT_PUBLIC_MODEMPAY_PUBLIC_KEY` | client checkout reads the `NEXT_PUBLIC_` one |
| `GOOGLE_API_KEY` or `GEMINI_API_KEY` | AI assistant; `GEMINI_API_KEY` wins if both set |

> ### ⚠️ `NEXT_PUBLIC_SITE_URL` has no fallback on the signup path
>
> `src/app/api/auth/signup/route.ts:137` builds the verification link as
> `` `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` `` with **no default**.
> If it is unset, every new user is emailed a link to
> `undefined/auth/callback` and cannot verify their account.
>
> Other call sites (`layout.tsx:73`, `signup-business/route.ts:104`) do fall back
> to `https://julazone.com` or localhost, so this fails silently in one place
> only. Set this variable in the new Vercel project **before** announcing the
> new URL. Also set `NEXT_PUBLIC_APP_URL` — it falls back to `https://julazone.com`,
> which is wrong on a `*.vercel.app` deployment.

### Optional — features degrade quietly if unset

| Variable | Effect when missing |
|---|---|
| `ZOHO_EMAIL`, `ZOHO_PASSWORD`, `ZOHO_SMTP_HOST`, `ZOHO_SMTP_PORT`, `ZOHO_FROM_NAME` | transactional email disabled |
| `REDIS_URL` / `UPSTASH_REDIS_REST_URL`, `REDIS_TOKEN` / `UPSTASH_REDIS_REST_TOKEN` | rate limiter falls back to in-memory — per-instance only, so it is effectively off on serverless |
| `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`, `PAYDUNYA_MODE` | PayDunya payment route returns an error; ModemPay unaffected |
| `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_STORAGE_BUCKET` | legacy Firebase storage path |
| `SESSION_COOKIE_NAME` | defaults to `session` |
| `OPENAI_API_KEY` | only if you use OpenAI instead of Gemini |

### Set by the platform — never set these yourself

`NODE_ENV`, `NEXT_RUNTIME`, `VERCEL_GIT_COMMIT_SHA`, `CF_PAGES`,
`CF_PAGES_BRANCH`, `CF_PAGES_COMMIT_SHA`, `CLOUDFLARE_PAGES`.

Bulk-import into a new Vercel project:

```bash
vercel link
vercel env pull .env.local            # from the OLD project, if still reachable
# then, per variable:
vercel env add NEXT_PUBLIC_SITE_URL production
```

`setup-vercel-env.sh` walks through the main ones interactively, but it predates
ModemPay and does **not** cover `MODEMPAY_*`, `NEXT_PUBLIC_SITE_URL`, `ZOHO_*`,
`PAYDUNYA_*`, or the Redis variables. Use the tables above as the source of truth.

---

## 5. Cloudflare

Cloudflare is **actively building this repo** — PR checks include a
`Workers Builds: lumo` check that runs on every push. So this is not just DNS,
and `wrangler.toml` is not dead config.

That means Cloudflare has its own Git integration pointing at the old account,
which must be repointed like Vercel's:

1. Cloudflare dashboard → Workers & Pages → the `lumo` project → Settings →
   Build → **disconnect** the old repository, reconnect the new one. Authorize
   the Cloudflare GitHub App on the new account when prompted.
2. Re-add every variable from §4 under Settings → Variables and Secrets.
   `wrangler.toml` only carries `NODE_ENV`; everything else lives in the
   dashboard and does **not** travel with the repo.
3. If the domain is also on Cloudflare and proxied (orange cloud), SSL mode must
   be **Full (strict)** or you get a redirect loop.

Worth deciding while you are in there: you are currently building this app on
both Vercel and Cloudflare. If only one actually serves traffic, disconnecting
the other removes a whole category of migration work and stops duplicate builds.

`vercel.json` pins `regions: ["iad1"]` and a 60s max duration for
`src/app/api/**` — both carry over automatically, no action needed.

Firebase (`.firebaserc` → `lumo-app-183f5`, `apphosting.yaml`) appears to be a
legacy path. If it is genuinely unused, leaving it alone is safe; it is not part
of this migration.

---

## 6. Verify

```bash
npm ci
npm run typecheck
npm test -- --run
npm run build
```

Then, against the new deployment:

- [ ] Sign up a new account → **verification email arrives with a working link**
      (this is the `NEXT_PUBLIC_SITE_URL` trap)
- [ ] Log in and log out
- [ ] Load a product page and the admin dashboard
- [ ] Upload a product image → confirm it lands in Supabase storage
- [ ] Run a test payment → confirm the ModemPay webhook is received
- [ ] `git push` to master → CI runs and the Vercel deploy succeeds

Keep the old Vercel project and Supabase project alive until all of the above
pass. Deleting either one early makes rollback impossible.
