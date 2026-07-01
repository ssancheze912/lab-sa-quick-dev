import axios, { type AxiosInstance } from 'axios'

/**
 * Singleton Axios instance for all API calls.
 * baseURL is read from Vite env var VITE_API_URL (see .env.development).
 * Content-Type and Accept are set on the instance defaults — no interceptor needed.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})
