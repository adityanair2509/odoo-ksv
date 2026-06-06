import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Tabs from '../../components/ui/Tabs'
import StarRating from '../../components/ui/StarRating'
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
    key: 'managerRating',
    label: 'Vendor Rating',
    render: (val, row) => {
      const rating = row.managerRating || row.vendorRating
      if (row.status === 'pending') {
        return (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <Star size={12} className="text-amber-400" />
            Rate on review
          </span>
        )
      }
      if (rating > 0) {
        return (
          <div className="flex items-center gap-1.5">
            <StarRating value={rating} readonly size={12} />
            <span className="text-xs text-text-secondary">{rating}/5</span>
          </div>
        )
      }
      return <span className="text-xs text-text-muted">—</span>
    },
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
    render: (val, row) => (
      <button
        onClick={() => navigate(`/approvals/${val}`)}
        className="text-xs text-primary hover:text-blue-700 transition-colors flex items-center gap-1"
      >
        {row.status === 'pending' ? (
          <>
            <Star size={11} className="text-amber-400" />
            Review &amp; Rate →
          </>
        ) : (
          'View →'
        )}
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
        <p className="text-sm text-text-muted mt-0.5">
          Review RFQs selected by procurement and rate vendors from 1–5 stars before approving.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
        <Star size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p>
          <strong>How to rate a vendor:</strong> Open <strong>Approvals</strong> in the sidebar → click{' '}
          <strong>Review &amp; Rate</strong> on a pending RFQ → pick <strong>1–5 stars</strong> for the vendor →
          click <strong>Approve</strong>. Your rating is saved to the vendor profile.
        </p>
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
