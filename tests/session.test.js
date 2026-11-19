const test = require('node:test');
const assert = require('node:assert');
const { getEnabledImages, shuffle, pickSessionImages } = require('../shared/session');

function lcg(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

test('getEnabledImages: only enabled collections, in order', () => {
  const c = [
    { enabled: true, images: ['a', 'b'] },
    { enabled: false, images: ['x'] },
    { enabled: true, images: ['c'] },
  ];
  assert.deepStrictEqual(getEnabledImages(c), ['a', 'b', 'c']);
});
test('getEnabledImages: empty when none enabled', () => {
  assert.deepStrictEqual(getEnabledImages([{ enabled: false, images: ['a'] }]), []);
});
test('shuffle: returns a permutation and does not mutate input', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const copy = [...input];
  const r = shuffle(input);
  assert.deepStrictEqual(input, copy);
  assert.deepStrictEqual([...r].sort(), copy);
});
test('shuffle: deterministic with injected random', () => {
  const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8], lcg(42));
  const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8], lcg(42));
  assert.deepStrictEqual(a, b);
});
test('pickSessionImages: returns count items, no duplicates', () => {
  const r = pickSessionImages([1, 2, 3, 4, 5, 6, 7, 8], 5);
  assert.strictEqual(r.length, 5);
  assert.strictEqual(new Set(r).size, 5);
});
test('pickSessionImages: count larger than list returns all', () => {
  assert.strictEqual(pickSessionImages([1, 2, 3], 10).length, 3);
});
