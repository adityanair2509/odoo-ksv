/**
 * Formats a date value as "DD MMM YYYY" (Indian style).
 * @param {string | Date | number} date
 * @returns {string}
 */
export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))

/**
 * Formats a date-time value as "DD MMM YYYY, HH:MM".
 * @param {string | Date | number} date
 * @returns {string}
 */
export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

/**
 * Returns relative time string (e.g. "2 hours ago").
 * @param {string | Date | number} date
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
