import { describe, it, expect } from 'vitest'
import { queryClient } from '../shared/lib/queryClient'
import { apiClient } from '../shared/lib/apiClient'

describe('Story 1.1 — Project Initialization', () => {
  describe('AC#4 — QueryClient singleton', () => {
    it('exports a QueryClient instance', () => {
      expect(queryClient).toBeDefined()
    })

    it('has staleTime of 60 seconds', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.staleTime).toBe(60000)
    })
  })

  describe('AC#4 — Axios API client', () => {
    it('exports an axios instance', () => {
      expect(apiClient).toBeDefined()
      expect(typeof apiClient.get).toBe('function')
      expect(typeof apiClient.post).toBe('function')
    })

    it('has Content-Type application/json default header', () => {
      const headers = apiClient.defaults.headers
      expect(headers['Content-Type']).toBe('application/json')
    })
  })
})
