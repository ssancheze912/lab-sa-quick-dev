import axios from 'axios'

/**
 * Shared Axios instance. baseURL is read from env var VITE_API_URL
 * (e.g. http://localhost:5000 in development).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Forward error so callers (TanStack Query mutations) can handle it.
    return Promise.reject(error)
  },
)
