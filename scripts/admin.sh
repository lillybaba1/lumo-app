#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run the admin script with all environment variables
npx tsx scripts/make-admin.ts "$@"
