import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const binDir = path.join(projectRoot, 'node_modules', '.bin');
const binPath = path.join(binDir, 'wrangler');

if (!fs.existsSync(binPath)) {
  // Nothing to shim yet (likely running in CI without installed deps)
  process.exit(0);
}

try {
  const stat = fs.lstatSync(binPath);
  if (stat.isSymbolicLink() || stat.isFile()) {
    fs.unlinkSync(binPath);
  }
} catch (error) {
  if (error.code !== 'ENOENT') {
    console.warn('[wrangler-shim] Failed to remove existing wrangler binary:', error);
  }
}

const shimContent = `#!/usr/bin/env node
const { spawn } = require('node:child_process');

const args = process.argv.slice(2);
if (args[0] === 'deploy' && args[1] !== 'pages') {
  args.unshift('pages');
}

const cliPath = require.resolve('wrangler/bin/wrangler.js');
const child = spawn(process.execPath, [cliPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
`;

fs.mkdirSync(binDir, { recursive: true });
fs.writeFileSync(binPath, shimContent, { mode: 0o755 });

const windowsShimPath = path.join(binDir, 'wrangler.cmd');
if (fs.existsSync(windowsShimPath)) {
  try {
    fs.unlinkSync(windowsShimPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('[wrangler-shim] Failed to remove windows shim:', error);
    }
  }
}
