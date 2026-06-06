import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from './env.js'
import { AppError } from './errors.js'
import { db } from './db.js'
import type { Role, User } from './types.js'

/** Payload encoded in the JWT. */
export interface JwtPayload {
    sub: string
    role: Role
    iat?: number
    exp?: number
}

/** Augment Express Request to include the authenticated user. */
declare module 'express-serve-static-core' {
    interface Request {
        user?: User
    }
}

/** Generate a signed JWT for a user. */
export function signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, role: user.role }
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

/** Verify a JWT and return its payload, or throw an AppError. */
export function verifyToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, env.JWT_SECRET) as JwtPayload
    } catch {
        throw AppError.unauthorized('Invalid or expired token')
    }
}

/** Extract the bearer token from the Authorization header. */
function extractToken(req: Request): string | null {
    const header = req.headers.authorization
    if (!header) return null
    const [scheme, value] = header.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !value) return null
    return value
}

/** Middleware: require a valid JWT and attach `req.user`. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    try {
        const token = extractToken(req)
        if (!token) throw AppError.unauthorized('Missing Authorization header')

        const payload = verifyToken(token)
        const user = await db.users.findById(payload.sub)
        if (!user) throw AppError.unauthorized('User no longer exists')
        if (user.status && user.status !== 'active') {
            throw AppError.forbidden('Account is not active')
        }

        req.user = user
        next()
    } catch (err) {
        next(err)
    }
}

/** Middleware factory: require one of the given roles. */
export function requireRole(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            next(AppError.unauthorized())
            return
        }
        if (!roles.includes(req.user.role)) {
            next(AppError.forbidden(`Requires one of roles: ${roles.join(', ')}`))
            return
        }
        next()
    }
}
