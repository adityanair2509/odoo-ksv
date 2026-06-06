import api from './api'
import { mockVendors } from '../mock/mockVendors'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @returns {Promise<Array>} */
export const getVendors = async () => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockVendors
  }
  const { data } = await api.get('/vendors')
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const getVendorById = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const vendor = mockVendors.find((v) => v.id === id)
    if (!vendor) throw new Error('Vendor not found')
    return vendor
  }
  const { data } = await api.get(`/vendors/${id}`)
  return data
}

/** @param {object} vendorData @returns {Promise<object>} */
export const createVendor = async (vendorData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { ...vendorData, id: `v${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() }
  }
  const { data } = await api.post('/vendors', vendorData)
  return data
}

/** @param {string} id @param {object} updates @returns {Promise<object>} */
export const updateVendor = async (id, updates) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return { ...mockVendors.find((v) => v.id === id), ...updates }
  }
  const { data } = await api.put(`/vendors/${id}`, updates)
  return data
}

/**
 * Mock GSTIN verification (simulates GST portal lookup).
 * @param {string} gstin
 * @returns {Promise<{ verified: boolean, companyName?: string, state?: string, status?: string }>}
 */
export const verifyGSTIN = async (gstin) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    const mockResults = {
      '27AACCI1234A1Z5': { verified: true, companyName: 'Infra Supplies Pvt Ltd', state: 'Maharashtra', status: 'Active' },
      '29AABCT5432B1Z3': { verified: true, companyName: 'TechSoft Solutions LLP', state: 'Karnataka', status: 'Active' },
      '07AACQL9876C1Z1': { verified: true, companyName: 'QuickMove Logistics', state: 'Delhi', status: 'Active' },
      '33AABCF7654D1Z8': { verified: true, companyName: 'FurnishPro India', state: 'Tamil Nadu', status: 'Active' },
      '09AABCD1234E1Z2': { verified: false, companyName: null, state: null, status: 'Inactive' },
    }
    return mockResults[gstin] || { verified: false }
  }
  const { data } = await api.post('/vendors/verify-gstin', { gstin })
  return data
}
