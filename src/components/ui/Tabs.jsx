/**
 * @param {{
 *   tabs: Array<{ label: string, count?: number, key?: string }>,
 *   active: string,
 *   onChange: (key: string) => void,
 * }} props
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center border-b border-border gap-1">
      {tabs.map((tab) => {
        const key = tab.key ?? tab.label.toLowerCase()
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={[
              'flex items-center gap-1.5 px-1 py-3 text-sm transition-colors duration-150',
              'border-b-2 -mb-px',
              isActive
                ? 'border-primary text-text-primary font-medium'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs bg-background text-text-muted px-1.5 rounded ml-0.5">
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
