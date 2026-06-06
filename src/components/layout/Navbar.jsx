import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/vendors': 'Vendors',
  '/vendors/new': 'Register New Vendor',
  '/rfqs': 'RFQs',
  '/rfqs/new': 'Create RFQ',
  '/quotations': 'Quotations',
  '/approvals': 'Approvals',
  '/purchase-orders': 'Purchase Orders',
  '/invoices': 'Invoices',
  '/activity': 'Activity',
  '/reports': 'Reports',
}

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuth()

  const title = (() => {
    const path = location.pathname
    if (PAGE_TITLES[path]) return PAGE_TITLES[path]
    if (path.startsWith('/vendors/') && path.endsWith('/edit')) return 'Edit Vendor'
    if (path.startsWith('/vendors/')) return 'Vendor Detail'
    if (path.startsWith('/rfqs/') && path.endsWith('/compare')) return 'Compare Quotations'
    if (path.startsWith('/rfqs/')) return 'RFQ Detail'
    if (path.startsWith('/approvals/')) return 'Approval Detail'
    if (path.startsWith('/purchase-orders/')) return 'Purchase Order'
    if (path.startsWith('/invoices/')) return 'Invoice'
    return 'VendorBridge'
  })()

  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between flex-shrink-0">
      <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative text-text-muted hover:text-text-secondary transition-colors p-1.5 rounded-md hover:bg-background"
          aria-label="Notifications"
          id="navbar-notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full" />
        </button>
        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
          title={user?.name}
        >
          <span className="text-xs text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  )
}
