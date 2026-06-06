import api from './api'
import { mockPOs } from '../mock/mockPOs'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @returns {Promise<Array>} */
export const getPurchaseOrders = async () => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockPOs
  }
  const { data } = await api.get('/purchase-orders')
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const getPOById = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const po = mockPOs.find((p) => p.id === id)
    if (!po) throw new Error('Purchase order not found')
    return po
  }
  const { data } = await api.get(`/purchase-orders/${id}`)
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const markPOAsPaid = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return { success: true, id, status: 'paid' }
  }
  const { data } = await api.post(`/purchase-orders/${id}/mark-paid`)
  return data
}
