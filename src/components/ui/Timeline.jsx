import {
  CheckCircle,
  XCircle,
  Send,
  FilePlus,
  FileText,
  Inbox,
  UserPlus,
  CheckSquare,
  Circle,
} from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatDate'

const ICON_MAP = {
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'send': Send,
  'file-plus': FilePlus,
  'file-text': FileText,
  'inbox': Inbox,
  'user-plus': UserPlus,
  'check-square': CheckSquare,
}

/**
 * @param {{
 *   entries: Array<{
 *     id: string,
 *     icon: string,
 *     title: string,
 *     description: string,
 *     user: string,
 *     timestamp: string,
 *   }>,
 * }} props
 */
export default function Timeline({ entries }) {
  return (
    <div className="flex flex-col">
      {entries.map((entry, idx) => {
        const IconComponent = ICON_MAP[entry.icon] ?? Circle
        const isLast = idx === entries.length - 1
        return (
          <div key={entry.id} className="flex gap-4">
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                <IconComponent size={14} className="text-text-secondary" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            {/* Content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''} pt-1 flex-1`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{entry.description}</p>
                  <p className="text-xs text-text-muted mt-1">by {entry.user}</p>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
