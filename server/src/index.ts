/**
 * Express bootstrap.
 *
 * Wires CORS, JSON parsing, all route modules, the 404 handler, and the
 * global error handler. Seeds the in-memory data layer before binding
 * the port so the very first request hits populated data.
 */

import express from 'express'
import cors from 'cors'
import { env } from './env.js'
import { seed } from './db.js'
import { errorHandler, notFoundHandler } from './errors.js'
import { getEmailService } from './emailService.js'
import { getPersistenceStatus, flushPersist } from './persistence.js'
import { authRouter } from './routes/auth.routes.js'
import { vendorsRouter } from './routes/vendors.routes.js'
import { rfqsRouter } from './routes/rfqs.routes.js'
import { quotationsRouter } from './routes/quotations.routes.js'
import { purchaseOrdersRouter } from './routes/purchaseOrders.routes.js'
import { invoicesRouter } from './routes/invoices.routes.js'
import { approvalsRouter } from './routes/approvals.routes.js'
import { activitiesRouter } from './routes/activities.routes.js'
import { notificationsRouter } from './routes/notifications.routes.js'
import { analyticsRouter } from './routes/analytics.routes.js'

const app = express()

// ---------- Middleware ----------

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow same-origin / curl requests (no origin header) and whitelisted dev origins.
            if (!origin) return callback(null, true)
            if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
            return callback(new Error(`CORS: origin '${origin}' not allowed`))
        },
        credentials: true,
    }),
)
app.use(express.json({ limit: '1mb' }))

// Lightweight request logger for dev.
app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
    next()
})

// ---------- Health check ----------

app.get('/api/health', (_req, res) => {
    const persistence = getPersistenceStatus()
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        ts: new Date().toISOString(),
        database: {
            type: 'json-file',
            ...persistence,
        },
        email: {
            configured: getEmailService().isConfigured,
        },
    })
})

// ---------- Routes ----------

app.use('/api/auth', authRouter)
app.use('/api/vendors', vendorsRouter)
app.use('/api/rfqs', rfqsRouter)
app.use('/api/quotations', quotationsRouter) // also exposes /api/quotations/rfqs/:rfqId/quotations
app.use('/api/purchase-orders', purchaseOrdersRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/approvals', approvalsRouter)
app.use('/api/activities', activitiesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/analytics', analyticsRouter)

// ---------- 404 + error handler ----------

app.use(notFoundHandler)
app.use(errorHandler)

// ---------- Boot ----------

async function main() {
    try {
        await seed()
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to seed database:', err)
        process.exit(1)
    }

    app.listen(env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`\n🚀 odoo-ksv API listening on http://localhost:${env.PORT}`)
        // eslint-disable-next-line no-console
        console.log(`   CORS allowed: ${env.ALLOWED_ORIGINS.join(', ')}`)
        // eslint-disable-next-line no-console
        console.log(`   Health:       GET  http://localhost:${env.PORT}/api/health`)
        // eslint-disable-next-line no-console
        console.log(`   SMTP:         ${getEmailService().isConfigured ? 'configured' : 'console-only (set SMTP_* in .env)'}`)
        // eslint-disable-next-line no-console
        console.log(`   Login:        POST http://localhost:${env.PORT}/api/auth/login`)
        // eslint-disable-next-line no-console
        console.log(`     shreenathpillai1696@gmail.com — password: Admin@123`)
        // eslint-disable-next-line no-console
        console.log(`\n   Register new users at /register — admin must approve before login.\n`)
    })

    process.on('SIGINT', () => { void flushPersist().then(() => process.exit(0)) })
    process.on('SIGTERM', () => { void flushPersist().then(() => process.exit(0)) })
}

main()
