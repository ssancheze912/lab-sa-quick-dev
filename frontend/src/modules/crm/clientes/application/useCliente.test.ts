/**
 * Story 2.2: Client Detail View — useCliente hook unit tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC3 — Direct URL access fetches GET /api/v1/clientes/{id} and populates detail
 *   AC5 — Skeleton loading state while fetch is in flight (enabled: !!id)
 *   AC6 — Error panel with retry on 5xx
 *
 * Test status: RED — tests will fail until useCliente.ts is implemented.
 * Framework: Vitest + @tanstack/react-query + MSW
 *
 * Given-When-Then structure follows ATDD conventions.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';

// Module under test — does NOT exist yet (RED phase)
// @ts-expect-error module does not exist until implementation
import { useCliente } from './useCliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_ID = '11111111-1111-4111-8111-111111111111';

const mockCliente = {
  id: KNOWN_ID,
  nombre: 'Acme Colombia SAS',
  nit: '900123456-7',
  telefono: '+57 601 234 5678',
  ciudad: 'Bogotá',
  createdAt: '2026-01-10T10:00:00Z',
  updatedAt: '2026-01-10T10:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — intercept GET /api/v1/clientes/:id
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === KNOWN_ID) {
      return HttpResponse.json(mockCliente);
    }
    return HttpResponse.json(
      {
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Not Found',
        status: 404,
        detail: `Cliente con id '${params.id}' no encontrado.`,
      },
      { status: 404 }
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test wrapper
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Hook fetches correct data when id is provided
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — AC3: fetches client data by id', () => {
  it('should return data from mocked GET /api/v1/clientes/:id', async () => {
    // GIVEN: A known client UUID is provided
    // WHEN: The hook is rendered with that id
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Hook eventually returns the client data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.nombre).toBe('Acme Colombia SAS');
    expect(result.current.data?.nit).toBe('900123456-7');
    expect(result.current.data?.telefono).toBe('+57 601 234 5678');
    expect(result.current.data?.ciudad).toBe('Bogotá');
  });

  it('should set isError to true when GET /api/v1/clientes/:id returns 500', async () => {
    // GIVEN: The API returns a 500 error
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: The hook is rendered with a valid id
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: isError is true and data is undefined
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Hook does NOT fire when id is undefined (enabled: false guard)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — AC5: disabled when id is undefined', () => {
  it('should NOT issue a fetch when id is undefined', async () => {
    // GIVEN: No clienteId is available (user on /clientes without selection)
    // WHEN: The hook is rendered with undefined
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    // THEN: isLoading stays false and no request is made
    // (MSW onUnhandledRequest: 'error' would throw if a request were issued)
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should NOT issue a fetch when id is an empty string', async () => {
    // GIVEN: id is an empty string (edge case from route param)
    // WHEN: The hook is rendered with ""
    const { result } = renderHook(() => useCliente(''), {
      wrapper: createWrapper(),
    });

    // THEN: No request is made and hook stays idle
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Hook exposes refetch for retry on error
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — AC6: exposes refetch for retry', () => {
  it('should expose a refetch function', async () => {
    // GIVEN: A known client UUID is provided
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // WHEN: Hook resolves
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });
});
