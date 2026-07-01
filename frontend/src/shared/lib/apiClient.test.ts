import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Story 1.1 — Unit coverage for the Axios apiClient singleton.
 *
 * Guards against regressions on:
 *   - baseURL wiring to VITE_API_URL (Story 1.1 Task 1 subtask)
 *   - JSON Content-Type / Accept headers
 *   - Request interceptor re-asserting Content-Type
 *   - Response interceptor propagating errors (must NOT swallow)
 */

// Set the env var BEFORE the module under test is imported so that
// axios.create(...) picks it up on module evaluation.
vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

const { apiClient } = await import('./apiClient')

describe('apiClient (Story 1.1 shared infrastructure)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('[P2] should read baseURL from VITE_API_URL env variable', () => {
    // GIVEN: VITE_API_URL is stubbed to http://localhost:5000
    // WHEN: reading apiClient's configured baseURL
    // THEN: it matches the env value (Story 1.1 CORS contract 5173 → 5000)
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5000')
  })

  it('[P2] should default to JSON Content-Type in defaults.headers', () => {
    // GIVEN: apiClient
    // WHEN: reading its default headers
    const headers = apiClient.defaults.headers as unknown as Record<string, unknown>

    // THEN: Content-Type is application/json (either at root or in common)
    const common = (headers.common ?? {}) as Record<string, unknown>
    const contentType = (headers['Content-Type'] ?? common['Content-Type']) as
      | string
      | undefined
    expect(contentType).toBe('application/json')
  })

  it('[P2] should default to JSON Accept header', () => {
    // GIVEN: apiClient
    // WHEN: reading defaults
    const headers = apiClient.defaults.headers as unknown as Record<string, unknown>
    const common = (headers.common ?? {}) as Record<string, unknown>
    const accept = (headers['Accept'] ?? common['Accept']) as string | undefined

    // THEN: Accept is application/json
    expect(accept).toBe('application/json')
  })

  it('[P2] should register at least one request interceptor', () => {
    // GIVEN: apiClient
    // WHEN: introspecting its interceptor handlers
    // (Axios stores them in the internal `.handlers` array on each InterceptorManager)
    const interceptors = apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: unknown; rejected: unknown } | null>
    }

    // THEN: at least one non-null handler exists
    const active = interceptors.handlers.filter((h) => h !== null)
    expect(active.length).toBeGreaterThanOrEqual(1)
  })

  it('[P2] should register a response interceptor with a rejection handler', () => {
    // GIVEN: apiClient
    // WHEN: introspecting response interceptors
    const interceptors = apiClient.interceptors.response as unknown as {
      handlers: Array<{ fulfilled: unknown; rejected: unknown } | null>
    }

    // THEN: a handler exists AND it has a rejection callback wired
    // (the rejection callback is what re-throws errors instead of swallowing them)
    const active = interceptors.handlers.filter((h): h is { fulfilled: unknown; rejected: unknown } => h !== null)
    expect(active.length).toBeGreaterThanOrEqual(1)
    expect(active[0].rejected).toBeTypeOf('function')
  })

  it('[P3] should preserve rejection semantics — response interceptor must re-throw errors', async () => {
    // GIVEN: the response interceptor's rejection callback
    const interceptors = apiClient.interceptors.response as unknown as {
      handlers: Array<{ fulfilled: unknown; rejected: (err: unknown) => unknown } | null>
    }
    const rejectionHandler = interceptors.handlers.filter(
      (h): h is { fulfilled: unknown; rejected: (err: unknown) => unknown } => h !== null,
    )[0].rejected

    // WHEN: an error object is passed through it
    const injected = new Error('network fail')
    let caught: unknown
    try {
      await rejectionHandler(injected)
    } catch (e) {
      caught = e
    }

    // THEN: the same error is re-thrown (not swallowed)
    expect(caught).toBe(injected)
  })
})
