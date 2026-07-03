import axios from 'axios'

/**
 * Central Axios instance for every module. Reads the base URL from Vite env
 * (`VITE_API_URL`) and sends JSON by default. Additional interceptors (auth,
 * error handling) can be attached in later stories.
 */
const baseURL = import.meta.env.VITE_API_URL
if (!baseURL) {
  throw new Error(
    'VITE_API_URL is not defined. Set it in `.env.development` or the deploy environment.',
  )
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})
