import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getQuotationsByRFQ, selectQuotation } from '../../services/quotation.service'
import { getRFQById } from '../../services/rfq.service'
import { formatINR } from '../../utils/formatCurrency'

const AI_SUMMARY = `Based on the three quotations received, Infra Supplies Pvt Ltd offers the lowest grand total at ₹16,90,000 with an 18% GST rate and 1-year warranty — making it the best value option. FurnishPro India delivers fastest (21 days) with bulk chair discounts, while QuickMove Logistics is the most expensive but includes free assembly and express delivery. Recommend selecting Infra Supplies unless delivery speed is critical.`

export default function QuotationComparePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRFQ] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(null)

  useEffect(() => {
    Promise.all([getRFQById(id), getQuotationsByRFQ(id)]).then(([r, q]) => {
      setRFQ(r)
      setQuotations(q)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>

  const lowestTotal = Math.min(...quotations.map((q) => q.grandTotal))
  const fastestDelivery = Math.min(...quotations.map((q) => q.deliveryDays))

  const handleSelect = async (quotation) => {
    setSelecting(quotation.id)
    try {
      await selectQuotation(quotation.id)
      navigate(`/approvals`)
    } catch (err) {
      console.error(err)
    } finally {
      setSelecting(null)
    }
  }

  const ROWS = [
    {
      label: 'Grand Total',
      render: (q) => (
        <span className={`text-sm font-semibold ${q.grandTotal === lowestTotal ? 'text-success' : 'text-text-primary'}`}>
          {formatINR(q.grandTotal)}
          {q.grandTotal === lowestTotal && <span className="ml-1 text-xs font-medium">✓ Lowest</span>}
        </span>
      ),
      cellClass: (q) => q.grandTotal === lowestTotal ? 'bg-green-50' : '',
    },
    {
      label: 'GST %',
      render: (q) => <span className="text-sm">{q.gstPercent}%</span>,
      cellClass: () => '',
    },
    {
      label: 'Delivery Days',
      render: (q) => (
        <span className={`text-sm font-medium ${q.deliveryDays === fastestDelivery ? 'text-primary' : 'text-text-primary'}`}>
          {q.deliveryDays} days
          {q.deliveryDays === fastestDelivery && <span className="ml-1 text-xs">⚡ Fastest</span>}
        </span>
      ),
      cellClass: (q) => q.deliveryDays === fastestDelivery ? 'bg-blue-50' : '',
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

  return (
    <div className="flex flex-col gap-6">
      <Link to={`/rfqs/${id}`} className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← RFQ Detail
      </Link>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">{rfq?.title}</h2>
        <Badge variant="sent">{quotations.length} Quotations Received</Badge>
      </div>

      {/* Comparison table */}
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
            {/* Select row */}
            <tr className="bg-background">
              <td className="px-5 py-3 text-xs text-text-muted font-medium">Select</td>
              {quotations.map((q) => (
                <td key={q.id} className="px-5 py-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelect(q)}
                    loading={selecting === q.id}
                  >
                    Select Vendor
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI Summary */}
      <div className="border-l-4 border-primary bg-background px-5 py-4 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs uppercase font-semibold text-primary tracking-wide">AI Analysis</span>
        </div>
        <p className="text-sm text-text-secondary italic">{AI_SUMMARY}</p>
        <p className="text-xs text-text-muted mt-2">Generated by VendorBridge AI</p>
      </div>
    </div>
  )
}
