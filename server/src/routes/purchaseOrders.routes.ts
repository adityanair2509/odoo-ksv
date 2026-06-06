import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const purchaseOrdersRouter = Router()

const MARK_PAID_ROLES = ['admin', 'manager'] as const

/** GET /api/purchase-orders */
purchaseOrdersRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
        res.json(await db.purchaseOrders.findAll())
    }),
)

/** GET /api/purchase-orders/:id */
purchaseOrdersRouter.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const po = await db.purchaseOrders.findById(req.params.id)
        if (!po) throw AppError.notFound('Purchase order not found')
        res.json(po)
    }),
)

/** POST /api/purchase-orders/:id/mark-paid */
purchaseOrdersRouter.post(
    '/:id/mark-paid',
    requireAuth,
    requireRole(...MARK_PAID_ROLES),
    asyncHandler(async (req, res) => {
        const updated = await db.purchaseOrders.markPaid(req.params.id)
        if (!updated) throw AppError.notFound('Purchase order not found')
        res.json({ success: true, id: req.params.id, status: 'paid' })
    }),
)
