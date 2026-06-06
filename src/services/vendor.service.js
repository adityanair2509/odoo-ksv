import api from './api'

export const getVendors = async () => {
  const { data } = await api.get('/vendors')
  return data
}

export const getVendorById = async (id) => {
  const { data } = await api.get(`/vendors/${id}`)
  return data
}

export const createVendor = async (vendorData) => {
  const { data } = await api.post('/vendors', vendorData)
  return data
}

export const updateVendor = async (id, updates) => {
  const { data } = await api.put(`/vendors/${id}`, updates)
  return data
}

export const verifyGSTIN = async (gstin) => {
  const { data } = await api.post('/vendors/verify-gstin', { gstin })
  return data
}
