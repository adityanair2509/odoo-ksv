import { Router } from 'express'
import { requireAuth, requireRole } from '../auth.js'
import { asyncHandler } from '../errors.js'
import {
    getSpendingByCategory,
    getMonthlySpend,
    getSpendSummary,
    getMonthlyPOVolume,
    getVendorPerformance,
    getPipelineSummary,
    getBudgetUtilisation,
    getVendorDashboard,
    getSpendInsight,
} from '../analytics.js'

export const analyticsRouter = Router()

analyticsRouter.get('/spending-by-category', requireAuth, asyncHandler(async (_req, res) => {
    res.json(await getSpendingByCategory())
}))

analyticsRouter.get('/monthly-spend', requireAuth, asyncHandler(async (req, res) => {
    res.json(await getMonthlySpend(Number(req.query.months) || 6))
}))

analyticsRouter.get('/spend-summary', requireAuth, asyncHandler(async (_req, res) => {
    res.json(await getSpendSummary())
}))

analyticsRouter.get('/monthly-po-volume', requireAuth, asyncHandler(async (req, res) => {
    res.json(await getMonthlyPOVolume(Number(req.query.months) || 12))
}))

analyticsRouter.get('/vendor-performance', requireAuth, asyncHandler(async (_req, res) => {
    res.json(await getVendorPerformance())
}))

analyticsRouter.get('/pipeline-summary', requireAuth, asyncHandler(async (_req, res) => {
    res.json(await getPipelineSummary())
}))

analyticsRouter.get('/budget-utilisation', requireAuth, asyncHandler(async (_req, res) => {
    res.json(await getBudgetUtilisation())
}))

analyticsRouter.get('/spend-insight', requireAuth, asyncHandler(async (_req, res) => {
    res.json({ message: await getSpendInsight() })
}))

analyticsRouter.get(
    '/vendor-dashboard',
    requireAuth,
    requireRole('vendor'),
    asyncHandler(async (req, res) => {
        res.json(await getVendorDashboard(req.user!.id))
    }),
)
