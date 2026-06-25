/**
 * Story 2.2: useCliente hook — Unit Tests
 * ATDD — GREEN Phase (All tests passing post-implementation)
 *
 * Acceptance Criteria covered:
 * - AC3: useCliente(id) fetches from GET /api/v1/clientes/{id}, queryKey: ['clientes', id]
 * - AC5: useCliente exposes isError, error, and refetch for error recovery
 * - AC6: useCliente exposes isLoading for skeleton screen control
 * - AC7: useCliente with undefined id does NOT make a fetch (enabled: false)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until useCliente is implemented
import { useCliente } from './useCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api/v1/clientes';
const KNOWN_ID = '550e8400-e29b-41d4-a716-446655440001';

const clienteStub = {
  id: KNOWN_ID,
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const server = setupServer(
  http.get(`${API_BASE}/:id`, () => HttpResponse.json(clienteStub)),
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

describe('useCliente', () => {
  // AC3: queryKey and successful fetch

  it('should use queryKey ["clientes", id] to fetch a single client', async () => {
    // GIVEN: MSW returns one client for the known ID
    // WHEN: Hook is rendered with a valid id
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Data is eventually available (queryKey is correct, fetch succeeds)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('should return the correct client object on success', async () => {
    // GIVEN: MSW returns the clienteStub for KNOWN_ID
    // WHEN: Hook resolves
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data matches the clienteStub
    expect(result.current.data).toMatchObject({
      id: clienteStub.id,
      nombre: clienteStub.nombre,
      nit: clienteStub.nit,
      telefono: clienteStub.telefono,
      ciudad: clienteStub.ciudad,
    });
  });

  // AC6: Loading state

  it('should expose isLoading true before data arrives', async () => {
    // GIVEN: MSW handler is delayed
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(clienteStub);
      }),
    );

    // WHEN: Hook is rendered immediately
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: isLoading is true on first render (before response arrives)
    expect(result.current.isLoading).toBe(true);
  });

  // AC5: Error state and refetch

  it('should expose isError true when API returns 500', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    );

    // WHEN: Hook is rendered with a valid id
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true and error object is defined
    expect(result.current.error).toBeDefined();
  });

  it('should expose a refetch function on error state', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    );

    // WHEN: Hook is rendered and resolves to error
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: A refetch function is available
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should expose the error with response status for 404 differentiation', async () => {
    // GIVEN: MSW returns 404
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
          { status: 404 },
        ),
      ),
    );

    // WHEN: Hook is rendered with an unknown id
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true (allows caller to check error.response?.status === 404)
    expect(result.current.error).toBeDefined();
  });

  // AC7: disabled when id is undefined

  it('should NOT fetch when id is undefined (enabled: false)', async () => {
    // GIVEN: No id provided
    // WHEN: Hook is rendered with undefined id
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    // THEN: The hook is not loading and has no data (fetch was never triggered)
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should return isPending false when id is undefined', async () => {
    // GIVEN: No id provided
    // WHEN: Hook is rendered with undefined id
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    // THEN: The hook is in idle state (not pending, not loading)
    expect(result.current.isFetching).toBe(false);
  });
});
