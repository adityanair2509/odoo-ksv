import api from './api'
import { mockApprovals } from '../mock/mockApprovals'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @returns {Promise<Array>} */
export const getApprovals = async () => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockApprovals
  }
  const { data } = await api.get('/approvals')
  return data
}

/** @param {string} id @returns {Promise<object>} */
export const getApprovalById = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    const approval = mockApprovals.find((a) => a.id === id)
    if (!approval) throw new Error('Approval not found')
    return approval
  }
  const { data } = await api.get(`/approvals/${id}`)
  return data
}

/** @param {string} id @param {{ remarks: string }} payload @returns {Promise<object>} */
export const approveRequest = async (id, payload) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true, id, action: 'approved', ...payload }
  }
  const { data } = await api.post(`/approvals/${id}/approve`, payload)
  return data
}

/** @param {string} id @param {{ remarks: string }} payload @returns {Promise<object>} */
export const rejectRequest = async (id, payload) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true, id, action: 'rejected', ...payload }
  }
  const { data } = await api.post(`/approvals/${id}/reject`, payload)
  return data
}
