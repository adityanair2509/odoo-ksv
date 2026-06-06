/**
 * Static seed data for the in-memory data layer.
 *
 * Mirrors the frontend's mock files (src/mock/mock*.js) so the API
 * returns the same records the UI was previously displaying in mock
 * mode. Edit this file to change the demo dataset.
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
} from './types.js'

// ---------- Users ----------

type SeedUser = Omit<UserRecord, 'passwordHash'> & { password: string }

export const SEED_USERS: SeedUser[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@vendorbridge.in', role: 'admin', avatar: 'A', password: 'demo123' },
    { id: 'u2', name: 'Priya Mehta', email: 'procurement@vendorbridge.in', role: 'procurement_officer', avatar: 'P', password: 'demo123' },
    { id: 'u3', name: 'Rohit Agarwal', email: 'manager@vendorbridge.in', role: 'manager', avatar: 'R', password: 'demo123' },
    { id: 'u4', name: 'Vendor Partner', email: 'vendor@vendorbridge.in', role: 'vendor', avatar: 'V', password: 'demo123' },
]

// ---------- Vendors ----------

export const SEED_VENDORS: Vendor[] = [
    {
        id: 'v1', name: 'Infra Supplies Pvt Ltd', category: 'Construction',
        gstin: '27AACCI1234A1Z5', contactPerson: 'Rajesh Kumar',
        email: 'rajesh@infrasupplies.in', phone: '+91 98765 43210',
        address: '14, MIDC Industrial Area, Pune, Maharashtra 411019',
        state: 'Maharashtra', status: 'active', rating: 4.5, totalPOs: 12,
        totalSpend: 2450000, createdAt: '2024-01-15T10:00:00Z', gstinVerified: true,
    },
    {
        id: 'v2', name: 'TechSoft Solutions LLP', category: 'IT',
        gstin: '29AABCT5432B1Z3', contactPerson: 'Priya Sharma',
        email: 'priya@techsoft.in', phone: '+91 80000 12345',
        address: '5th Floor, Manyata Tech Park, Bengaluru, Karnataka 560045',
        state: 'Karnataka', status: 'active', rating: 4.8, totalPOs: 7,
        totalSpend: 1890000, createdAt: '2024-02-20T09:00:00Z', gstinVerified: true,
    },
    {
        id: 'v3', name: 'QuickMove Logistics', category: 'Logistics',
        gstin: '07AACQL9876C1Z1', contactPerson: 'Amit Singh',
        email: 'amit@quickmove.in', phone: '+91 98112 56789',
        address: 'Plot 22, Okhla Industrial Estate, New Delhi 110020',
        state: 'Delhi', status: 'pending', rating: 3.9, totalPOs: 3,
        totalSpend: 340000, createdAt: '2024-04-10T14:00:00Z', gstinVerified: true,
    },
    {
        id: 'v4', name: 'FurnishPro India', category: 'Furniture',
        gstin: '33AABCF7654D1Z8', contactPerson: 'Meena Rajan',
        email: 'meena@furnishpro.in', phone: '+91 94440 98765',
        address: 'No. 8, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
        state: 'Tamil Nadu', status: 'active', rating: 4.2, totalPOs: 5,
        totalSpend: 780000, createdAt: '2024-03-05T11:00:00Z', gstinVerified: true,
    },
    {
        id: 'v5', name: 'DataNet Systems', category: 'IT',
        gstin: '09AABCD1234E1Z2', contactPerson: 'Vikram Patel',
        email: 'vikram@datanetsys.in', phone: '+91 99110 22334',
        address: 'C-14, Sector 62, Noida, Uttar Pradesh 201309',
        state: 'Uttar Pradesh', status: 'blocked', rating: 2.1, totalPOs: 1,
        totalSpend: 125000, createdAt: '2024-05-01T08:00:00Z', gstinVerified: false,
    },
]

// ---------- RFQs ----------

export const SEED_RFQS: RFQ[] = [
    {
        id: 'rfq1', title: 'Office Furniture Procurement Q3 2024', category: 'Furniture',
        status: 'sent', priority: 'High', deadline: '2024-07-30T00:00:00Z',
        description: 'Procurement of office chairs, desks, and storage units for the new Pune office expansion. Approximately 150 workstations to be furnished.',
        assignedVendors: ['v4', 'v1'],
        lineItems: [
            { id: 'li1', name: 'Ergonomic Office Chair', quantity: 150, unit: 'Nos' },
            { id: 'li2', name: 'Work Desk (L-Shaped)', quantity: 80, unit: 'Nos' },
            { id: 'li3', name: 'Storage Cabinet (4-Door)', quantity: 30, unit: 'Nos' },
        ],
        quotationsReceived: 3, createdBy: 'u1', createdAt: '2024-06-15T09:00:00Z',
    },
    {
        id: 'rfq2', title: 'Network Infrastructure Upgrade', category: 'IT',
        status: 'draft', priority: 'Medium', deadline: '2024-08-15T00:00:00Z',
        description: 'Upgrade of core network switches, firewall appliances, and structured cabling for HQ building.',
        assignedVendors: ['v2', 'v5'],
        lineItems: [
            { id: 'li4', name: 'Core Switch (48-port)', quantity: 5, unit: 'Nos' },
            { id: 'li5', name: 'Firewall Appliance', quantity: 2, unit: 'Nos' },
            { id: 'li6', name: 'CAT6 Cable (Drum)', quantity: 20, unit: 'Drums' },
        ],
        quotationsReceived: 0, createdBy: 'u3', createdAt: '2024-06-20T10:30:00Z',
    },
    {
        id: 'rfq3', title: 'Warehouse Shelving Units', category: 'Construction',
        status: 'approved', priority: 'Low', deadline: '2024-07-10T00:00:00Z',
        description: 'Heavy-duty industrial shelving units for the new Bhiwandi warehouse.',
        assignedVendors: ['v1'],
        lineItems: [
            { id: 'li7', name: 'Heavy-Duty Shelf (5-tier)', quantity: 100, unit: 'Nos' },
            { id: 'li8', name: 'Corner Bracket Set', quantity: 200, unit: 'Sets' },
        ],
        quotationsReceived: 1, createdBy: 'u1', createdAt: '2024-05-28T08:00:00Z',
    },
    {
        id: 'rfq4', title: 'Annual Courier & Logistics Services', category: 'Logistics',
        status: 'pending', priority: 'High', deadline: '2024-09-01T00:00:00Z',
        description: 'Annual contract for pan-India courier and freight services for product distribution.',
        assignedVendors: ['v3'],
        lineItems: [
            { id: 'li9', name: 'Express Delivery (per shipment)', quantity: 500, unit: 'Nos' },
            { id: 'li10', name: 'Freight Service (per month)', quantity: 12, unit: 'Months' },
        ],
        quotationsReceived: 1, createdBy: 'u3', createdAt: '2024-06-01T11:00:00Z',
    },
]

// ---------- Quotations ----------

const Q_LINEITEMS_FURNIPRO = [
    { name: 'Ergonomic Office Chair', quantity: 150, unitPrice: 7500, total: 1125000 },
    { name: 'Work Desk (L-Shaped)', quantity: 80, unitPrice: 8500, total: 680000 },
    { name: 'Storage Cabinet (4-Door)', quantity: 30, unitPrice: 2333, total: 70000 },
]
const Q_LINEITEMS_INFRA = [
    { name: 'Ergonomic Office Chair', quantity: 150, unitPrice: 6500, total: 975000 },
    { name: 'Work Desk (L-Shaped)', quantity: 80, unitPrice: 8000, total: 640000 },
    { name: 'Storage Cabinet (4-Door)', quantity: 30, unitPrice: 2500, total: 75000 },
]
const Q_LINEITEMS_QUICKMOVE = [
    { name: 'Ergonomic Office Chair', quantity: 150, unitPrice: 8500, total: 1275000 },
    { name: 'Work Desk (L-Shaped)', quantity: 80, unitPrice: 9500, total: 760000 },
    { name: 'Storage Cabinet (4-Door)', quantity: 30, unitPrice: 2167, total: 65000 },
]

export const SEED_QUOTATIONS: Quotation[] = [
    {
        id: 'q1', rfqId: 'rfq1', vendorId: 'v4', vendorName: 'FurnishPro India',
        status: 'submitted', grandTotal: 1875000, gstPercent: 18, deliveryDays: 21,
        vendorRating: 4.2, paymentTerms: '30 days from delivery',
        lineItems: Q_LINEITEMS_FURNIPRO,
        submittedAt: '2024-06-22T14:00:00Z',
        notes: 'Bulk discount of 5% applied on chairs. Delivery within 3 weeks from PO.',
    },
    {
        id: 'q2', rfqId: 'rfq1', vendorId: 'v1', vendorName: 'Infra Supplies Pvt Ltd',
        status: 'submitted', grandTotal: 1690000, gstPercent: 18, deliveryDays: 30,
        vendorRating: 4.5, paymentTerms: '45 days from invoice',
        lineItems: Q_LINEITEMS_INFRA,
        submittedAt: '2024-06-23T10:00:00Z',
        notes: 'Standard quality furniture with 1-year warranty. Installation included.',
    },
    {
        id: 'q3', rfqId: 'rfq1', vendorId: 'v3', vendorName: 'QuickMove Logistics',
        status: 'submitted', grandTotal: 2100000, gstPercent: 18, deliveryDays: 14,
        vendorRating: 3.9, paymentTerms: '15 days from delivery',
        lineItems: Q_LINEITEMS_QUICKMOVE,
        submittedAt: '2024-06-24T09:00:00Z',
        notes: 'Premium quality with express delivery. Includes free assembly service.',
    },
]

// ---------- Purchase Orders ----------

const ORG = {
    name: 'KSV Enterprises Pvt Ltd',
    address: 'Plot 7, Nariman Point, Mumbai, Maharashtra 400021',
    gstin: '27AABCK1234F1Z1',
}

const PO_LINEITEMS_SHELVING = [
    { name: 'Heavy-Duty Shelf (5-tier)', quantity: 100, unitPrice: 3500, total: 350000 },
    { name: 'Corner Bracket Set', quantity: 200, unitPrice: 300, total: 60000 },
]
const PO_LINEITEMS_FURNITURE = Q_LINEITEMS_FURNIPRO
const PO_LINEITEMS_NETWORK = [
    { name: 'Core Switch (48-port)', quantity: 5, unitPrice: 120000, total: 600000 },
    { name: 'Firewall Appliance', quantity: 2, unitPrice: 175000, total: 350000 },
    { name: 'CAT6 Cable (Drum)', quantity: 20, unitPrice: 3347, total: 66949 },
]

export const SEED_POS: PurchaseOrder[] = [
    {
        id: 'po1', poNumber: 'PO-2024-0042', rfqId: 'rfq3', rfqTitle: 'Warehouse Shelving Units',
        vendorId: 'v1', vendorName: 'Infra Supplies Pvt Ltd',
        vendorAddress: '14, MIDC Industrial Area, Pune, Maharashtra 411019',
        vendorGSTIN: '27AACCI1234A1Z5', status: 'delivered',
        amount: 485000, cgstPercent: 9, sgstPercent: 9, subtotal: 410000, cgst: 36900, sgst: 36900, grandTotal: 483800,
        poDate: '2024-06-13T10:00:00Z', invoiceDate: '2024-06-14T10:00:00Z',
        dueDate: '2024-07-14T10:00:00Z', deliveryDate: '2024-06-27T10:00:00Z',
        lineItems: PO_LINEITEMS_SHELVING,
        orgName: ORG.name, orgAddress: ORG.address, orgGSTIN: ORG.gstin,
        createdAt: '2024-06-13T10:00:00Z',
    },
    {
        id: 'po2', poNumber: 'PO-2024-0043', rfqId: 'rfq1', rfqTitle: 'Office Furniture Procurement Q3 2024',
        vendorId: 'v4', vendorName: 'FurnishPro India',
        vendorAddress: 'No. 8, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
        vendorGSTIN: '33AABCF7654D1Z8', status: 'pending',
        amount: 1875000, cgstPercent: 9, sgstPercent: 9, subtotal: 1588983, cgst: 143009, sgst: 143009, grandTotal: 1875001,
        poDate: '2024-07-01T10:00:00Z', invoiceDate: '2024-07-02T10:00:00Z',
        dueDate: '2024-08-01T10:00:00Z', deliveryDate: null,
        lineItems: PO_LINEITEMS_FURNITURE,
        orgName: ORG.name, orgAddress: ORG.address, orgGSTIN: ORG.gstin,
        createdAt: '2024-07-01T10:00:00Z',
    },
    {
        id: 'po3', poNumber: 'PO-2024-0044', rfqId: 'rfq2', rfqTitle: 'Network Infrastructure Upgrade',
        vendorId: 'v2', vendorName: 'TechSoft Solutions LLP',
        vendorAddress: '5th Floor, Manyata Tech Park, Bengaluru, Karnataka 560045',
        vendorGSTIN: '29AABCT5432B1Z3', status: 'overdue',
        amount: 1200000, cgstPercent: 9, sgstPercent: 9, subtotal: 1016949, cgst: 91525, sgst: 91525, grandTotal: 1199999,
        poDate: '2024-05-10T10:00:00Z', invoiceDate: '2024-05-11T10:00:00Z',
        dueDate: '2024-06-10T10:00:00Z', deliveryDate: null,
        lineItems: PO_LINEITEMS_NETWORK,
        orgName: ORG.name, orgAddress: ORG.address, orgGSTIN: ORG.gstin,
        createdAt: '2024-05-10T10:00:00Z',
    },
]

// ---------- Invoices ----------

export const SEED_INVOICES: Invoice[] = [
    {
        id: 'inv1', poId: 'po1', vendorId: 'v1', amount: 410000, gstAmount: 73800,
        totalAmount: 483800, status: 'paid',
        issuedAt: '2024-06-14T10:00:00Z', dueAt: '2024-07-14T10:00:00Z',
        paidAt: '2024-06-26T15:00:00Z',
    },
    {
        id: 'inv2', poId: 'po2', vendorId: 'v4', amount: 1588983, gstAmount: 286017,
        totalAmount: 1875000, status: 'pending',
        issuedAt: '2024-07-02T10:00:00Z', dueAt: '2024-08-01T10:00:00Z',
        paidAt: null,
    },
    {
        id: 'inv3', poId: 'po3', vendorId: 'v2', amount: 1016949, gstAmount: 183050,
        totalAmount: 1199999, status: 'overdue',
        issuedAt: '2024-05-11T10:00:00Z', dueAt: '2024-06-10T10:00:00Z',
        paidAt: null,
    },
]

// ---------- Approvals ----------

export const SEED_APPROVALS: Approval[] = [
    {
        id: 'ap1', rfqId: 'rfq1', rfqTitle: 'Office Furniture Procurement Q3 2024',
        quotationId: 'q2', vendorName: 'Infra Supplies Pvt Ltd', amount: 1690000,
        status: 'pending', currentStep: 'L1 Review',
        steps: [
            { label: 'Submitted', status: 'completed', completedAt: '2024-06-25T09:00:00Z' },
            { label: 'L1 Review', status: 'current', completedAt: null },
            { label: 'L2 Approval', status: 'upcoming', completedAt: null },
            { label: 'PO Generated', status: 'upcoming', completedAt: null },
        ],
        approvalChain: [
            { id: 'apr1', name: 'Sunita Mehta', role: 'Procurement Manager', status: 'approved', timestamp: '2024-06-25T10:30:00Z', remarks: 'Quotation looks competitive. Proceeding to L2.' },
            { id: 'apr2', name: 'Rohit Agarwal', role: 'Finance Head', status: 'pending', timestamp: null, remarks: null },
        ],
        lineItems: [
            { name: 'Ergonomic Office Chair', quantity: 150 },
            { name: 'Work Desk (L-Shaped)', quantity: 80 },
            { name: 'Storage Cabinet (4-Door)', quantity: 30 },
        ],
        deliveryDays: 30, vendorRating: 4.5, paymentTerms: '45 days from invoice',
        createdAt: '2024-06-25T09:00:00Z',
    },
    {
        id: 'ap2', rfqId: 'rfq3', rfqTitle: 'Warehouse Shelving Units',
        quotationId: 'q4', vendorName: 'Infra Supplies Pvt Ltd', amount: 485000,
        status: 'approved', currentStep: 'PO Generated',
        steps: [
            { label: 'Submitted', status: 'completed', completedAt: '2024-06-10T09:00:00Z' },
            { label: 'L1 Review', status: 'completed', completedAt: '2024-06-11T11:00:00Z' },
            { label: 'L2 Approval', status: 'completed', completedAt: '2024-06-12T14:00:00Z' },
            { label: 'PO Generated', status: 'completed', completedAt: '2024-06-13T10:00:00Z' },
        ],
        approvalChain: [
            { id: 'apr3', name: 'Sunita Mehta', role: 'Procurement Manager', status: 'approved', timestamp: '2024-06-11T11:00:00Z', remarks: 'Verified and approved.' },
            { id: 'apr4', name: 'Rohit Agarwal', role: 'Finance Head', status: 'approved', timestamp: '2024-06-12T14:00:00Z', remarks: 'Within budget. Approved.' },
        ],
        lineItems: [
            { name: 'Heavy-Duty Shelf (5-tier)', quantity: 100 },
            { name: 'Corner Bracket Set', quantity: 200 },
        ],
        deliveryDays: 14, vendorRating: 4.5, paymentTerms: '30 days from delivery',
        createdAt: '2024-06-10T09:00:00Z',
    },
]

export const SEED_ACTIVITIES: ActivityEntry[] = [
    {
        id: 'act1',
        type: 'po_created',
        icon: 'file-plus',
        title: 'Purchase Order Created',
        description: 'PO-2024-0044 raised for TechSoft Solutions LLP — ₹12,00,000',
        user: 'Sunita Mehta',
        timestamp: '2024-07-01T14:30:00Z',
    },
    {
        id: 'act2',
        type: 'approval_approved',
        icon: 'check-circle',
        title: 'Approval Granted',
        description: 'L2 approval for Office Furniture RFQ approved by Rohit Agarwal',
        user: 'Rohit Agarwal',
        timestamp: '2024-06-30T11:15:00Z',
    },
    {
        id: 'act3',
        type: 'rfq_sent',
        icon: 'send',
        title: 'RFQ Sent to Vendors',
        description: 'Annual Courier & Logistics Services RFQ sent to 1 vendor',
        user: 'Admin',
        timestamp: '2024-06-29T09:45:00Z',
    },
    {
        id: 'act4',
        type: 'quotation_received',
        icon: 'inbox',
        title: 'Quotation Received',
        description: 'QuickMove Logistics submitted quotation for Office Furniture RFQ',
        user: 'QuickMove Logistics',
        timestamp: '2024-06-28T16:00:00Z',
    },
    {
        id: 'act5',
        type: 'vendor_added',
        icon: 'user-plus',
        title: 'New Vendor Registered',
        description: 'DataNet Systems added to vendor directory',
        user: 'Admin',
        timestamp: '2024-06-27T10:30:00Z',
    },
    {
        id: 'act6',
        type: 'invoice_paid',
        icon: 'check-square',
        title: 'Invoice Marked as Paid',
        description: 'PO-2024-0042 invoice paid — ₹4,83,800 to Infra Supplies Pvt Ltd',
        user: 'Rohit Agarwal',
        timestamp: '2024-06-26T15:00:00Z',
    },
    {
        id: 'act7',
        type: 'approval_rejected',
        icon: 'x-circle',
        title: 'Approval Rejected',
        description: 'DataNet Systems blocked due to compliance issues',
        user: 'Sunita Mehta',
        timestamp: '2024-06-25T12:00:00Z',
    },
    {
        id: 'act8',
        type: 'rfq_created',
        icon: 'file-text',
        title: 'RFQ Created',
        description: 'Network Infrastructure Upgrade RFQ drafted by Procurement Manager',
        user: 'Admin',
        timestamp: '2024-06-24T09:00:00Z',
    },
]
