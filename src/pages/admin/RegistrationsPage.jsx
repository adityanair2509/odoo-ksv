import { useEffect, useState } from 'react'
import { fetchPendingRegistrations, approveRegistration, rejectRegistration } from '../../services/auth.service'
import { ROLE_LABELS } from '../../constants/roles'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/formatDate'

export default function RegistrationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const load = () => {
    setLoading(true)
    fetchPendingRegistrations()
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await approveRegistration(id)
      load()
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason?.trim()) return
    setActionId(id)
    try {
      await rejectRegistration(id, reason.trim())
      load()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Pending Registrations</h2>
        <p className="text-sm text-text-muted mt-0.5">Review and approve new user sign-up requests</p>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center text-sm text-text-muted">
          No pending registrations
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <div key={r.id} className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-text-primary">{r.firstName} {r.lastName}</p>
                  <p className="text-sm text-text-muted">{r.email} · {r.phone}</p>
                  <p className="text-xs text-text-muted mt-1">{r.country} · Submitted {formatDate(r.createdAt)}</p>
                </div>
                <Badge variant="pending">{ROLE_LABELS[r.role] || r.role}</Badge>
              </div>
              {r.additionalInfo && (
                <p className="text-sm text-text-secondary bg-background rounded px-3 py-2">{r.additionalInfo}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="primary" loading={actionId === r.id} onClick={() => handleApprove(r.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" disabled={actionId === r.id} onClick={() => handleReject(r.id)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
