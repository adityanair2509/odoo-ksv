import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Tabs from '../../components/ui/Tabs'
import Input from '../../components/ui/Input'
import { getVendors } from '../../services/vendor.service'

const TABS = [
  { label: 'All', key: 'all' },
  { label: 'Active', key: 'active' },
  { label: 'Pending', key: 'pending' },
  { label: 'Blocked', key: 'blocked' },
]

const COLUMNS = [
  { key: 'name', label: 'Vendor Name', render: (val) => <span className="font-medium text-text-primary">{val}</span> },
  { key: 'category', label: 'Category' },
  { key: 'gstin', label: 'GSTIN', render: (val) => <span className="font-mono text-xs">{val}</span> },
  {
    key: 'contactPerson',
    label: 'Contact',
    render: (val, row) => (
      <div>
        <p className="text-text-primary text-xs font-medium">{val || row.name}</p>
        <p className="text-text-muted text-xs">{row.email}</p>
        {row.phone && row.phone !== '—' && (
          <p className="text-text-muted text-xs">{row.phone}</p>
        )}
      </div>
    ),
  },
  {
    key: 'country',
    label: 'Country',
    render: (val) => val || '—',
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
      <a href={`/vendors/${val}`} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
        View →
      </a>
    ),
  },
]

export default function VendorsPage() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getVendors().then((data) => {
      setVendors(data)
      setLoading(false)
    })
  }, [])

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: t.key === 'all' ? vendors.length : vendors.filter((v) => v.status === t.key).length,
  }))

  const filtered = vendors.filter((v) => {
    const matchesTab = activeTab === 'all' || v.status === activeTab
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.contactPerson?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.gstin.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Vendors</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage supplier profiles</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/vendors/new')}>
          + Add Vendor
        </Button>
      </div>

      {/* Card */}
      <div className="bg-surface border border-border rounded-lg">
        {/* Tabs */}
        <div className="px-5 pt-3">
          <Tabs tabs={tabsWithCount} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Search */}
        <div className="px-5 py-4 border-b border-border">
          <Input
            name="vendor-search"
            placeholder="Search by name, GSTIN, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>

        {/* Table */}
        <DataTable columns={COLUMNS} data={filtered} loading={loading} />
      </div>
    </div>
  )
}
