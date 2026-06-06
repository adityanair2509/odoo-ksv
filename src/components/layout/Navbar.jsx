import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { ROLE_LABELS } from '../../constants/roles'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notification.service'

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

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuth()
  const { role } = useRole()
  const roleLabel = role ? ROLE_LABELS[role] || role : null

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

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

  const loadNotifications = async () => {
    if (!user) return
    try {
      const [items, { count }] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ])
      setNotifications(items)
      setUnreadCount(count)
    } catch {
      /* ignore — bell stays empty */
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    await loadNotifications()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    await loadNotifications()
  }

  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between flex-shrink-0">
      <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative text-text-muted hover:text-text-secondary transition-colors p-1.5 rounded-md hover:bg-background"
            aria-label="Notifications"
            id="navbar-notifications"
            aria-expanded={open}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-danger rounded-full text-[10px] text-white font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-text-muted text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-background transition-colors ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-text-muted mt-1">{formatTime(n.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex flex-col items-end leading-tight mr-1">
            <span className="text-xs font-medium text-text-primary">{user.name}</span>
            {roleLabel && (
              <span
                id="navbar-role-badge"
                data-role={role}
                className="text-[10px] uppercase tracking-wide font-semibold text-primary mt-0.5"
                title={`Signed in as ${roleLabel}`}
              >
                {roleLabel}
              </span>
            )}
          </div>
        )}
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
