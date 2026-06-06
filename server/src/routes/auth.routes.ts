import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { signToken, requireAuth } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const authRouter = Router()

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
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
