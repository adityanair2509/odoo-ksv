import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices } from '../../services/invoice.service'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const COLUMNS = (navigate) => [
  {
    key: 'invoiceNumber',
    label: 'Invoice No.',
    render: (val, row) => (
      <span className="font-mono font-medium text-text-primary">{val || row.poNumber || '—'}</span>
    ),
  },
  {
    key: 'poNumber',
    label: 'PO No.',
    render: (val) => <span className="font-mono text-text-secondary">{val || '—'}</span>,
  },
  { key: 'vendorName', label: 'Vendor', render: (v) => v || '—' },
  {
    key: 'grandTotal',
    label: 'Amount',
    render: (val) => <span className="font-medium">{formatINR(val || 0)}</span>,
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
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
        onClick={() => navigate(`/invoices/${val}`)}
        className="text-xs text-primary hover:text-blue-700 transition-colors"
      >
        View Invoice →
      </button>
    ),
  },
]

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Invoices</h2>
        <p className="text-sm text-text-muted mt-0.5">View and manage all invoices</p>
      </div>
      <div className="bg-surface border border-border rounded-lg">
        <DataTable columns={COLUMNS(navigate)} data={invoices} loading={loading} />
      </div>
    </div>
  )
}
