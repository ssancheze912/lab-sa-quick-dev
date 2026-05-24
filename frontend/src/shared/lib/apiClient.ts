import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Auth token injection interceptor — expanded in subsequent stories when auth is available
apiClient.interceptors.request.use((config) => config)

// Response error normalization interceptor — expanded in subsequent stories
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
)
