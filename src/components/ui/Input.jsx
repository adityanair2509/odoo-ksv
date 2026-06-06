import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * @param {{
 *   label?: string,
 *   name: string,
 *   type?: string,
 *   placeholder?: string,
 *   error?: string,
 *   register?: object,
 *   className?: string,
 *   icon?: React.ReactNode,
 *   rightElement?: React.ReactNode,
 *   disabled?: boolean,
 *   value?: string,
 *   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
 * }} props
 */
export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register,
  className = '',
  icon,
  rightElement,
  disabled = false,
  value,
  onChange,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs uppercase tracking-wide text-text-muted font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-text-muted">{icon}</span>
        )}
        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          {...(register || {})}
          className={[
            'w-full h-9 px-3 border rounded-md text-sm text-text-primary bg-white',
            'placeholder:text-text-muted',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            'disabled:bg-background disabled:cursor-not-allowed',
            'transition-colors duration-150',
            error ? 'border-danger' : 'border-border',
            icon ? 'pl-9' : '',
            isPassword || rightElement ? 'pr-10' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 text-text-muted hover:text-text-secondary transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        {!isPassword && rightElement && (
          <span className="absolute right-2">{rightElement}</span>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
