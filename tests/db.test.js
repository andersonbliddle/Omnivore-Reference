const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openDb, getPrefs, setPref, replaceCollectionImages, DEFAULT_PREFS } = require('../server/db');

function addCollection(db, name = 'c', p = 'a/b') {
  return db
    .prepare('INSERT INTO collections (name, path, created_at) VALUES (?, ?, ?)')
    .run(name, p, Date.now()).lastInsertRowid;
}

test('db: migrations set user_version to 1 and create all tables', () => {
  const db = openDb(':memory:');
  assert.strictEqual(db.pragma('user_version', { simple: true }), 1);
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((r) => r.name);
  for (const t of [
    'collections',
    'tags',
    'collection_tags',
    'practice_sets',
    'practice_set_collections',
    'images',
    'prefs',
  ]) {
    assert.ok(names.includes(t), 'missing table ' + t);
  }
  db.close();
});

test('db: reopening a file DB does not rerun migrations', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnivore-db-'));
  const file = path.join(dir, 'sub', 't.db');
  try {
    let db = openDb(file);
    addCollection(db);
    db.close();
    db = openDb(file);
    assert.strictEqual(db.prepare('SELECT COUNT(*) AS n FROM collections').get().n, 1);
    assert.strictEqual(db.pragma('user_version', { simple: true }), 1);
    db.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('db: foreign_keys pragma is on', () => {
  const db = openDb(':memory:');
  assert.strictEqual(db.pragma('foreign_keys', { simple: true }), 1);
  db.close();
});

test('db: deleting a collection cascades to images, collection_tags, practice_set_collections', () => {
  const db = openDb(':memory:');
  const cid = addCollection(db);
  const tid = db.prepare('INSERT INTO tags (name) VALUES (?)').run('t').lastInsertRowid;
  const pid = db
    .prepare('INSERT INTO practice_sets (name, created_at, updated_at) VALUES (?, 1, 1)')
    .run('s').lastInsertRowid;
  db.prepare('INSERT INTO collection_tags VALUES (?, ?)').run(cid, tid);
  db.prepare('INSERT INTO practice_set_collections VALUES (?, ?)').run(pid, cid);
  replaceCollectionImages(db, cid, [{ relPath: 'x.jpg', mtimeMs: 1, size: 2 }]);
  db.prepare('DELETE FROM collections WHERE id = ?').run(cid);
  for (const t of ['images', 'collection_tags', 'practice_set_collections']) {
    assert.strictEqual(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, 0, t);
  }
  db.close();
});

test('db: collection path and tag name are unique', () => {
  const db = openDb(':memory:');
  addCollection(db, 'a', 'p');
  assert.throws(() => addCollection(db, 'b', 'p'));
  db.prepare('INSERT INTO tags (name) VALUES (?)').run('t');
  assert.throws(() => db.prepare('INSERT INTO tags (name) VALUES (?)').run('t'));
  db.close();
});

test('db: getPrefs returns defaults when empty', () => {
  const db = openDb(':memory:');
  assert.deepStrictEqual(getPrefs(db), DEFAULT_PREFS);
  db.close();
});

test('db: setPref round-trips JSON values and overrides defaults', () => {
  const db = openDb(':memory:');
  setPref(db, 'timerDuration', 90);
  setPref(db, 'useRegex', true);
  setPref(db, 'currentPracticeSet', null);
  setPref(db, 'iconSize', 'large');
  setPref(db, 'iconSize', 'small');
  setPref(db, 'custom', 'x');
  const p = getPrefs(db);
  assert.strictEqual(p.timerDuration, 90);
  assert.strictEqual(p.useRegex, true);
  assert.strictEqual(p.currentPracticeSet, null);
  assert.strictEqual(p.iconSize, 'small');
  assert.strictEqual(p.custom, 'x');
  assert.strictEqual(p.sessionLength, DEFAULT_PREFS.sessionLength);
  db.close();
});

test('db: replaceCollectionImages replaces the list and updates image_count and scanned_at', () => {
  const db = openDb(':memory:');
  const cid = addCollection(db);
  replaceCollectionImages(db, cid, [
    { relPath: 'a.jpg', mtimeMs: 1, size: 1 },
    { relPath: 'b.jpg', mtimeMs: 2, size: 2 },
  ]);
  replaceCollectionImages(db, cid, [{ relPath: 'c.jpg', mtimeMs: 3, size: 3 }]);
  const rows = db.prepare('SELECT rel_path FROM images WHERE collection_id = ?').all(cid);
  assert.deepStrictEqual(rows.map((r) => r.rel_path), ['c.jpg']);
  const c = db.prepare('SELECT image_count, scanned_at FROM collections WHERE id = ?').get(cid);
  assert.strictEqual(c.image_count, 1);
  assert.ok(c.scanned_at > 0);
  db.close();
});

test('db: replaceCollectionImages rolls back on error', () => {
  const db = openDb(':memory:');
  const cid = addCollection(db);
  replaceCollectionImages(db, cid, [{ relPath: 'a.jpg', mtimeMs: 1, size: 1 }]);
  assert.throws(() =>
    replaceCollectionImages(db, cid, [
      { relPath: 'd.jpg', mtimeMs: 1, size: 1 },
      { relPath: 'd.jpg', mtimeMs: 1, size: 1 },
    ])
  );
  const rows = db.prepare('SELECT rel_path FROM images WHERE collection_id = ?').all(cid);
  assert.deepStrictEqual(rows.map((r) => r.rel_path), ['a.jpg']);
  assert.strictEqual(db.prepare('SELECT image_count FROM collections WHERE id = ?').get(cid).image_count, 1);
  db.close();
});
