// Fail the deployment build if a runtime data file is missing from either API bundle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'data/naraguta.json'), 'utf8'));
const dataPath = path.join(root, 'data/naraguta.bin');
const bytes = fs.readFileSync(dataPath);
assert.equal(bytes.length, metadata.nx * metadata.ny * 24, 'Incomplete sheet export');
assert.equal(createHash('sha256').update(bytes).digest('hex'), metadata.dataSha256, 'Sheet checksum mismatch');
for (const route of ['data', 'estimate']) {
  const tracePath = path.join(root, `.next/server/app/api/${route}/route.js.nft.json`);
  const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
  const files = trace.files.map(file => path.resolve(path.dirname(tracePath), file));
  assert(files.includes(dataPath), `Naraguta data missing from /api/${route} deployment bundle`);
  for (const file of files) assert(fs.existsSync(file), `Traced file does not exist: ${file}`);
  const size = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  assert(size < 250 * 1024 * 1024, `/api/${route} trace exceeds 250 MB`);
  console.log(`/api/${route}: sheet included; traced files ${(size / 1024 / 1024).toFixed(1)} MiB`);
}
console.log(`Production data verified: ${(bytes.length / 1024 / 1024).toFixed(1)} MiB, ${metadata.nx * metadata.ny} cells.`);
