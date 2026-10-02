const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, file);
let response;
class FakeGroq {
  chat = { completions: { create: async () => {
    if (response instanceof Error) throw response;
    return { choices: [{ message: { content: JSON.stringify(response) } }] };
  } } };
}
require('groq-sdk');
require.cache[require.resolve('groq-sdk')].exports = FakeGroq;
const { analyzeGrid } = require('../lib/gridAnalysis.ts');
const point = { x: 472562.5, y: 1077812.5, lat: 9.75, lng: 8.75, potassium: -0.37, thorium: -19.607, uranium: -4.983 };
(async () => {
  delete process.env.GROQ_API_KEY;
  const local = await analyzeGrid(point, [point]);
  assert.equal(local.analysisSource, 'local');
  assert.equal(local.recommendations.length, 3);
  process.env.GROQ_API_KEY = 'test-only';
  response = { analysis: 'Compare local variation.', recommendations: ['Verify calibration.'] };
  const ai = await analyzeGrid(point, [point]);
  assert.equal(ai.analysisSource, 'ai');
  assert.deepEqual(ai.recommendations, response.recommendations);
  response = { analysis: 9, recommendations: [null] };
  assert.deepEqual(await analyzeGrid(point, []), local);
  response = new Error('Service unavailable');
  assert.deepEqual(await analyzeGrid(point, []), local);
  assert.equal(point.potassium, -0.37);
  console.log('AI analysis checks passed: valid response, malformed response, missing key, service failure, and unchanged grid values.');
})().catch(error => { console.error(error); process.exitCode = 1; });
