/**
 * @param {{
 *   variant: 'active' | 'pending' | 'blocked' | 'approved' | 'rejected' | 'sent' | 'draft' | 'delivered' | 'overdue' | 'paid',
 *   children?: React.ReactNode,
 *   label?: string,
 * }} props
 */
export default function Badge({ variant, children, label }) {
  const styles = {
    active:    'bg-green-50 text-success',
    approved:  'bg-green-50 text-success',
    delivered: 'bg-green-50 text-success',
    paid:      'bg-green-50 text-success',
    pending:   'bg-yellow-50 text-warning',
    draft:     'bg-yellow-50 text-warning',
    blocked:   'bg-red-50 text-danger',
    rejected:  'bg-red-50 text-danger',
    overdue:   'bg-red-50 text-danger',
    sent:      'bg-blue-50 text-primary',
  }

  const display = children ?? label ?? variant
  const style = styles[variant] ?? 'bg-background text-text-secondary'

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded capitalize ${style}`}>
      {display}
    </span>
  )
}
