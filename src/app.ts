import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import type { AppEnv } from './config/env.ts';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { createAuthRouter } from './routes/auth.routes.js';

export const createApp = (env: AppEnv) => {
  const app = express();

  if (env.isProduction) {
    // Render sits behind a reverse proxy, so Express should trust the first hop.
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(mongoSanitize());
  app.use(cookieParser());
  app.use(express.json({ limit: '10kb' }));
  app.use(morgan('dev'));
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ message: 'Server is healthy.' });
  });

  app.use('/api/auth', createAuthRouter(env));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
