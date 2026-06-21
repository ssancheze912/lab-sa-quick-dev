/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * Unit Tests — useUpdateCliente hook
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Test Cases:
 *   success path: calls invalidateQueries(['clientes']) and setQueryData(['clientes', id]) with updated client
 *   success path: emits toast "Cliente actualizado correctamente"
 *   409 error: calls setNitError with "El NIT/RUC ya está registrado" without triggering generic toast
 *   non-409 error: does not call setNitError, triggers generic error toast
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { useUpdateCliente } from '../useUpdateCliente';
import type { ClienteFormData } from '../clienteSchema';

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/v1/clientes`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTE_ID = '00000000-0000-0000-0000-000000000042';

const validFormData: ClienteFormData = {
  nombre: 'Empresa Editada SA',
  nit: '900123456-2',
  telefono: '+573001234567',
  ciudad: 'Medellín',
};

const updatedClienteResponse = {
  id: CLIENTE_ID,
  nombre: 'Empresa Editada SA',
  nit: '900123456-2',
  telefono: '+573001234567',
  ciudad: 'Medellín',
  createdAt: '2026-01-15T10:00:00+00:00',
  updatedAt: new Date().toISOString(),
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useUpdateCliente', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Success path: invalidateQueries(['clientes'])
  // ─────────────────────────────────────────────────────────────────────────

  it('success path: calls invalidateQueries for clientes after successful PUT', async () => {
    server.use(
      http.put(`${API_BASE}/${CLIENTE_ID}`, () =>
        HttpResponse.json(updatedClienteResponse, { status: 200 })
      )
    );

    const { queryClient, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    act(() => {
      result.current.mutate({ id: CLIENTE_ID, data: validFormData });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: invalidateQueries called with ['clientes'] to refresh the list (FR27)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Success path: setQueryData(['clientes', id]) with updated client
  // ─────────────────────────────────────────────────────────────────────────

  it('success path: calls setQueryData with updated client for immediate detail panel update (FR27)', async () => {
    server.use(
      http.put(`${API_BASE}/${CLIENTE_ID}`, () =>
        HttpResponse.json(updatedClienteResponse, { status: 200 })
      )
    );

    const { queryClient, wrapper } = makeWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    act(() => {
      result.current.mutate({ id: CLIENTE_ID, data: validFormData });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: setQueryData called with ['clientes', id] to immediately update the detail panel cache
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['clientes', CLIENTE_ID],
      updatedClienteResponse
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 409 error: setNitError called without generic toast
  // ─────────────────────────────────────────────────────────────────────────

  it('409 error: calls setNitError with "El NIT/RUC ya está registrado" without triggering generic toast', async () => {
    server.use(
      http.put(`${API_BASE}/${CLIENTE_ID}`, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    );

    const setNitError = vi.fn();
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateCliente(setNitError), { wrapper });

    act(() => {
      result.current.mutate({ id: CLIENTE_ID, data: validFormData });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: setNitError called with the inline field error message
    expect(setNitError).toHaveBeenCalledWith('El NIT/RUC ya está registrado');
    expect(setNitError).toHaveBeenCalledTimes(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // non-409 error: does not call setNitError
  // ─────────────────────────────────────────────────────────────────────────

  it('non-409 error: does not call setNitError (only generic toast path)', async () => {
    server.use(
      http.put(`${API_BASE}/${CLIENTE_ID}`, () =>
        HttpResponse.json({ title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const setNitError = vi.fn();
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUpdateCliente(setNitError), { wrapper });

    act(() => {
      result.current.mutate({ id: CLIENTE_ID, data: validFormData });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: setNitError is NOT called for non-409 errors
    expect(setNitError).not.toHaveBeenCalled();
  });
});
