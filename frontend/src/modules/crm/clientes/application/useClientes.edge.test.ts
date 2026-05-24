/**
 * Story 2.1: Client List & Search
 * Unit Tests — useClientes hook (Edge Cases — Automate EXPAND)
 *
 * Covers boundary conditions and error paths NOT in ATDD tests:
 *   - 500 Server Error response → isError true, data undefined
 *   - 404 Not Found response → isError true
 *   - isLoading is true before data arrives
 *   - Data is undefined while loading
 *   - Subsequent fetch after error (retry mechanics)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';
import { useClientes } from './useClientes';
import {
  handleGetClientesSuccess,
  handleGetClientesNetworkError,
  FIVE_CLIENTES,
} from '../../../../tests/handlers/clienteHandlers';

// ─── MSW server setup ────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test wrapper with fresh QueryClient per test ────────────────────────────

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

// ─────────────────────────────────────────────────────────────────────────────
// Error path: 500 Internal Server Error
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — error states', () => {
  test('Given 500 server error, isError should be true', async () => {
    // GIVEN: server responds with 500
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => {
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // WHEN: fetch completes with error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: data is undefined
    expect(result.current.data).toBeUndefined();
  });

  test('Given 404 Not Found, isError should be true', async () => {
    // GIVEN: server responds with 404 (endpoint not mapped)
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => {
        return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });

  test('Given network error, isError should be true and data undefined', async () => {
    // GIVEN: network-level failure (no response)
    server.use(handleGetClientesNetworkError());

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  test('Given error state, isLoading should be false', async () => {
    // GIVEN: server returns 500
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => {
        return HttpResponse.json({ error: 'Fail' }, { status: 500 });
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isLoading is false (not stuck in loading)
    expect(result.current.isLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading state: data is undefined while request is in-flight
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — loading state', () => {
  test('Initially isLoading should be true before data arrives', async () => {
    // GIVEN: API call is delayed
    let resolveRequest!: () => void;
    const waitForRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.get('http://localhost:5000/api/v1/clientes', async () => {
        await waitForRequest;
        return HttpResponse.json(FIVE_CLIENTES);
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: on first render (before fetch completes), isLoading is true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Cleanup: resolve request
    resolveRequest();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  test('isLoading becomes false after successful response', async () => {
    // GIVEN: normal success response
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: isLoading is false
    expect(result.current.isLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Retry: after error, calling refetch with working server should recover
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — retry after error', () => {
  test('Given error then success, refetch returns data and clears error', async () => {
    // GIVEN: first request fails
    server.use(handleGetClientesNetworkError());

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // WHEN: server recovers and user calls refetch
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    result.current.refetch();

    // THEN: data is loaded and error is cleared
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(5);
    expect(result.current.isError).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: isSuccess false while loading
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — state exclusivity', () => {
  test('isSuccess and isError are never both true simultaneously', async () => {
    // GIVEN: normal success response
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: isError is false when isSuccess is true
    expect(result.current.isError).toBe(false);
  });

  test('isSuccess is false when isError is true', async () => {
    // GIVEN: server error
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => {
        return HttpResponse.json({}, { status: 503 });
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isSuccess is false
    expect(result.current.isSuccess).toBe(false);
  });
});
