import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { useCreateCliente } from '../useCreateCliente';
import type { ClienteFormData } from '../clienteSchema';

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/v1/clientes`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const validFormData: ClienteFormData = {
  nombre: 'Empresa Test SA',
  nit: '900123456-1',
  telefono: '+573001234567',
  ciudad: 'Bogotá',
};

const createdClienteResponse = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Empresa Test SA',
  nit: '900123456-1',
  telefono: '+573001234567',
  ciudad: 'Bogotá',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente', () => {
  it('success path: calls invalidateQueries for clientes', async () => {
    server.use(
      http.post(API_URL, () => HttpResponse.json(createdClienteResponse, { status: 201 }))
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    act(() => {
      result.current.mutate(validFormData);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] });
  });

  it('409 error: calls setNitError without triggering generic error', async () => {
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    );

    const setNitError = vi.fn();
    const wrapper = makeWrapper();

    const { result } = renderHook(() => useCreateCliente(setNitError), { wrapper });

    act(() => {
      result.current.mutate(validFormData);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(setNitError).toHaveBeenCalledWith('El NIT/RUC ya está registrado');
    expect(setNitError).toHaveBeenCalledTimes(1);
  });

  it('non-409 error: does not call setNitError', async () => {
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json({ title: 'Server error' }, { status: 500 })
      )
    );

    const setNitError = vi.fn();
    const wrapper = makeWrapper();

    const { result } = renderHook(() => useCreateCliente(setNitError), { wrapper });

    act(() => {
      result.current.mutate(validFormData);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(setNitError).not.toHaveBeenCalled();
  });
});
