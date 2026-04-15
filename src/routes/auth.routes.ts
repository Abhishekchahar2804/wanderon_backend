import { Router } from 'express';
import type { AppEnv } from '../config/env.js';
import {
  getMe,
  login,
  logout,
  refreshSession,
  register
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../validators/auth.schemas.js';

export const createAuthRouter = (env: AppEnv) => {
  const router = Router();

  router.post('/register', validateRequest(registerSchema), register(env));
  router.post('/login', validateRequest(loginSchema), login(env));
  router.post('/refresh', refreshSession(env));
  router.post('/logout', logout(env));
  router.get('/me', authenticate(env), getMe);

  return router;
};
