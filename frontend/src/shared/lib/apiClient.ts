import axios from 'axios'

/**
 * Shared Axios instance for the frontend.
 *
 * Response/request interceptors (auth refresh, 401 handling, error
 * normalization) will be added in later stories once auth and the domain
 * error contract are in place. Keep this file minimal — an empty
 * pass-through interceptor is intentionally NOT registered.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})
