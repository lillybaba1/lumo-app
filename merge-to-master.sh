#!/bin/bash

# Merge All Branches into Master
# This script consolidates all claude/* branches into master

set -e

echo "🔀 Merging all changes into master branch"
echo ""

# Store current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Fetch latest from remote
echo ""
echo "📥 Fetching latest changes from remote..."
git fetch origin

# Switch to master
echo ""
echo "🔄 Switching to master..."
git checkout master
git pull origin master

# Merge the review branch (which contains all changes)
echo ""
echo "🔀 Merging claude/review-lum-011CUj57Xb1VtERZ33txH1nB into master..."
git merge claude/review-lum-011CUj57Xb1VtERZ33txH1nB -m "Merge: Consolidate all improvements into master

Includes:
- Security improvements (auth, rate limiting, validation)
- Testing infrastructure (Vitest, 75+ tests)
- Client component fixes (Add/Edit Product pages)
- Deployment configuration (Vercel guides)
- Upload diagnostics and troubleshooting
- Route compilation fix documentation
- Firebase image display and upload fixes

All branches consolidated:
- claude/review-lum-011CUj57Xb1VtERZ33txH1nB
- claude/improve-ai-assistance-011CUSR9spzZaMtjEthocS6D
- claude/general-app-fixes-011CUNQf76PNKQ1PgD1xqXa5
- claude/dashboard-admin-features-011CUPpjTkztuYFJWhp6kDQ9
- claude/check-lumo-r-011CUQvbTh1mRLEVBivULvGi
"

# Push to master
echo ""
echo "⬆️  Pushing to origin/master..."
git push origin master

echo ""
echo "✅ Successfully merged all changes into master!"
echo ""
echo "📊 Summary of changes:"
git log --oneline origin/master~20..master | head -20

echo ""
echo "🎉 All done! Master branch is now up to date."
