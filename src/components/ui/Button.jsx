import { Loader2 } from 'lucide-react'

/**
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'destructive' | 'ghost',
 *   size?: 'sm' | 'md',
 *   children: React.ReactNode,
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   loading?: boolean,
 *   type?: 'button' | 'submit' | 'reset',
 *   className?: string,
 * }} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1'

  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 focus:ring-primary',
    secondary:
      'bg-white border border-border text-text-primary hover:bg-background focus:ring-border',
    destructive:
      'bg-white border border-danger text-danger hover:bg-red-50 focus:ring-danger',
    ghost:
      'text-text-secondary hover:bg-background focus:ring-border',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}
