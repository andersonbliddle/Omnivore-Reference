const path = require('path');
const Fastify = require('fastify');

function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? false });

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
