import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Check } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { getApprovalById, approveRequest, rejectRequest } from '../../services/approval.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/formatDate'

const CHAIN_STEPS = ['Submitted', 'L1 Review', 'L2 Approval', 'PO Generated']

export default function ApprovalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [approval, setApproval] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionDone, setActionDone] = useState(null)

  const { register, handleSubmit } = useForm()

  useEffect(() => {
    getApprovalById(id).then(setApproval).finally(() => setLoading(false))
  }, [id])

  const onAction = async (action, data) => {
    setActionLoading(action)
    try {
      if (action === 'approve') {
        await approveRequest(id, { remarks: data.remarks })
        setActionDone('approved')
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

  return (
    <div className="flex flex-col gap-6">
      <Link to="/approvals" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← Approvals
      </Link>

      <div className="grid grid-cols-5 gap-6">
        {/* LEFT: Main content */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{approval.rfqTitle}</h2>
            <p className="text-sm text-text-muted mt-0.5">{formatINR(approval.amount)}</p>
          </div>

          {/* Horizontal stepper */}
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

          {/* Approval Chain */}
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
                      <p className="text-xs text-text-secondary mt-0.5 italic">"{approver.remarks}"</p>
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

          {/* Action area */}
          {actionDone ? (
            <div className={`border rounded-lg p-4 text-sm font-medium ${actionDone === 'approved' ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-danger border-red-200'}`}>
              {actionDone === 'approved' ? '✓ Approval granted successfully' : '✗ Request rejected'}
            </div>
          ) : approval.status === 'pending' ? (
            <form className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
              <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Remarks</h3>
              <textarea
                {...register('remarks')}
                rows={3}
                placeholder="Add your comments..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none focus:border-primary focus:outline-none"
              />
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
                  Approve
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        {/* RIGHT: Summary panel */}
        <div className="col-span-2">
          <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4 sticky top-6">
            <h3 className="text-xs uppercase tracking-wide text-text-muted font-medium">Quotation Summary</h3>
            <div className="flex flex-col gap-3">
              <SummaryRow label="Vendor" value={approval.vendorName} />
              <SummaryRow label="Total Amount" value={<span className="font-semibold">{formatINR(approval.amount)}</span>} />
              <SummaryRow label="Delivery" value={`${approval.deliveryDays} days`} />
              <SummaryRow label="Rating" value={`${approval.vendorRating || '—'} ★`} />
              <SummaryRow label="Payment Terms" value={approval.paymentTerms} />
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
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm text-text-primary">{value ?? '—'}</span>
    </div>
  )
}
