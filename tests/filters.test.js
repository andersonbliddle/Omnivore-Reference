const test = require('node:test');
const assert = require('node:assert');
const { filterCollections, collectTags } = require('../shared/filters');

const cols = [
  { name: 'Hands Study', tags: ['anatomy', 'hands'] },
  { name: 'Faces', tags: ['anatomy'] },
  { name: 'Landscape 01', tags: ['env'] },
  { name: 'Landscape 02', tags: [] },
];
const names = r => r.map(c => c.name);

test('filterCollections: empty filters return all', () => {
  const r = filterCollections(cols);
  assert.deepStrictEqual(names(r), names(cols));
  assert.notStrictEqual(r, cols);
});
test('filterCollections: text match is case-insensitive substring', () => {
  assert.deepStrictEqual(names(filterCollections(cols, { textFilter: 'LAND' })), ['Landscape 01', 'Landscape 02']);
});
test('filterCollections: regex mode matches names', () => {
  assert.deepStrictEqual(names(filterCollections(cols, { textFilter: '\\d{2}$', useRegex: true })), ['Landscape 01', 'Landscape 02']);
});
test('filterCollections: invalid regex falls back to substring', () => {
  assert.deepStrictEqual(names(filterCollections(cols, { textFilter: 'faces(', useRegex: true })), []);
  assert.deepStrictEqual(names(filterCollections([{ name: 'a(b', tags: [] }], { textFilter: 'a(', useRegex: true })), ['a(b']);
});
test('filterCollections: whitespace-only text is ignored', () => {
  assert.strictEqual(filterCollections(cols, { textFilter: '   ' }).length, 4);
});
test('filterCollections: include tags require all (AND)', () => {
  assert.deepStrictEqual(names(filterCollections(cols, { includeTags: ['anatomy', 'hands'] })), ['Hands Study']);
});
test('filterCollections: exclude tags drop any match', () => {
  assert.deepStrictEqual(names(filterCollections(cols, { excludeTags: ['hands', 'env'] })), ['Faces', 'Landscape 02']);
});
test('filterCollections: include and exclude combine with text', () => {
  const r = filterCollections(cols, { textFilter: 'a', includeTags: ['anatomy'], excludeTags: ['hands'] });
  assert.deepStrictEqual(names(r), ['Faces']);
});
test('filterCollections: accepts Sets for tags', () => {
  const r = filterCollections(cols, { includeTags: new Set(['anatomy']), excludeTags: new Set(['hands']) });
  assert.deepStrictEqual(names(r), ['Faces']);
});
test('filterCollections: collection without tags array is handled', () => {
  const c = [{ name: 'x' }, { name: 'y', tags: ['t'] }];
  assert.deepStrictEqual(names(filterCollections(c, { includeTags: ['t'] })), ['y']);
  assert.deepStrictEqual(names(filterCollections(c, { excludeTags: ['t'] })), ['x']);
});
test('collectTags: unions tags and skips missing arrays', () => {
  const s = collectTags([{ tags: ['a', 'b'] }, {}, { tags: ['b', 'c'] }]);
  assert.deepStrictEqual([...s].sort(), ['a', 'b', 'c']);
});
