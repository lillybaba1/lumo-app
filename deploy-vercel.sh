#!/bin/bash

# Vercel Deployment Script for Lumo App
# This script helps you deploy to Vercel with proper checks

set -e  # Exit on error

echo "🚀 Lumo App - Vercel Deployment Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if git repo is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
    echo "Would you like to commit them? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Enter commit message:"
        read -r commit_message
        git add .
        git commit -m "$commit_message"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Proceeding with uncommitted changes${NC}"
    fi
fi

# Run build test locally
echo ""
echo "🔨 Testing build locally..."
if npm run build; then
    echo -e "${GREEN}✅ Local build successful${NC}"
else
    echo -e "${RED}❌ Local build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo ""
echo "Select deployment environment:"
echo "1) Preview (test deployment)"
echo "2) Production (live deployment)"
echo "3) Cancel"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🎯 Deploying to Preview..."
        vercel
        echo ""
        echo -e "${GREEN}✅ Preview deployment complete!${NC}"
        echo "Check your deployment at the URL shown above"
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
        echo "This will be live for all users."
        read -p "Are you sure? (yes/no): " confirm
        if [[ "$confirm" == "yes" ]]; then
            echo ""
            echo "🚀 Deploying to Production..."
            
            # Push to git first
            echo "📤 Pushing to GitHub..."
            git push origin master
            
            # Deploy to Vercel
            vercel --prod
            
            echo ""
            echo -e "${GREEN}✅ Production deployment complete!${NC}"
            echo ""
            echo "📋 Post-deployment checklist:"
            echo "  [ ] Test signup/login"
            echo "  [ ] Verify products load"
            echo "  [ ] Check image uploads"
            echo "  [ ] Test AI assistant"
            echo "  [ ] Monitor Vercel logs"
        else
            echo "Deployment cancelled"
        fi
        ;;
    3)
        echo "Deployment cancelled"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "🎉 Done!"
