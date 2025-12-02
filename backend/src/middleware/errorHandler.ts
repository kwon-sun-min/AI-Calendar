import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError';

export const notFoundHandler: RequestHandler = (_req, res, _next) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // eslint-disable-next-line no-console
  console.error('Unexpected error', err);
  return res.status(500).json({ message: 'Internal server error' });
};



