/**
 * Domain error hierarchy.
 *
 * Every backend error is normalised into one of these classes by
 * the API client.  Service and action layers can then `catch`
 * by class instead of inspecting raw status codes.
 *
 * All extend a common `ApiError` base so a single catch block
 * can still handle every API failure.
 */

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(400, "BAD_REQUEST", message);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends ApiError {
  public readonly fields: Record<string, string>;

  constructor(message = "Validation failed", fields: Record<string, string> = {}) {
    super(422, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class RateLimitError extends ApiError {
  /**
   * Seconds the caller should wait before retrying, parsed from the
   * `Retry-After` response header. `null` when the header was missing
   * or malformed — callers should fall back to a generic "try again
   * later" message in that case.
   */
  public readonly retryAfterSeconds: number | null;

  constructor(
    message = "Too many requests",
    retryAfterSeconds: number | null = null
  ) {
    super(429, "RATE_LIMIT", message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(500, "SERVER_ERROR", message);
    this.name = "ServerError";
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network error — backend unreachable") {
    super(0, "NETWORK_ERROR", message);
    this.name = "NetworkError";
  }
}

// ─── Factory ────────────────────────────────────────────────
/**
 * Maps an HTTP status + backend message into the correct
 * domain error class. The optional `extras` bag carries
 * status-specific metadata (e.g. `retryAfterSeconds` for 429).
 */
export interface CreateApiErrorExtras {
  retryAfterSeconds?: number | null;
}

export function createApiError(
  status: number,
  message: string,
  extras: CreateApiErrorExtras = {}
): ApiError {
  switch (status) {
    case 400:
      return new BadRequestError(message);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 422:
      return new ValidationError(message);
    case 429:
      return new RateLimitError(message, extras.retryAfterSeconds ?? null);
    default:
      return status >= 500
        ? new ServerError(message)
        : new ApiError(status, "UNKNOWN", message);
  }
}
