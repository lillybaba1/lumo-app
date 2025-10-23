# GitHub CI Secrets for Firebase Admin

This document shows the exact commands to create the base64 secret for the Firebase service account and how to add it to GitHub Secrets, plus an optional `ADMIN_API_KEY` used by server API endpoints.

## Create base64-encoded service account value

1. Download the service account JSON from Google Cloud Console (IAM → Service accounts → Keys → Create key → JSON).
2. Encode it to base64 (no newlines):

```bash
cat serviceAccountKey.json | base64 | tr -d '\n' > sa.b64
```

3. Copy the content of `sa.b64` and add it to GitHub Secrets:

- Go to your repository → Settings → Secrets and variables → Actions → New repository secret
- Name: `FIREBASE_SERVICE_ACCOUNT_BASE64`
- Value: (paste the content of `sa.b64`)

## Optional: ADMIN_API_KEY

If you want simple shared-secret protection for admin-only endpoints (not a replacement for real auth), create a random token:

```bash
openssl rand -hex 32
```

Add it to GitHub Secrets with name `ADMIN_API_KEY` and add the same value to your production environment.

## CI usage (already in this repo)
- The GitHub Actions workflow `.github/workflows/ci.yml` decodes `FIREBASE_SERVICE_ACCOUNT_BASE64` and writes it to `$GITHUB_WORKSPACE/serviceAccountKey.json`, then sets `GOOGLE_APPLICATION_CREDENTIALS` for subsequent steps.
- Make sure the secret is added before opening a PR if you expect build-time server Admin SDK access.

## Security notes
- Do NOT commit serviceAccountKey.json into the repo.
- Restrict the service account to least privilege roles.
- Rotate keys periodically and remove old keys.
