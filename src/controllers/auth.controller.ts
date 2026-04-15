import type { CookieOptions, RequestHandler, Response } from 'express';
import type { AppEnv } from '../config/env.js';
import type { SanitizedUser } from '../types/auth.js';
import jwt from 'jsonwebtoken';
import type { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import {
  clearRefreshToken,
  loginUser,
  persistRefreshToken,
  registerUser,
  signAccessToken,
  signRefreshToken,
  verifyStoredRefreshToken
} from '../services/auth.service.js';

type RefreshTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name: string;
};

const createAccessCookieOptions = (env: AppEnv): CookieOptions => ({
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  maxAge: 15 * 60 * 1000
});

const createRefreshCookieOptions = (env: AppEnv): CookieOptions => ({
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const createAccessClearCookieOptions = (env: AppEnv): CookieOptions => ({
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction
});

const createRefreshClearCookieOptions = (env: AppEnv): CookieOptions => ({
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction
});

const buildAuthResponse = (user: {
  id?: string;
  _id?: { toString(): string };
  name: string;
  email: string;
  createdAt: Date;
}): SanitizedUser => ({
  id: user.id || user._id?.toString() || '',
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

const setAuthCookies = async (
  res: Response,
  env: AppEnv,
  user: { id?: string; _id?: { toString(): string }; name: string; email: string }
): Promise<void> => {
  const userId = user.id || user._id?.toString();

  if (!userId) {
    throw new AppError('User identifier is missing.', 500);
  }

  const payload = { sub: userId, email: user.email, name: user.name };
  const accessToken = signAccessToken(payload, env);
  const refreshToken = signRefreshToken(payload, env);

  await persistRefreshToken(userId, refreshToken);

  res.cookie(
    env.accessCookieName,
    accessToken,
    createAccessCookieOptions(env)
  );
  res.cookie(
    env.refreshCookieName,
    refreshToken,
    createRefreshCookieOptions(env)
  );
};

export const register = (env: AppEnv): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = await registerUser(req.body);
      await setAuthCookies(res, env, user);

      res.status(201).json({
        message: 'Registration successful.',
        user: buildAuthResponse(user)
      });
    } catch (error) {
      next(error);
    }
  };

export const login = (env: AppEnv): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = await loginUser(req.body);
      await setAuthCookies(res, env, user);

      res.status(200).json({
        message: 'Login successful.',
        user: buildAuthResponse(user)
      });
    } catch (error) {
      next(error);
    }
  };

export const refreshSession = (env: AppEnv): RequestHandler =>
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies[env.refreshCookieName] as
        | string
        | undefined;

      if (!refreshToken) {
        throw new AppError('Refresh token is required.', 401);
      }

      const decoded = jwt.verify(
        refreshToken,
        env.refreshTokenSecret
      ) as RefreshTokenPayload;

      const user = await verifyStoredRefreshToken(decoded.sub, refreshToken);

      await setAuthCookies(res, env, user);

      res.status(200).json({
        message: 'Session refreshed successfully.',
        user: buildAuthResponse(user)
      });
    } catch (error) {
      if (
        error instanceof jwt.JsonWebTokenError ||
        (error as TokenExpiredError).name === 'TokenExpiredError'
      ) {
        next(new AppError('Refresh token is invalid or expired.', 401));
        return;
      }

      next(error);
    }
  };

export const logout = (env: AppEnv): RequestHandler =>
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies[env.refreshCookieName] as
        | string
        | undefined;

      if (refreshToken) {
        try {
          const decoded = jwt.verify(
            refreshToken,
            env.refreshTokenSecret
          ) as RefreshTokenPayload;
          await clearRefreshToken(decoded.sub);
        } catch {
          // Ignore invalid refresh tokens during logout and clear cookies anyway.
        }
      }

      res.clearCookie(
        env.accessCookieName,
        createAccessClearCookieOptions(env)
      );
      res.clearCookie(
        env.refreshCookieName,
        createRefreshClearCookieOptions(env)
      );
      res.status(200).json({ message: 'Logout successful.' });
    } catch (error) {
      next(error);
    }
  };

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json({ user: buildAuthResponse(req.user as SanitizedUser) });
  } catch (error) {
    next(error);
  }
};
