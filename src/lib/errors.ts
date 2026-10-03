import { NextResponse } from 'next/server'

/**
 * Application errors.
 *
 * The rule: `message` is for the logs and may contain database detail;
 * `userMessage` is the only thing that ever reaches a browser. Postgres error
 * text can name tables, columns, constraints and policies, which is both
 * useless to a gym owner and a map of the schema for anyone else.
 */
export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly userMessage: string

  constructor(
    message: string,
    opts: { status: number; code: string; userMessage: string; cause?: unknown }
  ) {
    super(message)
    this.name = new.target.name
    this.status = opts.status
    this.code = opts.code
    this.userMessage = opts.userMessage
    if (opts.cause !== undefined) this.cause = opts.cause
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Not authenticated', userMessage = 'Please sign in to continue.') {
    super(message, { status: 401, code: 'UNAUTHENTICATED', userMessage })
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized', userMessage = 'You do not have access to this.') {
    super(message, { status: 403, code: 'FORBIDDEN', userMessage })
  }
}

export class ValidationError extends AppError {
  /** Validation text is author-written, so it is safe to show as-is. */
  constructor(userMessage: string, message = userMessage) {
    super(message, { status: 400, code: 'INVALID_INPUT', userMessage })
  }
}

export class NotFoundError extends AppError {
  constructor(what = 'Record', message = `${what} not found`) {
    super(message, { status: 404, code: 'NOT_FOUND', userMessage: `${what} not found.` })
  }
}

export class ConflictError extends AppError {
  constructor(userMessage: string, message = userMessage) {
    super(message, { status: 409, code: 'CONFLICT', userMessage })
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, {
      status: 500,
      code: 'DATABASE_ERROR',
      userMessage: 'Something went wrong on our end. Please try again.',
      cause,
    })
  }
}

/** The shape Supabase/PostgREST returns in `{ error }`. */
export interface PostgrestLikeError {
  message: string
  code?: string
  details?: string | null
  hint?: string | null
}

/**
 * Turns a Supabase error into a typed AppError.
 *
 * `P0001` is a deliberate `RAISE EXCEPTION` from our own SECURITY DEFINER
 * functions ("Member not found in gym", "Plan not found or inactive"). Those
 * are business rules we authored, so their text is shown. Everything else is
 * Postgres speaking, and is translated.
 */
export function fromPostgrestError(error: PostgrestLikeError, context: string): AppError {
  const code = error.code ?? ''
  const detail = `${context}: [${code || 'no-code'}] ${error.message}`

  switch (code) {
    case 'P0001': // raise_exception — our own business rule
      return new ValidationError(error.message, detail)

    case '23505': // unique_violation
      return new ConflictError('That record already exists.', detail)

    case '23503': // foreign_key_violation
      return new ValidationError('That reference is not valid.', detail)

    case '23514': // check_violation
      return new ValidationError('Those values are not allowed.', detail)

    case '42501': // insufficient_privilege — an RLS policy refused the write
      return new AuthorizationError(detail, 'You do not have access to this.')

    case 'PGRST116': // no rows where exactly one was expected
      return new NotFoundError('Record', detail)

    case 'PGRST202': // function missing from the schema cache
      return new DatabaseError(
        `${detail} — a database migration has probably not been applied`,
        error
      )

    default:
      return new DatabaseError(detail, error)
  }
}

/** Narrow an unknown caught value to an AppError, wrapping anything else. */
export function toAppError(e: unknown, context = 'Unhandled'): AppError {
  if (e instanceof AppError) return e
  if (e instanceof Error) return new DatabaseError(`${context}: ${e.message}`, e)
  return new DatabaseError(`${context}: ${String(e)}`)
}

/**
 * The single exit point for Route Handler errors: logs the detail on the
 * server, returns only the safe message to the browser.
 */
export function errorResponse(e: unknown, context = 'Route'): NextResponse {
  const err = toAppError(e, context)

  // 4xx below 500 are expected outcomes, not incidents — log them quietly.
  const line = `[${err.code}] ${err.message}`
  if (err.status >= 500) console.error(line, err.cause ?? '')
  else console.warn(line)

  return NextResponse.json(
    { error: err.userMessage, code: err.code },
    { status: err.status }
  )
}
