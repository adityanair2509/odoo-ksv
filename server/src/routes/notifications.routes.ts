import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { AppError, asyncHandler } from '../errors.js'

export const notificationsRouter = Router()

/** GET /api/notifications */
notificationsRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
        const items = await db.notifications.findByUser(req.user!.id)
        res.json(items)
    }),
)

/** GET /api/notifications/unread-count */
notificationsRouter.get(
    '/unread-count',
    requireAuth,
    asyncHandler(async (req, res) => {
        const count = await db.notifications.unreadCount(req.user!.id)
        res.json({ count })
    }),
)

/** PATCH /api/notifications/:id/read */
notificationsRouter.patch(
    '/:id/read',
    requireAuth,
    asyncHandler(async (req, res) => {
        const updated = await db.notifications.markRead(req.params.id, req.user!.id)
        if (!updated) throw AppError.notFound('Notification not found')
        res.json(updated)
    }),
)

/** POST /api/notifications/read-all */
notificationsRouter.post(
    '/read-all',
    requireAuth,
    asyncHandler(async (req, res) => {
        const count = await db.notifications.markAllRead(req.user!.id)
        res.json({ success: true, count })
    }),
)
