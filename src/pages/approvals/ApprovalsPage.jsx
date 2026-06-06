import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Tabs from '../../components/ui/Tabs'
import { getApprovals } from '../../services/approval.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const TABS = [
  { label: 'Pending', key: 'pending' },
  { label: 'All', key: 'all' },
]

const COLUMNS = (navigate) => [
  {
    key: 'rfqTitle',
    label: 'RFQ',
    render: (val) => <span className="font-medium text-text-primary">{val}</span>,
  },
  { key: 'vendorName', label: 'Vendor' },
  {
    key: 'amount',
    label: 'Amount',
    render: (val) => <span className="font-medium">{formatINR(val)}</span>,
  },
  {
    key: 'currentStep',
    label: 'Current Step',
    render: (val) => <span className="text-xs text-text-muted">{val}</span>,
  },
  {
    key: 'createdAt',
    label: 'Submitted',
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
        onClick={() => navigate(`/approvals/${val}`)}
        className="text-xs text-primary hover:text-blue-700 transition-colors"
      >
        Review →
      </button>
    ),
  },
]

export default function ApprovalsPage() {
  const navigate = useNavigate()
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    getApprovals().then((data) => { setApprovals(data); setLoading(false) })
  }, [])

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.key === 'all' ? approvals.length : approvals.filter((a) => a.status === t.key).length,
  }))

  const filtered = activeTab === 'all' ? approvals : approvals.filter((a) => a.status === activeTab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Approvals</h2>
        <p className="text-sm text-text-muted mt-0.5">Review and approve procurement requests</p>
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
