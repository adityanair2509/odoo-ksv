import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  FileText, Users, Receipt, ShoppingCart,
  CheckSquare, Clock, TrendingUp, Package,
  AlertTriangle, Star, Send, Inbox, Shield,
  UserCheck, UserX, Sparkles, BarChart2,
  FilePlus, ClipboardList, DollarSign,
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Timeline from '../components/ui/Timeline'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { getPurchaseOrders } from '../services/order.service'
import { getApprovals } from '../services/approval.service'
import { getRFQs } from '../services/rfq.service'
import { getVendors } from '../services/vendor.service'
import { formatINR } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { mockActivity } from '../mock/mockActivity'
import { getQuotations } from '../services/quotation.service'

/* ─── Shared ──────────────────────────────────────────────────────────────── */

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 text-xs shadow-sm">
      <p className="text-text-muted mb-0.5">{label}</p>
      <p className="text-text-primary font-semibold">
        {val > 1000 ? formatINR(val) : val}
      </p>
    </div>
  )
}

const SPENDING_DATA = [
  { month: 'Jan', amount: 820000 },
  { month: 'Feb', amount: 1340000 },
  { month: 'Mar', amount: 980000 },
  { month: 'Apr', amount: 1760000 },
  { month: 'May', amount: 2100000 },
  { month: 'Jun', amount: 1890000 },
]

const CATEGORY_DATA = [
  { category: 'IT', amount: 2900000 },
  { category: 'Furniture', amount: 1875000 },
  { category: 'Construct.', amount: 1270000 },
  { category: 'Logistics', amount: 340000 },
]

/* ════════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   Responsibilities: Manage vendors, GSTIN, org profile, reports, activity
   Cannot: Create RFQs, approve procurements
   ════════════════════════════════════════════════════════════════════════════ */
function AdminDashboard({ vendors, loading }) {
  const navigate = useNavigate()

  const activeVendors  = vendors.filter((v) => v.status === 'active')
  const pendingVendors = vendors.filter((v) => v.status === 'pending')
  const blockedVendors = vendors.filter((v) => v.status === 'blocked')
  const unverifiedGSTIN = vendors.filter((v) => !v.gstinVerified)

  const VENDOR_COLS = [
    { key: 'name',    label: 'Vendor',   render: (v) => <span className="font-medium text-text-primary">{v}</span> },
    { key: 'category', label: 'Category' },
    { key: 'gstin',   label: 'GSTIN',    render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'gstinVerified', label: 'GSTIN',
      render: (v) => v
        ? <span className="text-xs text-success">✓ Verified</span>
        : <span className="text-xs text-danger font-medium">✗ Pending</span>,
    },
    { key: 'status', label: 'Status',  render: (v) => <Badge variant={v} /> },
    {
      key: 'id', label: 'Action',
      render: (v) => (
        <button onClick={() => navigate(`/vendors/${v}`)}
          className="text-xs text-primary hover:text-blue-700 transition-colors">
          Manage →
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {greeting()}, Admin
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Vendor directory &amp; organisation management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary"   size="sm" onClick={() => navigate('/vendors/new')}>+ Add Vendor</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>Reports</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/activity')}>Activity Log</Button>
        </div>
      </div>

      {/* Stat cards — vendor health KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Vendors"     value={loading ? '—' : vendors.length}
          icon={<Users size={18} />}
          delta={{ value: `${activeVendors.length} active`, positive: true }} />
        <StatCard label="Pending Onboarding" value={loading ? '—' : pendingVendors.length}
          icon={<UserCheck size={18} />}
          delta={pendingVendors.length > 0
            ? { value: 'Review required', positive: false }
            : { value: 'All clear', positive: true }} />
        <StatCard label="GSTIN Unverified"  value={loading ? '—' : unverifiedGSTIN.length}
          icon={<Shield size={18} />}
          delta={unverifiedGSTIN.length > 0
            ? { value: 'Action needed', positive: false }
            : { value: 'All verified', positive: true }} />
        <StatCard label="Blocked Vendors"   value={loading ? '—' : blockedVendors.length}
          icon={<UserX size={18} />}
          delta={{ value: 'Compliance holds', positive: false }} />
      </div>

      {/* Vendor health breakdown + Category spend */}
      <div className="grid grid-cols-5 gap-6">
        {/* Vendor status breakdown */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Vendor Status Breakdown</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Active Vendors',       count: activeVendors.length,  color: 'text-success', bg: 'bg-green-50',  bar: 'bg-success' },
              { label: 'Pending Onboarding',   count: pendingVendors.length, color: 'text-warning', bg: 'bg-yellow-50', bar: 'bg-warning' },
              { label: 'Blocked / Suspended',  count: blockedVendors.length, color: 'text-danger',  bg: 'bg-red-50',    bar: 'bg-danger' },
            ].map(({ label, count, color, bg, bar }) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-lg ${bg}`}>
                <span className="text-sm text-text-primary">{label}</span>
                <span className={`text-lg font-bold ${color}`}>{count}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
            <p className="text-xs uppercase text-text-muted font-medium tracking-wide mb-1">Quick Actions</p>
            <button onClick={() => navigate('/vendors/new')}
              className="text-left text-xs text-text-secondary hover:text-primary transition-colors py-1">
              + Onboard new vendor with GSTIN verification
            </button>
            <button onClick={() => navigate('/vendors?filter=pending')}
              className="text-left text-xs text-text-secondary hover:text-primary transition-colors py-1">
              → Review pending vendor applications
            </button>
            <button onClick={() => navigate('/reports')}
              className="text-left text-xs text-text-secondary hover:text-primary transition-colors py-1">
              ↗ View procurement analytics
            </button>
          </div>
        </div>

        {/* Spend by category chart */}
        <div className="col-span-3 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Organisational Spend by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CATEGORY_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v / 100000}L`} width={42} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" fill="#2563EB" radius={[3,3,0,0]} maxBarSize={52} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="bg-background rounded-lg px-4 py-3">
              <p className="text-xs text-text-muted">Total Org Spend (YTD)</p>
              <p className="text-base font-bold text-text-primary mt-0.5">{formatINR(6385000)}</p>
            </div>
            <div className="bg-background rounded-lg px-4 py-3">
              <p className="text-xs text-text-muted">Avg. Spend / Vendor</p>
              <p className="text-base font-bold text-text-primary mt-0.5">{formatINR(1277000)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor table */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Vendor Directory</h3>
          <button onClick={() => navigate('/vendors')} className="text-xs text-primary hover:text-blue-700">
            View all →
          </button>
        </div>
        <DataTable columns={VENDOR_COLS} data={vendors.slice(0, 5)} loading={loading} />
      </div>

      {/* Recent activity */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
          <button onClick={() => navigate('/activity')} className="text-xs text-primary hover:text-blue-700">
            View all →
          </button>
        </div>
        <Timeline entries={mockActivity.slice(0, 4)} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   PROCUREMENT OFFICER DASHBOARD
   Responsibilities: RFQs, quotations, POs, invoices, rate vendors
   Cannot: Approve own procurements, manage vendors
   ════════════════════════════════════════════════════════════════════════════ */
function ProcurementOfficerDashboard({ pos, rfqs, loading }) {
  const navigate = useNavigate()

  const activeRFQs      = rfqs.filter((r) => r.status === 'sent')
  const draftRFQs       = rfqs.filter((r) => r.status === 'draft')
  const quotesReceived  = rfqs.reduce((s, r) => s + (r.quotationsReceived || 0), 0)
  const pendingPOs      = pos.filter((p) => p.status === 'pending')
  const overduePOs      = pos.filter((p) => p.status === 'overdue')

  const RFQ_COLS = [
    { key: 'title',    label: 'RFQ Title', render: (v) => <span className="font-medium text-text-primary text-xs">{v}</span> },
    { key: 'category', label: 'Category' },
    { key: 'priority', label: 'Priority', render: (v) => {
      const c = { High:'text-danger', Medium:'text-warning', Low:'text-success' }
      return <span className={`text-xs font-medium ${c[v]}`}>{v}</span>
    }},
    { key: 'quotationsReceived', label: 'Quotes', render: (v) =>
      <span className={`text-xs px-1.5 py-0.5 rounded border ${v > 0 ? 'bg-blue-50 text-primary border-blue-100' : 'bg-background text-text-muted border-border'}`}>{v} received</span>
    },
    { key: 'deadline', label: 'Deadline', render: (v) => formatDate(v) },
    { key: 'status',   label: 'Status',   render: (v) => <Badge variant={v} /> },
    { key: 'id', label: '', render: (v, row) =>
      row.quotationsReceived > 0
        ? <button onClick={() => navigate(`/rfqs/${v}/compare`)} className="text-xs text-primary hover:text-blue-700 font-medium">Compare →</button>
        : <button onClick={() => navigate(`/rfqs/${v}`)} className="text-xs text-text-muted hover:text-text-secondary">View →</button>
    },
  ]

  const PO_COLS = [
    { key: 'poNumber',  label: 'PO No.',   render: (v) => <span className="font-mono text-xs font-medium">{v}</span> },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'grandTotal', label: 'Amount', render: (v) => <span className="font-medium">{formatINR(v)}</span> },
    { key: 'dueDate',    label: 'Due Date', render: (v) => formatDate(v) },
    { key: 'status',     label: 'Status',   render: (v) => <Badge variant={v} /> },
    { key: 'id', label: '', render: (v) =>
      <button onClick={() => navigate(`/purchase-orders/${v}`)} className="text-xs text-primary hover:text-blue-700">View →</button>
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {greeting()}, Priya
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {draftRFQs.length > 0
              ? `${draftRFQs.length} draft RFQ${draftRFQs.length > 1 ? 's' : ''} waiting to be sent`
              : 'Procurement pipeline overview'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary"   size="sm" onClick={() => navigate('/rfqs/new')}>+ New RFQ</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/quotations')}>Quotations</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/purchase-orders')}>POs</Button>
        </div>
      </div>

      {/* Stat cards — procurement pipeline KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active RFQs"       value={loading ? '—' : activeRFQs.length}
          icon={<FileText size={18} />}
          delta={{ value: `${draftRFQs.length} in draft`, positive: draftRFQs.length === 0 }} />
        <StatCard label="Quotes Received"   value={loading ? '—' : quotesReceived}
          icon={<Inbox size={18} />}
          delta={{ value: 'Across all RFQs', positive: true }} />
        <StatCard label="Active POs"        value={loading ? '—' : pendingPOs.length}
          icon={<Package size={18} />}
          delta={{ value: 'In progress', positive: true }} />
        <StatCard label="Overdue Payments"  value={loading ? '—' : overduePOs.length}
          icon={<AlertTriangle size={18} />}
          delta={overduePOs.length > 0
            ? { value: 'Follow-up needed', positive: false }
            : { value: 'All on track', positive: true }} />
      </div>

      {/* Pipeline status + AI suggestion */}
      <div className="grid grid-cols-5 gap-6">
        {/* Pipeline stages */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Procurement Pipeline</h3>
          <div className="flex flex-col gap-1">
            {[
              { stage: 'Draft RFQs',          count: draftRFQs.length,                            action: () => navigate('/rfqs'), color: 'border-l-warning' },
              { stage: 'Sent RFQs',           count: activeRFQs.length,                           action: () => navigate('/rfqs'), color: 'border-l-primary' },
              { stage: 'Quotes Received',      count: rfqs.filter(r => r.quotationsReceived > 0).length, action: () => navigate('/quotations'), color: 'border-l-success' },
              { stage: 'Pending PO Approval', count: 1,                                           action: () => navigate('/purchase-orders'), color: 'border-l-warning' },
              { stage: 'PO Delivered',        count: pos.filter(p => p.status === 'delivered').length, action: () => navigate('/purchase-orders'), color: 'border-l-success' },
            ].map(({ stage, count, action, color }) => (
              <button key={stage} onClick={action}
                className={`flex items-center justify-between px-3 py-3 border-l-2 ${color} bg-background hover:bg-border/30 transition-colors text-left rounded-r-lg mb-1`}>
                <span className="text-sm text-text-secondary">{stage}</span>
                <span className="text-sm font-bold text-text-primary">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spending trend */}
        <div className="col-span-3 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Procurement Spend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={SPENDING_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v / 100000}L`} width={42} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
          {/* AI suggestion box */}
          <div className="mt-4 border-l-4 border-primary bg-background px-4 py-3 rounded-r-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI Insight</span>
            </div>
            <p className="text-xs text-text-secondary italic">
              Spend peaked in May. Consider consolidating IT and Furniture RFQs this quarter to negotiate bulk pricing with Infra Supplies Pvt Ltd — estimated savings: ₹2.1L.
            </p>
          </div>
        </div>
      </div>

      {/* RFQ pipeline table */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Active RFQs</h3>
          <button onClick={() => navigate('/rfqs')} className="text-xs text-primary hover:text-blue-700">View all →</button>
        </div>
        <DataTable columns={RFQ_COLS} data={rfqs.slice(0, 4)} loading={loading} />
      </div>

      {/* Recent POs */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Recent Purchase Orders</h3>
          <button onClick={() => navigate('/purchase-orders')} className="text-xs text-primary hover:text-blue-700">View all →</button>
        </div>
        <DataTable columns={PO_COLS} data={pos.slice(0, 3)} loading={loading} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MANAGER DASHBOARD
   Responsibilities: Approve/reject requests, monitor workflows
   Cannot: Create RFQs, edit quotes, manage vendors
   ════════════════════════════════════════════════════════════════════════════ */
function ManagerDashboard({ pos, approvals, rfqs, loading }) {
  const navigate = useNavigate()

  const pendingApprovals  = approvals.filter((a) => a.status === 'pending')
  const approvedThisMonth = approvals.filter((a) => a.status === 'approved')
  const totalApproved     = approvedThisMonth.reduce((s, a) => s + a.amount, 0)
  const overdueInvoices   = pos.filter((p) => p.status === 'overdue')

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {greeting()}, Rohit
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {pendingApprovals.length > 0
              ? `${pendingApprovals.length} approval${pendingApprovals.length > 1 ? 's' : ''} require your review`
              : 'All approvals are up to date'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary"   size="sm" onClick={() => navigate('/approvals')}>
            Review Approvals {pendingApprovals.length > 0 && `(${pendingApprovals.length})`}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>Reports</Button>
        </div>
      </div>

      {/* Stat cards — approval authority KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Pending Approvals"     value={loading ? '—' : pendingApprovals.length}
          icon={<ClipboardList size={18} />}
          delta={pendingApprovals.length > 0
            ? { value: 'Awaiting your review', positive: false }
            : { value: 'All reviewed', positive: true }} />
        <StatCard label="Approved This Month"   value={loading ? '—' : approvedThisMonth.length}
          icon={<CheckSquare size={18} />}
          delta={{ value: 'Total approved', positive: true }} />
        <StatCard label="Value Approved (₹)"    value={loading ? '—' : formatINR(totalApproved)}
          icon={<DollarSign size={18} />}
          delta={{ value: 'Total sanctioned', positive: true }} />
        <StatCard label="Overdue Payments"       value={loading ? '—' : overdueInvoices.length}
          icon={<AlertTriangle size={18} />}
          delta={overdueInvoices.length > 0
            ? { value: 'Escalation needed', positive: false }
            : { value: 'No overdue items', positive: true }} />
      </div>

      {/* Approval queue + Spending */}
      <div className="grid grid-cols-5 gap-6">
        {/* Approval queue */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Approval Queue</h3>
            <button onClick={() => navigate('/approvals')} className="text-xs text-primary hover:text-blue-700">View all →</button>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">{[1,2].map(i => <div key={i} className="h-20 bg-background rounded animate-pulse" />)}</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckSquare size={20} className="text-success" />
              </div>
              <p className="text-sm font-medium text-text-primary">All clear!</p>
              <p className="text-xs text-text-muted">No pending approvals</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingApprovals.map((ap) => (
                <div key={ap.id}
                  className="border border-border rounded-lg p-3.5 flex flex-col gap-2.5 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/approvals/${ap.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{ap.rfqTitle}</p>
                      <p className="text-xs text-text-muted mt-0.5">{ap.vendorName}</p>
                    </div>
                    <Badge variant="pending" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-sm font-bold text-text-primary">{formatINR(ap.amount)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/approvals/${ap.id}`) }}
                        className="text-xs bg-green-50 text-success border border-green-100 px-2.5 py-1 rounded hover:bg-green-100 transition-colors font-medium">
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/approvals/${ap.id}`) }}
                        className="text-xs bg-red-50 text-danger border border-red-100 px-2.5 py-1 rounded hover:bg-red-100 transition-colors font-medium">
                        Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    Step: <span className="text-text-secondary font-medium">{ap.currentStep}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spending + budget tracker */}
        <div className="col-span-3 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Procurement Spend Under Approval</h3>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={SPENDING_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v / 100000}L`} width={42} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Budget utilisation */}
          <div className="mt-4 border-t border-border pt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted font-medium">Q3 Budget Utilisation</span>
              <span className="text-xs font-bold text-text-primary">₹63.6L / ₹80L</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div className="bg-warning h-2 rounded-full transition-all duration-500" style={{ width: '79.5%' }} />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>79.5% utilised</span>
              <span className="font-medium text-text-secondary">₹16.4L remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow monitor table */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">All Approval Requests</h3>
          <button onClick={() => navigate('/approvals')} className="text-xs text-primary hover:text-blue-700">View all →</button>
        </div>
        <DataTable
          columns={[
            { key: 'rfqTitle',    label: 'RFQ',      render: (v) => <span className="font-medium text-text-primary text-xs">{v}</span> },
            { key: 'vendorName',  label: 'Vendor' },
            { key: 'amount',      label: 'Amount',    render: (v) => formatINR(v) },
            { key: 'currentStep', label: 'Stage',     render: (v) => <span className="text-xs text-text-muted">{v}</span> },
            { key: 'status',      label: 'Status',    render: (v) => <Badge variant={v} /> },
            { key: 'id', label: '', render: (v) =>
              <button onClick={() => navigate(`/approvals/${v}`)} className="text-xs text-primary hover:text-blue-700">Review →</button>
            },
          ]}
          data={approvals}
          loading={loading}
        />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   VENDOR DASHBOARD
   Responsibilities: View assigned RFQs, submit quotations, track POs/invoices
   Cannot: See other vendors' data, access org-level info
   ════════════════════════════════════════════════════════════════════════════ */
function VendorDashboard({ pos, quotations, loading }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const myQuotations  = quotations
  const deliveredPOs  = pos.filter((p) => p.status === 'delivered')
  const pendingPOs    = pos.filter((p) => p.status === 'pending')
  const totalBilled   = pos.reduce((s, p) => s + p.grandTotal, 0)

  const QUOTATION_COLS = [
    { key: 'rfqId',        label: 'RFQ Ref',        render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'grandTotal',   label: 'Quoted Amount',   render: (v) => <span className="font-medium">{formatINR(v)}</span> },
    { key: 'deliveryDays', label: 'Delivery',        render: (v) => `${v} days` },
    { key: 'gstPercent',   label: 'GST',             render: (v) => `${v}%` },
    { key: 'vendorRating', label: 'Rating',          render: (v) => v ? `${v} ★` : '—' },
    { key: 'submittedAt',  label: 'Submitted',       render: (v) => formatDate(v) },
    { key: 'status',       label: 'Status',          render: (v) => <Badge variant={v} /> },
  ]

  const PO_COLS = [
    { key: 'poNumber',   label: 'PO Number',   render: (v) => <span className="font-mono font-medium text-xs">{v}</span> },
    { key: 'rfqTitle',   label: 'Description', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'grandTotal', label: 'PO Value',    render: (v) => <span className="font-medium">{formatINR(v)}</span> },
    { key: 'dueDate',    label: 'Payment Due', render: (v) => formatDate(v) },
    { key: 'status',     label: 'Status',      render: (v) => <Badge variant={v} /> },
    { key: 'id', label: '', render: (v) =>
      <button onClick={() => navigate(`/purchase-orders/${v}`)} className="text-xs text-primary hover:text-blue-700">View →</button>
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Your vendor portal — quotations, orders &amp; invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/rfqs')}>Browse RFQs</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/quotations')}>My Quotations</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/purchase-orders')}>My Orders</Button>
        </div>
      </div>

      {/* Stat cards — vendor personal KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Quotations Submitted" value={myQuotations.length}
          icon={<Send size={18} />}
          delta={{ value: 'All time', positive: true }} />
        <StatCard label="Active POs"          value={loading ? '—' : pendingPOs.length}
          icon={<Package size={18} />}
          delta={{ value: 'In progress', positive: true }} />
        <StatCard label="Delivered POs"       value={loading ? '—' : deliveredPOs.length}
          icon={<CheckSquare size={18} />}
          delta={{ value: 'Completed', positive: true }} />
        <StatCard label="Total Billed"        value={loading ? '—' : formatINR(totalBilled)}
          icon={<Receipt size={18} />}
          delta={{ value: 'Lifetime earnings', positive: true }} />
      </div>

      {/* Performance + Open opportunities */}
      <div className="grid grid-cols-5 gap-6">
        {/* Performance snapshot */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">My Performance</h3>
          <div className="flex flex-col divide-y divide-border">
            {[
              { icon: Star,       label: 'Vendor Rating',       value: '4.5 / 5.0', color: 'text-warning' },
              { icon: CheckSquare,label: 'On-Time Delivery',    value: '92%',        color: 'text-success' },
              { icon: TrendingUp, label: 'Quote Win Rate',      value: '67%',        color: 'text-primary' },
              { icon: Clock,      label: 'Avg. Response Time',  value: '1.8 days',   color: 'text-text-muted' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={color} />
                  <span className="text-sm text-text-secondary">{label}</span>
                </div>
                <span className="text-sm font-bold text-text-primary">{value}</span>
              </div>
            ))}
          </div>

          {/* Open RFQ opportunities */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs uppercase text-text-muted font-medium tracking-wide mb-3">Open RFQ Opportunities</p>
            <div className="flex flex-col gap-2">
              {[
                { title: 'Annual Courier & Logistics Services', deadline: '01 Sep 2024', id: 'rfq4' },
              ].map((rfq) => (
                <div key={rfq.id}
                  className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                  <Inbox size={13} className="text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text-primary leading-tight">{rfq.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">Deadline: {rfq.deadline}</p>
                  </div>
                  <button onClick={() => navigate(`/rfqs/${rfq.id}`)}
                    className="text-xs text-primary hover:text-blue-700 flex-shrink-0 font-medium">
                    Bid →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My quotations */}
        <div className="col-span-3 bg-surface border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">My Quotations</h3>
            <button onClick={() => navigate('/quotations')} className="text-xs text-primary hover:text-blue-700">View all →</button>
          </div>
          <DataTable columns={QUOTATION_COLS} data={myQuotations} loading={false} />
        </div>
      </div>

      {/* My POs */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">My Purchase Orders &amp; Invoices</h3>
          <button onClick={() => navigate('/purchase-orders')} className="text-xs text-primary hover:text-blue-700">View all →</button>
        </div>
        <DataTable columns={PO_COLS} data={pos} loading={loading} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT — dispatches to the correct role-specific dashboard
   ════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { role } = useRole()
  const [pos,       setPOs]       = useState([])
  const [approvals, setApprovals] = useState([])
  const [rfqs,      setRFQs]      = useState([])
  const [vendors,   setVendors]   = useState([])
  const [quotations,setQuotations] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          getPurchaseOrders(),
          getApprovals(),
          getRFQs(),
          getVendors(),
          getQuotations(),
        ])
        if (results[0].status === 'fulfilled') setPOs(results[0].value)
        if (results[1].status === 'fulfilled') setApprovals(results[1].value)
        if (results[2].status === 'fulfilled') setRFQs(results[2].value)
        if (results[3].status === 'fulfilled') setVendors(results[3].value)
        if (results[4].status === 'fulfilled') setQuotations(results[4].value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const props = { pos, approvals, rfqs, vendors, quotations, loading }

  if (role === 'admin')               return <AdminDashboard {...props} />
  if (role === 'procurement_officer') return <ProcurementOfficerDashboard {...props} />
  if (role === 'manager')             return <ManagerDashboard {...props} />
  if (role === 'vendor')              return <VendorDashboard {...props} />

  // Fallback while role resolves
  return <div className="text-sm text-text-muted">Loading dashboard...</div>
}
