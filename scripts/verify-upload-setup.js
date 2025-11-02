#!/usr/bin/env node

/**
 * Upload Setup Verification Script
 *
 * Run this script to verify that all required environment variables
 * and configurations are in place for image uploads to work.
 *
 * Usage:
 *   node scripts/verify-upload-setup.js
 *
 * or
 *   npm run verify:upload
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const { red, green, yellow, blue, cyan, reset } = colors;

console.log(`\n${cyan}╔═══════════════════════════════════════════════╗${reset}`);
console.log(`${cyan}║   Lumo Upload Setup Verification Script      ║${reset}`);
console.log(`${cyan}╚═══════════════════════════════════════════════╝${reset}\n`);

let hasErrors = false;
let hasWarnings = false;

// Helper functions
function checkPass(message) {
  console.log(`${green}✓${reset} ${message}`);
}

function checkFail(message) {
  console.log(`${red}✗${reset} ${message}`);
  hasErrors = true;
}

function checkWarn(message) {
  console.log(`${yellow}⚠${reset} ${message}`);
  hasWarnings = true;
}

function checkInfo(message) {
  console.log(`${blue}ℹ${reset} ${message}`);
}

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    checkFail('.env.local file not found');
    checkInfo(`  Create it by copying: ${cyan}cp .env.example .env.local${reset}`);
    return null;
  }

  checkPass('.env.local file exists');

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      envVars[key] = value.replace(/^['"]|['"]$/g, '');
    }
  });

  return envVars;
}

// Check 1: Environment file
console.log(`${cyan}[1] Checking environment file...${reset}`);
const envVars = loadEnvFile();

if (!envVars) {
  console.log(`\n${red}Cannot continue without .env.local file.${reset}\n`);
  process.exit(1);
}

console.log('');

// Check 2: Firebase Admin credentials
console.log(`${cyan}[2] Checking Firebase Admin credentials...${reset}`);

if (envVars.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const credentials = JSON.parse(envVars.FIREBASE_SERVICE_ACCOUNT_JSON);

    if (credentials.type === 'service_account') {
      checkPass('FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON');

      if (credentials.project_id) {
        checkPass(`  Project ID: ${credentials.project_id}`);
      } else {
        checkFail('  Missing project_id in service account JSON');
      }

      if (credentials.private_key) {
        checkPass('  Private key present');
      } else {
        checkFail('  Missing private_key in service account JSON');
      }

      if (credentials.client_email) {
        checkPass(`  Client email: ${credentials.client_email}`);
      } else {
        checkFail('  Missing client_email in service account JSON');
      }
    } else {
      checkFail('FIREBASE_SERVICE_ACCOUNT_JSON is not a valid service account');
    }
  } catch (error) {
    checkFail('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    checkInfo(`  Error: ${error.message}`);
  }
} else if (envVars.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decoded = Buffer.from(envVars.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const credentials = JSON.parse(decoded);

    if (credentials.type === 'service_account') {
      checkPass('FIREBASE_SERVICE_ACCOUNT_BASE64 is valid (decoded and parsed)');
    } else {
      checkFail('FIREBASE_SERVICE_ACCOUNT_BASE64 does not contain valid service account');
    }
  } catch (error) {
    checkFail('FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid');
    checkInfo(`  Error: ${error.message}`);
  }
} else if (envVars.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = envVars.GOOGLE_APPLICATION_CREDENTIALS;
  if (fs.existsSync(credPath)) {
    try {
      const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      if (credentials.type === 'service_account') {
        checkPass(`GOOGLE_APPLICATION_CREDENTIALS points to valid file: ${credPath}`);
      } else {
        checkFail(`GOOGLE_APPLICATION_CREDENTIALS file is not a valid service account`);
      }
    } catch (error) {
      checkFail(`GOOGLE_APPLICATION_CREDENTIALS file is not valid JSON`);
    }
  } else {
    checkFail(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${credPath}`);
  }
} else {
  checkFail('No Firebase Admin credentials found');
  checkInfo('  You need ONE of:');
  checkInfo('    • FIREBASE_SERVICE_ACCOUNT_JSON');
  checkInfo('    • FIREBASE_SERVICE_ACCOUNT_BASE64');
  checkInfo('    • GOOGLE_APPLICATION_CREDENTIALS');
  checkInfo('  See UPLOAD_TROUBLESHOOTING.md for setup instructions');
}

console.log('');

// Check 3: Storage bucket
console.log(`${cyan}[3] Checking Firebase Storage configuration...${reset}`);

if (envVars.FIREBASE_STORAGE_BUCKET) {
  checkPass(`FIREBASE_STORAGE_BUCKET is set: ${envVars.FIREBASE_STORAGE_BUCKET}`);

  // Validate bucket format
  if (envVars.FIREBASE_STORAGE_BUCKET.includes('.appspot.com') ||
      envVars.FIREBASE_STORAGE_BUCKET.includes('.firebasestorage.app')) {
    checkPass('  Bucket format looks valid');
  } else {
    checkWarn('  Bucket format might be incorrect (expected: project.appspot.com or project.firebasestorage.app)');
  }
} else {
  checkFail('FIREBASE_STORAGE_BUCKET is not set');
  checkInfo('  Add to .env.local:');
  checkInfo('    FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app');
}

console.log('');

// Check 4: Session configuration
console.log(`${cyan}[4] Checking session configuration...${reset}`);

if (envVars.FIREBASE_COOKIE_NAME) {
  checkPass(`FIREBASE_COOKIE_NAME is set: ${envVars.FIREBASE_COOKIE_NAME}`);
} else {
  checkWarn('FIREBASE_COOKIE_NAME not set (will use default: "session")');
}

console.log('');

// Check 5: Firebase client config
console.log(`${cyan}[5] Checking Firebase client configuration...${reset}`);

const clientVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
];

let clientConfigOk = true;
clientVars.forEach(varName => {
  if (envVars[varName]) {
    checkPass(`${varName} is set`);
  } else {
    checkWarn(`${varName} is not set`);
    clientConfigOk = false;
  }
});

if (!clientConfigOk) {
  checkInfo('  Client config vars are public and can be in the code or env vars');
}

console.log('');

// Check 6: API route exists
console.log(`${cyan}[6] Checking API routes...${reset}`);

const uploadRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'upload', 'route.ts');
if (fs.existsSync(uploadRoutePath)) {
  checkPass('Upload API route exists: /api/upload');
} else {
  checkFail('Upload API route not found: src/app/api/upload/route.ts');
}

const diagnosticsPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'diagnostics', 'route.ts');
if (fs.existsSync(diagnosticsPath)) {
  checkPass('Diagnostics API route exists: /api/admin/diagnostics');
} else {
  checkWarn('Diagnostics API route not found (optional but helpful for debugging)');
}

console.log('');

// Summary
console.log(`${cyan}═══════════════════════════════════════════════${reset}\n`);

if (!hasErrors && !hasWarnings) {
  console.log(`${green}✓ All checks passed!${reset}`);
  console.log(`  Your upload configuration looks good.`);
  console.log(`\n${cyan}Next steps:${reset}`);
  console.log(`  1. Start dev server: ${cyan}npm run dev${reset}`);
  console.log(`  2. Login as admin: ${cyan}http://localhost:3000/admin/login${reset}`);
  console.log(`  3. Test upload: ${cyan}http://localhost:3000/admin/products/add${reset}`);
  console.log(`  4. Check diagnostics: ${cyan}http://localhost:3000/api/admin/diagnostics${reset}`);
} else if (hasErrors) {
  console.log(`${red}✗ Configuration has errors${reset}`);
  console.log(`  Please fix the issues above before uploading images.`);
  console.log(`\n${cyan}Quick fixes:${reset}`);
  console.log(`  • Copy service account JSON to .env.local`);
  console.log(`  • Set FIREBASE_STORAGE_BUCKET in .env.local`);
  console.log(`  • See ${cyan}UPLOAD_TROUBLESHOOTING.md${reset} for detailed instructions`);
} else if (hasWarnings) {
  console.log(`${yellow}⚠ Configuration has warnings${reset}`);
  console.log(`  Uploads might work, but some issues should be addressed.`);
}

console.log('');

// Exit with appropriate code
process.exit(hasErrors ? 1 : 0);
