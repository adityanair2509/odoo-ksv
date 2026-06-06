import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const quotationsRouter = Router()

const SELECT_ROLES = ['admin', 'procurement_officer', 'manager'] as const
const SUBMIT_ROLES = ['vendor'] as const

const QuotationLineItemSchema = z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    total: z.number().nonnegative(),
})

const QuotationCreateSchema = z.object({
    rfqId: z.string().min(1),
    vendorId: z.string().min(1),
    vendorName: z.string().min(1),
    grandTotal: z.number().nonnegative(),
    gstPercent: z.number().min(0).max(100),
    deliveryDays: z.number().int().nonnegative(),
    vendorRating: z.number().min(0).max(5),
    paymentTerms: z.string().min(1),
    lineItems: z.array(QuotationLineItemSchema).min(1),
    notes: z.string().default(''),
})

/** GET /api/rfqs/:rfqId/quotations (nested under rfqs logically) */
quotationsRouter.get(
    '/rfqs/:rfqId/quotations',
    requireAuth,
    asyncHandler(async (req, res) => {
        res.json(await db.quotations.findByRFQ(req.params.rfqId))
    }),
)

/** POST /api/quotations */
quotationsRouter.post(
    '/',
    requireAuth,
    requireRole(...SUBMIT_ROLES),
    asyncHandler(async (req, res) => {
        const data = QuotationCreateSchema.parse(req.body)
        const created = await db.quotations.create(data)
        res.status(201).json(created)
    }),
)

/** POST /api/quotations/:id/select */
quotationsRouter.post(
    '/:id/select',
    requireAuth,
    requireRole(...SELECT_ROLES),
    asyncHandler(async (req, res) => {
        const updated = await db.quotations.markSelected(req.params.id)
        if (!updated) throw AppError.notFound('Quotation not found')
        res.json({ success: true, quotationId: req.params.id })
    }),
)
