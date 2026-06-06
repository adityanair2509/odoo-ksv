import api from './api'

export const getApprovals = async () => {
  const { data } = await api.get('/approvals')
  return data
}

export const getApprovalById = async (id) => {
  const { data } = await api.get(`/approvals/${id}`)
  return data
}

export const approveRequest = async (id, payload) => {
  const { data } = await api.post(`/approvals/${id}/approve`, payload)
  return data
}

export const rejectRequest = async (id, payload) => {
  const { data } = await api.post(`/approvals/${id}/reject`, payload)
  return data
}
