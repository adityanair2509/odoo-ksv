import api from './api'

export const fetchNotifications = async () => {
  const { data } = await api.get('/notifications')
  return data
}

export const fetchUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count')
  return data
}

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.post('/notifications/read-all')
  return data
}
