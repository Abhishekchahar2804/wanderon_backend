import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import type { AppEnv } from '../config/env.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';

type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name: string;
};

export const authenticate = (env: AppEnv): RequestHandler =>
  async (req, _res, next) => {
    try {
      const token = req.cookies[env.accessCookieName] as string | undefined;

      if (!token) {
        throw new AppError('Authentication required.', 401);
      }

      const decoded = jwt.verify(
        token,
        env.accessTokenSecret
      ) as AuthTokenPayload;
      const user = await User.findById(decoded.sub);

      if (!user) {
        throw new AppError('User no longer exists.', 401);
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      };

      next();
    } catch (error) {
      if (
        error instanceof jwt.JsonWebTokenError ||
        (error as TokenExpiredError).name === 'TokenExpiredError'
      ) {
        next(new AppError('Access token is invalid or expired.', 401));
        return;
      }

      next(error);
    }
  };
