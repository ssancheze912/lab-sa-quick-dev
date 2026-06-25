/**
 * Story 2.4: useUpdateCliente hook — Component Tests (ATDD RED Phase)
 * Tests intentionally fail until useUpdateCliente is implemented.
 *
 * Acceptance Criteria covered:
 * - AC2: mutation calls PUT /api/v1/clientes/{id} and invalidates ['clientes'] and ['clientes', id]
 * - AC5: on network/5xx error, mutation exposes isError true
 * - AC6: on 409 conflict, mutation exposes isError true with status 409
 *
 * Framework: Vitest + React Testing Library (renderHook) + MSW
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useUpdateCliente } from './useUpdateCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5000/api/v1/clientes';
const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';

const updatedClienteStub = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T11:00:00Z',
};

const validPayload = {
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
};

const server = setupServer(
  http.put(`${BASE_URL}/${CLIENTE_ID}`, () =>
    HttpResponse.json(updatedClienteStub, { status: 200 }),
  ),
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

describe('useUpdateCliente', () => {
  it('should call PUT /api/v1/clientes/{id} with the correct payload', async () => {
    // GIVEN: A valid update payload and a cliente ID
    let capturedBody: unknown;

    server.use(
      http.put(`${BASE_URL}/${CLIENTE_ID}`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    // WHEN: The mutation is called with the payload
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    // THEN: The request was made with correct body
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).toEqual(validPayload);
  });

  it('should call invalidateQueries with key ["clientes"] on success', async () => {
    // GIVEN: A QueryClient with a spy on invalidateQueries
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    // WHEN: Mutation succeeds
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: ['clientes'] cache is invalidated
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] }),
    );
  });

  it('should call invalidateQueries with key ["clientes", id] on success', async () => {
    // GIVEN: A QueryClient with a spy on invalidateQueries
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    // WHEN: Mutation succeeds
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: ['clientes', clienteId] cache is invalidated (FR27)
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes', CLIENTE_ID] }),
    );
  });

  it('should expose isError true on 409 conflict response', async () => {
    // GIVEN: The backend returns 409 (duplicate NIT)
    server.use(
      http.put(`${BASE_URL}/${CLIENTE_ID}`, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    // WHEN: Mutation is called
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    // THEN: isError is true and error is defined
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should expose isError true on 5xx server error', async () => {
    // GIVEN: The backend returns 500
    server.use(
      http.put(`${BASE_URL}/${CLIENTE_ID}`, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Mutation is called
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
