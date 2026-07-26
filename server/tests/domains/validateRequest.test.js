const express = require('express');
const request = require('supertest');
const { validateRequest } = require('../../src/shared/middleware/validateRequest');
const { z, num, int } = require('../../src/shared/middleware/zodHelpers');
const errorHandler = require('../../src/shared/error/errorHandler');

/**
 * Express 5 defines req.query as a getter with no setter.
 *
 * While this middleware was CommonJS it ran in sloppy mode, where assigning to
 * a getter fails silently — so writing Joi's coerced value back to req.query
 * was always a no-op. TypeScript emits strict-mode modules, where that same
 * assignment throws a TypeError and every query-validated route 500s.
 *
 * These tests pin the current behaviour: body and params receive coerced
 * values, query does not, and nothing throws.
 */
const buildApp = (schemas, handler) => {
  const app = express();
  app.use(express.json());
  app.get('/q/:id', validateRequest(schemas), handler);
  app.post('/b', validateRequest(schemas), handler);
  app.use(errorHandler);
  return app;
};

describe('validateRequest', () => {
  it('does not throw when validating query on Express 5', async () => {
    const app = buildApp(
      { query: z.object({ page: int().min(1).optional() }) },
      (req, res) => res.json({ page: req.query.page })
    );

    const res = await request(app).get('/q/1?page=2');

    expect(res.status).toBe(200);
  });

  it('leaves req.query uncoerced — it stays the raw string', async () => {
    const app = buildApp(
      { query: z.object({ page: int().optional() }) },
      (req, res) => res.json({ page: req.query.page, type: typeof req.query.page })
    );

    const res = await request(app).get('/q/1?page=2');

    // Joi coerces internally, but the value cannot be written back to the
    // getter-only req.query. Controllers coerce themselves (e.g. Number(page)).
    expect(res.body.type).toBe('string');
    expect(res.body.page).toBe('2');
  });

  it('writes the coerced value back to req.body, which is writable', async () => {
    const app = buildApp(
      { body: z.object({ amount: num() }) },
      (req, res) => res.json({ amount: req.body.amount, type: typeof req.body.amount })
    );

    const res = await request(app).post('/b').send({ amount: '42' });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('number');
    expect(res.body.amount).toBe(42);
  });

  it('pins the error response contract', async () => {
    // Locked before the Joi -> Zod migration so the replacement can be proven
    // to emit an identical envelope. The client reads `message`; `details` is
    // unused by the UI but kept stable for API consumers.
    const app = buildApp(
      { body: z.object({ amount: num() }) },
      (_req, res) => res.json({ ok: true })
    );

    const res = await request(app).post('/b').send({ amount: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0]).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        path: 'amount',
        type: expect.any(String),
      })
    );
    // Quote-stripping is preserved from the Joi implementation.
    expect(res.body.details[0].message).not.toContain('"');
  });

  it('reports every failure, not just the first', async () => {
    const app = buildApp(
      {
        body: z.object({
          a: num(),
          b: num(),
        }),
      },
      (_req, res) => res.json({ ok: true })
    );

    const res = await request(app).post('/b').send({ a: 'x', b: 'y' });

    expect(res.status).toBe(400);
    expect(res.body.details).toHaveLength(2);
  });

  it('strips unknown keys rather than rejecting them', async () => {
    const app = buildApp(
      { body: z.object({ keep: z.string() }) },
      (req, res) => res.json({ body: req.body })
    );

    const res = await request(app).post('/b').send({ keep: 'yes', drop: 'no' });

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ keep: 'yes' });
  });

  it('still rejects invalid input with 400 and validation details', async () => {
    const app = buildApp(
      { query: z.object({ page: int().min(1).optional() }) },
      (_req, res) => res.json({ ok: true })
    );

    const res = await request(app).get('/q/1?page=notanumber');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0]).toHaveProperty('path', 'page');
  });
});
