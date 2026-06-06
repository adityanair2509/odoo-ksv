import api from './api'
import { mockPOs } from '../mock/mockPOs'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @param {string} poId @returns {Promise<object>} */
export const getInvoiceByPO = async (poId) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const po = mockPOs.find((p) => p.id === poId)
    if (!po) throw new Error('Invoice not found')
    return po
  }
  const { data } = await api.get(`/invoices/po/${poId}`)
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const getInvoiceById = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const po = mockPOs.find((p) => p.id === id)
    if (!po) throw new Error('Invoice not found')
    return po
  }
  const { data } = await api.get(`/invoices/${id}`)
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const markInvoiceAsPaid = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return { success: true, id, status: 'paid' }
  }
  const { data } = await api.post(`/invoices/${id}/mark-paid`)
  return data
}
