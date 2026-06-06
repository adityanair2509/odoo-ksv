import { TrendingDown, TrendingUp } from 'lucide-react'

/**
 * @param {{
 *   label: string,
 *   value: string | number,
 *   delta?: { value: string, positive: boolean },
 *   icon?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function StatCard({ label, value, delta, icon, className = '' }) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg p-5 flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-text-primary leading-none">
            {value}
          </span>
          <span className="text-xs uppercase tracking-wide text-text-muted font-medium mt-1">
            {label}
          </span>
        </div>
        {icon && (
          <span className="text-text-muted opacity-60">{icon}</span>
        )}
      </div>
      {delta && (
        <div className="flex items-center gap-1">
          {delta.positive ? (
            <TrendingUp size={12} className="text-success" />
          ) : (
            <TrendingDown size={12} className="text-danger" />
          )}
          <span
            className={`text-xs font-medium ${
              delta.positive ? 'text-success' : 'text-danger'
            }`}
          >
            {delta.value}
          </span>
          <span className="text-xs text-text-muted">vs last month</span>
        </div>
      )}
    </div>
  )
}
