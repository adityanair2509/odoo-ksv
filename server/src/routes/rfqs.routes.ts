import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const rfqsRouter = Router()

const WRITE_ROLES = ['admin', 'procurement_officer'] as const

const LineItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unit: z.string().optional(),
})

// `createdBy` is intentionally NOT in this schema — it is taken from the
// authenticated session (req.user.id) so clients cannot spoof another author.
const RFQCreateSchema = z.object({
    title: z.string().min(1),
    category: z.string().min(1),
    status: z.enum(['draft', 'sent', 'pending', 'approved', 'closed']).default('draft'),
    priority: z.enum(['Low', 'Medium', 'High']),
    deadline: z.string().min(1),
    description: z.string().min(1),
    assignedVendors: z.array(z.string()).default([]),
    lineItems: z.array(LineItemSchema).min(1),
})

/** GET /api/rfqs */
rfqsRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
        res.json(await db.rfqs.findAll())
    }),
)

/** GET /api/rfqs/:id */
rfqsRouter.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const rfq = await db.rfqs.findById(req.params.id)
        if (!rfq) throw AppError.notFound('RFQ not found')
        res.json(rfq)
    }),
)

/** POST /api/rfqs */
rfqsRouter.post(
    '/',
    requireAuth,
    requireRole(...WRITE_ROLES),
    asyncHandler(async (req, res) => {
        const data = RFQCreateSchema.parse(req.body)
        // Force the author to be the authenticated user; ignore any
        // createdBy the client may have sent.
        const created = await db.rfqs.create({ ...data, createdBy: req.user!.id })
        res.status(201).json(created)
    }),
)

/** POST /api/rfqs/:id/send */
rfqsRouter.post(
    '/:id/send',
    requireAuth,
    requireRole(...WRITE_ROLES),
    asyncHandler(async (req, res) => {
        const updated = await db.rfqs.markSent(req.params.id, req.user!.name)
        if (!updated) throw AppError.notFound('RFQ not found')
        res.json({ success: true })
    }),
)
