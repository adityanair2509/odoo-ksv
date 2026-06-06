import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trash2, Plus, AlertCircle } from 'lucide-react'
import StepWizard from '../../components/ui/StepWizard'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { createRFQ } from '../../services/rfq.service'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { ROLE_LABELS } from '../../constants/roles'
import { mockVendors } from '../../mock/mockVendors'

const STEPS = [
  { label: 'Details' },
  { label: 'Line Items' },
  { label: 'Assign Vendors' },
]

const CATEGORIES = ['IT', 'Logistics', 'Furniture', 'Construction', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High']
const UNITS = ['Nos', 'Kg', 'Ltr', 'Meters', 'Sets', 'Drums', 'Months']

export default function CreateRFQPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [lineItems, setLineItems] = useState([{ id: 1, name: '', quantity: '', unit: 'Nos' }])
  const [selectedVendors, setSelectedVendors] = useState([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [itemError, setItemError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const { user } = useAuth()
  const { role, canManageRFQs } = useRole()
  const { register, handleSubmit, getValues, formState: { errors } } = useForm()

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { id: Date.now(), name: '', quantity: '', unit: 'Nos' }])
  }

  const removeLineItem = (id) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id))
  }

  const updateLineItem = (id, field, value) => {
    setLineItems((prev) => prev.map((li) => li.id === id ? { ...li, [field]: value } : li))
  }

  const toggleVendor = (vendor) => {
    setSelectedVendors((prev) =>
      prev.find((v) => v.id === vendor.id)
        ? prev.filter((v) => v.id !== vendor.id)
        : [...prev, vendor]
    )
  }

  const goNext = handleSubmit(() => {
    if (step === 1) {
      const valid = lineItems.length > 0 && lineItems.every((li) => li.name && li.quantity)
      if (!valid) { setItemError('All line items must have a name and quantity'); return }
      setItemError('')
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  })

  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleSendRFQ = async () => {
    setSubmitting(false) // reset any prior error
    setSubmitError('')

    // Defensive client-side role check — saves a round-trip and gives an
    // immediate, friendly message instead of a silent 403.
    if (!canManageRFQs) {
      const roleLabel = ROLE_LABELS[role] || role || 'unknown'
      setSubmitError(
        `Your account is signed in as "${roleLabel}" (${user?.email || 'no email'}). ` +
        `Only Procurement Officers and Administrators can create RFQs. ` +
        `Please sign out and log back in with procurement@vendorbridge.in.`
      )
      return
    }

    setSubmitting(true)
    try {
      const formData = getValues()

      // Build a clean payload that satisfies the backend's Zod schema:
      //  - drop empty line items
      //  - coerce quantity from string -> positive integer
      //  - always include createdBy from the authenticated user (defense in depth)
      const cleanLineItems = lineItems
        .filter((li) => li.name && li.quantity !== '' && li.quantity != null)
        .map(({ id, ...li }) => ({ ...li, quantity: Number(li.quantity) }))

      if (cleanLineItems.length === 0) {
        setItemError('Add at least one line item with a name and quantity.')
        setSubmitting(false)
        return
      }

      await createRFQ({
        ...formData,
        description: formData.description?.trim() || '',
        createdBy: user?.id,
        lineItems: cleanLineItems,
        assignedVendors: selectedVendors.map((v) => v.id),
        status: 'sent',
      })
      navigate('/rfqs')
    } catch (err) {
      // Map known backend errors to actionable messages.
      const status = err?.response?.status
      const backendMessage = err?.response?.data?.message
      if (status === 403) {
        const roleLabel = ROLE_LABELS[role] || role || 'unknown'
        setSubmitError(
          `Access denied (403). Your current role is "${roleLabel}". ` +
          `Only Procurement Officers and Administrators can create RFQs. ` +
          `Sign out and log in with procurement@vendorbridge.in / demo123.`
        )
      } else if (status === 401) {
        setSubmitError('Your session has expired. Please sign in again.')
      } else if (status === 400) {
        const details = err?.response?.data?.details
        if (details?.fieldErrors) {
          const fieldErrors = Object.entries(details.fieldErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n')
          setSubmitError(`Validation error:\n${fieldErrors}`)
        } else {
          setSubmitError(`Validation error: ${backendMessage || 'Invalid data submitted'}`)
        }
      } else {
        setSubmitError(backendMessage || err?.message || 'Failed to create RFQ. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredVendors = mockVendors.filter(
    (v) =>
      v.status !== 'blocked' &&
      (vendorSearch === '' || v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-text-primary">Create RFQ</h2>

      {/* Step wizard */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <StepWizard steps={STEPS} current={step} />
      </div>

      {/* Submit error (e.g. 403 forbidden) */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-red-50 border border-red-200 text-danger rounded-lg p-4 max-w-2xl"
        >
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="text-sm leading-relaxed whitespace-pre-line">{submitError}</div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-surface border border-border rounded-lg p-6 max-w-2xl">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Basic Details</h3>
            <Input
              label="RFQ Title"
              name="title"
              placeholder="e.g. Office Furniture Q3 2024"
              register={register('title', { required: 'Title is required' })}
              error={errors.title?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wide text-text-muted font-medium">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full h-9 px-3 border border-border rounded-md text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wide text-text-muted font-medium">Priority</label>
                <select
                  {...register('priority', { required: true })}
                  className="w-full h-9 px-3 border border-border rounded-md text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <Input
              label="Deadline"
              name="deadline"
              type="date"
              register={register('deadline', { required: 'Deadline is required' })}
              error={errors.deadline?.message}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wide text-text-muted font-medium">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                placeholder="Describe the procurement requirement..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:border-primary focus:outline-none resize-none"
              />
              {errors.description && (
                <p className="text-xs text-danger">{errors.description.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Line Items</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="px-3 py-2 text-left text-xs text-text-muted font-medium uppercase tracking-wide">Item Name</th>
                    <th className="px-3 py-2 text-left text-xs text-text-muted font-medium uppercase tracking-wide w-24">Qty</th>
                    <th className="px-3 py-2 text-left text-xs text-text-muted font-medium uppercase tracking-wide w-28">Unit</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <input
                          value={item.name}
                          onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full h-8 px-2 text-sm border border-border rounded focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                          placeholder="0"
                          className="w-full h-8 px-2 text-sm border border-border rounded focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.unit}
                          onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                          className="w-full h-8 px-2 text-sm border border-border rounded focus:border-primary focus:outline-none"
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-text-muted hover:text-danger transition-colors p-1"
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Plus size={14} />
              Add Line Item
            </button>
            {itemError && <p className="text-xs text-danger">{itemError}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Assign Vendors</h3>
            <input
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="Search vendors..."
              className="w-full h-9 px-3 border border-border rounded-md text-sm focus:border-primary focus:outline-none"
            />
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-border rounded-lg">
              {filteredVendors.map((v) => {
                const selected = !!selectedVendors.find((s) => s.id === v.id)
                return (
                  <label
                    key={v.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-background transition-colors border-b border-border last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleVendor(v)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm text-text-primary font-medium">{v.name}</p>
                      <p className="text-xs text-text-muted">{v.category} · {v.state}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            {selectedVendors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedVendors.map((v) => (
                  <span
                    key={v.id}
                    className="flex items-center gap-1.5 text-xs bg-blue-50 text-primary px-2 py-1 rounded border border-blue-100"
                  >
                    {v.name}
                    <button
                      type="button"
                      onClick={() => toggleVendor(v)}
                      className="hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Attachments */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-sm text-text-muted">
                Drag &amp; drop files or <span className="text-primary cursor-pointer">click to upload</span>
              </p>
              <p className="text-xs text-text-muted mt-1">Supported: PDF, DOC, JPG, PNG</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 max-w-2xl">
        <Button variant="secondary" onClick={goBack} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSendRFQ} loading={submitting}>
            Save &amp; Send
          </Button>
        )}
      </div>
    </div>
  )
}
