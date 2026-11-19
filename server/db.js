const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SQL_V1 = `
CREATE TABLE collections (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  scanned_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE collection_tags (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, tag_id)
);
CREATE TABLE practice_sets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE practice_set_collections (
  practice_set_id INTEGER NOT NULL REFERENCES practice_sets(id) ON DELETE CASCADE,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (practice_set_id, collection_id)
);
CREATE TABLE images (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  rel_path TEXT NOT NULL,
  mtime_ms INTEGER NOT NULL,
  size INTEGER NOT NULL,
  UNIQUE (collection_id, rel_path)
);
CREATE TABLE prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const MIGRATIONS = [SQL_V1];

const DEFAULT_PREFS = {
  timerDuration: 60,
  sessionLength: 10,
  iconSize: 'medium',
  useRegex: false,
  currentPracticeSet: null,
};

function migrate(db) {
  const current = db.pragma('user_version', { simple: true });
  const run = db.transaction(() => {
    MIGRATIONS.forEach((sql, i) => {
      if (i >= current) {
        db.exec(sql);
        db.pragma('user_version = ' + (i + 1));
      }
    });
  });
  run();
}

function openDb(filename) {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function getPrefs(db) {
  const prefs = { ...DEFAULT_PREFS };
  for (const row of db.prepare('SELECT key, value FROM prefs').all()) {
    prefs[row.key] = JSON.parse(row.value);
  }
  return prefs;
}

function setPref(db, key, value) {
  db.prepare(
    'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(value));
}

function replaceCollectionImages(db, collectionId, images) {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM images WHERE collection_id = ?').run(collectionId);
    const insert = db.prepare(
      'INSERT INTO images (collection_id, rel_path, mtime_ms, size) VALUES (?, ?, ?, ?)'
    );
    for (const img of images) {
      insert.run(collectionId, img.relPath, img.mtimeMs, img.size);
    }
    db.prepare('UPDATE collections SET image_count = ?, scanned_at = ? WHERE id = ?').run(
      images.length,
      Date.now(),
      collectionId
    );
  });
  run();
}

module.exports = { openDb, getPrefs, setPref, replaceCollectionImages, DEFAULT_PREFS };
