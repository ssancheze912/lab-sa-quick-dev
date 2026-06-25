/**
 * Story 2.4: useUpdateCliente hook — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD unit coverage with edge cases NOT covered by useUpdateCliente.test.ts.
 *
 * Additional scenarios:
 * - Initial state is idle before mutation is triggered
 * - isPending is false before mutation is triggered
 * - Returns updated ClienteDto in data on success
 * - invalidateQueries is NOT called on 409 failure
 * - invalidateQueries is NOT called on 5xx failure
 * - Mutation can be re-triggered successfully after a failure
 * - 503 error also sets isError true (any 5xx, not just 500)
 * - mutateAsync resolves with ClienteDto on success
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useUpdateCliente } from './useUpdateCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PUT_URL = `http://localhost:5000/api/v1/clientes/${CLIENTE_ID}`;

const updatedClienteStub = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-06-25T11:00:00Z',
};

const validPayload = {
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
};

const server = setupServer(
  http.put(PUT_URL, () => HttpResponse.json(updatedClienteStub, { status: 200 })),
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

// ─── Initial state before mutation is triggered ───────────────────────────────

describe('[P1] useUpdateCliente — initial state before mutation', () => {
  it('[P1] should have isIdle=true before the mutation is called', () => {
    // GIVEN: Hook is rendered but mutation has not been triggered
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Mutation is in idle state
    expect(result.current.isIdle).toBe(true);
  });

  it('[P1] should have isPending=false before the mutation is triggered', () => {
    // GIVEN: Hook is rendered but mutation has not been triggered
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Not pending before trigger
    expect(result.current.isPending).toBe(false);
  });

  it('[P1] should have data=undefined before the mutation is triggered', () => {
    // GIVEN: Hook is rendered
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // THEN: data is undefined in idle state
    expect(result.current.data).toBeUndefined();
  });
});

// ─── Returns updated ClienteDto on success ───────────────────────────────────

describe('[P1] useUpdateCliente — returns updated ClienteDto on success', () => {
  it('[P1] should expose the updated ClienteDto in data on success', async () => {
    // GIVEN: PUT returns the updatedClienteStub
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // WHEN: Mutation is triggered
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data contains the updated client with correct fields
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe(CLIENTE_ID);
    expect(result.current.data?.nombre).toBe('Empresa Actualizada S.A.');
    expect(result.current.data?.nit).toBe('900123456-7');
    expect(result.current.data?.updatedAt).toBe('2026-06-25T11:00:00Z');
  });

  it('[P1] should expose all Cliente fields in the returned data on success', async () => {
    // GIVEN: PUT returns updatedClienteStub
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: All Cliente interface fields are present and correctly typed
    const data = result.current.data!;
    expect(typeof data.id).toBe('string');
    expect(typeof data.nombre).toBe('string');
    expect(typeof data.nit).toBe('string');
    expect(typeof data.telefono).toBe('string');
    expect(typeof data.ciudad).toBe('string');
    expect(typeof data.createdAt).toBe('string');
    expect(typeof data.updatedAt).toBe('string');
  });
});

// ─── invalidateQueries NOT called on failure ──────────────────────────────────

describe('[P1] useUpdateCliente — invalidateQueries not called on failure', () => {
  it('[P1] should NOT call invalidateQueries when mutation returns 409', async () => {
    // GIVEN: PUT returns 409 conflict
    server.use(
      http.put(PUT_URL, () =>
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

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper });

    // WHEN: Mutation fails with 409
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called (no cache invalidation on failure)
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('[P1] should NOT call invalidateQueries when mutation returns 500', async () => {
    // GIVEN: PUT returns 500
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper });

    // WHEN: Mutation fails with 500
    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ─── 5xx variations: 503 also sets isError ───────────────────────────────────

describe('[P1] useUpdateCliente — 5xx error variations', () => {
  it('[P1] should set isError=true on 503 Service Unavailable', async () => {
    // GIVEN: PUT returns 503
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 503, title: 'Service Unavailable' }, { status: 503 }),
      ),
    );

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true and data is undefined
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});

// ─── Mutation can be re-triggered after failure ───────────────────────────────

describe('[P1] useUpdateCliente — re-trigger after failure', () => {
  it('[P1] should succeed on second call after a first failed call', async () => {
    // GIVEN: First call fails with 409, second call succeeds with 200
    let callCount = 0;
    server.use(
      http.put(PUT_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 409, detail: 'El NIT/RUC ya está registrado.' },
            { status: 409 },
          );
        }
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

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
    expect(result.current.data?.id).toBe(CLIENTE_ID);
    expect(callCount).toBe(2);
  });
});

// ─── mutateAsync resolves with ClienteDto ─────────────────────────────────────

describe('[P1] useUpdateCliente — mutateAsync resolves correctly', () => {
  it('[P1] should resolve mutateAsync with the updated ClienteDto on success', async () => {
    // GIVEN: PUT returns 200 with updatedClienteStub
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    // WHEN: mutateAsync is called
    let resolvedData: unknown;
    await act(async () => {
      resolvedData = await result.current.mutateAsync(validPayload);
    });

    // THEN: mutateAsync resolves with the returned DTO
    expect(resolvedData).toMatchObject({
      id: CLIENTE_ID,
      nombre: 'Empresa Actualizada S.A.',
    });
  });
});
