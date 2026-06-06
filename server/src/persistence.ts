/**
 * JSON file persistence for the in-memory data layer.
 * Data survives server restarts at server/data/store.json.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
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

export async function loadPersistedStore(): Promise<PersistedStore | null> {
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
    await fs.mkdir(DATA_DIR, { recursive: true })
    const payload = { ...lastSnapshot, savedAt: new Date().toISOString() }
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8')
    lastSnapshot = payload
}

export function getPersistenceStatus(): {
    enabled: boolean
    file: string
    savedAt: string | null
    recordCounts: Record<string, number> | null
} {
    if (!lastSnapshot) {
        return { enabled: true, file: DATA_FILE, savedAt: null, recordCounts: null }
    }
    return {
        enabled: true,
        file: DATA_FILE,
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
