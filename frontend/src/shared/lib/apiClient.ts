import axios from 'axios'

/**
 * Central Axios instance for every module. Reads the base URL from Vite env
 * (`VITE_API_URL`) and sends JSON by default. Additional interceptors (auth,
 * error handling) can be attached in later stories.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})
