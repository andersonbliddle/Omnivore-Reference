const test = require('node:test');
const assert = require('node:assert');
const { buildApp } = require('../server/app');

test('server: GET /api/health returns ok', async () => {
  const app = buildApp();
  try {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(res.body), { ok: true });
  } finally {
    await app.close();
  }
});

test('server: GET / serves web/index.html', async () => {
  const app = buildApp();
  try {
    const res = await app.inject({ method: 'GET', url: '/' });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].startsWith('text/html'));
    assert.ok(res.body.includes('Omnivore Reference'));
  } finally {
    await app.close();
  }
});

test('server: GET /shared/filters.js serves shared module', async () => {
  const app = buildApp();
  try {
    const res = await app.inject({ method: 'GET', url: '/shared/filters.js' });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('OmnivoreFilters'));
  } finally {
    await app.close();
  }
});

test('server: unknown API route returns 404', async () => {
  const app = buildApp();
  try {
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    assert.strictEqual(res.statusCode, 404);
  } finally {
    await app.close();
  }
});

test('server: path traversal outside web root is refused', async () => {
  const app = buildApp();
  try {
    for (const url of ['/../package.json', '/shared/../package.json']) {
      const res = await app.inject({ method: 'GET', url });
      assert.notStrictEqual(res.statusCode, 200, url);
    }
  } finally {
    await app.close();
  }
});
