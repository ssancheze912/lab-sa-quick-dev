/**
 * Story 2.5: useDeleteCliente mutation hook — Application Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC2: on success (204), invalidateQueries(['clientes']) is called
 * - AC5: on 5xx/network error, mutation isError is true
 *
 * Framework: Vitest + React Testing Library + MSW (matching existing hook patterns)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until useDeleteCliente is created
import { useDeleteCliente } from './useDeleteCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440005';
const DELETE_URL = `http://localhost:5000/api/v1/clientes/${CLIENTE_ID}`;

const server = setupServer(
  http.delete(DELETE_URL, () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── Helper wrapper ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDeleteCliente', () => {
  it('should call DELETE /api/v1/clientes/{id} with the correct id', async () => {
    // GIVEN: DELETE endpoint is ready to intercept the correct URL
    let capturedUrl: string | undefined;
    server.use(
      http.delete(DELETE_URL, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // WHEN: Mutation is triggered with the client id
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    // THEN: The correct DELETE URL was called
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain(CLIENTE_ID);
  });

  it('should invalidate clientes queries on successful deletion', async () => {
    // GIVEN: QueryClient with spy on invalidateQueries
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    // WHEN: Mutation succeeds
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });
    result.current.mutate(CLIENTE_ID);

    // THEN: invalidateQueries(['clientes']) is called (FR27)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] });
  });

  it('should have isError true on 404 response (client not found)', async () => {
    // GIVEN: DELETE returns 404 Problem Details
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Not Found',
            status: 404,
            detail: `Cliente con id ${CLIENTE_ID} no encontrado.`,
          },
          { status: 404 },
        ),
      ),
    );

    // WHEN: Mutation is triggered with a non-existent id
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    // THEN: Mutation reflects error state
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });

  it('should have isError true on 500 server error (AC5)', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 },
        ),
      ),
    );

    // WHEN: Mutation is triggered and backend fails
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    // THEN: Mutation reflects error state (AC5)
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });

  it('should expose isPending true while the mutation is in flight', async () => {
    // GIVEN: DELETE is slow
    server.use(
      http.delete(DELETE_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // WHEN: Mutation is triggered
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    // THEN: isPending is true while awaiting response
    await waitFor(() => expect(result.current.isPending).toBe(true));
  });
});
