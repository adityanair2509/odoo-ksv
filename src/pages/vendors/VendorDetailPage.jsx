import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Star } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { getVendorById } from '../../services/vendor.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function VendorDetailPage() {
  const { id } = useParams()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getVendorById(id)
      .then(setVendor)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>
  if (error || !vendor) return <div className="text-sm text-danger">{error || 'Vendor not found'}</div>

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Back link */}
      <Link to="/vendors" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
        ← Vendors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{vendor.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-text-muted">{vendor.category}</span>
            <span className="text-text-muted">·</span>
            <Badge variant={vendor.status} />
          </div>
        </div>
        <div className="flex items-center gap-1 text-warning">
          <Star size={14} fill="currentColor" />
          <span className="text-sm font-medium text-text-primary">{vendor.rating}</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Company Details */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Company Details</h3>
          <div className="flex flex-col gap-3">
            <Row label="GSTIN" value={
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-xs">{vendor.gstin}</span>
                {vendor.gstinVerified
                  ? <CheckCircle size={13} className="text-success" />
                  : <XCircle size={13} className="text-danger" />}
              </span>
            } />
            <Row label="State" value={vendor.state} />
            <Row label="Address" value={vendor.address} />
            <Row label="Registered On" value={formatDate(vendor.createdAt)} />
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Contact Details</h3>
          <div className="flex flex-col gap-3">
            <Row label="Contact Person" value={vendor.contactPerson} />
            <Row label="Email" value={<a href={`mailto:${vendor.email}`} className="text-primary hover:text-blue-700">{vendor.email}</a>} />
            <Row label="Phone" value={vendor.phone} />
          </div>
        </div>

        {/* Performance */}
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Performance</h3>
          <div className="flex flex-col gap-3">
            <Row label="Total Purchase Orders" value={vendor.totalPOs} />
            <Row label="Total Spend" value={formatINR(vendor.totalSpend)} />
            <Row label="Vendor Rating" value={`${vendor.rating} / 5`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-text-primary text-right">{value}</span>
    </div>
  )
}
