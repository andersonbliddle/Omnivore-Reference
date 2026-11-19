const path = require('path');
const { buildApp } = require('./app');
const { openDb } = require('./db');

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'omnivore.db');
  const db = openDb(dbPath);
  const app = buildApp({ logger: true, db });
  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
