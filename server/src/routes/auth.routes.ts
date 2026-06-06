import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { signToken, requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const authRouter = Router()

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

const UserCreateSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['admin', 'procurement_officer', 'manager', 'vendor']),
    password: z.string().optional(),
})

/** POST /api/auth/login */
authRouter.post(
    '/login',
    asyncHandler(async (req, res) => {
        const { email, password } = LoginSchema.parse(req.body)
        const user = await db.users.findByEmail(email)
        if (!user) throw AppError.unauthorized('Invalid email or password')

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) throw AppError.unauthorized('Invalid email or password')

        const { passwordHash: _ph, ...safeUser } = user
        const token = signToken(safeUser)
        res.json({ user: safeUser, token })
    }),
)

/** GET /api/auth/me */
authRouter.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
        // requireAuth already attached req.user
        res.json(req.user)
    }),
)

/** POST /api/auth/create-user */
authRouter.post(
    '/create-user',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (req, res) => {
        const data = UserCreateSchema.parse(req.body)
        const exists = await db.users.findByEmail(data.email)
        if (exists) throw AppError.badRequest('User with this email already exists')
        const created = await db.users.create(data)
        res.status(201).json(created)
    }),
)
