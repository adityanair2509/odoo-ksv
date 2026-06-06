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
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'

const NAV_GROUPS = [
  {
    label: null,
    items: [{ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }],
  },
  {
    label: 'PROCUREMENT',
    items: [
      { icon: FileText, label: 'RFQs', to: '/rfqs' },
      { icon: MessageSquare, label: 'Quotations', to: '/quotations' },
      { icon: CheckSquare, label: 'Approvals', to: '/approvals' },
      { icon: ShoppingCart, label: 'Purchase Orders', to: '/purchase-orders' },
      { icon: Receipt, label: 'Invoices', to: '/invoices' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { icon: Users, label: 'Vendors', to: '/vendors' },
      { icon: BarChart2, label: 'Reports', to: '/reports' },
      { icon: Activity, label: 'Activity', to: '/activity' },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { isVendor } = useRole()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Filter nav items based on role
  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (isVendor && ['/vendors', '/reports', '/approvals'].includes(item.to)) {
        return false
      }
      return true
    }),
  })).filter((group) => group.items.length > 0)

  return (
    <aside className="w-[220px] h-full bg-sidebar flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1E2028]">
        <span className="text-white text-sm font-semibold tracking-tight">
          VendorBridge
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {filteredGroups.map((group) => (
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
                      ? 'bg-[#1E2028] text-white border-l-2 border-primary -ml-0 pl-[10px]'
                      : 'text-[#A1A1AA] hover:bg-[#1A1D24] hover:text-white',
                  ].join(' ')
                }
              >
                <item.icon size={15} className="flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-[#1E2028] px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#1E2028] border border-[#2E3138] flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-white font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-[#52525B] capitalize">{user?.role}</p>
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
