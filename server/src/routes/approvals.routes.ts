import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const approvalsRouter = Router()

const DECIDE_ROLES = ['manager', 'admin'] as const

const RemarksSchema = z.object({
    remarks: z.string().optional().default(''),
})

const ApproveSchema = z.object({
    remarks: z.string().optional().default(''),
    vendorRating: z.number().min(1, 'Please rate the vendor (1–5 stars)').max(5),
})

/** GET /api/approvals */
approvalsRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
        res.json(await db.approvals.findAll())
    }),
)

/** GET /api/approvals/:id */
approvalsRouter.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const approval = await db.approvals.findById(req.params.id)
        if (!approval) throw AppError.notFound('Approval not found')
        res.json(approval)
    }),
)

/** POST /api/approvals/:id/approve */
approvalsRouter.post(
    '/:id/approve',
    requireAuth,
    requireRole(...DECIDE_ROLES),
    asyncHandler(async (req, res) => {
        const parsed = ApproveSchema.parse(req.body)
        const remarks = parsed.remarks.trim() || 'Approved'
        const updated = await db.approvals.decide(
            req.params.id,
            'approve',
            remarks,
            req.user!.name,
            parsed.vendorRating,
        )
        if (!updated) throw AppError.notFound('Approval not found')
        res.json({ success: true, id: req.params.id, action: 'approved', remarks })
    }),
)

/** POST /api/approvals/:id/reject */
approvalsRouter.post(
    '/:id/reject',
    requireAuth,
    requireRole(...DECIDE_ROLES),
    asyncHandler(async (req, res) => {
        const parsed = RemarksSchema.parse(req.body)
        const remarks = parsed.remarks.trim() || 'Rejected'
        const updated = await db.approvals.decide(req.params.id, 'reject', remarks, req.user!.name)
        if (!updated) throw AppError.notFound('Approval not found')
        res.json({ success: true, id: req.params.id, action: 'rejected', remarks })
    }),
)
