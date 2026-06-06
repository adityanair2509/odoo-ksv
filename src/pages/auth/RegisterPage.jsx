import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-lg p-10 w-full max-w-[400px]">
        <h1 className="text-lg font-semibold text-text-primary">VendorBridge</h1>
        <p className="text-sm text-text-muted mt-1 mb-8">Create your account</p>
        <p className="text-sm text-text-secondary mb-4">
          Registration is managed by your procurement administrator.
          Please contact your team lead for access.
        </p>
        <Link
          to="/login"
          className="text-sm text-primary hover:text-blue-700 transition-colors"
        >
          ← Back to Sign In
        </Link>
      </div>
    </div>
  )
}
