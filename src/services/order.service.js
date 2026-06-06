import api from './api'

export const getPurchaseOrders = async () => {
  const { data } = await api.get('/purchase-orders')
  return data
}

export const getPOById = async (id) => {
  const { data } = await api.get(`/purchase-orders/${id}`)
  return data
}

export const markPOAsPaid = async (id) => {
  const { data } = await api.post(`/purchase-orders/${id}/mark-paid`)
  return data
}
