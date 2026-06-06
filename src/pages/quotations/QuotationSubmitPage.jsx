import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { submitQuotation } from '../../services/quotation.service'
import { getRFQById } from '../../services/rfq.service'
import { useAuth } from '../../hooks/useAuth'

export default function QuotationSubmitPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rfq, setRFQ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [lineItems, setLineItems] = useState([{ id: 1, name: '', quantity: 0, unitPrice: '' }])

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    getRFQById(id).then((data) => {
      setRFQ(data)
      if (data.lineItems?.length) {
        setLineItems(data.lineItems.map((li) => ({ ...li, unitPrice: '' })))
      }
      setLoading(false)
    })
  }, [id])

  const updateItem = (itemId, field, value) => {
    setLineItems((prev) => prev.map((li) => li.id === itemId ? { ...li, [field]: value } : li))
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      // Compute line item totals and grand total
      const processedItems = lineItems.map((li) => ({
        name: li.name,
        quantity: Number(li.quantity) || 0,
        unitPrice: Number(li.unitPrice) || 0,
        total: (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0),
      }))

      const subtotal = processedItems.reduce((sum, li) => sum + li.total, 0)
      const gstPercent = Number(data.gstPercent) || 0
      const grandTotal = subtotal + (subtotal * gstPercent / 100)

      await submitQuotation({
        rfqId: id,
        vendorId: user?.id,
        vendorName: user?.name,
        grandTotal,
        gstPercent,
        deliveryDays: Number(data.deliveryDays) || 0,
        vendorRating: 0,
        paymentTerms: data.paymentTerms,
        lineItems: processedItems,
        notes: data.notes || '',
      })
      navigate('/rfqs')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit quotation'
      const details = err?.response?.data?.details
      if (details?.fieldErrors) {
        const fieldErrors = Object.entries(details.fieldErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n')
        setSubmitError(`${msg}\n${fieldErrors}`)
      } else {
        setSubmitError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link to="/rfqs" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← RFQs
      </Link>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Submit Quotation</h2>
        <p className="text-sm text-text-muted mt-0.5">For: {rfq?.title}</p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-red-50 border border-red-200 text-danger rounded-lg p-4"
        >
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="text-sm leading-relaxed whitespace-pre-line">{submitError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold border-b border-border pb-3">Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GST %"
              name="gstPercent"
              type="number"
              placeholder="18"
              register={register('gstPercent', { required: 'GST % is required' })}
              error={errors.gstPercent?.message}
            />
            <Input
              label="Delivery Days"
              name="deliveryDays"
              type="number"
              placeholder="21"
              register={register('deliveryDays', { required: 'Delivery days required' })}
              error={errors.deliveryDays?.message}
            />
          </div>
          <Input
            label="Payment Terms"
            name="paymentTerms"
            placeholder="e.g. 30 days from delivery"
            register={register('paymentTerms', { required: 'Payment terms required' })}
            error={errors.paymentTerms?.message}
          />
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold border-b border-border pb-3">Line Items</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-background border-b border-border text-xs text-text-muted font-medium uppercase">
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-left w-16">Qty</th>
                <th className="px-3 py-2 text-left w-28">Unit Price (₹)</th>
                <th className="px-3 py-2 text-right w-24">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                return (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-sm text-text-primary">{item.name}</td>
                    <td className="px-3 py-2 text-sm text-text-muted">{item.quantity}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="0"
                        className="w-full h-8 px-2 text-sm border border-border rounded focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-medium">
                      {total ? `₹${total.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <label className="text-xs uppercase tracking-wide text-text-muted font-medium block mb-2">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any additional notes or conditions..."
            className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/rfqs')}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting}>Submit Quotation</Button>
        </div>
      </form>
    </div>
  )
}

