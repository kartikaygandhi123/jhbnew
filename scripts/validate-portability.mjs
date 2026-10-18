import { readFileSync, existsSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';

const manifest = JSON.parse(readFileSync('src/lib/static-assets.json', 'utf8'));
assert.ok(manifest.length >= 31, 'Historical static asset inventory is incomplete');
for (const asset of manifest) {
  const path = `public${asset.url}`;
  assert.ok(existsSync(path), `Missing static file: ${path}`);
  assert.equal(statSync(path).size, asset.size, `Static file size mismatch: ${path}`);
}
assert.ok(statSync('public/jhb-logo.png').size > 100000, 'Full logo must be present');
const config = readFileSync('vite.vps.config.ts', 'utf8');
assert.ok(!config.includes('@lovable.dev/'), 'VPS config must use the independent build stack');
assert.ok(config.includes("preset: 'node-server'"), 'Node deployment target is required');
if (process.argv.includes('--output')) {
  assert.ok(existsSync('.output/server/index.mjs'), 'Node server build output is missing');
  for (const asset of manifest) assert.ok(existsSync(`.output/public${asset.url}`), `Missing build asset: ${asset.url}`);
  assert.ok(existsSync('.output/public/jhb-logo.png'), 'Logo not copied to build output');
}
console.log(`Validated ${manifest.length} repository assets and independent VPS configuration${process.argv.includes('--output') ? ' with Node output' : ' (production output not checked)'}.`);