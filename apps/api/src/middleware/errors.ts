import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

/** An error whose message is safe to show to the client. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join('; ');
    res.status(400).json({ data: null, error: { message } });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ data: null, error: { message: err.message } });
    return;
  }

  // body-parser errors (malformed JSON, body too large) carry a client-safe status.
  if (typeof err.status === 'number' && err.status < 500 && err.expose) {
    const message = err.status === 413 ? 'Request body too large' : 'Invalid request body';
    res.status(err.status).json({ data: null, error: { message } });
    return;
  }

  // Log the message only: stacks and request bodies could contain secrets or post text.
  console.error('Unhandled error:', err instanceof Error ? err.message : 'unknown');
  res.status(500).json({ data: null, error: { message: 'Something went wrong' } });
};
