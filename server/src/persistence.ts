/**
 * Persistence for the in-memory data layer.
 * - Production (Railway): PostgreSQL `app_store` table when DATABASE_URL is set
 * - Local dev: JSON file at server/data/store.json
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import type {
    Approval,
    Invoice,
    PurchaseOrder,
    Quotation,
    RFQ,
    UserRecord,
    Vendor,
    ActivityEntry,
    Notification,
    RegistrationRequest,
} from './types.js'
import { env } from './env.js'

const { Pool } = pg

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data')
const DATA_FILE = path.join(DATA_DIR, 'store.json')

export interface PersistedStore {
    users: UserRecord[]
    vendors: Vendor[]
    rfqs: RFQ[]
    quotations: Quotation[]
    purchaseOrders: PurchaseOrder[]
    invoices: Invoice[]
    approvals: Approval[]
    activities: ActivityEntry[]
    notifications: Notification[]
    registrations: RegistrationRequest[]
    savedAt: string
}

let dirty = false
let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastSnapshot: PersistedStore | null = null
let pgPool: pg.Pool | null = null

function usePostgres(): boolean {
    return Boolean(env.DATABASE_URL)
}

function getPgPool(): pg.Pool {
    if (!env.DATABASE_URL) throw new Error('DATABASE_URL not configured')
    if (!pgPool) {
        pgPool = new Pool({
            connectionString: env.DATABASE_URL,
            ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        })
    }
    return pgPool
}

export async function loadPersistedStore(): Promise<PersistedStore | null> {
    if (usePostgres()) {
        try {
            const pool = getPgPool()
            const result = await pool.query<{ payload: PersistedStore }>(
                'SELECT payload FROM app_store WHERE id = 1',
            )
            if (!result.rows.length) return null
            const parsed = result.rows[0].payload
            if (!parsed?.users || !Array.isArray(parsed.users)) return null
            lastSnapshot = parsed
            return parsed
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('PostgreSQL load failed, starting fresh:', err)
            return null
        }
    }

    try {
        const raw = await fs.readFile(DATA_FILE, 'utf-8')
        const parsed = JSON.parse(raw) as PersistedStore
        if (!parsed.users || !Array.isArray(parsed.users)) return null
        lastSnapshot = parsed
        return parsed
    } catch {
        return null
    }
}

export function schedulePersist(snapshot: PersistedStore): void {
    lastSnapshot = snapshot
    dirty = true
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
        void flushPersist()
    }, 400)
}

export async function flushPersist(): Promise<void> {
    if (!dirty || !lastSnapshot) return
    dirty = false
    const payload = { ...lastSnapshot, savedAt: new Date().toISOString() }
    lastSnapshot = payload

    if (usePostgres()) {
        const pool = getPgPool()
        await pool.query(
            `INSERT INTO app_store (id, payload, saved_at)
             VALUES (1, $1::jsonb, NOW())
             ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, saved_at = NOW()`,
            [JSON.stringify(payload)],
        )
        return
    }

    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8')
}

export function getPersistenceStatus(): {
    enabled: boolean
    backend: 'postgresql' | 'json-file'
    file: string | null
    savedAt: string | null
    recordCounts: Record<string, number> | null
} {
    const backend = usePostgres() ? 'postgresql' : 'json-file'
    if (!lastSnapshot) {
        return { enabled: true, backend, file: backend === 'json-file' ? DATA_FILE : null, savedAt: null, recordCounts: null }
    }
    return {
        enabled: true,
        backend,
        file: backend === 'json-file' ? DATA_FILE : null,
        savedAt: lastSnapshot.savedAt,
        recordCounts: {
            users: lastSnapshot.users.length,
            vendors: lastSnapshot.vendors.length,
            rfqs: lastSnapshot.rfqs.length,
            quotations: lastSnapshot.quotations.length,
            purchaseOrders: lastSnapshot.purchaseOrders.length,
            invoices: lastSnapshot.invoices.length,
            approvals: lastSnapshot.approvals.length,
            registrations: lastSnapshot.registrations.length,
            notifications: lastSnapshot.notifications.length,
        },
    }
}
