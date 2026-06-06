import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-lg p-10 w-full max-w-[400px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-text-primary">VendorBridge</h1>
          <p className="text-sm text-text-muted mt-1">Procurement &amp; Vendor Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@company.in"
            register={register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email',
              },
            })}
            error={errors.email?.message}
          />

          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              register={register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
              error={errors.password?.message}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-text-muted hover:text-text-secondary transition-colors mt-1"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {serverError && (
            <p className="text-xs text-danger bg-red-50 border border-red-100 rounded px-3 py-2" role="alert">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            className="w-full mt-1"
          >
            Sign In
          </Button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-text-muted font-medium mb-1.5">Demo accounts</p>
          <div className="flex flex-col gap-1">
            {[
              { email: 'admin@vendorbridge.in', role: 'Admin' },
              { email: 'priya@vendorbridge.in', role: 'Procurement Officer' },
              { email: 'rohit@vendorbridge.in', role: 'Manager' },
              { email: 'rajesh@infrasupplies.in', role: 'Vendor' },
            ].map((d) => (
              <p key={d.email} className="text-xs text-text-muted">
                <span className="text-text-secondary font-medium">{d.role}:</span>{' '}
                {d.email} / demo123
              </p>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center mt-4">
        New vendor? Contact your procurement team.
      </p>
    </div>
  )
}
