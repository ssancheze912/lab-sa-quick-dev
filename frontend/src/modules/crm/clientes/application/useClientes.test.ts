/**
 * Story 2.1: useClientes hook — Unit Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: useClientes returns the list of clients (data from API)
 * - AC4: useClientes exposes an error state and a refetch function
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until implemented
import { useClientes } from './useClientes';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/clientes';

const clienteStub = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([clienteStub])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper wrapper ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useClientes', () => {
  it('should use queryKey ["clientes"]', async () => {
    // GIVEN: MSW returns one client
    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: Data is eventually available (queryKey is correct)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('should return data array with client objects on success', async () => {
    // GIVEN: MSW returns one client stub
    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data is an array containing the stub
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toMatchObject({
      id: clienteStub.id,
      nombre: clienteStub.nombre,
      nit: clienteStub.nit,
    });
  });

  it('should expose isLoading true before data arrives', async () => {
    // GIVEN: MSW handler is slow (will not resolve before assertion)
    server.use(
      http.get(API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json([]);
      }),
    );

    // WHEN: Hook is rendered immediately
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: isLoading is true on first render
    expect(result.current.isLoading).toBe(true);
  });

  it('should expose isError true and error object when API fails', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true and error is set
    expect(result.current.error).toBeDefined();
  });

  it('should expose a refetch function on error state', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Hook is rendered and resolves to error
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: A refetch function is available
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return empty array when API returns empty array', async () => {
    // GIVEN: MSW returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data is an empty array
    expect(result.current.data).toEqual([]);
  });
});
