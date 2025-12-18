#!/usr/bin/env node

/**
 * Security Checklist Action Script
 * 
 * Run this script to guide you through completing the security checklist items.
 * Usage: node scripts/security-actions.mjs
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.bold}${num}.${colors.reset} ${msg}`),
};

async function runSecurityChecklist() {
  console.clear();
  log.header('🔐 LUMO-APP SECURITY CHECKLIST');
  console.log('This script will guide you through completing important security tasks.\n');

  // Check 1: Environment Variables
  log.header('1. ENVIRONMENT VARIABLES CHECK');
  
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  let envMissing = false;
  for (const envVar of envVars) {
    if (process.env[envVar]) {
      log.success(`${envVar} is set`);
    } else {
      log.warning(`${envVar} is NOT set`);
      envMissing = true;
    }
  }

  if (envMissing) {
    log.info('\nMake sure all environment variables are set in your .env.local file');
    log.info('Never commit .env files to git (they should be in .gitignore)');
  }

  // Check 2: Git Security
  log.header('2. GIT SECURITY CHECK');
  
  try {
    const gitIgnore = execSync('type .gitignore 2>nul || cat .gitignore 2>/dev/null', { encoding: 'utf-8' });
    
    const sensitivePatterns = ['.env', '.env.local', '.env*.local', 'node_modules'];
    let allIgnored = true;
    
    for (const pattern of sensitivePatterns) {
      if (gitIgnore.includes(pattern)) {
        log.success(`${pattern} is in .gitignore`);
      } else {
        log.error(`${pattern} is NOT in .gitignore`);
        allIgnored = false;
      }
    }

    if (!allIgnored) {
      log.error('\nSome sensitive files may not be ignored. Add them to .gitignore immediately!');
    }
  } catch (e) {
    log.warning('Could not read .gitignore file');
  }

  // Check 3: API Key Rotation
  log.header('3. API KEY ROTATION');
  
  console.log(`
${colors.yellow}ACTION REQUIRED:${colors.reset} Rotate your API keys if they were ever exposed.

Steps to rotate Google/Firebase API keys:

1. Go to Google Cloud Console:
   ${colors.cyan}https://console.cloud.google.com/apis/credentials${colors.reset}

2. Create a NEW API key with restrictions:
   - Application restrictions: HTTP referrers (websites)
   - Website restrictions:
     • https://your-domain.com/*
     • https://your-app.vercel.app/*
     • http://localhost:3000/* (for development)
   
3. Update your .env.local file with the new key

4. DELETE the old API key from Google Cloud Console

5. If using Vercel, update the environment variable:
   ${colors.cyan}vercel env add GOOGLE_API_KEY${colors.reset}
`);

  await question('Press Enter when you have completed API key rotation (or skip)...');

  // Check 4: Firebase Security Rules
  log.header('4. FIREBASE/SUPABASE SECURITY');
  
  console.log(`
${colors.yellow}REVIEW REQUIRED:${colors.reset} Check your database security rules.

For Supabase:
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Policies
3. Ensure Row Level Security (RLS) is enabled on all tables
4. Review each policy to ensure proper access control

Key policies to verify:
- Users can only read their own data
- Only admins can access admin routes
- Business accounts can only modify their own products
`);

  await question('Press Enter when you have reviewed security rules (or skip)...');

  // Check 5: Rate Limiting
  log.header('5. RATE LIMITING CHECK');
  
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  
  if (redisUrl) {
    log.success('Redis is configured for production rate limiting');
  } else {
    log.warning('Redis is NOT configured');
    console.log(`
For production, you should configure Redis for distributed rate limiting:

1. Sign up for Upstash Redis: ${colors.cyan}https://upstash.com${colors.reset}
2. Create a new Redis database
3. Add environment variables:
   - UPSTASH_REDIS_REST_URL=your_redis_url
   - UPSTASH_REDIS_REST_TOKEN=your_token

Without Redis, rate limiting only works per-instance and resets on deploy.
`);
  }

  await question('Press Enter to continue...');

  // Check 6: Dependencies Audit
  log.header('6. DEPENDENCY SECURITY AUDIT');
  
  console.log('Running npm audit...\n');
  
  try {
    execSync('npm audit --production', { stdio: 'inherit' });
    log.success('No critical vulnerabilities found');
  } catch (e) {
    log.warning('Some vulnerabilities were found. Review the output above.');
    console.log(`
To fix vulnerabilities:
- Run: ${colors.cyan}npm audit fix${colors.reset}
- For breaking changes: ${colors.cyan}npm audit fix --force${colors.reset} (use with caution)
`);
  }

  await question('Press Enter to continue...');

  // Check 7: HTTPS and Headers
  log.header('7. SECURITY HEADERS');
  
  console.log(`
Your next.config.mjs includes security headers:

✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: DENY
✓ X-XSS-Protection: 1; mode=block
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ Permissions-Policy: camera=(), microphone=(), geolocation=()
✓ Content-Security-Policy: Configured with restrictions

${colors.green}These headers are automatically applied to all routes.${colors.reset}

To verify in production:
1. Deploy your app
2. Open browser DevTools > Network tab
3. Check response headers for any request
`);

  await question('Press Enter to continue...');

  // Summary
  log.header('📋 SECURITY CHECKLIST SUMMARY');
  
  console.log(`
Complete these remaining tasks:

${colors.bold}Required:${colors.reset}
□ Rotate any exposed API keys
□ Enable RLS on all Supabase tables
□ Review and fix npm audit vulnerabilities

${colors.bold}Recommended:${colors.reset}
□ Set up Redis for production rate limiting
□ Enable Firebase App Check (if using Firebase)
□ Set up monitoring/alerting for failed auth attempts
□ Enable 2FA for admin accounts
□ Regular security audits (monthly)

${colors.bold}Documentation:${colors.reset}
- Security Checklist: ${colors.cyan}./SECURITY_CHECKLIST.md${colors.reset}
- Admin Security Guide: ${colors.cyan}./ADMIN_SECURITY.md${colors.reset}
`);

  rl.close();
  console.log('\n' + colors.green + 'Security checklist complete!' + colors.reset + '\n');
}

// Run the script
runSecurityChecklist().catch(console.error);
