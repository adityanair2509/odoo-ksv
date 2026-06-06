import api from './api'

export const getRFQs = async () => {
  const { data } = await api.get('/rfqs')
  return data
}

export const getRFQById = async (id) => {
  const { data } = await api.get(`/rfqs/${id}`)
  return data
}

export const createRFQ = async (rfqData) => {
  const { data } = await api.post('/rfqs', rfqData)
  return data
}

export const sendRFQ = async (id) => {
  const { data } = await api.post(`/rfqs/${id}/send`)
  return data
}
