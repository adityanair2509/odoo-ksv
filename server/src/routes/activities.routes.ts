import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { asyncHandler } from '../errors.js'

export const activitiesRouter = Router()

/** GET /api/activities */
activitiesRouter.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
        res.json(await db.activities.findAll())
    }),
)
