import api from './api'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** Mock users for demo — 4 roles */
const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@vendorbridge.in',
    role: 'admin',
    password: 'demo123',
    avatar: 'A',
  },
  {
    id: 'u2',
    name: 'Priya Mehta',
    email: 'priya@vendorbridge.in',
    role: 'procurement_officer',
    password: 'demo123',
    avatar: 'P',
  },
  {
    id: 'u3',
    name: 'Rohit Agarwal',
    email: 'rohit@vendorbridge.in',
    role: 'manager',
    password: 'demo123',
    avatar: 'R',
  },
  {
    id: 'v1',
    name: 'Rajesh Kumar',
    email: 'rajesh@infrasupplies.in',
    role: 'vendor',
    password: 'demo123',
    avatar: 'R',
  },
]

/**
 * Authenticate user with email/password.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, token: string }>}
 */
export const authLogin = async ({ email, password }) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    )
    if (!user) throw new Error('Invalid email or password')
    const { password: _pw, ...safeUser } = user
    return { user: safeUser, token: `mock-jwt-token-${user.id}` }
  }
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

/**
 * Get current user profile.
 * @returns {Promise<object>}
 */
export const authGetProfile = async () => {
  if (USE_MOCK) {
    const token = localStorage.getItem('vb_token')
    const userId = token?.split('-').pop()
    const user = MOCK_USERS.find((u) => u.id === userId)
    if (!user) throw new Error('Not authenticated')
    const { password: _pw, ...safeUser } = user
    return safeUser
  }
  const { data } = await api.get('/auth/me')
  return data
}

/**
 * Create a new user (Admin only).
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const createUser = async (userData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const next = { ...userData, id: `u${Date.now()}`, avatar: userData.name.charAt(0).toUpperCase() }
    MOCK_USERS.push(next)
    return next
  }
  const { data } = await api.post('/auth/create-user', userData)
  return data
}
