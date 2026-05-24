/**
 * Story 2.2: Client Detail View
 * Unit Tests — useCliente hook (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC2 — GET /api/v1/clientes/{id} loads correct client data (hook layer)
 *   AC3 — Non-existent clienteId → hook isError is true (enables not-found display)
 *
 * Related Test Cases (test-design-epic-2.md):
 *   TC-E2-P1-06 — Non-existent clienteId renders not-found gracefully (hook layer)
 *
 * Tests will FAIL until useCliente, IClienteRepository.getById, and
 * clienteApiRepository.getById are implemented.
 * Uses MSW to intercept network calls without a running backend.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';
import { useCliente } from './useCliente';
import { buildClienteDto } from '../../../../tests/handlers/clienteHandlers';

const API_BASE = 'http://localhost:5000';

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
// AC2: Hook resolves with typed Cliente object when API returns 200
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — data fetching (AC2)', () => {
  test('Given a valid clienteId, when API returns 200, hook should resolve with a ClienteDto', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes/{id} and returns a client
    const cliente = buildClienteDto({
      id: 'aaaaaaaa-0000-0000-0000-000000000001',
      nombre: 'Empresa Alpha SA',
      nit: '900100001-1',
      telefono: '3001111111',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCliente(cliente.id), { wrapper });

    // WHEN: hook resolves
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data contains the full cliente object
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toMatchObject({
      id: cliente.id,
      nombre: 'Empresa Alpha SA',
      nit: '900100001-1',
      telefono: '3001111111',
      ciudad: 'Bogotá',
    });
  });

  test('Given a valid clienteId, hook should return all required fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)', async () => {
    // GIVEN: MSW returns a full client DTO
    const cliente = buildClienteDto({
      id: 'aaaaaaaa-0000-0000-0000-000000000002',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCliente(cliente.id), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: all 7 fields are present
    const data = result.current.data!;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('nombre');
    expect(data).toHaveProperty('nit');
    expect(data).toHaveProperty('telefono');
    expect(data).toHaveProperty('ciudad');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
  });

  test('Hook should use query key [clientes, id] per architecture spec', async () => {
    // GIVEN: hook resolves successfully
    const cliente = buildClienteDto({
      id: 'aaaaaaaa-0000-0000-0000-000000000003',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCliente(cliente.id), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: query data is accessible via the ['clientes', id] key
    const cachedData = qc.getQueryData(['clientes', cliente.id]);
    expect(cachedData).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Hook sets isError=true when API returns 404
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — 404 / not-found handling (AC3)', () => {
  test('Given a non-existent clienteId, when API returns 404, hook isError should be true', async () => {
    // GIVEN: MSW returns 404 for the requested id
    const nonExistentId = '00000000-dead-beef-0000-000000000000';

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`, () => {
        return HttpResponse.json(
          { type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404 },
          { status: 404 },
        );
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCliente(nonExistentId), { wrapper });

    // WHEN: hook resolves (with error)
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true, data is undefined
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  test('Given a non-existent clienteId, hook isSuccess should be false', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = '00000000-dead-beef-0000-000000000001';

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`, () => {
        return HttpResponse.json(
          { title: 'Not Found', status: 404 },
          { status: 404 },
        );
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCliente(nonExistentId), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isSuccess remains false
    expect(result.current.isSuccess).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: hook disabled when id is falsy (enabled: !!id)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — disabled state when id is falsy', () => {
  test('When called with an empty string, hook should not trigger a fetch', async () => {
    // GIVEN: hook called with empty string (no id in route yet)
    let apiWasCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        apiWasCalled = true;
        return HttpResponse.json({});
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCliente(''), { wrapper });

    // WHEN: we wait briefly
    await waitFor(() => {
      // Hook must remain in pending/idle state (not loading, not error)
      expect(result.current.isLoading).toBe(false);
    });

    // THEN: no API call was made
    expect(apiWasCalled).toBe(false);
  });
});
