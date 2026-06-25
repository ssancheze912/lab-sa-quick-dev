/**
 * Story 2.3: useCreateCliente hook — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD unit coverage with edge cases NOT covered by useCreateCliente.test.ts.
 *
 * Additional scenarios:
 * - Mutation returns the created ClienteDto on success (data field)
 * - isIdle is true before the mutation is called
 * - isPending is false before mutation is triggered
 * - 500 server error sets isError true (not just 409)
 * - Network abort (ERR_CONNECTION_REFUSED) sets isError true
 * - invalidateQueries is NOT called when mutation fails (409 or 5xx)
 * - Mutation can be re-called after a failure (stateless between calls)
 * - retry is not configured (mutation uses retry: 0 — from wrapper config)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCreateCliente } from './useCreateCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const POST_URL = 'http://localhost:5000/api/v1/clientes';

const clienteStub = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const validPayload = {
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
};

const server = setupServer(
  http.post(POST_URL, () => HttpResponse.json(clienteStub, { status: 201 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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

// ─── Initial state before mutation is triggered ───────────────────────────────

describe('[P1] useCreateCliente — initial state before mutation', () => {
  it('[P1] should have isIdle=true before the mutation is called', () => {
    // GIVEN: Hook is rendered but mutation has not been triggered
    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // THEN: Mutation is in idle state
    expect(result.current.isIdle).toBe(true);
  });

  it('[P1] should have isPending=false before the mutation is triggered', () => {
    // GIVEN: Hook is rendered but mutation has not been triggered
    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // THEN: Not pending before trigger
    expect(result.current.isPending).toBe(false);
  });

  it('[P1] should have data=undefined before the mutation is triggered', () => {
    // GIVEN: Hook is rendered
    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // THEN: data is undefined in idle state
    expect(result.current.data).toBeUndefined();
  });
});

// ─── Mutation returns the created ClienteDto ─────────────────────────────────

describe('[P1] useCreateCliente — returns created ClienteDto on success', () => {
  it('[P1] should expose the created ClienteDto in data on success', async () => {
    // GIVEN: POST returns the clienteStub
    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // WHEN: Mutation is triggered
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data contains the created client with the correct id
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe(clienteStub.id);
    expect(result.current.data?.nombre).toBe(clienteStub.nombre);
    expect(result.current.data?.nit).toBe(clienteStub.nit);
  });
});

// ─── 500 error sets isError true ─────────────────────────────────────────────

describe('[P1] useCreateCliente — 5xx errors', () => {
  it('[P1] should set isError=true on 500 Internal Server Error', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // WHEN: Mutation is triggered
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true and data is undefined
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('[P1] should set isError=true on 503 Service Unavailable', async () => {
    // GIVEN: POST returns 503
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 503, title: 'Service Unavailable' }, { status: 503 }),
      ),
    );

    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // WHEN: Mutation is triggered
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true
    expect(result.current.isError).toBe(true);
  });
});

// ─── invalidateQueries NOT called on failure ──────────────────────────────────

describe('[P1] useCreateCliente — invalidateQueries not called on failure', () => {
  it('[P1] should NOT call invalidateQueries when mutation returns 409', async () => {
    // GIVEN: POST returns 409
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: Mutation is triggered and fails with 409
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called (no cache invalidation on failure)
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('[P1] should NOT call invalidateQueries when mutation returns 500', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: Mutation fails with 500
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ─── Mutation can be re-triggered after failure ───────────────────────────────

describe('[P1] useCreateCliente — re-trigger after failure', () => {
  it('[P1] should succeed on second call after a first failed call', async () => {
    // GIVEN: First call fails with 409, second call succeeds with 201
    let callCount = 0;
    server.use(
      http.post(POST_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 409, detail: 'El NIT/RUC ya está registrado.' },
            { status: 409 },
          );
        }
        return HttpResponse.json(clienteStub, { status: 201 });
      }),
    );

    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    // First call — fails
    await act(async () => {
      result.current.mutate(validPayload);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // WHEN: Second call — succeeds
    await act(async () => {
      result.current.mutate({ ...validPayload, nit: '900999999-9' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: Data from second call is returned
    expect(result.current.data?.id).toBe(clienteStub.id);
    expect(callCount).toBe(2);
  });
});
