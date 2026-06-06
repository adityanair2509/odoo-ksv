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
    ApprovalChainItem,
    Invoice,
    InvoiceDetail,
    PurchaseOrder,
    Quotation,
    RFQ,
    User,
    UserRecord,
    Vendor,
    ActivityEntry,
    Role,
    Notification,
    OtpPurpose,
    RegistrationRequest,
    UserStatus,
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
    SEED_NOTIFICATIONS,
} from './db.seed.js'
import { getEmailService } from './emailService.js'
import { generateInvoicePdf } from './invoicePdf.js'
import { env } from './env.js'
import { loadPersistedStore, schedulePersist } from './persistence.js'

// ---------- In-memory stores ----------

const users: UserRecord[] = []
const vendors: Vendor[] = []
const rfqs: RFQ[] = []
const quotations: Quotation[] = []
const purchaseOrders: PurchaseOrder[] = []
const invoices: Invoice[] = []
const approvals: Approval[] = []
const activities: ActivityEntry[] = []
const notifications: Notification[] = []
const registrations: RegistrationRequest[] = []
const otps = new Map<string, { otp: string; purpose: OtpPurpose; expiresAt: number; attempts: number }>()

let seeded = false

function hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10)
}

function toPublic(record: UserRecord): User {
    const { passwordHash: _ph, ...safe } = record
    return safe
}

function touchDb(): void {
    schedulePersist({
        users,
        vendors,
        rfqs,
        quotations,
        purchaseOrders,
        invoices,
        approvals,
        activities,
        notifications,
        registrations,
        savedAt: new Date().toISOString(),
    })
}

function ensureInvoiceNumber(inv: Invoice): string {
    if (inv.invoiceNumber) return inv.invoiceNumber
    inv.invoiceNumber = `INV-${new Date(inv.issuedAt).getFullYear()}-${inv.id.replace(/\D/g, '').slice(-6)}`
    return inv.invoiceNumber
}

function buildInvoiceDetail(inv: Invoice): InvoiceDetail {
    ensureInvoiceNumber(inv)
    const po = purchaseOrders.find((p) => p.id === inv.poId) ?? null
    const vendor = vendors.find((v) => v.id === inv.vendorId)
    return {
        ...inv,
        poNumber: po?.poNumber,
        vendorName: po?.vendorName ?? vendor?.name,
        vendorEmail: vendor?.email,
        rfqTitle: po?.rfqTitle,
        po,
    }
}

function formatEmailDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ADMIN_EMAIL = 'shreenathpillai1696@gmail.com'

function vendorProfileFromUser(user: UserRecord): Vendor {
    const companyName = user.additionalInfo?.trim() || `${user.name} Services`
    return {
        id: user.id,
        name: companyName,
        category: 'Other',
        gstin: '29AABCT5432B1Z3',
        contactPerson: user.name,
        email: user.email,
        phone: user.phone || '—',
        address: user.country || 'India',
        state: user.country === 'India' ? 'Maharashtra' : (user.country || 'Other'),
        country: user.country,
        additionalInfo: user.additionalInfo,
        status: 'active',
        rating: 0,
        totalPOs: 0,
        totalSpend: 0,
        gstinVerified: false,
        createdAt: new Date().toISOString(),
    }
}

function enrichVendorWithRegistration(vendor: Vendor): Vendor {
    const user = users.find(
        (u) => u.role === 'vendor' && (u.id === vendor.id || u.email.toLowerCase() === vendor.email.toLowerCase()),
    )
    if (!user) return vendor
    return {
        ...vendor,
        contactPerson: user.name,
        email: user.email,
        phone: user.phone || vendor.phone,
        country: user.country || vendor.country,
        additionalInfo: user.additionalInfo || vendor.additionalInfo,
    }
}

function syncVendorDetailsFromUsers(): void {
    for (const vendor of vendors) {
        const enriched = enrichVendorWithRegistration(vendor)
        vendor.contactPerson = enriched.contactPerson
        vendor.email = enriched.email
        vendor.phone = enriched.phone
        vendor.country = enriched.country
        vendor.additionalInfo = enriched.additionalInfo
    }
}

function buildApprovalChain(
    q: Quotation,
    selectedBy?: Pick<User, 'id' | 'name'>,
): ApprovalChainItem[] {
    const rfq = rfqs.find((r) => r.id === q.rfqId)
    const poUser = selectedBy || users.find((u) => u.id === rfq?.createdBy)
    const poName = poUser?.name || 'Procurement Officer'
    const now = new Date().toISOString()
    return [
        {
            id: `apr-po-${Date.now()}`,
            name: poName,
            role: 'Procurement Officer',
            status: 'approved',
            timestamp: now,
            remarks: `Selected ${q.vendorName} for manager approval`,
        },
        {
            id: `apr-vendor-${Date.now()}`,
            name: q.vendorName,
            role: 'Vendor',
            status: 'approved',
            timestamp: q.submittedAt,
            remarks: 'Quotation submitted',
        },
    ]
}

function normalizeApprovalRecord(a: Approval): Approval {
    const legacy = a.approvalChain.some(
        (item) => item.name === 'Sunita Mehta' || item.name === 'Rohit Agarwal',
    )
    if (legacy) {
        const rfq = rfqs.find((r) => r.id === a.rfqId)
        const q = quotations.find((x) => x.id === a.quotationId)
        const poUser = users.find((u) => u.id === rfq?.createdBy)
        a.approvalChain = buildApprovalChain(
            q || {
                rfqId: a.rfqId,
                vendorName: a.vendorName,
                submittedAt: a.createdAt,
            } as Quotation,
            poUser ? { id: poUser.id, name: poUser.name } : undefined,
        )
        if (a.vendorRating === 4.5 && !a.managerRating) {
            a.vendorRating = 0
        }
        touchDb()
    }
    return a
}

function syncVendorDirectoryFromUsers(): number {
    let added = 0
    for (const user of users) {
        if (user.role !== 'vendor' || user.status !== 'active') continue
        const exists = vendors.some((v) => v.email.toLowerCase() === user.email.toLowerCase())
        if (exists) continue
        vendors.push(vendorProfileFromUser(user))
        added++
    }
    return added
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

    const saved = await loadPersistedStore()
    if (saved) {
        users.push(...saved.users)
        vendors.push(...saved.vendors)
        rfqs.push(...saved.rfqs)
        quotations.push(...saved.quotations)
        purchaseOrders.push(...saved.purchaseOrders)
        invoices.push(...saved.invoices)
        approvals.push(...saved.approvals)
        activities.push(...saved.activities)
        notifications.push(...saved.notifications)
        registrations.push(...saved.registrations)
        for (const inv of invoices) ensureInvoiceNumber(inv)
        // eslint-disable-next-line no-console
        console.log(`📂 Loaded persisted database (${saved.savedAt || 'unknown'})`)
    } else {
        for (const u of SEED_USERS) {
            const { password, ...rest } = u
            users.push({ ...rest, passwordHash: await hash(password), status: rest.status || 'active' })
        }
        vendors.push(...SEED_VENDORS)
        rfqs.push(...SEED_RFQS)
        quotations.push(...SEED_QUOTATIONS)
        purchaseOrders.push(...SEED_POS)
        invoices.push(...SEED_INVOICES)
        approvals.push(...SEED_APPROVALS)
        activities.push(...SEED_ACTIVITIES)
        notifications.push(...SEED_NOTIFICATIONS)
    }

    const adminUser = users.find((u) => u.role === 'admin')
    if (adminUser) {
        adminUser.email = ADMIN_EMAIL
        adminUser.name = adminUser.name === 'System Admin' ? 'Admin' : adminUser.name
    } else if (!users.some((u) => u.email.toLowerCase() === ADMIN_EMAIL)) {
        for (const u of SEED_USERS) {
            const { password, ...rest } = u
            users.push({ ...rest, passwordHash: await hash(password), status: rest.status || 'active' })
        }
    }

    const synced = syncVendorDirectoryFromUsers()
    if (synced > 0) {
        // eslint-disable-next-line no-console
        console.log(`🔗 Synced ${synced} vendor user(s) into vendor directory`)
    }
    syncVendorDetailsFromUsers()

    touchDb()
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
        async findByRole(role: Role): Promise<User[]> {
            return users.filter((u) => u.role === role).map(toPublic)
        },
        async create(data: {
            name: string
            email: string
            role: Role
            password?: string
            id?: string
            status?: UserStatus
            phone?: string
            country?: string
            additionalInfo?: string
        }): Promise<User> {
            const password = data.password || 'demo123'
            const passwordHash = await hash(password)
            const next: UserRecord = {
                id: data.id || `u${Date.now()}`,
                name: data.name,
                email: data.email,
                role: data.role,
                avatar: data.name.charAt(0).toUpperCase(),
                passwordHash,
                status: data.status || 'active',
                phone: data.phone,
                country: data.country,
                additionalInfo: data.additionalInfo,
            }
            users.push(next)
            touchDb()
            return toPublic(next)
        },
    },

    vendors: {
        async findAll(): Promise<Vendor[]> {
            return vendors.map((v) => enrichVendorWithRegistration(v))
        },
        async findById(id: string): Promise<Vendor | null> {
            const v = vendors.find((x) => x.id === id)
            return v ? enrichVendorWithRegistration(v) : null
        },
        async findByEmail(email: string): Promise<Vendor | null> {
            return vendors.find((v) => v.email.toLowerCase() === email.toLowerCase()) ?? null
        },
        async createFromUser(user: UserRecord, userName: string = 'System'): Promise<Vendor | null> {
            if (user.role !== 'vendor') return null
            const existing = await db.vendors.findByEmail(user.email)
            if (existing) return existing
            const next = vendorProfileFromUser(user)
            vendors.push(next)
            await db.activities.log(
                'vendor_added',
                'user-plus',
                'Vendor Profile Created',
                `${next.name} added from approved registration`,
                userName,
            )
            touchDb()
            return next
        },
        async create(data: Omit<Vendor, 'id' | 'createdAt'>, userName: string = 'Admin'): Promise<Vendor> {
            const next: Vendor = {
                ...data,
                id: `v${Date.now()}`,
                createdAt: new Date().toISOString(),
            }
            vendors.push(next)

            // Auto-create a user account for the vendor so they can log in!
            const exists = await db.users.findByEmail(data.email)
            if (!exists) {
                await db.users.create({
                    id: next.id,
                    name: data.contactPerson || data.name,
                    email: data.email,
                    role: 'vendor',
                })
            }

            await db.activities.log('vendor_added', 'user-plus', 'New Vendor Registered', `${next.name} added to vendor directory`, userName)
            touchDb()
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

            const emailService = getEmailService()
            for (const vendorId of r.assignedVendors ?? []) {
                const vendor = vendors.find((v) => v.id === vendorId)
                const vendorUser = vendor ? users.find((u) => u.email === vendor.email) : null
                const userId = vendorUser?.id ?? vendorId

                await db.notifications.create({
                    userId,
                    title: 'New RFQ Invitation',
                    message: `You have been invited to quote for "${r.title}". Deadline: ${r.deadline}`,
                    type: 'rfq',
                    entityType: 'rfq',
                    entityId: r.id,
                })

                if (vendor?.email) {
                    await emailService.sendRFQNotification(
                        vendor.email,
                        vendor.contactPerson || vendor.name,
                        r.title,
                        r.deadline,
                        r.id,
                    )
                }
            }
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
        async markSelected(id: string, selectedBy?: User): Promise<Quotation | null> {
            const q = quotations.find((x) => x.id === id)
            if (!q) return null

            const rfq = rfqs.find((r) => r.id === q.rfqId)
            const chain = buildApprovalChain(q, selectedBy)

            for (const other of quotations) {
                if (other.rfqId === q.rfqId && other.id !== q.id && other.status === 'selected') {
                    other.status = 'submitted'
                }
            }
            q.status = 'selected'

            if (rfq) {
                rfq.status = 'pending'
            }

            const existingApproval = approvals.find(
                (a) => a.rfqId === q.rfqId && a.status === 'pending',
            )

            if (existingApproval) {
                existingApproval.quotationId = q.id
                existingApproval.vendorName = q.vendorName
                existingApproval.amount = q.grandTotal
                existingApproval.lineItems = q.lineItems.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                }))
                existingApproval.deliveryDays = q.deliveryDays
                existingApproval.paymentTerms = q.paymentTerms
                existingApproval.approvalChain = chain
                existingApproval.selectedById = selectedBy?.id
                existingApproval.selectedByName = selectedBy?.name
                touchDb()
                return q
            }

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
                approvalChain: chain,
                lineItems: q.lineItems.map((item) => ({ name: item.name, quantity: item.quantity })),
                deliveryDays: q.deliveryDays,
                vendorRating: 0,
                managerRating: null,
                paymentTerms: q.paymentTerms,
                selectedById: selectedBy?.id,
                selectedByName: selectedBy?.name,
                createdAt: new Date().toISOString(),
            }
            approvals.push(nextApproval)

            const emailService = getEmailService()
            for (const manager of users.filter((u) => u.role === 'manager')) {
                await db.notifications.create({
                    userId: manager.id,
                    title: 'Approval Required',
                    message: `Quotation from ${q.vendorName} for "${rfq?.title || 'RFQ'}" needs your review (₹${q.grandTotal.toLocaleString('en-IN')}).`,
                    type: 'approval',
                    entityType: 'approval',
                    entityId: approvalId,
                })
                await emailService.sendApprovalNotification(
                    manager.email,
                    manager.name,
                    rfq?.title || 'RFQ',
                    q.vendorName,
                    q.grandTotal,
                )
            }

            touchDb()
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
        async findAll(): Promise<Array<Invoice & {
            poNumber?: string
            vendorName?: string
            grandTotal?: number
            invoiceDate?: string
            dueDate?: string
            invoiceNumber?: string
        }>> {
            return invoices.map((inv) => {
                ensureInvoiceNumber(inv)
                const po = purchaseOrders.find((p) => p.id === inv.poId)
                return {
                    ...inv,
                    poNumber: po?.poNumber,
                    vendorName: po?.vendorName,
                    grandTotal: inv.totalAmount,
                    invoiceDate: inv.issuedAt,
                    dueDate: inv.dueAt,
                    invoiceNumber: inv.invoiceNumber,
                }
            })
        },
        async findByPO(poId: string): Promise<Invoice | null> {
            const inv = invoices.find((i) => i.poId === poId) ?? null
            if (inv) ensureInvoiceNumber(inv)
            return inv
        },
        async findById(id: string): Promise<Invoice | null> {
            const inv = invoices.find((i) => i.id === id) ?? null
            if (inv) ensureInvoiceNumber(inv)
            return inv
        },
        async findDetailById(id: string): Promise<InvoiceDetail | null> {
            const inv = invoices.find((i) => i.id === id)
            if (!inv) return null
            return buildInvoiceDetail(inv)
        },
        async markPaid(id: string): Promise<Invoice | null> {
            const i = invoices.find((x) => x.id === id)
            if (!i) return null
            i.status = 'paid'
            i.paidAt = new Date().toISOString()
            touchDb()
            return i
        },
        async emailInvoice(id: string, extraRecipients: string[] = []): Promise<{ sent: string[] }> {
            const inv = invoices.find((i) => i.id === id)
            if (!inv) throw new Error('Invoice not found')
            const detail = buildInvoiceDetail(inv)

            const pdfBuffer = await generateInvoicePdf(detail)
            const emailSvc = getEmailService()
            const sent: string[] = []
            const recipients = new Set<string>(extraRecipients.filter(Boolean))

            if (detail.vendorEmail) recipients.add(detail.vendorEmail)
            for (const admin of users.filter((u) => u.role === 'admin')) recipients.add(admin.email)
            for (const po of users.filter((u) => u.role === 'procurement_officer')) recipients.add(po.email)

            for (const email of recipients) {
                const ok = await emailSvc.sendInvoice(
                    email,
                    detail.vendorName || 'Vendor',
                    detail.invoiceNumber,
                    formatEmailDate(detail.issuedAt),
                    formatEmailDate(detail.dueAt),
                    detail.totalAmount,
                    pdfBuffer,
                )
                if (ok) sent.push(email)
            }
            return { sent }
        },
    },

    approvals: {
        async findAll(): Promise<Approval[]> {
            return approvals.map((a) => normalizeApprovalRecord(a))
        },
        async findById(id: string): Promise<Approval | null> {
            const a = approvals.find((x) => x.id === id)
            if (!a) return null
            return normalizeApprovalRecord(a)
        },
        async decide(
            id: string,
            action: 'approve' | 'reject',
            remarks: string,
            userName: string = 'Manager',
            vendorRating?: number,
        ): Promise<Approval | null> {
            const a = approvals.find((x) => x.id === id)
            if (!a) return null
            a.status = action === 'approve' ? 'approved' : 'rejected'
            a.remarks = remarks
            a.decidedAt = new Date().toISOString()

            if (action === 'approve' && vendorRating != null && vendorRating >= 1) {
                a.managerRating = vendorRating
                a.vendorRating = vendorRating
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
                    if (vendorRating != null && vendorRating >= 1) {
                        q.vendorRating = vendorRating
                        const vendor = vendors.find((v) => v.id === q.vendorId)
                        if (vendor) vendor.rating = vendorRating
                    }
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
                const issuedAt = new Date().toISOString()
                const dueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                
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
                    poDate: issuedAt,
                    invoiceDate: issuedAt,
                    dueDate: dueAt,
                    deliveryDate: null,
                    lineItems: q.lineItems,
                    orgName: 'KSV Enterprises Pvt Ltd',
                    orgAddress: 'Plot 7, Nariman Point, Mumbai, Maharashtra 400021',
                    orgGSTIN: '27AABCK1234F1Z1',
                    createdAt: issuedAt,
                }
                purchaseOrders.push(nextPO)

                const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
                const nextInvoice: Invoice = {
                    id: `inv${Date.now()}`,
                    invoiceNumber,
                    poId: poId,
                    vendorId: q.vendorId,
                    amount: subtotal,
                    gstAmount: cgst + sgst,
                    totalAmount: q.grandTotal,
                    status: 'pending',
                    issuedAt,
                    dueAt,
                    paidAt: null,
                }
                invoices.push(nextInvoice)

                const invoiceDetail = buildInvoiceDetail(nextInvoice)
                const pdfBuffer = await generateInvoicePdf(invoiceDetail)
                const emailSvc = getEmailService()

                if (vendor?.email) {
                    await emailSvc.sendInvoice(
                        vendor.email,
                        q.vendorName,
                        invoiceNumber,
                        formatEmailDate(issuedAt),
                        formatEmailDate(dueAt),
                        q.grandTotal,
                        pdfBuffer,
                    )
                }

                for (const admin of users.filter((u) => u.role === 'admin')) {
                    await emailSvc.sendInvoice(
                        admin.email,
                        q.vendorName,
                        invoiceNumber,
                        formatEmailDate(issuedAt),
                        formatEmailDate(dueAt),
                        q.grandTotal,
                        pdfBuffer,
                    )
                    await db.notifications.create({
                        userId: admin.id,
                        title: 'Invoice Generated',
                        message: `${invoiceNumber} for ${q.vendorName} — ₹${q.grandTotal.toLocaleString('en-IN')}`,
                        type: 'system',
                        entityType: 'invoice',
                        entityId: nextInvoice.id,
                    })
                }

                for (const officer of users.filter((u) => u.role === 'procurement_officer')) {
                    await emailSvc.sendInvoice(
                        officer.email,
                        q.vendorName,
                        invoiceNumber,
                        formatEmailDate(issuedAt),
                        formatEmailDate(dueAt),
                        q.grandTotal,
                        pdfBuffer,
                    )
                }

                await db.activities.log(
                    'invoice_created',
                    'receipt',
                    'Invoice Generated',
                    `${invoiceNumber} created for ${poNumber} — ₹${q.grandTotal.toLocaleString('en-IN')}`,
                    userName,
                )

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

            if (q) {
                const vendorUser = users.find((u) => u.id === q.vendorId || u.email === vendors.find((v) => v.id === q.vendorId)?.email)
                if (vendorUser) {
                    await db.notifications.create({
                        userId: vendorUser.id,
                        title: actTitle,
                        message: actDesc,
                        type: 'approval',
                        entityType: 'approval',
                        entityId: a.id,
                    })
                    await getEmailService().sendApprovalResult(
                        vendorUser.email,
                        q.vendorName,
                        a.rfqTitle,
                        action === 'approve' ? 'approved' : 'rejected',
                        remarks,
                    )
                }
            }

            touchDb()
            return a
        },
    },

    notifications: {
        async findByUser(userId: string): Promise<Notification[]> {
            return notifications
                .filter((n) => n.userId === userId)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        },
        async unreadCount(userId: string): Promise<number> {
            return notifications.filter((n) => n.userId === userId && !n.isRead).length
        },
        async create(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<Notification> {
            const next: Notification = {
                ...data,
                id: `n${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                isRead: false,
                createdAt: new Date().toISOString(),
            }
            notifications.push(next)
            touchDb()
            return next
        },
        async markRead(id: string, userId: string): Promise<Notification | null> {
            const n = notifications.find((x) => x.id === id && x.userId === userId)
            if (!n) return null
            n.isRead = true
            return n
        },
        async markAllRead(userId: string): Promise<number> {
            let count = 0
            for (const n of notifications) {
                if (n.userId === userId && !n.isRead) {
                    n.isRead = true
                    count++
                }
            }
            return count
        },
    },

    otps: {
        async store(email: string, otp: string, purpose: OtpPurpose): Promise<void> {
            const key = `${email.toLowerCase()}:${purpose}`
            otps.set(key, {
                otp,
                purpose,
                expiresAt: Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000,
                attempts: 0,
            })
        },
        async verify(email: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
            const key = `${email.toLowerCase()}:${purpose}`
            const record = otps.get(key)
            if (!record) return false
            if (Date.now() > record.expiresAt) {
                otps.delete(key)
                return false
            }
            record.attempts++
            if (record.attempts > 5) {
                otps.delete(key)
                return false
            }
            if (record.otp !== otp) return false
            otps.delete(key)
            return true
        },
    },

    registrations: {
        async findByEmail(email: string): Promise<RegistrationRequest | null> {
            return registrations.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null
        },
        async findById(id: string): Promise<RegistrationRequest | null> {
            return registrations.find((r) => r.id === id) ?? null
        },
        async findPending(): Promise<RegistrationRequest[]> {
            return registrations
                .filter((r) => r.status === 'pending_approval')
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        },
        async countPending(): Promise<number> {
            return registrations.filter((r) => r.status === 'pending_approval').length
        },
        async create(data: Omit<RegistrationRequest, 'id' | 'status' | 'createdAt'>): Promise<RegistrationRequest> {
            const idx = registrations.findIndex((r) => r.email.toLowerCase() === data.email.toLowerCase())
            if (idx !== -1) {
                const existing = registrations[idx]
                if (existing.status === 'pending_approval' || existing.status === 'pending_otp') {
                    throw new Error('REGISTRATION_EXISTS')
                }
                registrations.splice(idx, 1)
            }
            const next: RegistrationRequest = {
                ...data,
                id: `reg${Date.now()}`,
                status: 'pending_otp',
                createdAt: new Date().toISOString(),
            }
            registrations.push(next)
            touchDb()
            return next
        },
        async markOtpVerified(email: string): Promise<RegistrationRequest | null> {
            const r = registrations.find((x) => x.email.toLowerCase() === email.toLowerCase())
            if (!r) return null
            r.status = 'pending_approval'
            touchDb()
            return r
        },
        async approve(id: string, adminId: string): Promise<User | null> {
            const r = registrations.find((x) => x.id === id)
            if (!r || r.status !== 'pending_approval') return null
            const exists = await db.users.findByEmail(r.email)
            if (exists) return null

            const next: UserRecord = {
                id: `u${Date.now()}`,
                name: `${r.firstName} ${r.lastName}`.trim(),
                email: r.email,
                role: r.role,
                avatar: r.firstName.charAt(0).toUpperCase(),
                passwordHash: r.passwordHash,
                status: 'active',
                phone: r.phone,
                country: r.country,
                additionalInfo: r.additionalInfo,
            }
            users.push(next)
            r.status = 'approved'
            r.reviewedAt = new Date().toISOString()
            r.reviewedBy = adminId

            if (r.role === 'vendor') {
                await db.vendors.createFromUser(next, 'Admin')
            }

            await db.notifications.create({
                userId: next.id,
                title: 'Account Approved',
                message: 'Your VendorBridge registration has been approved. You can now sign in.',
                type: 'system',
            })

            await getEmailService().sendRegistrationApproved(next.email, next.name)
            touchDb()
            return toPublic(next)
        },
        async reject(id: string, adminId: string, reason: string): Promise<RegistrationRequest | null> {
            const r = registrations.find((x) => x.id === id)
            if (!r || r.status !== 'pending_approval') return null
            r.status = 'rejected'
            r.reviewedAt = new Date().toISOString()
            r.reviewedBy = adminId
            r.rejectionReason = reason
            touchDb()
            return r
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
