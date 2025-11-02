#!/bin/bash

# Lumo App - Vercel Deployment Script
# This script helps deploy the Lumo app to Vercel

set -e  # Exit on error

echo "🚀 Lumo App - Vercel Deployment"
echo "================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
else
    echo "✅ Vercel CLI found ($(vercel --version))"
fi

echo ""
echo "📋 Pre-deployment Checklist:"
echo ""
echo "Required environment variables:"
echo "  1. NEXT_PUBLIC_FIREBASE_API_KEY"
echo "  2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "  3. NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "  4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "  5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "  6. NEXT_PUBLIC_FIREBASE_APP_ID"
echo "  7. GOOGLE_API_KEY (from https://aistudio.google.com/)"
echo "  8. FIREBASE_SERVICE_ACCOUNT_JSON (from Firebase Console)"
echo "  9. FIREBASE_STORAGE_BUCKET"
echo " 10. FIREBASE_COOKIE_NAME (default: session)"
echo ""

read -p "Have you prepared all environment variables? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please prepare environment variables first."
    echo "📖 See DEPLOYMENT_GUIDE.md for instructions"
    exit 1
fi

echo ""
echo "🔑 Authenticating with Vercel..."
vercel login

echo ""
echo "📦 Deploying to Vercel..."
echo ""
echo "Choose deployment type:"
echo "  1. Preview (development)"
echo "  2. Production"
echo ""
read -p "Enter choice (1 or 2): " -n 1 -r
echo ""

if [[ $REPLY == "2" ]]; then
    echo "🚀 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🔍 Deploying to PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Visit your deployment URL"
echo "  2. Test the application"
echo "  3. Configure environment variables if needed"
echo "  4. Set up first admin at /admin/setup-first-admin"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
