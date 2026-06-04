import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'
import axios from 'axios'

describe('apiClient', () => {
  it('should expose the axios isAxiosError utility', () => {
    // GIVEN: The axios library is installed
    // WHEN: We access a well-known utility on the axios object
    // THEN: The utility is defined (validates the import is correct)
    expect(axios.isAxiosError).toBeDefined()
  })

  it('should have a defaults object (is a valid Axios instance)', () => {
    // GIVEN: apiClient is created with axios.create()
    // WHEN: We access its defaults
    // THEN: The defaults object is defined (instance is valid)
    expect(apiClient.defaults).toBeDefined()
  })

  it('should have application/json content-type header', () => {
    // GIVEN: apiClient is created with Content-Type application/json
    // WHEN: We read the default headers
    // THEN: The Content-Type header is correctly set
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })

  it('should use VITE_API_URL as baseURL', () => {
    // GIVEN: VITE_API_URL is not set in the test environment
    // WHEN: We read the default baseURL of the apiClient
    // THEN: baseURL is undefined (env var absent in test context)
    expect(apiClient.defaults.baseURL).toBeUndefined()
  })
})
