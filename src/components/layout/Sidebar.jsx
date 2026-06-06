import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  Receipt,
  Users,
  BarChart2,
  Activity,
  LogOut,
  Building2,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { ROLE_LABELS } from '../../constants/roles'
import { fetchPendingRegistrationCount } from '../../services/auth.service'

/**
 * Nav items visible per role.
 * Each entry: { icon, label, to }
 * Grouped under section labels.
 */
const NAV_BY_ROLE = {
  admin: [
    {
      label: null,
      items: [{ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { icon: Users,     label: 'Vendors',   to: '/vendors' },
        { icon: ShoppingCart, label: 'Purchase Orders', to: '/purchase-orders' },
        { icon: Receipt, label: 'Invoices', to: '/invoices' },
        { icon: BarChart2, label: 'Reports',   to: '/reports' },
        { icon: Activity,  label: 'Activity',  to: '/activity' },
        { icon: CheckSquare, label: 'Registrations', to: '/registrations', badgeKey: 'registrations' },
      ],
    },
  ],

  manager: [
    {
      label: null,
      items: [{ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }],
    },
    {
      label: 'PROCUREMENT',
      items: [
        { icon: Users,        label: 'Vendors',          to: '/vendors' },
        { icon: FileText,     label: 'RFQs',             to: '/rfqs' },
        { icon: MessageSquare,label: 'Quotations',       to: '/quotations' },
        { icon: ShoppingCart, label: 'Purchase Orders',  to: '/purchase-orders' },
        { icon: Receipt,      label: 'Invoices',         to: '/invoices' },
      ],
    },
    {
      label: 'OTHER',
      items: [
        { icon: Activity, label: 'Activity', to: '/activity' },
      ],
    },
  ],

  procurement_officer: [
    {
      label: null,
      items: [{ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }],
    },
    {
      label: 'APPROVALS',
      items: [
        { icon: CheckSquare, label: 'Approvals', to: '/approvals' },
      ],
    },
    {
      label: 'OTHER',
      items: [
        { icon: BarChart2, label: 'Reports',  to: '/reports' },
        { icon: Activity,  label: 'Activity', to: '/activity' },
      ],
    },
  ],

  vendor: [
    {
      label: null,
      items: [{ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }],
    },
    {
      label: 'MY WORK',
      items: [
        { icon: FileText,     label: 'My RFQs',          to: '/rfqs' },
        { icon: MessageSquare,label: 'My Quotations',     to: '/quotations' },
        { icon: ShoppingCart, label: 'My Orders',         to: '/purchase-orders' },
        { icon: Receipt,      label: 'My Invoices',       to: '/invoices' },
      ],
    },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { role } = useRole()
  const navigate = useNavigate()
  const [pendingRegs, setPendingRegs] = useState(0)

  useEffect(() => {
    if (role !== 'admin') return
    fetchPendingRegistrationCount()
      .then(setPendingRegs)
      .catch(() => setPendingRegs(0))
    const interval = setInterval(() => {
      fetchPendingRegistrationCount().then(setPendingRegs).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [role])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const groups = NAV_BY_ROLE[role] ?? NAV_BY_ROLE['admin']
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <aside className="w-[220px] h-full bg-sidebar flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1E2028]">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-primary flex-shrink-0" />
          <span className="text-white text-sm font-semibold tracking-tight">
            VendorBridge
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {groups.map((group) => (
          <div key={group.label ?? 'main'}>
            {group.label && (
              <p className="text-[10px] uppercase text-[#52525B] px-3 pt-5 pb-1 tracking-widest">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2 mx-2 rounded-md text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-[#1E2028] text-white border-l-2 border-primary pl-[10px]'
                      : 'text-[#A1A1AA] hover:bg-[#1A1D24] hover:text-white',
                  ].join(' ')
                }
              >
                <item.icon size={15} className="flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badgeKey === 'registrations' && pendingRegs > 0 && (
                  <span className="ml-auto bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingRegs}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-[#1E2028] px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-primary font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-[#52525B]">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#52525B] hover:text-white transition-colors p-1 rounded"
            aria-label="Logout"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
