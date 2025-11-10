#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this to set up all required environment variables for Vercel

echo "🔐 Vercel Environment Variables Setup"
echo "======================================"
echo ""
echo "This script will help you set up environment variables for Vercel deployment."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "Logging in to Vercel..."
vercel login

# Link project
echo ""
echo "Linking to Vercel project..."
vercel link

echo ""
echo "Now let's add the environment variables..."
echo ""

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_description=$2
    local is_secret=$3
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Setting: $var_name"
    echo "Description: $var_description"
    echo ""
    
    if [[ "$is_secret" == "secret" ]]; then
        echo "⚠️  This is a SECRET variable (don't share it!)"
        read -p "Add to Production? (y/n): " prod_choice
        if [[ "$prod_choice" =~ ^([yY])$ ]]; then
            vercel env add $var_name production
        fi
        
        read -p "Add to Preview? (y/n): " prev_choice
        if [[ "$prev_choice" =~ ^([yY])$ ]]; then
            vercel env add $var_name preview
        fi
    else
        echo "This is a PUBLIC variable (safe to expose)"
        read -p "Add to All environments? (y/n): " choice
        if [[ "$choice" =~ ^([yY])$ ]]; then
            vercel env add $var_name production
            vercel env add $var_name preview
            vercel env add $var_name development
        fi
    fi
    echo ""
}

# Add all required variables
echo "📋 Required Variables:"
echo ""

add_env_var "NEXT_PUBLIC_SUPABASE_URL" "Supabase project URL (e.g., https://xxx.supabase.co)" "public"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase anonymous key (public)" "public"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key (KEEP SECRET!)" "secret"
add_env_var "OPENAI_API_KEY" "OpenAI API key for AI assistant (KEEP SECRET!)" "secret"

echo ""
echo "📋 Optional Variables (for Firebase Storage):"
echo ""

read -p "Are you using Firebase Storage for images? (y/n): " use_firebase
if [[ "$use_firebase" =~ ^([yY])$ ]]; then
    add_env_var "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "Firebase storage bucket" "public"
    add_env_var "SERVICE_ACCOUNT_JSON" "Firebase service account JSON (KEEP SECRET!)" "secret"
    add_env_var "SESSION_COOKIE_NAME" "Session cookie name (usually 'session')" "public"
fi

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify all variables in Vercel dashboard"
echo "2. Run: ./deploy-vercel.sh"
echo "3. Or push to GitHub for automatic deployment"
echo ""
echo "🎉 You're ready to deploy!"
