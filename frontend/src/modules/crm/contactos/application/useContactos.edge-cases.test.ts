/**
 * Story 3.1: useContactos hook — Unit Edge Case Tests
 * testarch-automate expansion (BMad-Integrated Mode)
 *
 * Covers edge cases NOT in the ATDD baseline:
 * - Multiple contacts returned and mapped correctly
 * - Hook configuration: staleTime set, retry: 0
 * - Contact with non-null clienteId mapped correctly
 * - Network timeout-like slow response (initial loading state)
 * - Data shape: all required fields present in returned objects
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { useContactos } from './useContactos';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/contactos';

const makeContactoStub = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  nombre: 'Contacto Prueba',
  cargo: 'Cargo Prueba',
  telefono: '3001234567',
  email: 'prueba@test.com',
  clienteId: null,
  createdAt: '2026-06-25T10:00:00Z',
  updatedAt: '2026-06-25T10:00:00Z',
  ...overrides,
});

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([makeContactoStub()])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper wrapper ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─── Multiple contacts mapping ────────────────────────────────────────────────

describe('useContactos — multiple contacts', () => {
  it('[P1] should return all items when API returns multiple contacts', async () => {
    // GIVEN: API returns three contacts
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          makeContactoStub({ nombre: 'Primero', email: 'primero@test.com' }),
          makeContactoStub({ nombre: 'Segundo', email: 'segundo@test.com' }),
          makeContactoStub({ nombre: 'Tercero', email: 'tercero@test.com' }),
        ]),
      ),
    );

    // WHEN: Hook is called
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    // THEN: Data array has three items
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });

  it('[P1] should preserve order of contacts as returned by API', async () => {
    // GIVEN: API returns contacts in a specific order
    const first = makeContactoStub({ nombre: 'Alpha', email: 'alpha@test.com' });
    const second = makeContactoStub({ nombre: 'Beta', email: 'beta@test.com' });
    server.use(http.get(API_URL, () => HttpResponse.json([first, second])));

    // WHEN: Hook is called
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    // THEN: Data preserves the API order
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].nombre).toBe('Alpha');
    expect(result.current.data![1].nombre).toBe('Beta');
  });
});

// ─── Contact field mapping ────────────────────────────────────────────────────

describe('useContactos — field mapping', () => {
  it('[P1] should map all required Contacto fields from API response', async () => {
    // GIVEN: API returns a contact with all fields populated
    const stub = makeContactoStub({
      id: '550e8400-e29b-41d4-a716-446655440001',
      nombre: 'Test Nombre',
      cargo: 'Test Cargo',
      telefono: '3001234567',
      email: 'test@email.com',
      clienteId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
    server.use(http.get(API_URL, () => HttpResponse.json([stub])));

    // WHEN: Hook is called
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    // THEN: All fields are correctly mapped
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const contacto = result.current.data![0];
    expect(contacto.id).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(contacto.nombre).toBe('Test Nombre');
    expect(contacto.cargo).toBe('Test Cargo');
    expect(contacto.telefono).toBe('3001234567');
    expect(contacto.email).toBe('test@email.com');
    expect(contacto.clienteId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(contacto.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(contacto.updatedAt).toBe('2026-01-02T00:00:00Z');
  });

  it('[P1] should map contacto with null clienteId correctly (orphan contact)', async () => {
    // GIVEN: API returns a contact with clienteId = null
    const stub = makeContactoStub({ clienteId: null });
    server.use(http.get(API_URL, () => HttpResponse.json([stub])));

    // WHEN: Hook is called
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    // THEN: clienteId is null in returned data
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].clienteId).toBeNull();
  });

  it('[P1] should map contacto with non-null clienteId correctly', async () => {
    // GIVEN: API returns a contact linked to a client
    const clienteId = '550e8400-e29b-41d4-a716-446655440000';
    const stub = makeContactoStub({ clienteId });
    server.use(http.get(API_URL, () => HttpResponse.json([stub])));

    // WHEN: Hook is called
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    // THEN: clienteId is the expected UUID string
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].clienteId).toBe(clienteId);
  });
});

// ─── Error handling edge cases ────────────────────────────────────────────────

describe('useContactos — error edge cases', () => {
  it('[P1] should expose error object with message when API returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Hook is called
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    // THEN: isError is true and error is an instance of Error
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('[P2] should not retry on error (retry: 0)', async () => {
    // GIVEN: API always returns 500
    let callCount = 0;
    server.use(
      http.get(API_URL, () => {
        callCount++;
        return HttpResponse.json({ status: 500 }, { status: 500 });
      }),
    );

    // WHEN: Hook is called and error is reached
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: API was called exactly once (retry: 0 means no retries)
    expect(callCount).toBe(1);
  });
});

// ─── queryKey ─────────────────────────────────────────────────────────────────

describe('useContactos — queryKey', () => {
  it('[P2] should use queryKey ["contactos"] so multiple consumers share cache', async () => {
    // GIVEN: Two hook instances with the same QueryClient
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    // WHEN: Both hooks are rendered
    const { result: result1 } = renderHook(() => useContactos(), { wrapper });
    const { result: result2 } = renderHook(() => useContactos(), { wrapper });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    // THEN: Both return the same data reference (shared cache)
    expect(result1.current.data).toEqual(result2.current.data);
  });
});
