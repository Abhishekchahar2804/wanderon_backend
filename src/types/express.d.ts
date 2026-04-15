import type { SanitizedUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: SanitizedUser;
    }
  }
}
export {};
