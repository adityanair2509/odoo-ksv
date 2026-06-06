import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { getRFQById } from '../../services/rfq.service'
import { formatDate } from '../../utils/formatDate'

export default function RFQDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRFQ] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRFQById(id).then(setRFQ).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>
  if (!rfq) return <div className="text-sm text-danger">RFQ not found</div>

  const priorityColors = { High: 'text-danger', Medium: 'text-warning', Low: 'text-success' }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Link to="/rfqs" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← RFQs
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{rfq.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-text-muted">{rfq.category}</span>
            <span className="text-text-muted">·</span>
            <Badge variant={rfq.status} />
            <span className="text-text-muted">·</span>
            <span className={`text-xs font-medium ${priorityColors[rfq.priority]}`}>
              {rfq.priority} Priority
            </span>
          </div>
        </div>
        {rfq.quotationsReceived > 0 && (
          <Button variant="primary" size="sm" onClick={() => navigate(`/rfqs/${id}/compare`)}>
            Compare Quotations ({rfq.quotationsReceived})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* RFQ Details */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Details</h3>
          <div className="flex flex-col gap-3">
            <Row label="Deadline" value={formatDate(rfq.deadline)} />
            <Row label="Vendors Invited" value={rfq.assignedVendors?.length ?? 0} />
            <Row label="Quotations Received" value={rfq.quotationsReceived} />
            <Row label="Created" value={formatDate(rfq.createdAt)} />
            <Row label="Description" value={rfq.description} />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Line Items</h3>
          <div className="flex flex-col gap-2">
            {rfq.lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-primary">{item.name}</span>
                <span className="text-xs text-text-muted">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  )
}
