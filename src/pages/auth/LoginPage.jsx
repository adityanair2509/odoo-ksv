import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { authSendOtp } from '../../services/auth.service'

export default function LoginPage() {
  const { login, verifyOtpLogin } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [otpMode, setOtpMode] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [devOtpHint, setDevOtpHint] = useState('')

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

  const onSendOtp = async ({ email }) => {
    setServerError('')
    setDevOtpHint('')
    try {
      const result = await authSendOtp({ email, purpose: 'login' })
      setOtpEmail(email)
      setOtpSent(true)
      if (result.devOtp) setDevOtpHint(`Dev OTP: ${result.devOtp}`)
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to send OTP')
    }
  }

  const onVerifyOtp = async ({ otp }) => {
    setServerError('')
    try {
      await verifyOtpLogin(otpEmail, otp)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Invalid OTP')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-lg p-10 w-full max-w-[400px]">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-text-primary">VendorBridge</h1>
          <p className="text-sm text-text-muted mt-1">Procurement &amp; Vendor Management</p>
        </div>

        {!otpMode ? (
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
              <div className="flex justify-between mt-1">
                <button
                  type="button"
                  onClick={() => { setOtpMode(true); setServerError(''); setOtpSent(false) }}
                  className="text-xs text-primary hover:text-blue-700 transition-colors"
                >
                  Sign in with OTP
                </button>
                <button
                  type="button"
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
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

            <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full mt-1">
              Sign In
            </Button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSubmit(onSendOtp)} noValidate className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              Enter your email and we&apos;ll send a one-time password to sign in.
            </p>
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
            {serverError && (
              <p className="text-xs text-danger bg-red-50 border border-red-100 rounded px-3 py-2" role="alert">
                {serverError}
              </p>
            )}
            <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full">
              Send OTP
            </Button>
            <button
              type="button"
              onClick={() => { setOtpMode(false); setServerError('') }}
              className="text-sm text-text-muted hover:text-text-secondary"
            >
              ← Back to password login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onVerifyOtp)} noValidate className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              Enter the 6-digit OTP sent to <strong>{otpEmail}</strong>
            </p>
            {devOtpHint && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                {devOtpHint}
              </p>
            )}
            <Input
              label="OTP Code"
              name="otp"
              type="text"
              placeholder="123456"
              register={register('otp', {
                required: 'OTP is required',
                minLength: { value: 4, message: 'Enter the full OTP' },
              })}
              error={errors.otp?.message}
            />
            {serverError && (
              <p className="text-xs text-danger bg-red-50 border border-red-100 rounded px-3 py-2" role="alert">
                {serverError}
              </p>
            )}
            <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full">
              Verify &amp; Sign In
            </Button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setServerError('') }}
              className="text-sm text-text-muted hover:text-text-secondary"
            >
              ← Resend OTP
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-3">
          <Link to="/register" className="block">
            <Button type="button" variant="secondary" size="md" className="w-full">
              Create Account — Register
            </Button>
          </Link>
          <p className="text-xs text-text-muted text-center">
            New users must register and be approved by an administrator.
          </p>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center mt-2">
        Admin login: shreenathpillai1696@gmail.com
      </p>
    </div>
  )
}
