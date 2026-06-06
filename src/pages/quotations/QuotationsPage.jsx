import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { getQuotations } from '../../services/quotation.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const COLUMNS = (navigate) => [
  {
    key: 'vendorName',
    label: 'Vendor',
    render: (val) => <span className="font-medium text-text-primary">{val}</span>,
  },
  {
    key: 'rfqId',
    label: 'RFQ',
    render: (val) => <a href={`/rfqs/${val}`} className="text-primary text-xs hover:text-blue-700">{val}</a>,
  },
  {
    key: 'grandTotal',
    label: 'Grand Total',
    render: (val) => <span className="font-medium">{formatINR(val)}</span>,
  },
  { key: 'gstPercent', label: 'GST %', render: (val) => `${val}%` },
  { key: 'deliveryDays', label: 'Delivery', render: (val) => `${val} days` },
  {
    key: 'submittedAt',
    label: 'Submitted',
    render: (val) => formatDate(val),
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <Badge variant={val} />,
  },
  {
    key: 'rfqId',
    label: 'Action',
    render: (val) => (
      <button
        onClick={() => navigate(`/rfqs/${val}/compare`)}
        className="text-xs text-primary hover:text-blue-700"
      >
        Compare →
      </button>
    ),
  },
]

export default function QuotationsPage() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQuotations()
      .then(setQuotations)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Quotations</h2>
        <p className="text-sm text-text-muted mt-0.5">All received vendor quotations</p>
      </div>
      <div className="bg-surface border border-border rounded-lg">
        <DataTable columns={COLUMNS(navigate)} data={quotations} loading={loading} />
      </div>
    </div>
  )
}
