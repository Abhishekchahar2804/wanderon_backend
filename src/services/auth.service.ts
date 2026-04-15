import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { AppEnv } from '../config/env.js';
import { User } from '../models/user.model.js';
import type { LoginInput, RegisterInput } from '../validators/auth.schemas.js';
import { AppError } from '../utils/AppError.js';

export const registerUser = async ({
  name,
  email,
  password
}: RegisterInput) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  return user;
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  return user;
};

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
};

export const signAccessToken = (
  payload: TokenPayload,
  env: AppEnv
): string =>
  jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn as SignOptions['expiresIn']
  });

export const signRefreshToken = (
  payload: TokenPayload,
  env: AppEnv
): string =>
  jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn as SignOptions['expiresIn']
  });

export const persistRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
  await User.findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken });
};

export const clearRefreshToken = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const verifyStoredRefreshToken = async (
  userId: string,
  refreshToken: string
) => {
  const user = await User.findById(userId);

  if (!user || !user.refreshToken) {
    throw new AppError('Refresh session is invalid.', 401);
  }

  const isRefreshTokenValid = await bcrypt.compare(
    refreshToken,
    user.refreshToken
  );

  if (!isRefreshTokenValid) {
    throw new AppError('Refresh session is invalid.', 401);
  }

  return user;
};
