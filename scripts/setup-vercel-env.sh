#!/bin/bash

# Script to add missing environment variables to Vercel
# Usage: ./scripts/setup-vercel-env.sh

echo "🔧 Setting up Vercel environment variables..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm install -g vercel"
    exit 1
fi

# Add SUPABASE_SERVICE_ROLE_KEY
echo "📝 Adding SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkc3V2bmxidmlvc255eGJqcHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY3NjEwMCwiZXhwIjoyMDc4MjUyMTAwfQ.lz5_bbcNNsUmDFdaorlFZi0XPHvnSt3Zqd-Yd_txRHw"

echo ""
echo "⚠️  You need to manually add Twilio credentials:"
echo "   - TWILIO_ACCOUNT_SID"
echo "   - TWILIO_AUTH_TOKEN"
echo "   - TWILIO_PHONE_NUMBER"
echo ""
echo "Add them via: vercel env add VARIABLE_NAME production"
echo ""
echo "✅ Done! Redeploy your application for changes to take effect."
