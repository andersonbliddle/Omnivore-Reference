const test = require('node:test');
const assert = require('node:assert');
const { DEFAULT_SETTINGS, mergeWithDefaults, parseSettings } = require('../shared/settings');

test('mergeWithDefaults: fills missing keys', () => {
  const r = mergeWithDefaults({ timerDuration: 30 });
  assert.strictEqual(r.sessionLength, DEFAULT_SETTINGS.sessionLength);
  assert.deepStrictEqual(r.collections, []);
});
test('mergeWithDefaults: file values override defaults', () => {
  assert.strictEqual(mergeWithDefaults({ timerDuration: 30 }).timerDuration, 30);
});
test('mergeWithDefaults: null/array/number input gives defaults', () => {
  for (const v of [null, [], 5, undefined, 'x']) {
    assert.deepStrictEqual(mergeWithDefaults(v), DEFAULT_SETTINGS);
  }
});
test('mergeWithDefaults: returns a fresh copy each call', () => {
  const a = mergeWithDefaults(null);
  a.collections.push({ id: 1 });
  assert.deepStrictEqual(mergeWithDefaults(null).collections, []);
  assert.deepStrictEqual(DEFAULT_SETTINGS.collections, []);
});
test('parseSettings: fix: corrupt JSON returns defaults', () => {
  assert.deepStrictEqual(parseSettings('{bad'), DEFAULT_SETTINGS);
});
test('parseSettings: empty string returns defaults', () => {
  assert.deepStrictEqual(parseSettings(''), DEFAULT_SETTINGS);
});
test('parseSettings: valid JSON merged', () => {
  const r = parseSettings('{"timerDuration":15}');
  assert.strictEqual(r.timerDuration, 15);
  assert.strictEqual(r.sessionLength, 10);
});
