const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
process.chdir(path.resolve(__dirname, '..'));
require.extensions['.ts'] = (module, file) => {
  const source = fs.readFileSync(file, 'utf8').replaceAll("'@/lib/grdParser'", JSON.stringify(path.resolve('lib/grdParser.ts')));
  module._compile(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, esModuleInterop: true, resolveJsonModule: true,
  } }).outputText, file);
};
const { loadAllRadiometricData, findNearestDataPoint, utmToLatLng, latLngToUtm, getSheetMatch } = require('../lib/grdParser.ts');
const { POST } = require('../app/api/estimate/route.ts');
const data = loadAllRadiometricData();
assert.equal(data.length, 194038);
assert.equal(data[0].potassium, -0.6555745601654053);
assert.equal(getSheetMatch(data[0], data[0].lat, data[0].lng).cell, 'B2');
assert.equal(getSheetMatch(data.at(-1), data.at(-1).lat, data.at(-1).lng).cell, 'PX443');
// Independent known projection anchor: central meridian on the equator.
assert.deepEqual(latLngToUtm(0, 9), { x: 500000, y: 0 });
// Every grid cell must survive conversion and round to its original row/column.
for (const point of data) assert.equal(findNearestDataPoint(data, point.lat, point.lng), point);
for (const [x, y] of [[445000, 1070000], [500100, 1070000], [470000, 1050000], [470000, 1105500]]) {
  const p = utmToLatLng(x, y);
  assert.equal(findNearestDataPoint(data, p.lat, p.lng), null);
}
assert.throws(() => loadAllRadiometricData('missing-data-directory'));
const request = body => new Request('http://localhost/api/estimate', { method: 'POST', body: JSON.stringify(body) });
(async () => {
  for (const index of [0, 438, 439, 80000, data.length - 1]) {
    const point = data[index];
    const body = { lat: point.lat, lng: point.lng, includeSurrounding: true };
    const response = await POST(request(body));
    assert.equal(response.status, 200);
    const result = await response.json();
    for (const key of ['x', 'y', 'potassium', 'thorium', 'uranium']) assert.equal(result.prediction[key], point[key]);
    assert.equal(result.prediction.predictedGrade, undefined);
    assert.deepEqual(await (await POST(request(body))).json(), result);
  }
  assert.equal((await POST(request({lat: 0, lng: 0}))).status, 404);
  for (const body of [null, {}, {lat: '9.75', lng: 8.75}, {lat: 91, lng: 8}, {lat: 9.75, lng: 8.75, radius: -1}]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  console.log('Passed: all 194,038 cell lookups, projection anchor, bounds, missing data, API values, repeatability and input validation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
