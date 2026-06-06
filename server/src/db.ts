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
    ActivityEntry,
} from './types.js'
import {
    SEED_USERS,
    SEED_VENDORS,
    SEED_RFQS,
    SEED_QUOTATIONS,
    SEED_POS,
    SEED_INVOICES,
    SEED_APPROVALS,
    SEED_ACTIVITIES,
} from './db.seed.js'

// ---------- In-memory stores ----------

const users: UserRecord[] = []
const vendors: Vendor[] = []
const rfqs: RFQ[] = []
const quotations: Quotation[] = []
const purchaseOrders: PurchaseOrder[] = []
const invoices: Invoice[] = []
const approvals: Approval[] = []
const activities: ActivityEntry[] = []

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
    activities.push(...SEED_ACTIVITIES)
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
        async create(data: Omit<Vendor, 'id' | 'createdAt'>, userName: string = 'Admin'): Promise<Vendor> {
            const next: Vendor = {
                ...data,
                id: `v${Date.now()}`,
                createdAt: new Date().toISOString(),
            }
            vendors.push(next)
            await db.activities.log('vendor_added', 'user-plus', 'New Vendor Registered', `${next.name} added to vendor directory`, userName)
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
            const user = users.find((u) => u.id === data.createdBy)
            const userName = user ? user.name : 'Procurement Officer'
            await db.activities.log('rfq_created', 'file-text', 'RFQ Created', `${next.title} RFQ drafted by ${userName}`, userName)
            return next
        },
        async markSent(id: string, userName: string = 'Admin'): Promise<RFQ | null> {
            const r = rfqs.find((x) => x.id === id)
            if (!r) return null
            r.status = 'sent'
            await db.activities.log('rfq_sent', 'send', 'RFQ Sent to Vendors', `${r.title} RFQ sent to ${r.assignedVendors?.length || 0} vendors`, userName)
            return r
        },
    },

    quotations: {
        async findAll(): Promise<Quotation[]> {
            return [...quotations]
        },
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
            await db.activities.log('quotation_received', 'inbox', 'Quotation Received', `${next.vendorName} submitted quotation for ${rfq?.title || 'RFQ'}`, next.vendorName)
            return next
        },
        async markSelected(id: string): Promise<Quotation | null> {
            const q = quotations.find((x) => x.id === id)
            if (!q) return null
            q.status = 'selected'

            // Cascade to RFQ: set its status to 'pending'
            const rfq = rfqs.find((r) => r.id === q.rfqId)
            if (rfq) {
                rfq.status = 'pending'
            }

            // Create a new Approval record
            const approvalId = `ap${Date.now()}`
            const nextApproval: Approval = {
                id: approvalId,
                rfqId: q.rfqId,
                rfqTitle: rfq?.title || 'Unknown RFQ',
                quotationId: q.id,
                vendorName: q.vendorName,
                amount: q.grandTotal,
                status: 'pending',
                currentStep: 'L1 Review',
                steps: [
                    { label: 'Submitted', status: 'completed', completedAt: new Date().toISOString() },
                    { label: 'L1 Review', status: 'current', completedAt: null },
                    { label: 'L2 Approval', status: 'upcoming', completedAt: null },
                    { label: 'PO Generated', status: 'upcoming', completedAt: null },
                ],
                approvalChain: [
                    { id: `apr-${Date.now()}-1`, name: 'Sunita Mehta', role: 'Procurement Manager', status: 'pending', timestamp: null, remarks: null },
                    { id: `apr-${Date.now()}-2`, name: 'Rohit Agarwal', role: 'Finance Head', status: 'pending', timestamp: null, remarks: null },
                ],
                lineItems: q.lineItems.map(item => ({ name: item.name, quantity: item.quantity })),
                deliveryDays: q.deliveryDays,
                vendorRating: q.vendorRating || 4.5,
                paymentTerms: q.paymentTerms,
                createdAt: new Date().toISOString()
            }
            approvals.push(nextApproval)

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
            userName: string = 'Manager',
        ): Promise<Approval | null> {
            const a = approvals.find((x) => x.id === id)
            if (!a) return null
            a.status = action === 'approve' ? 'approved' : 'rejected'
            a.remarks = remarks
            a.decidedAt = new Date().toISOString()
            // Mark the next pending chain item
            for (const item of a.approvalChain) {
                if (item.status === 'pending') {
                    item.status = action === 'approve' ? 'approved' : 'rejected'
                    item.timestamp = a.decidedAt
                    item.remarks = remarks
                    break
                }
            }
            // Update the stepper steps
            if (action === 'approve') {
                // Mark L1 Review and L2 Approval as completed, PO Generated as current
                for (const step of a.steps) {
                    if (step.status === 'current') {
                        step.status = 'completed'
                        step.completedAt = a.decidedAt
                    } else if (step.status === 'upcoming') {
                        step.status = 'completed'
                        step.completedAt = a.decidedAt
                    }
                }
                a.currentStep = 'PO Generated'
            }
            // Cascade to the linked RFQ
            const rfq = rfqs.find((r) => r.id === a.rfqId)
            if (rfq) {
                if (action === 'approve') {
                    rfq.status = 'approved'
                }
                // On reject, keep the RFQ as-is (it can be re-submitted)
            }
            // Cascade to the linked quotation
            const q = quotations.find((x) => x.id === a.quotationId)
            if (q) {
                if (action === 'approve') {
                    q.status = 'selected'
                    // Mark all OTHER quotations for this RFQ as rejected
                    quotations.forEach((otherQ) => {
                        if (otherQ.rfqId === q.rfqId && otherQ.id !== q.id) {
                            otherQ.status = 'rejected'
                        }
                    })
                } else {
                    q.status = 'rejected'
                }
            }

            // --- Generate Purchase Order, Invoice, and log Activities ---
            if (action === 'approve' && rfq && q) {
                const poId = `po${Date.now()}`
                const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                const subtotal = q.lineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0)
                const cgstPercent = q.gstPercent / 2
                const sgstPercent = q.gstPercent / 2
                const cgst = subtotal * (cgstPercent / 100)
                const sgst = subtotal * (sgstPercent / 100)

                // Find vendor address/GSTIN
                const vendor = vendors.find((v) => v.id === q.vendorId)
                
                const nextPO: PurchaseOrder = {
                    id: poId,
                    poNumber,
                    rfqId: rfq.id,
                    rfqTitle: rfq.title,
                    vendorId: q.vendorId,
                    vendorName: q.vendorName,
                    vendorAddress: vendor?.address || 'MIDC Industrial Area, Pune',
                    vendorGSTIN: vendor?.gstin || '27AACCI1234A1Z5',
                    status: 'pending',
                    amount: subtotal,
                    cgstPercent,
                    sgstPercent,
                    subtotal,
                    cgst,
                    sgst,
                    grandTotal: q.grandTotal,
                    poDate: new Date().toISOString(),
                    invoiceDate: null,
                    dueDate: null,
                    deliveryDate: null,
                    lineItems: q.lineItems,
                    orgName: 'KSV Enterprises Pvt Ltd',
                    orgAddress: 'Plot 7, Nariman Point, Mumbai, Maharashtra 400021',
                    orgGSTIN: '27AABCK1234F1Z1',
                    createdAt: new Date().toISOString()
                }
                purchaseOrders.push(nextPO)

                // Generate Invoice
                const nextInvoice: Invoice = {
                    id: `inv${Date.now()}`,
                    poId: poId,
                    vendorId: q.vendorId,
                    amount: subtotal,
                    gstAmount: cgst + sgst,
                    totalAmount: q.grandTotal,
                    status: 'pending',
                    issuedAt: new Date().toISOString(),
                    dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    paidAt: null
                }
                invoices.push(nextInvoice)

                // Bump vendor POs and spend
                if (vendor) {
                    vendor.totalPOs += 1
                    vendor.totalSpend += q.grandTotal
                }

                // Log PO activity
                await db.activities.log(
                    'po_created',
                    'file-plus',
                    'Purchase Order Created',
                    `${poNumber} raised for ${q.vendorName} — ₹${q.grandTotal.toLocaleString('en-IN')}`,
                    userName
                )
            }

            // Log Approval decision activity
            const actType = action === 'approve' ? 'approval_approved' : 'approval_rejected'
            const actIcon = action === 'approve' ? 'check-circle' : 'x-circle'
            const actTitle = action === 'approve' ? 'Approval Granted' : 'Approval Rejected'
            const actDesc = action === 'approve'
                ? `L2 approval for ${a.rfqTitle} approved by ${userName}`
                : `L2 approval for ${a.rfqTitle} rejected by ${userName}`
            
            await db.activities.log(actType, actIcon, actTitle, actDesc, userName)

            return a
        },
    },

    activities: {
        async findAll(): Promise<ActivityEntry[]> {
            return [...activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        },
        async log(type: string, icon: string, title: string, description: string, user: string): Promise<ActivityEntry> {
            const next: ActivityEntry = {
                id: `act${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                type,
                icon,
                title,
                description,
                user,
                timestamp: new Date().toISOString(),
            }
            activities.push(next)
            return next
        },
    },
}
