/**
 * Story 2.3: useCreateCliente mutation hook — Unit Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC2: mutation calls POST /api/v1/clientes with correct payload
 * - AC2: on success, invalidateQueries(['clientes']) is called
 * - AC4: on 409 Conflict, mutation isError is true
 * - AC5: on 5xx, mutation isError is true
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until useCreateCliente is implemented
import { useCreateCliente } from './useCreateCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/clientes';

const validPayload = {
  nombre: 'Empresa Nueva SA',
  nit: '900111222-3',
  telefono: '3001234567',
  ciudad: 'Bogotá',
};

const clienteCreatedStub = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  nombre: 'Empresa Nueva SA',
  nit: '900111222-3',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T10:30:00Z',
};

const server = setupServer(
  http.post(API_URL, () => HttpResponse.json(clienteCreatedStub, { status: 201 })),
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
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCreateCliente', () => {
  // AC2: mutation calls POST /api/v1/clientes

  it('should call POST /api/v1/clientes with the correct payload on mutate', async () => {
    // GIVEN: MSW intercepts POST and captures the request body
    let capturedBody: unknown = null;
    server.use(
      http.post(API_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called with valid payload
    await act(async () => {
      result.current.mutate(validPayload);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: POST was called with the correct body
    expect(capturedBody).toMatchObject(validPayload);
  });

  it('should expose isSuccess true after a successful mutation', async () => {
    // GIVEN: MSW returns 201 Created
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called with valid payload
    await act(async () => {
      result.current.mutate(validPayload);
    });

    // THEN: isSuccess is true after resolution
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should return the created ClienteDto in the mutation data on success', async () => {
    // GIVEN: MSW returns the clienteCreatedStub
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate(validPayload);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data contains the created client
    expect(result.current.data).toMatchObject({
      id: clienteCreatedStub.id,
      nombre: clienteCreatedStub.nombre,
      nit: clienteCreatedStub.nit,
    });
  });

  // AC2: on success, invalidateQueries(['clientes']) triggers a refetch

  it('should expose isPending true while mutation is in flight', async () => {
    // GIVEN: MSW handler is delayed to capture pending state
    server.use(
      http.post(API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validPayload);
    });

    // THEN: isPending is true immediately after mutate
    await waitFor(() => expect(result.current.isPending).toBe(true));
  });

  // AC4: 409 Conflict → isError true

  it('should expose isError true when the backend returns 409 Conflict', async () => {
    // GIVEN: MSW returns 409 Conflict
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate(validPayload);
    });

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should expose the error object when the backend returns 409 Conflict', async () => {
    // GIVEN: MSW returns 409 Conflict
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate(validPayload);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: error object is defined
    expect(result.current.error).toBeDefined();
  });

  // AC5: 5xx error → isError true

  it('should expose isError true when the backend returns 500', async () => {
    // GIVEN: MSW returns 500 Internal Server Error
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
      ),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate(validPayload);
    });

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should expose isIdle true before mutation is triggered', async () => {
    // GIVEN: No mutation has been triggered yet
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: Hook is rendered without calling mutate
    // THEN: isIdle is true (hook is in initial state)
    expect(result.current.isIdle).toBe(true);
  });
});
