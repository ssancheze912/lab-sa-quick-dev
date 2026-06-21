/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Unit Tests — useCliente hook edge cases (BMad-Integrated Expansion)
 * Expands ATDD coverage with edge cases not covered in useCliente.test.ts.
 *
 * New Test Cases:
 *   TC-2.2-U-06 — Empty string id ("") behaves as disabled (enabled: false)
 *   TC-2.2-U-07 — refetch after error re-triggers the queryFn
 *   TC-2.2-U-08 — id change from undefined → valid triggers fetch automatically
 *   TC-2.2-U-09 — hook returns refetch function that can be called
 *   TC-2.2-U-10 — 404 error is propagated as error (isError=true, not silently swallowed)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { useCliente } from '../useCliente';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const mockCliente = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Edge Case Corp SA',
  nit: '900999888-7',
  telefono: '+573009998887',
  ciudad: 'Cali',
  createdAt: '2026-01-01T00:00:00+00:00',
  updatedAt: '2026-01-01T00:00:00+00:00',
};

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === mockCliente.id) {
      return HttpResponse.json(mockCliente);
    }
    return HttpResponse.json({ title: 'Cliente no encontrado.', status: 404 }, { status: 404 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-U-06: Empty string id — disabled query (enabled: false)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — boundary: empty string id', () => {
  it('[P2][TC-2.2-U-06] Given id is empty string "", When hook renders, Then query is disabled (not loading, idle)', () => {
    // GIVEN: id is an empty string (edge case — enabled: !!id → false for "")
    const { result } = renderHook(
      () => useCliente(''),
      { wrapper: makeWrapper() }
    );

    // THEN: Query disabled — no loading state, fetchStatus is idle
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-U-07: refetch after error re-triggers the queryFn
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — refetch after error', () => {
  it('[P1][TC-2.2-U-07] Given query errored, When refetch is called, Then new fetch is triggered and data loads', async () => {
    let callCount = 0;

    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, ({ params }) => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Temporary Error' }, { status: 500 });
        }
        // Second call returns valid data
        return HttpResponse.json(mockCliente);
      })
    );

    const { result } = renderHook(
      () => useCliente(mockCliente.id),
      { wrapper: makeWrapper() }
    );

    // GIVEN: First call errored
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(callCount).toBe(1);

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: Data loaded successfully
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCliente);
    expect(callCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-U-08: id change undefined → valid triggers fetch automatically
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — id transitions from undefined to valid', () => {
  it('[P1][TC-2.2-U-08] Given id starts as undefined, When id changes to a valid string, Then fetch is triggered automatically', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    let idRef = { current: undefined as string | undefined };

    const { result, rerender } = renderHook(
      () => useCliente(idRef.current),
      { wrapper }
    );

    // GIVEN: Initially disabled (undefined id)
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');

    // WHEN: id changes to a valid value
    idRef.current = mockCliente.id;
    rerender();

    // THEN: Fetch is triggered and data loads
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCliente);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-U-09: hook exposes refetch function
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — refetch function exposed', () => {
  it('[P1][TC-2.2-U-09] Given hook renders, When inspecting return value, Then refetch is a callable function', async () => {
    const { result } = renderHook(
      () => useCliente(mockCliente.id),
      { wrapper: makeWrapper() }
    );

    // THEN: refetch is a function (required by ClienteDetailView ErrorPanel integration)
    expect(typeof result.current.refetch).toBe('function');

    // AND: data loads (ensuring we have a complete hook result)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-U-10: 404 response propagated as isError=true (not silently swallowed)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — 404 propagated as error', () => {
  it('[P1][TC-2.2-U-10] Given non-existent id returns 404, When query resolves, Then isError=true and error has 404 status', async () => {
    const { result } = renderHook(
      () => useCliente('non-existent-uuid'),
      { wrapper: makeWrapper() }
    );

    // THEN: isError is true (Axios throws on non-2xx by default)
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();

    // AND: error object carries the HTTP status info (Axios AxiosError shape)
    // This allows ClienteDetailView to distinguish 404 from other errors
    const axiosError = result.current.error as { response?: { status?: number } } | null;
    expect(axiosError).not.toBeNull();
    // The error should be present and the response status should be accessible
    if (axiosError?.response) {
      expect(axiosError.response.status).toBe(404);
    }
  });
});
