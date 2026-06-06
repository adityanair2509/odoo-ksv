import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Check, Star } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import StarRating from '../../components/ui/StarRating'
import { getApprovalById, approveRequest, rejectRequest } from '../../services/approval.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

const CHAIN_STEPS = ['Submitted', 'L1 Review', 'L2 Approval', 'PO Generated']

export default function ApprovalDetailPage() {
  const { id } = useParams()
  const [approval, setApproval] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionDone, setActionDone] = useState(null)
  const [vendorRating, setVendorRating] = useState(0)
  const [ratingError, setRatingError] = useState('')

  const { register, handleSubmit } = useForm()

  useEffect(() => {
    getApprovalById(id).then((data) => {
      setApproval(data)
      if (data?.managerRating) setVendorRating(data.managerRating)
    }).finally(() => setLoading(false))
  }, [id])

  const onAction = async (action, data) => {
    if (action === 'approve' && vendorRating < 1) {
      setRatingError('Please rate the vendor before approving (1–5 stars).')
      return
    }
    setRatingError('')
    setActionLoading(action)
    try {
      if (action === 'approve') {
        await approveRequest(id, { remarks: data.remarks, vendorRating })
        setActionDone('approved')
        setApproval((prev) => prev ? { ...prev, managerRating: vendorRating, vendorRating } : prev)
      } else {
        await rejectRequest(id, { remarks: data.remarks })
        setActionDone('rejected')
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>
  if (!approval) return <div className="text-sm text-danger">Approval not found</div>

  const currentStepIdx = CHAIN_STEPS.indexOf(approval.currentStep)
  const displayRating = approval.managerRating || (actionDone === 'approved' ? vendorRating : 0)
  const canRate = approval.status === 'pending' && !actionDone

  return (
    <div className="flex flex-col gap-6">
      <Link to="/approvals" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← Approvals
      </Link>

      {canRate && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              <h3 className="text-sm font-semibold text-text-primary">Rate this vendor (required)</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Give <strong>{approval.vendorName}</strong> a score from 1 to 5 stars for this RFQ quotation before you approve.
            </p>
            {ratingError && (
              <p className="text-xs text-danger mt-2">{ratingError}</p>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <StarRating value={vendorRating} onChange={setVendorRating} size={28} />
            <span className="text-xs text-text-muted">
              {vendorRating > 0 ? `${vendorRating} / 5 selected` : 'Tap a star to rate'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{approval.rfqTitle}</h2>
            <p className="text-sm text-text-muted mt-0.5">{formatINR(approval.amount)}</p>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center">
              {CHAIN_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIdx || actionDone === 'approved'
                const isCurrent = idx === currentStepIdx && !actionDone
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={[
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                        isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-background border border-border text-text-muted',
                      ].join(' ')}>
                        {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                      </div>
                      <span className={`text-xs whitespace-nowrap ${isCompleted || isCurrent ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                        {step}
                      </span>
                    </div>
                    {idx < CHAIN_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 mt-[-16px] ${isCompleted ? 'bg-success' : 'bg-border'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Approval Chain</h3>
            {approval.approvalChain.map((approver) => (
              <div key={approver.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-xs font-semibold text-text-secondary">
                    {approver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{approver.name}</p>
                    <p className="text-xs text-text-muted">{approver.role}</p>
                    {approver.remarks && (
                      <p className="text-xs text-text-secondary mt-0.5 italic">&ldquo;{approver.remarks}&rdquo;</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={approver.status} />
                  {approver.timestamp && (
                    <span className="text-xs text-text-muted">{formatDateTime(approver.timestamp)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {actionDone ? (
            <div className={`border rounded-lg p-4 text-sm font-medium ${actionDone === 'approved' ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-danger border-red-200'}`}>
              {actionDone === 'approved'
                ? `✓ Approval granted — you rated ${approval.vendorName} ${displayRating}/5 stars`
                : '✗ Request rejected'}
            </div>
          ) : canRate ? (
            <form className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium mb-2">Remarks</h3>
                <textarea
                  {...register('remarks')}
                  rows={3}
                  placeholder="Add your comments (optional)..."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  loading={actionLoading === 'reject'}
                  onClick={handleSubmit((data) => onAction('reject', data))}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={actionLoading === 'approve'}
                  onClick={handleSubmit((data) => onAction('approve', data))}
                >
                  Approve {vendorRating > 0 ? `(${vendorRating}★)` : ''}
                </Button>
              </div>
            </form>
          ) : displayRating > 0 ? (
            <div className="bg-surface border border-border rounded-lg p-4 text-sm text-text-secondary">
              You rated this vendor <strong>{displayRating}/5 stars</strong>.
            </div>
          ) : null}
        </div>

        <div className="col-span-2">
          <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4 sticky top-6">
            <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Quotation Summary</h3>
            <div className="flex flex-col gap-3">
              <SummaryRow label="RFQ" value={approval.rfqTitle} />
              <SummaryRow label="Vendor" value={approval.vendorName} />
              <SummaryRow label="Total Amount" value={<span className="font-semibold">{formatINR(approval.amount)}</span>} />
              <SummaryRow label="Delivery" value={`${approval.deliveryDays} days`} />
              <div className="rounded-lg bg-background border border-border p-3 flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-text-muted font-medium">Manager Vendor Rating</span>
                {canRate ? (
                  <>
                    <StarRating value={vendorRating} onChange={setVendorRating} size={22} />
                    <span className="text-xs text-text-muted">
                      {vendorRating > 0 ? `${vendorRating} / 5 — required before approve` : 'Select 1–5 stars above'}
                    </span>
                  </>
                ) : displayRating > 0 ? (
                  <div className="flex items-center gap-2">
                    <StarRating value={displayRating} readonly size={18} />
                    <span className="text-sm font-medium text-text-primary">{displayRating}/5</span>
                  </div>
                ) : (
                  <span className="text-sm text-text-muted italic">Not rated</span>
                )}
              </div>
              <SummaryRow label="Payment Terms" value={approval.paymentTerms} />
              {approval.selectedByName && (
                <SummaryRow label="Selected By (PO)" value={approval.selectedByName} />
              )}
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs uppercase tracking-wide text-text-muted font-medium mb-3">RFQ Items</p>
              {approval.lineItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm border-b border-border last:border-0">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="text-text-muted">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-text-muted flex-shrink-0">{label}</span>
      <span className="text-sm text-text-primary text-right">{value ?? '—'}</span>
    </div>
  )
}
