import { spawnSync } from 'node:child_process';
import process from 'node:process';

const isCloudflarePages =
  process.env.CF_PAGES ||
  process.env.CLOUDFLARE_PAGES ||
  process.env.CF_PAGES_BRANCH ||
  process.env.CF_PAGES_COMMIT_SHA;

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const commandArgs = isCloudflarePages
  ? ['@cloudflare/next-on-pages']
  : ['next', 'build'];

const result = spawnSync(npxCommand, commandArgs, {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
  shell: false,
});

if (result.status !== 0) {
  const script = isCloudflarePages ? 'npx @cloudflare/next-on-pages' : 'npx next build';
  console.error(`[build] Command "${script}" exited with code ${result.status}.`);
  process.exit(result.status ?? 1);
}
