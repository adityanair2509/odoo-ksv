import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { FileText, Users, Receipt } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { getPurchaseOrders } from '../services/order.service'
import { getApprovals } from '../services/approval.service'
import { formatINR } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const SPENDING_DATA = [
  { month: 'Jan', amount: 820000 },
  { month: 'Feb', amount: 1340000 },
  { month: 'Mar', amount: 980000 },
  { month: 'Apr', amount: 1760000 },
  { month: 'May', amount: 2100000 },
  { month: 'Jun', amount: 1890000 },
]

const PO_COLUMNS = [
  { key: 'poNumber', label: 'PO Number' },
  { key: 'vendorName', label: 'Vendor' },
  {
    key: 'grandTotal',
    label: 'Amount',
    render: (val) => <span className="font-medium">{formatINR(val)}</span>,
  },
  {
    key: 'poDate',
    label: 'Date',
    render: (val) => formatDate(val),
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <Badge variant={val} />,
  },
  {
    key: 'id',
    label: 'Action',
    render: (val) => (
      <a href={`/purchase-orders/${val}`} className="text-xs text-primary hover:text-blue-700">
        View
      </a>
    ),
  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded px-3 py-2 text-xs shadow-sm">
        <p className="text-text-muted mb-1">{label}</p>
        <p className="text-text-primary font-semibold">{formatINR(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pos, setPOs] = useState([])
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [poData, approvalData] = await Promise.all([
          getPurchaseOrders(),
          getApprovals(),
        ])
        setPOs(poData)
        setApprovals(approvalData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pendingApprovals = approvals.filter((a) => a.status === 'pending')
  const overdueInvoices = pos.filter((p) => p.status === 'overdue')

  return (
    <div className="flex flex-col gap-8">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Here&apos;s your procurement overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/rfqs/new')}
          >
            + New RFQ
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/vendors/new')}
          >
            Add Vendor
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/invoices')}
          >
            View Invoices
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active RFQs"
          value="4"
          icon={<FileText size={18} />}
          delta={{ value: '+2 this week', positive: true }}
        />
        <StatCard
          label="Pending Approvals"
          value={loading ? '—' : pendingApprovals.length}
          icon={<Receipt size={18} />}
          delta={{ value: '1 urgent', positive: false }}
        />
        <StatCard
          label="POs This Month"
          value={loading ? '—' : pos.length}
          icon={<Users size={18} />}
          delta={{ value: '+3 vs last month', positive: true }}
        />
        <StatCard
          label="Overdue Invoices"
          value={loading ? '—' : overdueInvoices.length}
          icon={<Receipt size={18} />}
          delta={{ value: '₹12L outstanding', positive: false }}
        />
      </div>

      {/* Charts + Pending Approvals row */}
      <div className="grid grid-cols-5 gap-6">
        {/* Spending Trends chart */}
        <div className="col-span-3 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Spending Trends
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={SPENDING_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#A1A1AA' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#A1A1AA' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 100000}L`}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563EB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Approvals */}
        <div className="col-span-2 bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Pending Approvals
          </h3>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-background rounded animate-pulse" />
              ))}
            </div>
          ) : pendingApprovals.length === 0 ? (
            <p className="text-sm text-text-muted">No pending approvals</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingApprovals.slice(0, 4).map((ap) => (
                <div
                  key={ap.id}
                  className="border border-border rounded-lg p-3 flex flex-col gap-2"
                >
                  <div>
                    <p className="text-xs font-medium text-text-primary truncate">
                      {ap.rfqTitle}
                    </p>
                    <p className="text-xs text-text-muted">{ap.vendorName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                      {formatINR(ap.amount)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/approvals/${ap.id}`)}
                        className="text-xs bg-green-50 text-success px-2 py-0.5 rounded hover:bg-green-100 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => navigate(`/approvals/${ap.id}`)}
                        className="text-xs bg-red-50 text-danger px-2 py-0.5 rounded hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent POs table */}
      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">
            Recent Purchase Orders
          </h3>
        </div>
        <DataTable
          columns={PO_COLUMNS}
          data={pos.slice(0, 5)}
          loading={loading}
        />
      </div>
    </div>
  )
}
