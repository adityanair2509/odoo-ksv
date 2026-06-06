import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Tabs from '../../components/ui/Tabs'
import { getPurchaseOrders } from '../../services/order.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const TABS = [
  { label: 'All', key: 'all' },
  { label: 'Pending', key: 'pending' },
  { label: 'Delivered', key: 'delivered' },
  { label: 'Overdue', key: 'overdue' },
]

const COLUMNS = (navigate) => [
  {
    key: 'poNumber',
    label: 'PO Number',
    render: (val) => <span className="font-mono font-medium text-text-primary">{val}</span>,
  },
  { key: 'vendorName', label: 'Vendor' },
  {
    key: 'grandTotal',
    label: 'Amount',
    render: (val) => <span className="font-medium">{formatINR(val)}</span>,
  },
  { key: 'rfqTitle', label: 'RFQ' },
  {
    key: 'poDate',
    label: 'PO Date',
    render: (val) => formatDate(val),
  },
  {
    key: 'dueDate',
    label: 'Due Date',
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
      <button
        onClick={() => navigate(`/purchase-orders/${val}`)}
        className="text-xs text-primary hover:text-blue-700 transition-colors"
      >
        View →
      </button>
    ),
  },
]

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    getPurchaseOrders().then((data) => { setPOs(data); setLoading(false) })
  }, [])

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.key === 'all' ? pos.length : pos.filter((p) => p.status === t.key).length,
  }))

  const filtered = activeTab === 'all' ? pos : pos.filter((p) => p.status === activeTab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Purchase Orders</h2>
        <p className="text-sm text-text-muted mt-0.5">Track and manage all purchase orders</p>
      </div>

      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 pt-3">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
        <DataTable columns={COLUMNS(navigate)} data={filtered} loading={loading} />
      </div>
    </div>
  )
}
