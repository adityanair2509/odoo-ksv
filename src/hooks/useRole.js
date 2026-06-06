import { useAuth } from './useAuth'
import { ROLES } from '../constants/roles'

/**
 * Hook to check the current user's role.
 * @returns {{
 *   isAdmin: boolean,
 *   isProcurementOfficer: boolean,
 *   isManager: boolean,
 *   isVendor: boolean,
 *   role: string | null,
 * }}
 */
export function useRole() {
  const { user } = useAuth()
  const role = user?.role ?? null
  return {
    isAdmin:               role === ROLES.ADMIN,
    isProcurementOfficer:  role === ROLES.PROCUREMENT_OFFICER,
    isManager:             role === ROLES.MANAGER,
    isVendor:              role === ROLES.VENDOR,
    // Convenience: can approve = manager only
    canApprove:            role === ROLES.MANAGER,
    // Can manage vendors = admin only
    canManageVendors:      role === ROLES.ADMIN,
    // Can create/manage RFQs = procurement officer only
    canManageRFQs:         role === ROLES.PROCUREMENT_OFFICER,
    role,
  }
}
