import api from './api'

export const getQuotationsByRFQ = async (rfqId) => {
  const { data } = await api.get(`/quotations/rfqs/${rfqId}/quotations`)
  return data
}

export const submitQuotation = async (quotationData) => {
  const { data } = await api.post('/quotations', quotationData)
  return data
}

export const selectQuotation = async (quotationId) => {
  const { data } = await api.post(`/quotations/${quotationId}/select`)
  return data
}

export const getQuotations = async () => {
  const { data } = await api.get('/quotations')
  return data
}
