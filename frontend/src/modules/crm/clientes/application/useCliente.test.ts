/**
 * Unit tests — useCliente hook
 * Story 2.2 | Client Detail View
 *
 * These tests are in the RED phase — useCliente.ts does not exist yet.
 * Expected failure: "Cannot find module '../useCliente'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCliente } from '../useCliente';

// ---------------------------------------------------------------------------
// MSW server for this unit test file
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: wrap useCliente in QueryClientProvider with isolated QueryClient
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// TC: useCliente with undefined clienteId — query must NOT fire
// ---------------------------------------------------------------------------

describe('useCliente — disabled when clienteId is falsy', () => {
  it('should NOT enable the query when clienteId is undefined', () => {
    // GIVEN: No clienteId provided (undefined)
    const wrapper = createWrapper();

    // WHEN: useCliente is called with undefined
    const { result } = renderHook(() => useCliente(undefined), { wrapper });

    // THEN: Query is disabled — fetchStatus should be idle, not loading
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });

  it('should NOT enable the query when clienteId is null', () => {
    // GIVEN: clienteId is explicitly null (no client selected)
    const wrapper = createWrapper();

    // WHEN: useCliente is called with null
    const { result } = renderHook(() => useCliente(null), { wrapper });

    // THEN: Query is disabled — fetchStatus idle means no network request was made
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });

  it('should NOT enable the query when clienteId is an empty string', () => {
    // GIVEN: clienteId is empty string (falsy)
    const wrapper = createWrapper();

    // WHEN: useCliente is called with empty string
    const { result } = renderHook(() => useCliente(''), { wrapper });

    // THEN: Query is disabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC: useCliente with valid clienteId — query fires and returns data
// ---------------------------------------------------------------------------

describe('useCliente — fetches client data when clienteId is provided', () => {
  it('should fetch and return cliente data when clienteId is a valid UUID', async () => {
    // GIVEN: MSW returns a client for the requested ID
    const knownId = '00000000-0000-0000-0000-000000000001';
    const mockCliente = {
      id: knownId,
      nombre: 'Empresa Test',
      nit: '900000001-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-06-29T10:00:00Z',
    };

    server.use(
      http.get(`/api/v1/clientes/${knownId}`, () => HttpResponse.json(mockCliente))
    );

    const wrapper = createWrapper();

    // WHEN: useCliente is called with a valid UUID
    const { result } = renderHook(() => useCliente(knownId), { wrapper });

    // THEN: Data is eventually returned
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCliente);
  });

  it('should expose isError true when the API returns 404', async () => {
    // GIVEN: MSW returns 404 for the given ID
    const unknownId = '00000000-0000-0000-0000-000000000000';

    server.use(
      http.get(`/api/v1/clientes/${unknownId}`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useCliente is called with an ID that does not exist
    const { result } = renderHook(() => useCliente(unknownId), { wrapper });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
