import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const invoicesRouter = Router()

const MARK_PAID_ROLES = ['admin', 'manager'] as const

/** GET /api/invoices/po/:poId */
invoicesRouter.get(
    '/po/:poId',
    requireAuth,
    asyncHandler(async (req, res) => {
        const inv = await db.invoices.findByPO(req.params.poId)
        if (!inv) throw AppError.notFound('Invoice not found')
        res.json(inv)
    }),
)

/** GET /api/invoices/:id */
invoicesRouter.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const inv = await db.invoices.findById(req.params.id)
        if (!inv) throw AppError.notFound('Invoice not found')
        res.json(inv)
    }),
)

/** POST /api/invoices/:id/mark-paid */
invoicesRouter.post(
    '/:id/mark-paid',
    requireAuth,
    requireRole(...MARK_PAID_ROLES),
    asyncHandler(async (req, res) => {
        const updated = await db.invoices.markPaid(req.params.id)
        if (!updated) throw AppError.notFound('Invoice not found')
        res.json({ success: true, id: req.params.id, status: 'paid' })
    }),
)
