/**
 * Unit tests — useContactosByCliente hook
 * Story 4.1 — View Associated Contacts in Client Detail (ATDD RED phase)
 *
 * These tests are in the RED phase — useContactosByCliente.ts does not exist yet.
 * Expected failure: "Cannot find module './useContactosByCliente'"
 *
 * Test IDs covered:
 *   TC-1: Returns contacts array when API responds 200
 *   TC-2: Returns empty array when API responds 200 with []
 *   TC-3: Returns isError = true when API responds 5xx
 *   TC-4: enabled: false when clienteId is undefined/null — no fetch fired
 *
 * TanStack Query key: ['contactos', { clienteId }]
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { useContactosByCliente } from './useContactosByCliente';
import { createContacto, createContactos, resetContactoCounter } from '../../../test/factories/contacto.factory';
import { createCliente } from '../../../test/factories/cliente.factory';

// ---------------------------------------------------------------------------
// MSW server for this unit test file
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: wrap useContactosByCliente in QueryClientProvider
// ---------------------------------------------------------------------------

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
// TC-4: Query disabled when clienteId is falsy (no fetch fired)
// ---------------------------------------------------------------------------

describe('useContactosByCliente — TC-4: disabled when clienteId is falsy', () => {
  it('should NOT fire a fetch when clienteId is undefined', () => {
    // GIVEN: No clienteId provided (undefined)
    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called with undefined
    const { result } = renderHook(() => useContactosByCliente(undefined), { wrapper });

    // THEN: Query is disabled — fetchStatus idle, not loading
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });

  it('should NOT fire a fetch when clienteId is null', () => {
    // GIVEN: clienteId is explicitly null (no client selected)
    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called with null
    const { result } = renderHook(() => useContactosByCliente(null), { wrapper });

    // THEN: Query is disabled — no network request made
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });

  it('should NOT fire a fetch when clienteId is an empty string', () => {
    // GIVEN: clienteId is empty string (falsy)
    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called with empty string
    const { result } = renderHook(() => useContactosByCliente(''), { wrapper });

    // THEN: Query is disabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-1: Returns contacts array when API responds 200
// ---------------------------------------------------------------------------

describe('useContactosByCliente — TC-1: returns contacts array on 200', () => {
  it('should return an array of contacts for a valid clienteId', async () => {
    // GIVEN: MSW returns 2 contacts for the given clienteId
    const cliente = createCliente();
    const contactos = createContactos(2, { clienteId: cliente.id });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json(contactos);
        }
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called with a valid clienteId
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: Data array is returned with 2 contacts
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data).toEqual(contactos);
  });

  it('should use GET /api/v1/contactos?clienteId=<id> as the request URL', async () => {
    // GIVEN: MSW intercepts the contactos request
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });
    let capturedUrl = '';

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([contacto]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: The request included clienteId as a query param
    expect(capturedUrl).toContain(`clienteId=${cliente.id}`);
  });

  it('should use canonical TanStack Query key ["contactos", { clienteId }]', async () => {
    // GIVEN: MSW returns contacts for the clienteId
    const cliente = createCliente();
    const contactos = createContactos(1, { clienteId: cliente.id });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json(contactos);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Two hooks with the same clienteId share the same QueryClient
    // (same key → same cache entry → only one network request)
    const wrapper = createWrapper();
    const { result: r1 } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });
    const { result: r2 } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    await waitFor(() => expect(r1.current.isSuccess).toBe(true));
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));

    // THEN: Both hooks return the same cached data (cache key deduplication)
    expect(r1.current.data).toEqual(r2.current.data);
  });
});

// ---------------------------------------------------------------------------
// TC-2: Returns empty array when API responds 200 with []
// ---------------------------------------------------------------------------

describe('useContactosByCliente — TC-2: returns empty array when no contacts', () => {
  it('should return an empty array when API responds 200 with []', async () => {
    // GIVEN: MSW returns empty array for the clienteId
    const cliente = createCliente();

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called for a client with no contacts
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: data is an empty array (not undefined)
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.data).toHaveLength(0);
  });

  it('should expose isSuccess true even when the contacts list is empty', async () => {
    // GIVEN: MSW returns empty array
    const cliente = createCliente();

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    const wrapper = createWrapper();

    // WHEN: hook loads with empty result
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: isSuccess true, isError false (empty array is a valid response)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-3: Returns isError = true when API responds 5xx
// ---------------------------------------------------------------------------

describe('useContactosByCliente — TC-3: exposes isError on 5xx response', () => {
  it('should expose isError true when API returns 500', async () => {
    // GIVEN: MSW returns 500 for the contacts endpoint
    const cliente = createCliente();

    server.use(
      http.get('/api/v1/contactos', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContactosByCliente is called and backend fails
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: isError becomes true (no retry in test config)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('should expose isError true when API returns 503', async () => {
    // GIVEN: MSW returns 503 (service unavailable — backend down)
    const cliente = createCliente();

    server.use(
      http.get('/api/v1/contactos', () =>
        new HttpResponse(null, { status: 503 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: hook fetches and backend is unavailable
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should expose refetch function to retry after error', async () => {
    // GIVEN: MSW returns contacts on first call
    const cliente = createCliente();
    const contactos = createContactos(1, { clienteId: cliente.id });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    const wrapper = createWrapper();

    // WHEN: hook loads successfully
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: refetch is a callable function (required by AC#4)
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should expose isLoading true while fetch is in-flight', async () => {
    // GIVEN: MSW delays response by 300ms
    const cliente = createCliente();

    server.use(
      http.get('/api/v1/contactos', async () => {
        await delay(300);
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: hook renders immediately
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: isLoading is true while fetch is in-flight (AC#5 — skeleton prerequisite)
    expect(result.current.isLoading).toBe(true);

    // THEN: After response arrives, isLoading becomes false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });
  });
});
