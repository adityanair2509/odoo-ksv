import api from './api'

export const getInvoices = async () => {
  const { data } = await api.get('/invoices')
  return data
}

export const getInvoiceByPO = async (poId) => {
  const { data } = await api.get(`/invoices/po/${poId}`)
  return data
}

export const getInvoiceById = async (id) => {
  const { data } = await api.get(`/invoices/${id}`)
  return data
}

export const getInvoiceDetail = async (id) => {
  const { data } = await api.get(`/invoices/${id}/detail`)
  return data
}

export const openInvoicePdf = async (id) => {
  const { data } = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
  window.open(url, '_blank')
}

export const emailInvoice = async (id, recipients = []) => {
  const { data } = await api.post(`/invoices/${id}/email`, { recipients })
  return data
}

export const markInvoiceAsPaid = async (id) => {
  const { data } = await api.post(`/invoices/${id}/mark-paid`)
  return data
}
