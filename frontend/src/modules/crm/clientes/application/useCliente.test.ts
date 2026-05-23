/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Unit tests for useCliente(id) hook (Vitest + MSW) — RED Phase
 * Tests fail until useCliente hook and clienteApiRepository.getById are implemented.
 *
 * Acceptance Criteria covered:
 *   AC2 — Hook fetches single client from GET /api/v1/clientes/:id
 *   AC4 — Hook exposes isError + refetch on network failure (never raw error.message)
 *   AC5 — Hook exposes isLoading flag for skeleton rendering
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// This module does not exist yet — tests will fail (RED phase)
import { useCliente } from './useCliente';

// ─── MSW Server Setup ────────────────────────────────────────────────────────

const CLIENTE_ID = '11111111-0000-0000-0000-000000000001';

const mockCliente = {
  id: CLIENTE_ID,
  nombre: 'Acme Colombia SA',
  nit: '900111222',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const server = setupServer(
  http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
    return HttpResponse.json(mockCliente);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — useCliente returns data from GET /api/v1/clientes/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — data fetching', () => {
  test('should return client data when GET /api/v1/clientes/:id responds with 200', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes/:id and returns a single client
    // WHEN: useCliente hook is rendered with a valid id
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Hook eventually returns the mock client
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.nombre).toBe('Acme Colombia SA');
    expect(result.current.data!.nit).toBe('900111222');
  });

  test('should set isLoading=true initially then isLoading=false after fetch completes', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes/:id
    // WHEN: useCliente hook is rendered
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Loading transitions from true to false
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
  });

  test('should return client with all required fields: id, nombre, nit, telefono, ciudad', async () => {
    // GIVEN: MSW returns a client with all DTO fields
    // WHEN: useCliente hook resolves
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: Client has all required domain fields
    const cliente = result.current.data!;
    expect(cliente).toHaveProperty('id');
    expect(cliente).toHaveProperty('nombre');
    expect(cliente).toHaveProperty('nit');
    expect(cliente).toHaveProperty('telefono');
    expect(cliente).toHaveProperty('ciudad');
    expect(cliente).toHaveProperty('createdAt');
    expect(cliente).toHaveProperty('updatedAt');
  });

  test('should use queryKey ["clientes", id] for TanStack Query cache', async () => {
    // GIVEN: A QueryClient with manually seeded cache using the canonical key
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(['clientes', CLIENTE_ID], mockCliente);

    const wrapper = function Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children);
    };

    // WHEN: useCliente hook is rendered
    const { result } = renderHook(() => useCliente(CLIENTE_ID), { wrapper });

    // THEN: Hook reads from ['clientes', id] cache immediately (no fetch needed)
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.nombre).toBe('Acme Colombia SA');
    expect(result.current.isLoading).toBe(false);
  });

  test('should not fetch when id is empty string (disabled query)', async () => {
    // GIVEN: useCliente is called with an empty id
    // WHEN: Hook renders
    const { result } = renderHook(() => useCliente(''), {
      wrapper: createWrapper(),
    });

    // THEN: Query is disabled — isLoading is false and data is undefined
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — useCliente exposes isError + refetch on network failure
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — error handling', () => {
  test('should set isError=true when GET /api/v1/clientes/:id returns a network error', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return HttpResponse.error();
      })
    );

    // WHEN: useCliente hook is rendered
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: isError flag is set to true (hook never exposes raw error.message)
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  test('should set isError=true when GET /api/v1/clientes/:id returns HTTP 404', async () => {
    // GIVEN: MSW returns a 404 not found response
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    // WHEN: useCliente hook is rendered
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: isError flag is true; data remains undefined
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  test('should set isError=true when GET /api/v1/clientes/:id returns HTTP 500', async () => {
    // GIVEN: MSW returns a 500 server error
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // WHEN: useCliente hook is rendered
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: isError flag is true; data remains undefined
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  test('should expose a refetch function for retry capability (AC4)', async () => {
    // GIVEN: useCliente hook rendered
    // WHEN: the hook is inspected for its API surface
    const { result } = renderHook(() => useCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: refetch is a callable function (needed by ErrorPanel's Reintentar button)
    expect(typeof result.current.refetch).toBe('function');
  });
});
