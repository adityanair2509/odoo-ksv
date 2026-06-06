import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { createVendor, verifyGSTIN } from '../../services/vendor.service'
import { validateGSTINFormat, getStateFromGSTIN } from '../../utils/gstin.validator'

const CATEGORIES = ['IT', 'Logistics', 'Furniture', 'Construction', 'Other']

export default function AddVendorPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await createVendor({ ...data, gstinVerified: true, status: 'active' })
      navigate('/vendors')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/vendors" className="text-sm text-text-muted hover:text-text-secondary transition-colors w-fit">
        ← Vendors
      </Link>
      <h2 className="text-lg font-semibold text-text-primary">Register New Vendor</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
        {/* Company Information */}
        <Section title="Company Information">
          <Input
            label="Company Name"
            name="name"
            placeholder="Acme Supplies Pvt Ltd"
            register={register('name', { required: 'Company name is required' })}
            error={errors.name?.message}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-text-muted font-medium">
              Category
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full h-9 px-3 border border-border rounded-md text-sm text-text-primary bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
          </div>
        </Section>

        {/* GST Details */}
        <Section title="GST Details">
          <Input
            label="GSTIN"
            name="gstin"
            placeholder="27AACCI1234A1Z5"
            register={register('gstin', { required: 'GSTIN is required' })}
            error={errors.gstin?.message}
          />
          <Input
            label="State"
            name="state"
            placeholder="e.g. Maharashtra"
            register={register('state', { required: 'State is required' })}
            error={errors.state?.message}
          />
        </Section>

        {/* Contact Details */}
        <Section title="Contact Details">
          <Input
            label="Contact Person Name"
            name="contactPerson"
            placeholder="Rajesh Kumar"
            register={register('contactPerson', { required: 'Contact person is required' })}
            error={errors.contactPerson?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="contact@company.in"
              register={register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
              error={errors.email?.message}
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              register={register('phone', { required: 'Phone is required' })}
              error={errors.phone?.message}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-text-muted font-medium">
              Address
            </label>
            <textarea
              {...register('address', { required: 'Address is required' })}
              placeholder="14, MIDC Industrial Area, Pune, Maharashtra 411019"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md text-sm text-text-primary bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {errors.address && <p className="text-xs text-danger">{errors.address.message}</p>}
          </div>
        </Section>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/vendors')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
          >
            Register Vendor
          </Button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}
