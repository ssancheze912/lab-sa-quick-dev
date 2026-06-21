/**
 * Story 2.2: Client Detail View
 * Unit tests for useCliente hook
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { useCliente } from '../useCliente';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const CLIENTE_URL = (id: string) => `${BASE_URL}/api/v1/clientes/${id}`;

const mockCliente = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '+573001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00+00:00',
  updatedAt: '2026-01-01T00:00:00+00:00',
};

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === mockCliente.id) {
      return HttpResponse.json(mockCliente);
    }
    return HttpResponse.json({ title: 'Cliente no encontrado.', status: 404 }, { status: 404 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCliente', () => {
  it('returns data when id is valid and API succeeds', async () => {
    const { result } = renderHook(
      () => useCliente(mockCliente.id),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCliente);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('sets isLoading=true initially when id is provided', () => {
    const { result } = renderHook(
      () => useCliente(mockCliente.id),
      { wrapper: makeWrapper() }
    );

    // Before the query resolves, isLoading should be true
    expect(result.current.isLoading).toBe(true);
  });

  it('sets isError=true when API returns error', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    );

    const { result } = renderHook(
      () => useCliente('some-id'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('does NOT fetch when id is undefined (enabled: false)', () => {
    const { result } = renderHook(
      () => useCliente(undefined),
      { wrapper: makeWrapper() }
    );

    // enabled: !!id → false → query disabled, not loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('uses canonical query key [clientes, id]', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(
      () => useCliente(mockCliente.id),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the query is cached under ['clientes', id]
    const cached = queryClient.getQueryData(['clientes', mockCliente.id]);
    expect(cached).toEqual(mockCliente);
  });
});
