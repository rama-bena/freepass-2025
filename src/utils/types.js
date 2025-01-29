export const Role = Object.freeze({
  ADMIN: 'admin',
  EVENT_COORDINATOR: 'event-coordinator',
  USER: 'user',
});

export const SessionStatus = Object.freeze({
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
});

export const HttpStatusCode = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
});

export const ResponseError = Object.freeze({
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INVALID: 'INVALID',
  LOGIN_FAILED: 'LOGIN_FAILED',
  ADMIN_ONLY: 'ADMIN_ONLY',
});

