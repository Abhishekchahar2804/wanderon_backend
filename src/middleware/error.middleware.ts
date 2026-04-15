import type { NextFunction, Request, Response } from 'express';

type ErrorWithStatus = Error & {
  statusCode?: number;
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ message: 'Route not found.' });
};

export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    res.status(401).json({
      message: 'Authentication token is invalid or expired.'
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'Something went wrong on the server.' : err.message;

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
};
