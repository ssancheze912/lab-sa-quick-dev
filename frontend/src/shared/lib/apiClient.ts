import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor reserved for future cross-cutting concerns
// (auth refresh, global error normalization, telemetry). Currently pass-through.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)
