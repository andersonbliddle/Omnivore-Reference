const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('smoke: app entry files exist and package main points at main.js', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.main, 'main.js');
  for (const f of ['main.js', 'preload.js', 'renderer.js', 'index.html', 'styles.css']) {
    assert.ok(fs.existsSync(path.join(root, f)), `${f} missing`);
  }
});
