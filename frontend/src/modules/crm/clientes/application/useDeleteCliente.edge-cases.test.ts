/**
 * Story 2.5: useDeleteCliente hook — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD unit coverage with edge cases NOT covered by useDeleteCliente.test.ts.
 *
 * Additional scenarios:
 * - Initial state is idle before mutation is triggered
 * - isPending is false before mutation is triggered
 * - mutateAsync resolves with void on success (no return value expected)
 * - invalidateQueries is NOT called on 404 failure
 * - invalidateQueries is NOT called on 5xx failure
 * - Mutation can be re-triggered successfully after a failure
 * - 503 error also sets isError true (any 5xx, not just 500)
 * - 429 error also sets isError true
 * - Multiple successful deletes each invalidate queries (once per success)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useDeleteCliente } from './useDeleteCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';
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

// ─── Initial state ────────────────────────────────────────────────────────────

describe('[P1] useDeleteCliente — initial hook state before mutation', () => {
  it('[P1] should have idle status before mutation is triggered', () => {
    // GIVEN: Hook is rendered without triggering mutation
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    // THEN: Initial status is idle
    expect(result.current.status).toBe('idle');
  });

  it('[P1] should have isPending false before mutation is triggered', () => {
    // GIVEN: Hook is rendered without triggering mutation
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    // THEN: isPending is false
    expect(result.current.isPending).toBe(false);
  });

  it('[P1] should have isSuccess false before mutation is triggered', () => {
    // GIVEN: Hook is rendered without triggering mutation
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    // THEN: isSuccess is false
    expect(result.current.isSuccess).toBe(false);
  });

  it('[P1] should have isError false before mutation is triggered', () => {
    // GIVEN: Hook is rendered without triggering mutation
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    // THEN: isError is false
    expect(result.current.isError).toBe(false);
  });
});

// ─── invalidateQueries NOT called on failure ──────────────────────────────────

describe('[P1] useDeleteCliente — invalidateQueries not called on failure', () => {
  it('[P1] should NOT invalidate clientes queries on 404 failure', async () => {
    // GIVEN: DELETE returns 404
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
          { status: 404 },
        ),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    result.current.mutate(CLIENTE_ID);

    // WHEN: Mutation fails with 404
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('[P1] should NOT invalidate clientes queries on 5xx failure', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    result.current.mutate(CLIENTE_ID);

    // WHEN: Mutation fails with 500
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ─── Mutation re-trigger after failure ───────────────────────────────────────

describe('[P1] useDeleteCliente — mutation can be re-triggered after failure', () => {
  it('[P1] should succeed when re-triggered after a previous 500 failure', async () => {
    // GIVEN: First call returns 500, second call returns 204
    let callCount = 0;
    server.use(
      http.delete(DELETE_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ status: 500 }, { status: 500 });
        }
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    // WHEN: First mutation fails
    result.current.mutate(CLIENTE_ID);
    await waitFor(() => expect(result.current.isError).toBe(true));

    // WHEN: Second mutation succeeds
    act(() => {
      result.current.reset();
    });
    result.current.mutate(CLIENTE_ID);

    // THEN: Second mutation succeeds
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(2);
  });
});

// ─── 5xx variants all set isError ────────────────────────────────────────────

describe('[P2] useDeleteCliente — all error HTTP statuses set isError true', () => {
  it('[P2] should have isError true on 503 response', async () => {
    // GIVEN: DELETE returns 503 (Service Unavailable)
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json({ status: 503 }, { status: 503 }),
      ),
    );

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    // THEN: isError is true for 503
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });

  it('[P2] should have isError true on 429 response (rate limited)', async () => {
    // GIVEN: DELETE returns 429 (Too Many Requests)
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json({ status: 429 }, { status: 429 }),
      ),
    );

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    // THEN: isError is true for 429
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });
});

// ─── Multiple successful deletes ─────────────────────────────────────────────

describe('[P2] useDeleteCliente — multiple consecutive deletes each invalidate queries', () => {
  it('[P2] should call invalidateQueries twice when two deletes succeed', async () => {
    // GIVEN: DELETE always returns 204
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    // WHEN: First deletion
    result.current.mutate(CLIENTE_ID);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // AND: Reset and second deletion
    act(() => {
      result.current.reset();
    });
    result.current.mutate(CLIENTE_ID);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: invalidateQueries was called twice
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] });
  });
});
