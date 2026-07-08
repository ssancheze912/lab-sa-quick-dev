import axios, { type AxiosInstance } from 'axios'

const baseURL = import.meta.env.VITE_API_URL as string | undefined

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)
