import axios from 'axios'

/**
 * Shared Axios instance. baseURL is read from env var VITE_API_URL
 * (e.g. http://localhost:5000 in development).
 *
 * A 15s timeout prevents the UI from hanging on stalled connections.
 * Real error handling (Problem Details RFC 7807 parsing) is added in
 * later stories where domain calls exist; this module intentionally
 * stays thin to avoid coupling to domain types.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})
