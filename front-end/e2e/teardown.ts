import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default function teardown() {
  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'tests/e2e/cleanup.ts'], {
    cwd: resolve('../back-end'),
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'pipe',
  });
}
