/**
 * In-memory data layer.
 *
 * Until a real database is wired in, this module exposes a single `db`
 * object whose methods read/write module-scope arrays. All state is
 * seeded once at startup from `./db.seed.js` (which mirrors the
 * frontend's mock data) and lost on process restart.
 *
 * The exported `db` object defines the entire data-access surface the
 * route handlers depend on. Swapping the in-memory implementation for a
 * real database requires changing only this file.
 */

import bcrypt from 'bcryptjs'
import type {
    Approval,
    Invoice,
    PurchaseOrder,
    Quotation,
    RFQ,
    User,
    UserRecord,
    Vendor,
} from './types.js'
import {
    SEED_USERS,
    SEED_VENDORS,
    SEED_RFQS,
    SEED_QUOTATIONS,
    SEED_POS,
    SEED_INVOICES,
    SEED_APPROVALS,
} from './db.seed.js'

// ---------- In-memory stores ----------

const users: UserRecord[] = []
const vendors: Vendor[] = []
const rfqs: RFQ[] = []
const quotations: Quotation[] = []
const purchaseOrders: PurchaseOrder[] = []
const invoices: Invoice[] = []
const approvals: Approval[] = []

let seeded = false

function hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10)
}

function toPublic(record: UserRecord): User {
    const { passwordHash: _ph, ...safe } = record
    return safe
}

// ---------- GSTIN verification stub ----------
// Seeded from src/mock/mockVendors.js — known active GSTINs.

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}Z[A-Z\d]{1}$/

const GSTIN_REGISTRY: Record<string, { companyName: string; state: string; status: 'Active' | 'Inactive' }> = {
    '27AACCI1234A1Z5': { companyName: 'Infra Supplies Pvt Ltd', state: 'Maharashtra', status: 'Active' },
    '29AABCT5432B1Z3': { companyName: 'TechSoft Solutions LLP', state: 'Karnataka', status: 'Active' },
    '07AACQL9876C1Z1': { companyName: 'QuickMove Logistics', state: 'Delhi', status: 'Active' },
    '33AABCF7654D1Z8': { companyName: 'FurnishPro India', state: 'Tamil Nadu', status: 'Active' },
    '09AABCD1234E1Z2': { companyName: 'DataNet Systems', state: 'Uttar Pradesh', status: 'Inactive' },
}

// ---------- Seed ----------

export async function seed(): Promise<void> {
    if (seeded) return
    seeded = true

    for (const u of SEED_USERS) {
        const { password, ...rest } = u
        users.push({ ...rest, passwordHash: await hash(password) })
    }
    vendors.push(...SEED_VENDORS)
    rfqs.push(...SEED_RFQS)
    quotations.push(...SEED_QUOTATIONS)
    purchaseOrders.push(...SEED_POS)
    invoices.push(...SEED_INVOICES)
    approvals.push(...SEED_APPROVALS)
}

// ---------- Data-access surface ----------

export const db = {
    users: {
        async findByEmail(email: string): Promise<UserRecord | null> {
            return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
        },
        async findById(id: string): Promise<User | null> {
            const u = users.find((x) => x.id === id)
            return u ? toPublic(u) : null
        },
    },

    vendors: {
        async findAll(): Promise<Vendor[]> {
            return [...vendors]
        },
        async findById(id: string): Promise<Vendor | null> {
            return vendors.find((v) => v.id === id) ?? null
        },
        async create(data: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor> {
            const next: Vendor = {
                ...data,
                id: `v${Date.now()}`,
                createdAt: new Date().toISOString(),
            }
            vendors.push(next)
            return next
        },
        async update(id: string, patch: Partial<Vendor>): Promise<Vendor | null> {
            const idx = vendors.findIndex((v) => v.id === id)
            if (idx === -1) return null
            vendors[idx] = { ...vendors[idx], ...patch, id: vendors[idx].id }
            return vendors[idx]
        },
        async verifyGstin(gstin: string): Promise<{
            verified: boolean
            companyName?: string
            state?: string
            status?: string
        }> {
            // Simulate GST portal latency
            await new Promise((r) => setTimeout(r, 700))
            if (!GSTIN_REGEX.test(gstin)) {
                return { verified: false }
            }
            const hit = GSTIN_REGISTRY[gstin]
            if (!hit) return { verified: false }
            return { verified: hit.status === 'Active', companyName: hit.companyName, state: hit.state, status: hit.status }
        },
    },

    rfqs: {
        async findAll(): Promise<RFQ[]> {
            return [...rfqs]
        },
        async findById(id: string): Promise<RFQ | null> {
            return rfqs.find((r) => r.id === id) ?? null
        },
        async create(data: Omit<RFQ, 'id' | 'createdAt' | 'quotationsReceived'>): Promise<RFQ> {
            const next: RFQ = {
                ...data,
                id: `rfq${Date.now()}`,
                quotationsReceived: 0,
                createdAt: new Date().toISOString(),
            }
            rfqs.push(next)
            return next
        },
        async markSent(id: string): Promise<RFQ | null> {
            const r = rfqs.find((x) => x.id === id)
            if (!r) return null
            r.status = 'sent'
            return r
        },
    },

    quotations: {
        async findByRFQ(rfqId: string): Promise<Quotation[]> {
            return quotations.filter((q) => q.rfqId === rfqId)
        },
        async create(
            data: Omit<Quotation, 'id' | 'submittedAt' | 'status'>,
        ): Promise<Quotation> {
            const next: Quotation = {
                ...data,
                id: `q${Date.now()}`,
                status: 'submitted',
                submittedAt: new Date().toISOString(),
            }
            quotations.push(next)
            // Bump RFQ counter
            const rfq = rfqs.find((r) => r.id === next.rfqId)
            if (rfq) rfq.quotationsReceived += 1
            return next
        },
        async markSelected(id: string): Promise<Quotation | null> {
            const q = quotations.find((x) => x.id === id)
            if (!q) return null
            q.status = 'selected'
            return q
        },
    },

    purchaseOrders: {
        async findAll(): Promise<PurchaseOrder[]> {
            return [...purchaseOrders]
        },
        async findById(id: string): Promise<PurchaseOrder | null> {
            return purchaseOrders.find((p) => p.id === id) ?? null
        },
        async markPaid(id: string): Promise<PurchaseOrder | null> {
            const p = purchaseOrders.find((x) => x.id === id)
            if (!p) return null
            p.status = 'paid'
            return p
        },
    },

    invoices: {
        async findByPO(poId: string): Promise<Invoice | null> {
            return invoices.find((i) => i.poId === poId) ?? null
        },
        async findById(id: string): Promise<Invoice | null> {
            return invoices.find((i) => i.id === id) ?? null
        },
        async markPaid(id: string): Promise<Invoice | null> {
            const i = invoices.find((x) => x.id === id)
            if (!i) return null
            i.status = 'paid'
            i.paidAt = new Date().toISOString()
            return i
        },
    },

    approvals: {
        async findAll(): Promise<Approval[]> {
            return [...approvals]
        },
        async findById(id: string): Promise<Approval | null> {
            return approvals.find((a) => a.id === id) ?? null
        },
        async decide(
            id: string,
            action: 'approve' | 'reject',
            remarks: string,
        ): Promise<Approval | null> {
            const a = approvals.find((x) => x.id === id)
            if (!a) return null
            a.status = action === 'approve' ? 'approved' : 'rejected'
            a.remarks = remarks
            a.decidedAt = new Date().toISOString()
            // Mark all chain items appropriately
            for (const item of a.approvalChain) {
                if (item.status === 'pending') {
                    item.status = action === 'approve' ? 'approved' : 'rejected'
                    item.timestamp = a.decidedAt
                    item.remarks = remarks
                    break
                }
            }
            return a
        },
    },
}
