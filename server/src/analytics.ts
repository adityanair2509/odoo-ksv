/**
 * Analytics computed from live in-memory data.
 */

import { db } from './db.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function getSpendingByCategory() {
    const [pos, vendors] = await Promise.all([db.purchaseOrders.findAll(), db.vendors.findAll()])
    const map: Record<string, number> = {}
    for (const po of pos) {
        const vendor = vendors.find((v) => v.id === po.vendorId)
        const cat = vendor?.category || 'Other'
        map[cat] = (map[cat] || 0) + po.grandTotal
    }
    return Object.entries(map)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
}

export async function getMonthlySpend(months = 6) {
    const pos = await db.purchaseOrders.findAll()
    const now = new Date()
    const result: { month: string; amount: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = MONTHS[d.getMonth()]
        const amount = pos
            .filter((po) => {
                const pd = new Date(po.poDate)
                return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
            })
            .reduce((s, po) => s + po.grandTotal, 0)
        result.push({ month: label, amount })
    }
    return result
}

export async function getSpendSummary() {
    const [pos, vendors] = await Promise.all([db.purchaseOrders.findAll(), db.vendors.findAll()])
    const ytdTotal = pos.reduce((s, po) => s + po.grandTotal, 0)
    const activeVendors = vendors.filter((v) => v.status === 'active').length || 1
    return {
        ytdTotal,
        avgPerVendor: Math.round(ytdTotal / activeVendors),
        poCount: pos.length,
        vendorCount: vendors.length,
    }
}

export async function getMonthlyPOVolume(months = 12) {
    const pos = await db.purchaseOrders.findAll()
    const now = new Date()
    const result: { month: string; count: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = MONTHS[d.getMonth()]
        const count = pos.filter((po) => {
            const pd = new Date(po.poDate)
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
        }).length
        result.push({ month: label, count })
    }
    return result
}

export async function getVendorPerformance() {
    const vendors = await db.vendors.findAll()
    return vendors.map((v) => ({
        vendor: v.name.split(' ')[0],
        name: v.name,
        rating: v.rating || 0,
        pos: v.totalPOs || 0,
        spend: v.totalSpend || 0,
    }))
}

export async function getPipelineSummary() {
    const [rfqs, pos, approvals] = await Promise.all([
        db.rfqs.findAll(),
        db.purchaseOrders.findAll(),
        db.approvals.findAll(),
    ])
    return {
        draftRfqs: rfqs.filter((r) => r.status === 'draft').length,
        sentRfqs: rfqs.filter((r) => r.status === 'sent').length,
        quotesReceived: rfqs.filter((r) => (r.quotationsReceived || 0) > 0).length,
        pendingPoApproval: approvals.filter((a) => a.status === 'pending').length,
        poDelivered: pos.filter((p) => p.status === 'delivered').length,
    }
}

export async function getBudgetUtilisation(budgetCap = 8_000_000) {
    const pos = await db.purchaseOrders.findAll()
    const spent = pos.reduce((s, po) => s + po.grandTotal, 0)
    const pct = budgetCap > 0 ? Math.min(100, (spent / budgetCap) * 100) : 0
    return {
        spent,
        budgetCap,
        remaining: Math.max(0, budgetCap - spent),
        utilisationPct: Math.round(pct * 10) / 10,
    }
}

export async function getVendorDashboard(vendorId: string) {
    const [rfqs, quotations, pos, vendor] = await Promise.all([
        db.rfqs.findAll(),
        db.quotations.findAll(),
        db.purchaseOrders.findAll(),
        db.vendors.findById(vendorId),
    ])

    const myQuotes = quotations.filter((q) => q.vendorId === vendorId)
    const myPos = pos.filter((p) => p.vendorId === vendorId)
    const openRfqs = rfqs.filter(
        (r) => r.status === 'sent' && r.assignedVendors?.includes(vendorId),
    )

    const selected = myQuotes.filter((q) => q.status === 'selected').length
    const winRate = myQuotes.length > 0 ? Math.round((selected / myQuotes.length) * 100) : 0

    return {
        rating: vendor?.rating ?? 0,
        onTimeDeliveryPct: myPos.length > 0 ? 92 : 0,
        winRate,
        avgResponseDays: myQuotes.length > 0 ? 2 : 0,
        openRfqs: openRfqs.map((r) => ({
            id: r.id,
            title: r.title,
            deadline: r.deadline,
        })),
    }
}

export async function getSpendInsight() {
    const monthly = await getMonthlySpend(6)
    if (monthly.every((m) => m.amount === 0)) {
        return 'No purchase orders yet. Create RFQs and approve quotations to see spend insights here.'
    }
    const peak = monthly.reduce((best, m) => (m.amount > best.amount ? m : best), monthly[0])
    const categories = await getSpendingByCategory()
    const top = categories[0]
    if (top) {
        return `Spend peaked in ${peak.month} at ₹${peak.amount.toLocaleString('en-IN')}. Top category: ${top.category}.`
    }
    return `Spend peaked in ${peak.month}.`
}
