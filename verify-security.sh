#!/bin/bash

# Lumo-App Security Verification Script
# Run this before pushing to GitHub

echo "🔐 Lumo-App Security Check"
echo "=========================="
echo ""

ISSUES=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to script directory
cd "$(dirname "$0")"

# Check 1: .gitignore properly configured
echo "1. Checking .gitignore..."
if grep -q ".env\*" .gitignore; then
    echo -e "   ${GREEN}✅ .env files are gitignored${NC}"
else
    echo -e "   ${RED}❌ .env files not properly gitignored${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check 2: Verify .env files are not tracked
echo "2. Checking if .env files are ignored by git..."
if git check-ignore .env .env.local > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ .env files are properly ignored${NC}"
else
    echo -e "   ${RED}❌ .env files may be tracked!${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check 3: Check for secrets in staged changes
echo "3. Checking staged changes for secrets..."
if git diff --cached --name-only | grep -q "\.env$"; then
    echo -e "   ${RED}❌ WARNING: .env file is staged for commit!${NC}"
    ISSUES=$((ISSUES+1))
elif git diff --cached | grep -qE "(AIzaSy[a-zA-Z0-9_-]{33}|sk-[a-zA-Z0-9]{20,})"; then
    echo -e "   ${RED}❌ WARNING: Possible API key in staged changes!${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "   ${GREEN}✅ No secrets detected in staged changes${NC}"
fi

# Check 4: Check if service account keys exist (should be gitignored)
echo "4. Checking for service account files..."
if ls service-account*.json > /dev/null 2>&1; then
    if git check-ignore service-account*.json > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Service account files present but gitignored${NC}"
    else
        echo -e "   ${RED}❌ Service account files found and NOT ignored!${NC}"
        ISSUES=$((ISSUES+1))
    fi
else
    echo -e "   ${GREEN}✅ No service account files in directory${NC}"
fi

# Check 5: Verify Firebase config uses env vars (not hardcoded secrets)
echo "5. Checking source code for hardcoded secrets..."
if grep -r "sk-proj-\|AIzaSyAMjqMK" src/ 2>/dev/null; then
    echo -e "   ${RED}❌ Found hardcoded API keys in source!${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "   ${GREEN}✅ No hardcoded secrets in src/${NC}"
fi

# Check 6: Google API key status
echo "6. Checking Google API key in .env..."
if [ -f .env ]; then
    if grep -q "AIzaSyAMjqMK7DF89wwcDl-o49xXpIWypd8vgbI" .env; then
        echo -e "   ${YELLOW}⚠️  OLD Google API key still in .env${NC}"
        echo -e "   ${YELLOW}   Action: Rotate this key (see SECURITY_CHECKLIST.md)${NC}"
    else
        echo -e "   ${GREEN}✅ Google API key appears to be rotated${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  .env file not found${NC}"
fi

# Check 7: Git status
echo "7. Checking git status..."
MODIFIED=$(git status --short | wc -l)
if [ $MODIFIED -eq 0 ]; then
    echo -e "   ${GREEN}✅ Working directory clean${NC}"
else
    echo -e "   ${YELLOW}⚠️  $MODIFIED file(s) modified${NC}"
    echo ""
    git status --short
    echo ""
fi

# Check 8: Remote configured
echo "8. Checking git remote..."
REMOTE=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE" ]; then
    echo -e "   ${GREEN}✅ Remote configured: $REMOTE${NC}"
else
    echo -e "   ${RED}❌ No remote configured${NC}"
    ISSUES=$((ISSUES+1))
fi

echo ""
echo "=========================="
echo "📊 Security Summary"
echo "=========================="

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo ""
    echo "Safe to commit and push to GitHub."
    echo ""
    echo "Before deploying to production:"
    echo "1. Rotate Google API key (if not done yet)"
    echo "2. Set API key restrictions in Google Cloud Console"
    echo "3. Review Firebase Security Rules"
    echo "4. Enable Firebase App Check"
    echo ""
    echo "See SECURITY_CHECKLIST.md for details."
else
    echo -e "${RED}❌ Found $ISSUES security issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before committing."
    echo "See SECURITY_CHECKLIST.md for guidance."
fi

echo ""
exit $ISSUES
