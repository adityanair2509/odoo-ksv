import api from './api'

export const getSpendingByCategory = async () => {
  const { data } = await api.get('/analytics/spending-by-category')
  return data
}

export const getMonthlySpend = async (months = 6) => {
  const { data } = await api.get(`/analytics/monthly-spend?months=${months}`)
  return data
}

export const getSpendSummary = async () => {
  const { data } = await api.get('/analytics/spend-summary')
  return data
}

export const getMonthlyPOVolume = async (months = 12) => {
  const { data } = await api.get(`/analytics/monthly-po-volume?months=${months}`)
  return data
}

export const getVendorPerformance = async () => {
  const { data } = await api.get('/analytics/vendor-performance')
  return data
}

export const getPipelineSummary = async () => {
  const { data } = await api.get('/analytics/pipeline-summary')
  return data
}

export const getBudgetUtilisation = async () => {
  const { data } = await api.get('/analytics/budget-utilisation')
  return data
}

export const getSpendInsight = async () => {
  const { data } = await api.get('/analytics/spend-insight')
  return data
}

export const getVendorDashboardStats = async () => {
  const { data } = await api.get('/analytics/vendor-dashboard')
  return data
}
