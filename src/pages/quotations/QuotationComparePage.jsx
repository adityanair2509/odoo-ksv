import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Sparkles, CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getQuotationsByRFQ, selectQuotation } from '../../services/quotation.service'
import { getRFQById } from '../../services/rfq.service'
import { getVendors } from '../../services/vendor.service'
import { formatINR } from '../../utils/formatCurrency'

function buildAiSummary(quotations) {
  if (!quotations.length) return 'No quotations received yet.'
  const priced = quotations.filter((q) => q.grandTotal > 0)
  const pool = priced.length ? priced : quotations
  const lowest = pool.reduce((a, b) => (a.grandTotal < b.grandTotal ? a : b))
  const fastest = quotations.reduce((a, b) => (a.deliveryDays < b.deliveryDays ? a : b))
  const parts = [
    `Based on ${quotations.length} quotation${quotations.length > 1 ? 's' : ''} received,`,
    `${lowest.vendorName} offers the lowest grand total at ${formatINR(lowest.grandTotal)} (${lowest.gstPercent}% GST).`,
  ]
  if (fastest.id !== lowest.id) {
    parts.push(`${fastest.vendorName} delivers fastest (${fastest.deliveryDays} days).`)
  }
  parts.push(`Recommend selecting ${lowest.vendorName} for best value unless delivery speed is critical.`)
  return parts.join(' ')
}

export default function QuotationComparePage() {
  const { id } = useParams()
  const [rfq, setRFQ] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const loadData = useCallback(() => {
    return Promise.all([getRFQById(id), getQuotationsByRFQ(id), getVendors()]).then(([r, q, v]) => {
      setRFQ(r)
      setQuotations(q)
      setVendors(v)
    })
  }, [id])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [loadData])

  const selectedQuotation = useMemo(
    () => quotations.find((q) => q.status === 'selected') ?? null,
    [quotations],
  )

  const invitedVendors = useMemo(() => {
    const ids = rfq?.assignedVendors || []
    return vendors.filter((v) => ids.includes(v.id))
  }, [rfq, vendors])

  const pendingVendors = useMemo(() => {
    const quotedIds = new Set(quotations.map((q) => q.vendorId))
    return invitedVendors.filter((v) => !quotedIds.has(v.id))
  }, [invitedVendors, quotations])

  const aiSummary = useMemo(() => buildAiSummary(quotations), [quotations])

  const pricedQuotations = quotations.filter((q) => q.grandTotal > 0)
  const lowestTotal = pricedQuotations.length
    ? Math.min(...pricedQuotations.map((q) => q.grandTotal))
    : null
  const fastestDelivery = quotations.length
    ? Math.min(...quotations.map((q) => q.deliveryDays))
    : null

  const handleSelect = async (quotation) => {
    if (selectedQuotation?.id === quotation.id) return

    if (selectedQuotation) {
      const ok = window.confirm(
        `Switch selection from ${selectedQuotation.vendorName} to ${quotation.vendorName}?`,
      )
      if (!ok) return
    }

    setSelecting(quotation.id)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await selectQuotation(quotation.id)
      await loadData()
      setSuccessMsg(
        `${quotation.vendorName} selected. The quotation has been sent to the manager for approval.`,
      )
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to select vendor. Please try again.')
    } finally {
      setSelecting(null)
    }
  }

  const ROWS = [
    {
      label: 'Grand Total',
      render: (q) => (
        <span
          className={`text-sm font-semibold ${
            lowestTotal !== null && q.grandTotal === lowestTotal && q.grandTotal > 0
              ? 'text-success'
              : 'text-text-primary'
          }`}
        >
          {formatINR(q.grandTotal)}
          {lowestTotal !== null && q.grandTotal === lowestTotal && q.grandTotal > 0 && (
            <span className="ml-1 text-xs font-medium">✓ Lowest</span>
          )}
        </span>
      ),
      cellClass: (q) =>
        lowestTotal !== null && q.grandTotal === lowestTotal && q.grandTotal > 0 ? 'bg-green-50' : '',
    },
    {
      label: 'GST %',
      render: (q) => <span className="text-sm">{q.gstPercent}%</span>,
      cellClass: () => '',
    },
    {
      label: 'Delivery Days',
      render: (q) => (
        <span
          className={`text-sm font-medium ${
            fastestDelivery !== null && q.deliveryDays === fastestDelivery ? 'text-primary' : 'text-text-primary'
          }`}
        >
          {q.deliveryDays} days
          {fastestDelivery !== null && q.deliveryDays === fastestDelivery && (
            <span className="ml-1 text-xs">⚡ Fastest</span>
          )}
        </span>
      ),
      cellClass: (q) =>
        fastestDelivery !== null && q.deliveryDays === fastestDelivery ? 'bg-blue-50' : '',
    },
    {
      label: 'Vendor Rating',
      render: (q) => <span className="text-sm">{q.vendorRating} ★</span>,
      cellClass: () => '',
    },
    {
      label: 'Payment Terms',
      render: (q) => <span className="text-xs text-text-secondary">{q.paymentTerms}</span>,
      cellClass: () => '',
    },
  ]

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>

  if (!quotations.length) {
    return (
      <div className="flex flex-col gap-4">
        <Link to={`/rfqs/${id}`} className="text-sm text-text-muted hover:text-text-secondary w-fit">
          ← RFQ Detail
        </Link>
        <p className="text-sm text-text-muted">No quotations received yet for this RFQ.</p>
        {pendingVendors.length > 0 && (
          <p className="text-sm text-text-secondary">
            Waiting for quotes from: {pendingVendors.map((v) => v.name).join(', ')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to={`/rfqs/${id}`} className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← RFQ Detail
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-text-primary">{rfq?.title}</h2>
        <Badge variant="sent">{quotations.length} Quotations Received</Badge>
        {invitedVendors.length > quotations.length && (
          <Badge variant="pending">
            {invitedVendors.length - quotations.length} vendor(s) awaiting quote
          </Badge>
        )}
      </div>

      {selectedQuotation && !successMsg && (
        <p className="text-sm text-text-secondary bg-background border border-border rounded-lg px-4 py-3">
          <strong>{selectedQuotation.vendorName}</strong> is currently selected.
          Click <strong>Select Vendor</strong> on another column to change your choice.
        </p>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-success rounded-lg px-4 py-3 text-sm">
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p>{successMsg}</p>
            <Link to={`/rfqs/${id}`} className="text-xs text-primary hover:text-blue-700 mt-1 inline-block">
              Back to RFQ detail →
            </Link>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-4 py-3">{errorMsg}</p>
      )}

      {pendingVendors.length > 0 && (
        <p className="text-sm text-text-muted">
          <strong>{invitedVendors.length}</strong> vendor(s) invited —{' '}
          <strong>{pendingVendors.map((v) => v.name).join(', ')}</strong>{' '}
          {pendingVendors.length === 1 ? 'has' : 'have'} not submitted a quotation yet.
        </p>
      )}

      <div className="bg-surface border border-border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs uppercase text-text-muted font-medium tracking-wide w-40">
                Criteria
              </th>
              {quotations.map((q) => (
                <th key={q.id} className="px-5 py-3 text-left">
                  <p className="text-sm font-semibold text-text-primary">{q.vendorName}</p>
                  {q.status === 'selected' && (
                    <span className="text-xs text-success font-medium">Selected</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-xs text-text-muted font-medium">{row.label}</td>
                {quotations.map((q) => (
                  <td key={q.id} className={`px-5 py-3 ${row.cellClass(q)}`}>
                    {row.render(q)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-background">
              <td className="px-5 py-3 text-xs text-text-muted font-medium">Select</td>
              {quotations.map((q) => (
                <td key={q.id} className="px-5 py-3">
                  {q.status === 'selected' ? (
                    <span className="text-xs text-success font-medium flex items-center gap-1">
                      <CheckCircle size={14} /> Selected
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelect(q)}
                      loading={selecting === q.id}
                    >
                      {selectedQuotation ? 'Switch to this vendor' : 'Select Vendor'}
                    </Button>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-l-4 border-primary bg-background px-5 py-4 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs uppercase font-semibold text-primary tracking-wide">AI Analysis</span>
        </div>
        <p className="text-sm text-text-secondary italic">{aiSummary}</p>
        <p className="text-xs text-text-muted mt-2">Generated by VendorBridge AI</p>
      </div>
    </div>
  )
}
