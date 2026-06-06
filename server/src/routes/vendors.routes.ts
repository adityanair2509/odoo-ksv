import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const vendorsRouter = Router()

const WRITE_ROLES = ['admin', 'procurement_officer'] as const

const VendorCreateSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    gstin: z.string().min(1),
    contactPerson: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    state: z.string().min(1),
    status: z.enum(['active', 'pending', 'blocked']).default('pending'),
    rating: z.number().min(0).max(5).default(0),
    totalPOs: z.number().int().min(0).default(0),
    totalSpend: z.number().int().min(0).default(0),
    gstinVerified: z.boolean().default(false),
})

const VendorUpdateSchema = VendorCreateSchema.partial()

const GstinVerifySchema = z.object({
    gstin: z.string().min(1),
})

/** GET /api/vendors */
vendorsRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
        res.json(await db.vendors.findAll())
    }),
)

/** GET /api/vendors/:id */
vendorsRouter.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const vendor = await db.vendors.findById(req.params.id)
        if (!vendor) throw AppError.notFound('Vendor not found')
        res.json(vendor)
    }),
)

/** POST /api/vendors */
vendorsRouter.post(
    '/',
    requireAuth,
    requireRole(...WRITE_ROLES),
    asyncHandler(async (req, res) => {
        const data = VendorCreateSchema.parse(req.body)
        const created = await db.vendors.create(data)
        res.status(201).json(created)
    }),
)

/** PUT /api/vendors/:id */
vendorsRouter.put(
    '/:id',
    requireAuth,
    requireRole(...WRITE_ROLES),
    asyncHandler(async (req, res) => {
        const patch = VendorUpdateSchema.parse(req.body)
        const updated = await db.vendors.update(req.params.id, patch)
        if (!updated) throw AppError.notFound('Vendor not found')
        res.json(updated)
    }),
)

/** POST /api/vendors/verify-gstin */
vendorsRouter.post(
    '/verify-gstin',
    requireAuth,
    requireRole(...WRITE_ROLES),
    asyncHandler(async (req, res) => {
        const { gstin } = GstinVerifySchema.parse(req.body)
        res.json(await db.vendors.verifyGstin(gstin))
    }),
)
