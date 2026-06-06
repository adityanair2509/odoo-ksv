/**
 * Minimal seed — only bootstrap admin. All other data comes from real usage.
 */

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
} from './types.js'

type SeedUser = Omit<UserRecord, 'passwordHash'> & { password: string }

export const SEED_USERS: SeedUser[] = [
    {
        id: 'admin1',
        name: 'Admin',
        email: 'shreenathpillai1696@gmail.com',
        role: 'admin',
        avatar: 'S',
        password: 'Admin@123',
        status: 'active',
    },
]

export const SEED_VENDORS: Vendor[] = []
export const SEED_RFQS: RFQ[] = []
export const SEED_QUOTATIONS: Quotation[] = []
export const SEED_POS: PurchaseOrder[] = []
export const SEED_INVOICES: Invoice[] = []
export const SEED_APPROVALS: Approval[] = []
export const SEED_ACTIVITIES: ActivityEntry[] = []
export const SEED_NOTIFICATIONS: Notification[] = []
