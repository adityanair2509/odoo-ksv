import { Check } from 'lucide-react'

/**
 * @param {{
 *   steps: Array<{ label: string }>,
 *   current: number,
 * }} props
 */
export default function StepWizard({ steps, current }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => {
        const isCompleted = idx < current
        const isCurrent = idx === current
        const isUpcoming = idx > current
        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-200',
                  isCompleted
                    ? 'bg-primary text-white'
                    : isCurrent
                    ? 'border-2 border-primary text-primary bg-white'
                    : 'border-2 border-border text-text-muted bg-white',
                ].join(' ')}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : idx + 1}
              </div>
              <span
                className={[
                  'text-xs font-medium whitespace-nowrap',
                  isCompleted || isCurrent ? 'text-text-primary' : 'text-text-muted',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                className={[
                  'flex-1 h-px mx-3 mt-[-18px]',
                  isCompleted ? 'bg-primary' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
