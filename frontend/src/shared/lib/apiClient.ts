import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Real error normalization will be added in Story 1.3 (Problem Details RFC 7807
// parsing). Until then we keep axios's default behavior (no no-op interceptor).
