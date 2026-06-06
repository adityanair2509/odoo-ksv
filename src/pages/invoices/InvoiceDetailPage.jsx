import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'

// InvoiceDetailPage redirects to PODetailPage for the same data
// In production, invoices may have separate logic
export default function InvoiceDetailPage() {
  const { id } = useParams()
  // Reuse the PO detail view by linking to the PO
  return (
    <div className="flex flex-col gap-4">
      <Link to="/purchase-orders" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← Purchase Orders
      </Link>
      <p className="text-sm text-text-muted">
        Redirecting to purchase order view...{' '}
        <Link to={`/purchase-orders/${id}`} className="text-primary hover:text-blue-700">
          View PO #{id} →
        </Link>
      </p>
    </div>
  )
}
