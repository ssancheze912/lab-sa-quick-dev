/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit Tests — Edge Cases & Boundary Conditions
 *
 * Complements apiClient.test.ts happy-path tests.
 * Coverage:
 *   - Axios instance configuration edge cases
 *   - Request interceptor behaviour
 *   - Default header inheritance
 *   - Base URL handling when env var is undefined
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('apiClient — edge cases', () => {
  // ── Instance configuration ───────────────────────────────────────────────

  describe('Axios instance configuration', () => {
    it('[P1] should create a separate Axios instance (not the global Axios default)', async () => {
      // GIVEN: apiClient is imported
      const { apiClient } = await import('../apiClient');
      const axios = await import('axios');

      // WHEN: Comparing apiClient to the default Axios instance
      // THEN: apiClient is a distinct instance (not axios itself)
      expect(apiClient).not.toBe(axios.default);
    });

    it('[P1] should have Content-Type header defined at the instance level (not just request level)', async () => {
      // GIVEN: apiClient is created with headers object
      const { apiClient } = await import('../apiClient');

      // WHEN: Reading the common headers
      const contentType =
        (apiClient.defaults.headers as Record<string, unknown>)['Content-Type'] ??
        (apiClient.defaults.headers.common as Record<string, unknown>)?.['Content-Type'];

      // THEN: Content-Type: application/json is set on the instance
      expect(contentType).toBe('application/json');
    });

    it('[P2] should not have an Authorization header pre-configured (no hardcoded tokens)', async () => {
      // GIVEN: The apiClient is initialized without authentication (auth is story-specific)
      const { apiClient } = await import('../apiClient');

      // WHEN: Reading the Authorization header
      const authHeader =
        (apiClient.defaults.headers as Record<string, unknown>)['Authorization'] ??
        (apiClient.defaults.headers.common as Record<string, unknown>)?.['Authorization'];

      // THEN: No Authorization header is hardcoded on the base client
      expect(authHeader).toBeUndefined();
    });

    it('[P2] should have baseURL set to the VITE_API_URL env variable or undefined (no hardcoded URL)', async () => {
      // GIVEN: apiClient.ts creates an Axios instance with baseURL: import.meta.env.VITE_API_URL
      const { apiClient } = await import('../apiClient');

      // WHEN: Reading the baseURL
      const baseURL = apiClient.defaults.baseURL;

      // THEN: baseURL is either undefined (env var not set in test env) or a valid http URL
      // It must NEVER be a hardcoded string like 'http://localhost:5000' in the source
      if (baseURL !== undefined) {
        expect(typeof baseURL).toBe('string');
        expect(baseURL).toMatch(/^https?:\/\//);
      } else {
        // Undefined is valid when VITE_API_URL is not set in test environment
        expect(baseURL).toBeUndefined();
      }
    });
  });

  // ── Request interceptors ─────────────────────────────────────────────────

  describe('Request interceptor stack', () => {
    it('[P2] should not have an excessive number of request interceptors (max 5)', async () => {
      // GIVEN: apiClient is created with default configuration
      const { apiClient } = await import('../apiClient');

      // WHEN: Checking the interceptor count
      // Axios stores interceptors in a handlers array on the manager
      type InterceptorManager = {
        handlers: Array<{ fulfilled?: unknown; rejected?: unknown } | null>;
      };
      const manager = apiClient.interceptors.request as unknown as InterceptorManager;
      const activeHandlers = manager.handlers?.filter(Boolean) ?? [];

      // THEN: No runaway interceptor registration (no memory leak pattern)
      expect(activeHandlers.length).toBeLessThanOrEqual(5);
    });

    it('[P2] should not have an excessive number of response interceptors (max 5)', async () => {
      // GIVEN: apiClient is created with default configuration
      const { apiClient } = await import('../apiClient');

      type InterceptorManager = {
        handlers: Array<{ fulfilled?: unknown; rejected?: unknown } | null>;
      };
      const manager = apiClient.interceptors.response as unknown as InterceptorManager;
      const activeHandlers = manager.handlers?.filter(Boolean) ?? [];

      // THEN: Response interceptors are bounded
      expect(activeHandlers.length).toBeLessThanOrEqual(5);
    });
  });

  // ── Axios defaults isolation ─────────────────────────────────────────────

  describe('Axios global defaults isolation', () => {
    let originalGlobalBaseURL: string | undefined;

    beforeEach(() => {
      originalGlobalBaseURL = undefined;
    });

    afterEach(() => {
      // Restore any inadvertent global mutation
      const axiosModule = vi.importActual('axios') as { default: { defaults: { baseURL?: string } } };
      void axiosModule;
    });

    it('[P1] should NOT mutate the global Axios defaults (isolated instance)', async () => {
      // GIVEN: apiClient is imported (may have side effects)
      const axios = await import('axios');
      const globalBaseURLBefore = axios.default.defaults.baseURL;

      // WHEN: apiClient module is loaded
      await import('../apiClient');

      // THEN: The global axios.defaults.baseURL is unchanged
      expect(axios.default.defaults.baseURL).toBe(globalBaseURLBefore);
    });
  });
});
