import api from './api'
import { mockQuotations } from '../mock/mockQuotations'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @param {string} rfqId @returns {Promise<Array>} */
export const getQuotationsByRFQ = async (rfqId) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockQuotations.filter((q) => q.rfqId === rfqId)
  }
  const { data } = await api.get(`/quotations/rfqs/${rfqId}/quotations`)
  return data
}

/** @param {object} quotationData @returns {Promise<object>} */
export const submitQuotation = async (quotationData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { ...quotationData, id: `q${Date.now()}`, status: 'submitted', submittedAt: new Date().toISOString() }
  }
  const { data } = await api.post('/quotations', quotationData)
  return data
}

/** @param {string} quotationId @returns {Promise<object>} */
export const selectQuotation = async (quotationId) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return { success: true, quotationId }
  }
  const { data } = await api.post(`/quotations/${quotationId}/select`)
  return data
}

/** @returns {Promise<Array>} */
export const getQuotations = async () => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockQuotations
  }
  const { data } = await api.get('/quotations')
  return data
}

