import { useEffect, useState } from 'react'
import Timeline from '../components/ui/Timeline'
import { getActivities } from '../services/activity.service'

export default function ActivityPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivities()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Activity</h2>
        <p className="text-sm text-text-muted mt-0.5">Recent procurement activity log</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 max-w-2xl">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-background animate-pulse flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 bg-background rounded animate-pulse w-48" />
                  <div className="h-3 bg-background rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Timeline entries={entries} />
        )}
      </div>
    </div>
  )
}
