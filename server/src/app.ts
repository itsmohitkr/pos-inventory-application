import express = require('express');
import cors = require('cors');
import bodyParser = require('body-parser');
import helmet from 'helmet';
import logger = require('./shared/utils/logger');

import pathNotFound = require('./shared/error/pathNotFound');
import errorHandler = require('./shared/error/errorHandler');
import apiRouter = require('./apiRouter');

const app = express();

// Production security middleware
app.use(helmet());

// Restrict to localhost origins only (Electron renderer uses null origin in production,
// localhost:5173 in dev with Vite)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null' || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
}));

// Hard-reject any request not originating from the local machine.
// The server binds to 127.0.0.1, so this is defence-in-depth against
// misconfigured reverse proxies or future bind changes.
app.use((req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  logger.warn({ ip, url: req.url }, 'Rejected non-localhost request');
  return res.status(403).json({ error: 'Forbidden' });
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming Request');
    next();
});

// Handle legacy un-prefixed routes if any (all should be prefixed now)
// Note: If any routes were previously mounted without prefix (e.g. app.use(productRoutes)), 
// they should now be accessed via /api/products etc.

app.use('/api', apiRouter);
app.use(pathNotFound);
app.use(errorHandler);

export = app;
