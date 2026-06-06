import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Tabs from '../../components/ui/Tabs'
import Input from '../../components/ui/Input'
import { getRFQs } from '../../services/rfq.service'
import { formatDate } from '../../utils/formatDate'
import { useRole } from '../../hooks/useRole'

const TABS = [
  { label: 'All', key: 'all' },
  { label: 'Draft', key: 'draft' },
  { label: 'Sent', key: 'sent' },
  { label: 'Approved', key: 'approved' },
  { label: 'Pending', key: 'pending' },
]

function buildColumns(isVendor) {
  return [
    {
      key: 'title',
      label: 'RFQ Title',
      render: (val) => <span className="font-medium text-text-primary">{val}</span>,
    },
    { key: 'category', label: 'Category' },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => {
        const colors = { High: 'text-danger', Medium: 'text-warning', Low: 'text-success' }
        return <span className={`text-xs font-medium ${colors[val] || 'text-text-muted'}`}>{val}</span>
      },
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (val) => formatDate(val),
    },
    {
      key: 'quotationsReceived',
      label: 'Quotations',
      render: (val) => <span className="text-xs bg-background px-2 py-0.5 rounded border border-border">{val} received</span>,
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
        <div className="flex gap-2">
          <a href={`/rfqs/${val}`} className="text-xs text-text-secondary hover:text-text-primary">View</a>
          {/* Vendor: show Submit Quote link for sent/pending RFQs */}
          {isVendor && (row.status === 'sent' || row.status === 'pending') && (
            <a href={`/quotations/${val}/submit`} className="text-xs text-primary hover:text-blue-700">Submit Quote</a>
          )}
          {/* Procurement Officer: show Compare link when quotations exist */}
          {!isVendor && row.quotationsReceived > 0 && (
            <a href={`/rfqs/${val}/compare`} className="text-xs text-primary hover:text-blue-700">Compare</a>
          )}
        </div>
      ),
    },
  ]
}

export default function RFQsPage() {
  const navigate = useNavigate()
  const { isVendor, canManageRFQs } = useRole()
  const [rfqs, setRFQs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getRFQs().then((data) => { setRFQs(data); setLoading(false) })
  }, [])

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: t.key === 'all' ? rfqs.length : rfqs.filter((r) => r.status === t.key).length,
  }))

  const filtered = rfqs.filter((r) => {
    const matchesTab = activeTab === 'all' || r.status === activeTab
    const q = search.toLowerCase()
    const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  const columns = buildColumns(isVendor)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">RFQs</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {isVendor ? 'View RFQs and submit quotations' : 'Manage request for quotations'}
          </p>
        </div>
        {canManageRFQs && (
          <Button variant="primary" size="sm" onClick={() => navigate('/rfqs/new')}>
            + Create RFQ
          </Button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 pt-3">
          <Tabs tabs={tabsWithCount} active={activeTab} onChange={setActiveTab} />
        </div>
        <div className="px-5 py-4 border-b border-border">
          <Input
            name="rfq-search"
            placeholder="Search by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  )
}

