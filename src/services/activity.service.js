import api from './api'

export const getActivities = async () => {
  const { data } = await api.get('/activities')
  return data
}
