import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireRole } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'
import { generateInvoicePdf } from '../invoicePdf.js'

export const invoicesRouter = Router()

const MARK_PAID_ROLES = ['admin', 'manager'] as const

const EmailSchema = z.object({
    recipients: z.array(z.string().email()).optional(),
})

/** GET /api/invoices */
invoicesRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
        res.json(await db.invoices.findAll())
    }),
)

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

/** GET /api/invoices/:id/detail */
invoicesRouter.get(
    '/:id/detail',
    requireAuth,
    asyncHandler(async (req, res) => {
        const detail = await db.invoices.findDetailById(req.params.id)
        if (!detail) throw AppError.notFound('Invoice not found')
        res.json(detail)
    }),
)

/** GET /api/invoices/:id/pdf */
invoicesRouter.get(
    '/:id/pdf',
    requireAuth,
    asyncHandler(async (req, res) => {
        const detail = await db.invoices.findDetailById(req.params.id)
        if (!detail) throw AppError.notFound('Invoice not found')
        const pdf = await generateInvoicePdf(detail)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${detail.invoiceNumber}.pdf"`)
        res.send(pdf)
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

/** POST /api/invoices/:id/email */
invoicesRouter.post(
    '/:id/email',
    requireAuth,
    requireRole('admin', 'procurement_officer', 'manager'),
    asyncHandler(async (req, res) => {
        const inv = await db.invoices.findById(req.params.id)
        if (!inv) throw AppError.notFound('Invoice not found')
        const { recipients } = EmailSchema.parse(req.body ?? {})
        const result = await db.invoices.emailInvoice(req.params.id, recipients)
        res.json({ success: true, ...result })
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
