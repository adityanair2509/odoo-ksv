import api from './api'

export const authLogin = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const authGetProfile = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

export const createUser = async (userData) => {
  const { data } = await api.post('/auth/create-user', userData)
  return data
}

export const authRegister = async (payload) => {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export const authVerifyRegistration = async ({ email, otp }) => {
  const { data } = await api.post('/auth/verify-registration', { email, otp })
  return data
}

export const authSendOtp = async ({ email, purpose = 'login' }) => {
  const { data } = await api.post('/auth/send-otp', { email, purpose })
  return data
}

export const authVerifyOtp = async ({ email, otp, purpose = 'login' }) => {
  const { data } = await api.post('/auth/verify-otp', { email, otp, purpose })
  return data
}

export const fetchPendingRegistrations = async () => {
  const { data } = await api.get('/auth/registrations')
  return data
}

export const fetchPendingRegistrationCount = async () => {
  const { data } = await api.get('/auth/registrations/pending-count')
  return data.count
}

export const approveRegistration = async (id) => {
  const { data } = await api.post(`/auth/registrations/${id}/approve`)
  return data
}

export const rejectRegistration = async (id, reason) => {
  const { data } = await api.post(`/auth/registrations/${id}/reject`, { reason })
  return data
}
