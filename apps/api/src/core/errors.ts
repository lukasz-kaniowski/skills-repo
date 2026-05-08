import type { ErrorHandler } from "hono";

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof ValidationError) return c.json({ error: err.message }, 400);
  if (err instanceof NotFoundError)
    return c.json({ error: err.message || "not found" }, 404);
  if (err instanceof ConflictError) return c.json({ error: err.message }, 409);
  throw err;
};
