import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

/**
 * Application error with an explicit HTTP status code. Throw from any
 * route handler — the global error middleware will turn it into a
 * standardized JSON response.
 */
export class AppError extends Error {
    public readonly statusCode: number
    public readonly code?: string
    public readonly details?: unknown

    constructor(statusCode: number, message: string, code?: string, details?: unknown) {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
        this.code = code
        this.details = details
    }

    static badRequest(message: string, details?: unknown) {
        return new AppError(400, message, 'BAD_REQUEST', details)
    }
    static unauthorized(message = 'Unauthorized') {
        return new AppError(401, message, 'UNAUTHORIZED')
    }
    static forbidden(message = 'Forbidden') {
        return new AppError(403, message, 'FORBIDDEN')
    }
    static notFound(message = 'Not found') {
        return new AppError(404, message, 'NOT_FOUND')
    }
    static conflict(message: string) {
        return new AppError(409, message, 'CONFLICT')
    }
    static internal(message = 'Internal server error') {
        return new AppError(500, message, 'INTERNAL_ERROR')
    }
}

/** Wrap an async route handler so thrown errors flow into `errorHandler`. */
export function asyncHandler<TReq extends Request = Request, TRes extends Response = Response>(
    fn: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown> | unknown,
) {
    return (req: TReq, res: TRes, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

/** Global Express error handler. Always emits the standard envelope. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
        // eslint-disable-next-line no-console
        console.error('❌ Zod validation failed:', JSON.stringify(err.flatten().fieldErrors, null, 2))
        res.status(400).json({
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: err.flatten(),
        })
        return
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            code: err.code,
            ...(err.details !== undefined ? { details: err.details } : {}),
        })
        return
    }

    // Unknown errors → log and return 500
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ message, code: 'INTERNAL_ERROR' })
}

/** Standard JSON 404 for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response) {
    res.status(404).json({ message: 'Route not found', code: 'NOT_FOUND' })
}
