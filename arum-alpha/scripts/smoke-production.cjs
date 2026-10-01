const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');
const root = path.resolve(__dirname, '..');

async function main() {
  // Ask the OS for an unused local port; do not interfere with the user's dev server.
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: root, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let logs = '';
  server.stdout.on('data', chunk => { logs += chunk; });
  server.stderr.on('data', chunk => { logs += chunk; });
  const base = `http://127.0.0.1:${port}`;
  const get = route => fetch(base + route, { signal: AbortSignal.timeout(10000) });
  const post = body => fetch(base + '/api/estimate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (server.exitCode !== null) throw new Error('Production server exited early');
      try { ready = (await get('/api/estimate')).ok; } catch { /* server starting */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert(ready, 'Production server did not start');
    const page = await get('/');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /194,038/);
    const response = await get('/api/data');
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.dataPoints, 194038);
    assert.deepEqual(data.grid, { nx: 439, ny: 442 });
    const point = data.sample[0];
    const lookup = await post({ lat: point.lat, lng: point.lng });
    assert.equal(lookup.status, 200);
    const result = await lookup.json();
    assert.equal(result.prediction.sheetMatch.cell, 'B2');
    assert.equal(result.prediction.potassium, -0.6555745601654053);
    for (const key of ['potassium', 'thorium', 'uranium']) assert.equal(result.prediction[key], point[key]);
    assert.equal((await post({ lat: 0, lng: 0 })).status, 404);
    assert.equal((await post({ lat: 'bad', lng: 8.75 })).status, 400);
    assert.equal((await get('/data/naraguta.bin')).status, 404);
    console.log('Production HTTP checks passed: page, grid metadata, exact workbook values, coverage, validation and private data file.');
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    server.kill();
    if (server.exitCode === null) await new Promise(resolve => server.once('exit', resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
