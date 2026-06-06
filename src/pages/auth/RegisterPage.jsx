import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { authRegister, authVerifyRegistration } from '../../services/auth.service'
import { ROLE_LABELS } from '../../constants/roles'

const ROLES = [
  { value: 'procurement_officer', label: ROLE_LABELS.procurement_officer },
  { value: 'manager', label: ROLE_LABELS.manager },
  { value: 'vendor', label: ROLE_LABELS.vendor },
]

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Singapore', 'UAE', 'Other',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [email, setEmail] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const otpForm = useForm()

  const onRegister = async (data) => {
    setServerError('')
    try {
      const result = await authRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        country: data.country,
        additionalInfo: data.additionalInfo || '',
        password: data.password,
      })
      setEmail(data.email)
      if (result.devOtp) setDevOtp(result.devOtp)
      setStep('otp')
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Registration failed')
    }
  }

  const onVerifyOtp = async ({ otp }) => {
    setServerError('')
    try {
      const result = await authVerifyRegistration({ email, otp })
      setSuccessMsg(result.message)
      setStep('done')
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'OTP verification failed')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="bg-surface border border-border rounded-lg p-10 w-full max-w-[480px]">
        <h1 className="text-lg font-semibold text-text-primary">VendorBridge</h1>
        <p className="text-sm text-text-muted mt-1 mb-6">Create your account</p>

        {step === 'form' && (
          <form onSubmit={handleSubmit(onRegister)} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" name="firstName" register={register('firstName', { required: 'Required' })} error={errors.firstName?.message} />
              <Input label="Last Name" name="lastName" register={register('lastName', { required: 'Required' })} error={errors.lastName?.message} />
            </div>
            <Input label="Email" name="email" type="email" register={register('email', { required: 'Required' })} error={errors.email?.message} />
            <Input label="Phone Number" name="phone" register={register('phone', { required: 'Required', minLength: { value: 6, message: 'Too short' } })} error={errors.phone?.message} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Role</label>
              <select
                {...register('role', { required: 'Select a role' })}
                className="border border-border rounded-md px-3 py-2 text-sm bg-surface"
                defaultValue=""
              >
                <option value="" disabled>Select role</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Country</label>
              <select
                {...register('country', { required: 'Select country' })}
                className="border border-border rounded-md px-3 py-2 text-sm bg-surface"
                defaultValue=""
              >
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.country && <p className="text-xs text-danger">{errors.country.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Additional Info</label>
              <textarea
                {...register('additionalInfo')}
                rows={3}
                placeholder="Company name, department, GSTIN, or other details for admin review"
                className="border border-border rounded-md px-3 py-2 text-sm bg-surface resize-none"
              />
            </div>
            <Input
              label="Password"
              name="password"
              type="password"
              register={register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
              error={errors.password?.message}
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              register={register('confirmPassword', {
                required: 'Required',
                validate: (val, form) => val === form.password || 'Passwords do not match',
              })}
              error={errors.confirmPassword?.message}
            />
            {serverError && <p className="text-xs text-danger bg-red-50 border border-red-100 rounded px-3 py-2">{serverError}</p>}
            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">Register &amp; Verify Email</Button>
            <Link to="/login" className="block">
              <Button type="button" variant="secondary" className="w-full">Back to Sign In</Button>
            </Link>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">Enter the OTP sent to <strong>{email}</strong></p>
            {devOtp && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">Dev OTP: {devOtp}</p>
            )}
            <Input label="OTP Code" name="otp" register={otpForm.register('otp', { required: 'Required' })} error={otpForm.formState.errors.otp?.message} />
            {serverError && <p className="text-xs text-danger bg-red-50 border border-red-100 rounded px-3 py-2">{serverError}</p>}
            <Button type="submit" variant="primary" loading={otpForm.formState.isSubmitting} className="w-full">Verify Email</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-success bg-green-50 border border-green-100 rounded px-3 py-3">{successMsg}</p>
            <p className="text-sm text-text-muted">An administrator will review your registration. You&apos;ll be able to sign in once approved.</p>
            <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>Go to Sign In</Button>
          </div>
        )}

        <Link to="/login" className="inline-block mt-6 text-sm text-primary hover:text-blue-700">← Back to Sign In</Link>
      </div>
    </div>
  )
}
