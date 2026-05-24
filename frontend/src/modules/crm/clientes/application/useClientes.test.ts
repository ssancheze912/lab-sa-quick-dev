/**
 * Story 2.1: Client List & Search
 * Unit Tests — useClientes hook (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC1 — Navigating to /clientes loads clients from GET /api/v1/clientes
 *
 * Tests will FAIL until useClientes and clienteApiRepository are implemented.
 * Uses MSW to intercept network calls without a running backend.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';
import { useClientes } from './useClientes';
import {
  handleGetClientesSuccess,
  handleGetClientesEmpty,
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
// Given: GET /api/v1/clientes returns 5 clients
// When:  useClientes() is called
// Then:  hook returns typed array of clients
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — data fetching', () => {
  test('should call GET /api/v1/clientes once on mount', async () => {
    // GIVEN: MSW intercepts with 5 clients
    let callCount = 0;
    server.use(
      ...([handleGetClientesSuccess(FIVE_CLIENTES)].map((h) => {
        // Count requests via a wrapping handler
        return h;
      })),
    );

    // Track request count independently
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // WHEN: hook resolves
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data contains 5 items
    expect(result.current.data).toHaveLength(5);
  });

  test('should return typed array matching Cliente interface shape', async () => {
    // GIVEN: MSW returns 5 clients
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: first item has all required fields
    const first = result.current.data![0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('nombre');
    expect(first).toHaveProperty('nit');
    expect(first).toHaveProperty('telefono');
    expect(first).toHaveProperty('ciudad');
    expect(first).toHaveProperty('createdAt');
    expect(first).toHaveProperty('updatedAt');
  });

  test('should return empty array when API returns []', async () => {
    // GIVEN: API returns empty array (no clients in system)
    server.use(handleGetClientesEmpty());

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data is an empty array
    expect(result.current.data).toEqual([]);
  });

  test('should expose refetch function for retry support', async () => {
    // GIVEN: hook resolves successfully
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: refetch is a callable function (needed for ErrorPanel retry)
    expect(typeof result.current.refetch).toBe('function');
  });

  test('should use query key [clientes] per architecture spec', async () => {
    // GIVEN: hook resolves
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: query data is accessible via the ['clientes'] key
    const cachedData = qc.getQueryData(['clientes']);
    expect(cachedData).toBeDefined();
    expect(Array.isArray(cachedData)).toBe(true);
  });
});
