#!/bin/bash
#
# Repoint this repository at a new GitHub owner.
#
# Rewrites the hardcoded `lillybaba1` references in documentation and, with
# --remote, updates the git origin URL. It does NOT push, and it does NOT touch
# Vercel / Supabase / Cloudflare — see MIGRATION_TO_NEW_ACCOUNT.md for those.
#
#   ./scripts/repoint-repo.sh <new-owner>
#   ./scripts/repoint-repo.sh <new-owner> --remote
#

set -euo pipefail

OLD_OWNER="lillybaba1"
REPO_NAME="lumo-app"

NEW_OWNER="${1:-}"
UPDATE_REMOTE="${2:-}"

if [[ -z "$NEW_OWNER" || "$NEW_OWNER" == -* ]]; then
    echo "Usage: $0 <new-github-owner> [--remote]" >&2
    echo "" >&2
    echo "  <new-github-owner>   GitHub username or org that will own the repo" >&2
    echo "  --remote             also repoint 'origin' at the new owner" >&2
    exit 1
fi

cd "$(dirname "$0")/.."

if [[ "$NEW_OWNER" == "$OLD_OWNER" ]]; then
    echo "New owner is the same as the old owner ($OLD_OWNER). Nothing to do."
    exit 0
fi

echo "Repointing $OLD_OWNER/$REPO_NAME -> $NEW_OWNER/$REPO_NAME"
echo ""

# ---------------------------------------------------------------------------
# 1. Rewrite documentation references
# ---------------------------------------------------------------------------

# Only tracked files, so nothing in node_modules/.git is touched. -I skips
# binaries (INVESTOR_SUMMARY.pdf contains the string but must not be rewritten).
mapfile -t FILES < <(git grep -lI "$OLD_OWNER" -- . ':!package-lock.json' || true)

if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "No '$OLD_OWNER' references found in tracked text files."
else
    echo "Rewriting ${#FILES[@]} file(s):"
    for f in "${FILES[@]}"; do
        count=$(grep -c "$OLD_OWNER" "$f" || true)
        # Both bare owner refs and URL-encoded ones (%2F<owner>%2F in Vercel
        # deploy buttons) resolve correctly with a plain substitution.
        sed -i "s|${OLD_OWNER}|${NEW_OWNER}|g" "$f"
        printf '  %-60s %s ref(s)\n' "$f" "$count"
    done
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Repoint the git remote
# ---------------------------------------------------------------------------

CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "(none)")

if [[ "$UPDATE_REMOTE" == "--remote" ]]; then
    NEW_REMOTE="https://github.com/${NEW_OWNER}/${REPO_NAME}.git"
    git remote set-url origin "$NEW_REMOTE"
    echo "origin updated:"
    echo "  was: $CURRENT_REMOTE"
    echo "  now: $NEW_REMOTE"
else
    echo "origin left unchanged: $CURRENT_REMOTE"
    echo "  (re-run with --remote, or set it manually:)"
    echo "  git remote set-url origin https://github.com/${NEW_OWNER}/${REPO_NAME}.git"
fi

# ---------------------------------------------------------------------------
# 3. What the script cannot do
# ---------------------------------------------------------------------------

cat <<EOF

Done. Remaining steps (see MIGRATION_TO_NEW_ACCOUNT.md):

  1. Revoke the two leaked GOOGLE_API_KEY values still in git history
     -> https://aistudio.google.com/apikey
  2. Create an EMPTY repo at github.com/${NEW_OWNER}/${REPO_NAME} (private),
     then:  git push -u origin --all && git push origin --tags
  3. Re-add GitHub Actions secrets — VERCEL_TOKEN, VERCEL_ORG_ID,
     VERCEL_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_BASE64
  4. Repoint the Vercel project's Git integration at the new repo
  5. Update Supabase Auth redirect URLs to the new deployment URL
  6. Set NEXT_PUBLIC_SITE_URL in Vercel — signup verification emails break
     without it (no fallback at src/app/api/auth/signup/route.ts:137)

Review before committing:  git diff
EOF
