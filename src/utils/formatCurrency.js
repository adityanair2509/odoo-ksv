/**
 * Formats a number as Indian Rupee currency string.
 * @param {number} amount
 * @returns {string}
 */
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

/**
 * Formats a number as compact Indian notation (e.g. ₹1.2L, ₹3.4Cr).
 * @param {number} amount
 * @returns {string}
 */
export const formatINRCompact = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}
