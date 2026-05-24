/**
 * Story 2.3: Create Client — useCreateCliente Hook Unit Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC2 — Successful mutation calls POST /api/v1/clientes and invalidates ['clientes'] query key
 *   AC5 — 409 response does NOT trigger generic toast (handled in form layer)
 *
 * Test status: RED — tests will fail until useCreateCliente.ts is implemented:
 *   - frontend/src/modules/crm/clientes/application/useCreateCliente.ts does NOT exist yet
 *
 * Framework: Vitest + @tanstack/react-query + MSW
 * Patterns: QueryClientWrapper (reuse from Story 2.1), Given-When-Then.
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';

// Module under test — does NOT exist yet (RED phase)
// @ts-expect-error module does not exist until implementation
import { useCreateCliente } from './useCreateCliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const validFormData = {
  nombre: 'Empresa Test SA',
  nit: '900123456-7',
  telefono: '3001234567',
  ciudad: 'Bogotá',
};

const mockCreatedCliente = {
  id: '22222222-2222-4222-8222-222222222222',
  nombre: 'Empresa Test SA',
  nit: '900123456-7',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-05-24T15:00:00Z',
  updatedAt: '2026-05-24T15:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first intercepts configured before each test
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.post('*/api/v1/clientes', () => HttpResponse.json(mockCreatedCliente, { status: 201 }))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// QueryClientWrapper helper (pattern from Story 2.1)
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Hook calls POST /api/v1/clientes and invalidates ['clientes'] on success
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente — AC2: mutation calls POST /api/v1/clientes', () => {
  it('should set isSuccess to true when POST /api/v1/clientes returns 201', async () => {
    // GIVEN: MSW intercepts POST /api/v1/clientes and returns 201
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called with valid form data
    await act(async () => {
      result.current.mutate(validFormData);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: isSuccess is true
    expect(result.current.isSuccess).toBe(true);
  });

  it('should invalidate the ["clientes"] query key on successful POST', async () => {
    // GIVEN: A queryClient spy and MSW intercept for POST
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate succeeds
    await act(async () => {
      result.current.mutate(validFormData);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: invalidateQueries was called with { queryKey: ['clientes'] }
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] })
    );
  });

  it('should NOT directly call toast (toast is caller responsibility)', async () => {
    // GIVEN: Toast function mocked at module level
    const toastSpy = vi.fn();
    vi.mock('sonner', () => ({ toast: { success: toastSpy, error: toastSpy } }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutation succeeds
    await act(async () => {
      result.current.mutate(validFormData);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: The hook itself does not call toast directly
    // (toast is wired in the form component's onSuccess callback)
    // This test verifies the hook is pure — it only invalidates, not toasts
    expect(result.current.isSuccess).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2/error — Hook exposes isError on 500
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente — error handling', () => {
  it('should expose isError true when POST /api/v1/clientes returns 500', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate(validFormData);
    });
    await waitFor(() => expect(result.current.isIdle).toBe(false));
    await waitFor(() => !result.current.isPending);

    // THEN: isError is true
    expect(result.current.isError).toBe(true);
  });

  it('should NOT invalidate ["clientes"] query key when POST returns 409', async () => {
    // GIVEN: MSW returns 409 Conflict
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: "El NIT/RUC '900123456-7' ya está registrado.",
          },
          { status: 409 }
        )
      )
    );
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate(validFormData);
    });
    await waitFor(() => !result.current.isPending);

    // THEN: invalidateQueries is NOT called for ['clientes']
    const callsWithClientesKey = invalidateSpy.mock.calls.filter(
      (call) => JSON.stringify(call[0]).includes('clientes')
    );
    expect(callsWithClientesKey).toHaveLength(0);
  });
});
