/**
 * Shared domain types. These mirror the shape returned by the existing
 * frontend mocks in `src/mock/mock*.js` so the API is drop-in compatible.
 */

export type Role = 'admin' | 'procurement_officer' | 'manager' | 'vendor'

export type VendorStatus = 'active' | 'pending' | 'blocked'
export type RFQStatus = 'draft' | 'sent' | 'pending' | 'approved' | 'closed'
export type Priority = 'Low' | 'Medium' | 'High'
export type QuotationStatus = 'submitted' | 'selected' | 'rejected'
export type POStatus =
    | 'issued'
    | 'acknowledged'
    | 'in_transit'
    | 'delivered'
    | 'paid'
    | 'pending'
    | 'overdue'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ApprovalEntityType = 'rfq' | 'po' | 'vendor'

export interface LineItem {
    id?: string
    name: string
    quantity: number
    unit?: string
    unitPrice?: number
    total?: number
}

/** User with credentials (only used server-side). */
export interface UserRecord {
    id: string
    name: string
    email: string
    role: Role
    avatar: string
    passwordHash: string
}

/** User shape returned to the client (no password). */
export interface User {
    id: string
    name: string
    email: string
    role: Role
    avatar: string
}

export interface Vendor {
    id: string
    name: string
    category: string
    gstin: string
    contactPerson: string
    email: string
    phone: string
    address: string
    state: string
    status: VendorStatus
    rating: number
    totalPOs: number
    totalSpend: number
    createdAt: string
    gstinVerified: boolean
}

export interface RFQ {
    id: string
    title: string
    category: string
    status: RFQStatus
    priority: Priority
    deadline: string
    description: string
    assignedVendors: string[]
    lineItems: LineItem[]
    quotationsReceived: number
    createdBy: string
    createdAt: string
}

export interface Quotation {
    id: string
    rfqId: string
    vendorId: string
    vendorName: string
    status: QuotationStatus
    grandTotal: number
    gstPercent: number
    deliveryDays: number
    vendorRating: number
    paymentTerms: string
    lineItems: LineItem[]
    submittedAt: string
    notes: string
}

export interface PurchaseOrder {
    id: string
    poNumber: string
    rfqId: string
    rfqTitle: string
    vendorId: string
    vendorName: string
    vendorAddress: string
    vendorGSTIN: string
    status: POStatus
    amount: number
    cgstPercent: number
    sgstPercent: number
    subtotal: number
    cgst: number
    sgst: number
    grandTotal: number
    poDate: string
    invoiceDate: string | null
    dueDate: string | null
    deliveryDate: string | null
    lineItems: LineItem[]
    orgName: string
    orgAddress: string
    orgGSTIN: string
    createdAt: string
}

export interface Invoice {
    id: string
    poId: string
    vendorId: string
    amount: number
    gstAmount: number
    totalAmount: number
    status: InvoiceStatus
    issuedAt: string
    dueAt: string
    paidAt: string | null
}

export interface ApprovalStep {
    label: string
    status: 'completed' | 'current' | 'upcoming'
    completedAt: string | null
}

export interface ApprovalChainItem {
    id: string
    name: string
    role: string
    status: 'approved' | 'pending' | 'rejected'
    timestamp: string | null
    remarks: string | null
}

export interface Approval {
    id: string
    rfqId: string
    rfqTitle: string
    quotationId: string
    vendorName: string
    amount: number
    status: ApprovalStatus
    currentStep: string
    steps: ApprovalStep[]
    approvalChain: ApprovalChainItem[]
    lineItems: Pick<LineItem, 'name' | 'quantity'>[]
    deliveryDays: number
    vendorRating: number
    paymentTerms: string
    createdAt: string
    entityType?: ApprovalEntityType
    entityId?: string
    requestedBy?: string
    approverId?: string
    remarks?: string
    decidedAt?: string | null
}
