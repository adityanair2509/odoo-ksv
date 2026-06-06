import api from './api'
import { mockRFQs } from '../mock/mockRFQs'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @returns {Promise<Array>} */
export const getRFQs = async () => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockRFQs
  }
  const { data } = await api.get('/rfqs')
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const getRFQById = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const rfq = mockRFQs.find((r) => r.id === id)
    if (!rfq) throw new Error('RFQ not found')
    return rfq
  }
  const { data } = await api.get(`/rfqs/${id}`)
  return data
}

/** @param {object} rfqData @returns {Promise<object>} */
export const createRFQ = async (rfqData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    return { ...rfqData, id: `rfq${Date.now()}`, status: 'draft', createdAt: new Date().toISOString() }
  }
  const { data } = await api.post('/rfqs', rfqData)
  return data
}

/** @param {string} id @returns {Promise<void>} */
export const sendRFQ = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return { success: true }
  }
  const { data } = await api.post(`/rfqs/${id}/send`)
  return data
}
