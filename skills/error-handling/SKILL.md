---
name: error-handling
description: Error handling patterns including custom error classes, operational vs programmer errors, structured logging, HTTP status mapping, and async error propagation for backend services.
origin: ECC
---

# Error Handling Patterns

Consistent, predictable error handling for backend services and APIs.

## When to Activate

- Implementing try-catch blocks or error middleware
- Designing error response formats for APIs
- Working with async/await error propagation
- Adding structured error logging
- Distinguishing between operational and programmer errors
- Building custom error classes or error hierarchies

## Core Principles

1. **Errors are data** — every error carries a code, message, HTTP status, and context
2. **Operational vs programmer** — handle expected failures gracefully; crash on bugs
3. **Never swallow errors** — empty catch blocks hide problems
4. **Never expose internals** — stack traces and query details stay server-side
5. **Log everything, return little** — structured server logs, clean client messages

## Error Classification

### Operational Errors (Expected)

Failures that can happen in normal operation. Handle gracefully and return appropriate HTTP status.

| Error | HTTP Status | Example |
|-------|-------------|---------|
| Validation failure | 400 | Missing required field |
| Authentication failure | 401 | Invalid or expired token |
| Authorization failure | 403 | User lacks permission |
| Resource not found | 404 | Entity does not exist |
| Conflict | 409 | Duplicate unique constraint |
| Rate limit exceeded | 429 | Too many requests |
| External service failure | 502/503 | Upstream timeout |

### Programmer Errors (Bugs)

Defects in the code. These should crash the process (or at least log critically) and get fixed, not handled.

- TypeError, ReferenceError
- Assertion failures
- Undefined function calls
- Reading property of undefined

## Custom Error Classes

Build a base error class that all application errors extend:

```typescript
class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} ${id} not found`, 404, { resource, id });
  }
}

class ValidationError extends AppError {
  constructor(details: Array<{ field: string; message: string }>) {
    super('VALIDATION_ERROR', 'Request validation failed', 400, { details });
  }
}

class ConflictError extends AppError {
  constructor(resource: string, field: string) {
    super('CONFLICT', `${resource} with this ${field} already exists`, 409, { resource, field });
  }
}
```

## API Error Response Format

All API errors use a consistent envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "must be a valid email address" },
      { "field": "age", "message": "must be a positive integer" }
    ]
  }
}
```

Rules:
- `code` is a machine-readable string constant (UPPER_SNAKE_CASE)
- `message` is a human-readable explanation (safe to display to end users)
- `details` is optional and provides field-level or context-specific info
- Never include stack traces, SQL queries, or internal paths

## Structured Error Logging

Log errors with enough context to debug without the stack trace alone:

```typescript
logger.error({
  errorCode: error.code,
  message: error.message,
  statusCode: error.statusCode,
  stack: error.stack,
  requestId: req.id,
  userId: req.user?.id,
  method: req.method,
  path: req.path,
  context: error.context,
});
```

Rules:
- Always include `requestId` for correlation
- Always include `userId` if authenticated
- Log the full stack trace server-side
- Use structured JSON format, not string interpolation
- Set appropriate log level: `error` for 5xx, `warn` for 4xx, `info` for expected failures

## Async Error Handling

### Express/Koa Middleware

Wrap async route handlers to catch unhandled rejections:

```typescript
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Usage
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) throw new NotFoundError('User', req.params.id);
  res.json(user);
}));
```

### Global Error Middleware

```typescript
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    logger.warn({ ...err, requestId: req.id });
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Programmer error — log full details, return generic message
  logger.error({ message: err.message, stack: err.stack, requestId: req.id });
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
};
```

### Unhandled Rejections

Always register a global handler as a safety net:

```typescript
process.on('unhandledRejection', (reason) => {
  logger.fatal({ message: 'Unhandled rejection', reason });
  process.exit(1);
});
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Empty `catch {}` | Error silently disappears | Log and re-throw or handle explicitly |
| `catch (e) { return null }` | Caller doesn't know something failed | Throw a typed error or return a Result type |
| String-only errors (`throw 'failed'`) | No stack trace, no type, no code | Throw an Error or AppError subclass |
| Logging `error.message` only | Loses stack trace and context | Log the full error object |
| Catching and re-throwing without context | Original context is lost | Wrap in a new error with `cause` |
| Generic 500 for all errors | Client can't distinguish errors | Use appropriate HTTP status codes |

## Checklist

- [ ] All errors extend a base AppError class
- [ ] Every error has a code, message, and statusCode
- [ ] Operational errors return appropriate HTTP status
- [ ] Programmer errors crash with full logging
- [ ] No stack traces in API responses
- [ ] Structured logging with requestId correlation
- [ ] Async handlers are wrapped (no unhandled rejections)
- [ ] Global error middleware catches everything
