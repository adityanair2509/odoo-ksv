import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { signToken, requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'
import { sendOtp, verifyOtp } from '../notify.js'
import { getEmailService } from '../emailService.js'

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

const SendOtpSchema = z.object({
    email: z.string().email(),
    purpose: z.enum(['registration', 'password_reset', 'login', 'verification']).default('login'),
})

const VerifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().min(4).max(8),
    purpose: z.enum(['registration', 'password_reset', 'login', 'verification']).default('login'),
})

const RegisterSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
    role: z.enum(['procurement_officer', 'manager', 'vendor']),
    country: z.string().min(1),
    additionalInfo: z.string().optional().default(''),
    password: z.string().min(8),
})

const VerifyRegistrationSchema = z.object({
    email: z.string().email(),
    otp: z.string().min(4).max(8),
})

const RejectSchema = z.object({
    reason: z.string().min(1),
})

function assertActiveUser(user: { status?: string }) {
    if (user.status && user.status !== 'active') {
        throw AppError.forbidden('Your account is pending admin approval or has been suspended.')
    }
}

/** POST /api/auth/login */
authRouter.post(
    '/login',
    asyncHandler(async (req, res) => {
        const { email, password } = LoginSchema.parse(req.body)
        const user = await db.users.findByEmail(email)
        if (!user) throw AppError.unauthorized('Invalid email or password')

        assertActiveUser(user)

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
        res.json(req.user)
    }),
)

/** POST /api/auth/register */
authRouter.post(
    '/register',
    asyncHandler(async (req, res) => {
        const data = RegisterSchema.parse(req.body)
        const existingUser = await db.users.findByEmail(data.email)
        if (existingUser) throw AppError.conflict('An account with this email already exists')

        const pending = await db.registrations.findByEmail(data.email)
        if (pending && pending.status === 'pending_approval') {
            throw AppError.conflict('Registration already submitted and awaiting admin approval')
        }
        if (pending && pending.status === 'pending_otp') {
            throw AppError.conflict('Registration started — verify the OTP sent to your email')
        }

        const passwordHash = await bcrypt.hash(data.password, 10)
        try {
            await db.registrations.create({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            role: data.role,
            country: data.country,
            additionalInfo: data.additionalInfo || '',
            passwordHash,
        })
        } catch {
            throw AppError.conflict('Registration already in progress for this email')
        }

        const result = await sendOtp(data.email, 'registration')
        res.status(201).json(result)
    }),
)

/** POST /api/auth/verify-registration */
authRouter.post(
    '/verify-registration',
    asyncHandler(async (req, res) => {
        const { email, otp } = VerifyRegistrationSchema.parse(req.body)
        const reg = await db.registrations.findByEmail(email)
        if (!reg) throw AppError.notFound('Registration not found')

        const valid = await verifyOtp(email, otp, 'registration')
        if (!valid) throw AppError.unauthorized('Invalid or expired OTP')

        await db.registrations.markOtpVerified(email)

        const admins = await db.users.findByRole('admin')
        const emailService = getEmailService()
        for (const admin of admins) {
            await db.notifications.create({
                userId: admin.id,
                title: 'New Registration Pending',
                message: `${reg.firstName} ${reg.lastName} (${reg.role}) requested access — review in Registrations.`,
                type: 'system',
                entityType: 'registration',
                entityId: reg.id,
            })
            await emailService.sendRegistrationPendingToAdmin(
                admin.email,
                reg.firstName,
                reg.lastName,
                reg.role,
                reg.email,
                reg.id,
            )
        }

        res.json({
            message: 'Email verified. Your account is pending admin approval before you can sign in.',
            status: 'pending_approval',
        })
    }),
)

/** GET /api/auth/registrations/pending-count — admin only */
authRouter.get(
    '/registrations/pending-count',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (_req, res) => {
        res.json({ count: await db.registrations.countPending() })
    }),
)

/** GET /api/auth/registrations — admin only */
authRouter.get(
    '/registrations',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (_req, res) => {
        res.json(await db.registrations.findPending())
    }),
)

/** POST /api/auth/registrations/:id/approve */
authRouter.post(
    '/registrations/:id/approve',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (req, res) => {
        const user = await db.registrations.approve(req.params.id, req.user!.id)
        if (!user) throw AppError.notFound('Registration not found or already processed')
        res.json({ success: true, user })
    }),
)

/** POST /api/auth/registrations/:id/reject */
authRouter.post(
    '/registrations/:id/reject',
    requireAuth,
    requireRole('admin'),
    asyncHandler(async (req, res) => {
        const { reason } = RejectSchema.parse(req.body)
        const reg = await db.registrations.reject(req.params.id, req.user!.id, reason)
        if (!reg) throw AppError.notFound('Registration not found or already processed')
        res.json({ success: true, registration: reg })
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

/** POST /api/auth/send-otp */
authRouter.post(
    '/send-otp',
    asyncHandler(async (req, res) => {
        const { email, purpose } = SendOtpSchema.parse(req.body)
        if (purpose !== 'registration') {
            const user = await db.users.findByEmail(email)
            if (!user) throw AppError.notFound('No account found with this email')
            assertActiveUser(user)
        }
        const result = await sendOtp(email, purpose)
        res.json(result)
    }),
)

/** POST /api/auth/verify-otp */
authRouter.post(
    '/verify-otp',
    asyncHandler(async (req, res) => {
        const { email, otp, purpose } = VerifyOtpSchema.parse(req.body)
        const valid = await verifyOtp(email, otp, purpose)
        if (!valid) throw AppError.unauthorized('Invalid or expired OTP')

        if (purpose === 'login' || purpose === 'verification') {
            const user = await db.users.findByEmail(email)
            if (!user) throw AppError.notFound('User not found')
            assertActiveUser(user)
            const { passwordHash: _ph, ...safeUser } = user
            const token = signToken(safeUser)
            res.json({ verified: true, user: safeUser, token })
            return
        }

        res.json({ verified: true, message: 'OTP verified successfully' })
    }),
)
