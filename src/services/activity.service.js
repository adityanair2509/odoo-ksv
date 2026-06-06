import api from './api'
import { mockActivity } from '../mock/mockActivity'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** @returns {Promise<Array>} */
export const getActivities = async () => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return mockActivity
  }
  const { data } = await api.get('/activities')
  return data
}
