/**
 * Edge-case unit tests — useContacto hook HTTP error boundary conditions
 * Story 3.2 — Contact Detail View — Automation Expansion
 *
 * Complements useContacto.test.ts (ATDD baseline).
 * Covers HTTP error edge cases NOT in ATDD (uses real @tanstack/react-query + MSW):
 *   - 401 Unauthorized sets isError = true
 *   - 403 Forbidden sets isError = true
 *   - 429 Too Many Requests sets isError = true
 *
 * These are boundary conditions: the ATDD tests cover 404 and 500 explicitly.
 * This file tests that the hook consistently propagates all non-2xx errors.
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useContacto } from './useContacto';
import { resetContactoCounter } from '../../../test/factories/contacto.factory';

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// Edge: 401, 403, 429 HTTP errors propagate as isError = true
// ---------------------------------------------------------------------------

describe('useContacto — non-standard HTTP error status codes', () => {
  it('[P1] should expose isError true when API returns 401 Unauthorized', async () => {
    // GIVEN: MSW returns 401 for the given contactoId
    const contactoId = '10000000-0000-0000-0000-000000000040';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called and API returns 401
    const { result } = renderHook(() => useContacto(contactoId), { wrapper });

    // THEN: isError becomes true (401 is not a success response)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: No data is returned for unauthorized responses
    expect(result.current.data).toBeUndefined();
  });

  it('[P1] should expose isError true when API returns 403 Forbidden', async () => {
    // GIVEN: MSW returns 403 for the given contactoId
    const contactoId = '10000000-0000-0000-0000-000000000043';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        new HttpResponse(null, { status: 403 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called and API returns 403
    const { result } = renderHook(() => useContacto(contactoId), { wrapper });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('[P2] should expose isError true when API returns 429 Too Many Requests', async () => {
    // GIVEN: MSW returns 429 (rate limit hit)
    const contactoId = '10000000-0000-0000-0000-000000000042';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        new HttpResponse(null, { status: 429 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called and API returns 429
    const { result } = renderHook(() => useContacto(contactoId), { wrapper });

    // THEN: isError becomes true (hook does not silently swallow 429)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('[P2] should return isSuccess false for all non-2xx status codes', async () => {
    // GIVEN: MSW returns 503 Service Unavailable
    const contactoId = '10000000-0000-0000-0000-000000000053';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        new HttpResponse(null, { status: 503 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called
    const { result } = renderHook(() => useContacto(contactoId), { wrapper });

    // THEN: isSuccess is false and isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
