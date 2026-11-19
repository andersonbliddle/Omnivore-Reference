const path = require('path');
const Fastify = require('fastify');
const { openDb } = require('./db');

function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? false });

  const db = opts.db || openDb(':memory:');
  app.decorate('db', db);
  app.addHook('onClose', async () => db.close());

  app.register(require('@fastify/static'), {
    root: path.join(__dirname, '..', 'web'),
    prefix: '/',
  });
  app.register(require('@fastify/static'), {
    root: path.join(__dirname, '..', 'shared'),
    prefix: '/shared/',
    decorateReply: false,
  });

  app.get('/api/health', async () => ({ ok: true }));

  return app;
}

module.exports = { buildApp };
