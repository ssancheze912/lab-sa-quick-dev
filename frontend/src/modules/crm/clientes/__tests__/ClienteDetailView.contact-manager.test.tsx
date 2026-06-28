/**
 * ATDD component tests — Story 4.1: View Associated Contacts in Client Detail (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/contactos/application/useContactosByCliente.ts
 *   - frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (getByClienteId)
 *   - frontend/src/modules/crm/contactos/domain/IContactoRepository.ts (getByClienteId)
 *   - frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts
 *   - frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (ContactManager integration)
 *   - siesa-ui-kit ContactManager component is imported and wired
 *
 * Test IDs:
 *   TC-E4-4-1-CMP-1 (P0) — ClienteDetailView with valid clienteId renders contact-manager-section
 *   TC-E4-4-1-CMP-2 (P1) — ClienteContactServiceAdapter is constructed with active clienteId
 *   TC-E4-4-1-CMP-3 (P1) — GET contactos?clienteId=[] → ContactManager renders empty state
 *   TC-E4-4-1-CMP-4 (P1) — GET contactos?clienteId= 500 → ContactManager renders error state + retry
 *   TC-E4-4-1-CMP-5 (P1) — useContactosByCliente with valid clienteId calls GET with clienteId param
 *   TC-E4-4-1-CMP-6 (P1) — useContactosByCliente with undefined clienteId does NOT fire HTTP request
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente, resetClienteCounter } from './clienteFactory';
import { buildContacto, resetContactoCounter } from '../../contactos/__tests__/contactoFactory';

// ClienteDetailView does NOT exist with ContactManager yet — import fails (RED phase)
import { ClienteDetailView } from '../presentation/ClienteDetailView';

// useContactosByCliente does NOT exist yet — import fails (RED phase)
import { useContactosByCliente } from '../../contactos/application/useContactosByCliente';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query / MSW errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code') ||
    msg.includes('Not implemented')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first: handlers registered before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ClienteDetailView with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteDetailView(clienteId: string | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-1-CMP-1 (P0) — ClienteDetailView with valid clienteId renders contact-manager-section
// AC #1: ContactManager rendered when client has contacts (FR21)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ContactManager section renders (TC-E4-4-1-CMP-1)', () => {
  it('TC-E4-4-1-CMP-1: should render data-testid="contact-manager-section" when clienteId is valid and client data is loaded', async () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern)
    const cliente = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Empresa ContactManager CMP Test',
    });

    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Ana García CMP',
      clienteId: cliente.id,
    });

    // CRITICAL: Intercept BOTH requests BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contacto]);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: data-testid="contact-manager-section" is present in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });
  });

  it('should render the "Contactos asociados" heading inside the contact-manager-section (Spanish — AC #1)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const cliente = buildCliente({
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Empresa Heading Test CMP',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: "Contactos asociados" heading is visible inside the section
    await waitFor(() => {
      const section = screen.getByTestId('contact-manager-section');
      expect(section).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/contactos asociados/i)).toBeInTheDocument();
    });
  });

  it('should NOT render contact-manager-section when clienteId is undefined (no client selected)', () => {
    // GIVEN: No MSW handler needed — no fetch occurs when clienteId is undefined

    // WHEN: ClienteDetailView is rendered with clienteId={undefined}
    renderClienteDetailView(undefined);

    // THEN: contact-manager-section is NOT in the DOM (ContactManager only shown when client loaded)
    expect(screen.queryByTestId('contact-manager-section')).not.toBeInTheDocument();
  });

  it('should NOT render contact-manager-section while client data is still loading', async () => {
    // GIVEN: Client fetch is delayed (simulating loading state)
    const clienteId = '33333333-3333-3333-3333-333333333333';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, async () => {
        // Delay response — ContactManager should not appear during loading
        return new Promise((resolve) => {
          setTimeout(() => resolve(HttpResponse.json(buildCliente({ id: clienteId }))), 10000);
        });
      })
    );

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(clienteId);

    // THEN: contact-manager-section is NOT visible while loading
    // (ContactManager only renders after client data has loaded)
    expect(screen.queryByTestId('contact-manager-section')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-1-CMP-2 (P1) — ClienteContactServiceAdapter constructed with active clienteId
// AC #1: ContactManager uses ClienteContactServiceAdapter wired to GET /api/v1/contactos?clienteId=:id
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ClienteContactServiceAdapter wiring (TC-E4-4-1-CMP-2)', () => {
  it('TC-E4-4-1-CMP-2: GET /api/v1/contactos should be called with clienteId query param when ContactManager is rendered', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — spy on the clienteId param
    const cliente = buildCliente({
      id: '44444444-4444-4444-4444-444444444444',
      nombre: 'Empresa Adapter Wiring CMP',
    });

    let capturedClienteId: string | null = null;

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        capturedClienteId = url.searchParams.get('clienteId');
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView renders with clienteId
    renderClienteDetailView(cliente.id);

    // Wait for contact-manager-section to appear (triggers the adapter fetch)
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // THEN: The contactos endpoint was called with the correct clienteId (adapter is wired)
    expect(capturedClienteId).toBe(cliente.id);
  });

  it('should NOT call GET /api/v1/contactos when clienteId is undefined (no adapter instantiated)', () => {
    // GIVEN: A handler that fails loudly if called
    let wasCalled = false;
    server.use(
      http.get(CONTACTOS_URL, () => {
        wasCalled = true;
        return HttpResponse.json({}, { status: 500 });
      })
    );

    // WHEN: ClienteDetailView renders with undefined clienteId
    renderClienteDetailView(undefined);

    // THEN: No contactos request was made (ContactManager is not rendered without a client)
    expect(wasCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-1-CMP-3 (P1) — Empty contacts array → ContactManager shows empty state
// AC #2: ContactManager displays empty state when no contacts linked
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ContactManager empty state (TC-E4-4-1-CMP-3)', () => {
  it('TC-E4-4-1-CMP-3: should display empty state in ContactManager when GET contactos?clienteId= returns empty array', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — contactos returns [] (AC #2: 200 OK + [])
    const cliente = buildCliente({
      id: '55555555-5555-5555-5555-555555555555',
      nombre: 'Empresa Vacia CMP',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([]);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView renders with a clienteId that has no contacts
    renderClienteDetailView(cliente.id);

    // THEN: contact-manager-section is visible
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // AND: ContactManager shows an empty state (AC #2 — no contacts linked yet)
    // ContactManager from siesa-ui-kit renders empty state when contacts array is []
    await waitFor(() => {
      const section = screen.getByTestId('contact-manager-section');
      expect(section).toBeInTheDocument();
      // Empty state text (siesa-ui-kit ContactManager — Spanish locale)
      const emptyStateText = section.textContent ?? '';
      const hasEmptyState =
        /no hay contactos|sin contactos|no contacts|no tiene contactos/i.test(emptyStateText);
      expect(hasEmptyState).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-1-CMP-4 (P1) — GET contactos 500 → ContactManager shows error state + retry
// AC #3: ContactManager displays error state with retry option when fetch fails
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ContactManager error state (TC-E4-4-1-CMP-4)', () => {
  it('TC-E4-4-1-CMP-4: should display error state with a retry option in ContactManager when GET contactos?clienteId= returns 500', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — contactos fetch returns 500 (AC #3)
    const cliente = buildCliente({
      id: '66666666-6666-6666-6666-666666666666',
      nombre: 'Empresa Error Contactos CMP',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView renders — contactos fetch will fail
    renderClienteDetailView(cliente.id);

    // THEN: contact-manager-section is still visible (wrapper always present when client loaded)
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // AND: ContactManager shows error state (AC #3)
    // siesa-ui-kit ContactManager renders error state with retry
    await waitFor(() => {
      const section = screen.getByTestId('contact-manager-section');
      // Error state: either an error text or a retry button is rendered
      const retryButton = section.querySelector('[data-testid="retry-button"], button');
      const errorText = section.textContent ?? '';
      const hasErrorState =
        /error|no se pudo|error al cargar/i.test(errorText) ||
        retryButton !== null;
      expect(hasErrorState).toBe(true);
    });
  });

  it('should show existing client fields (Nombre, NIT) even when ContactManager is in error state (regression guard)', async () => {
    // GIVEN: Client fetch succeeds but contactos fetch fails
    const cliente = buildCliente({
      id: '77777777-7777-7777-7777-777777777777',
      nombre: 'Empresa Error Campos Preservados',
      nit: '900888777-6',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, () => new HttpResponse(null, { status: 500 }))
    );

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(cliente.id);

    // THEN: Client nombre is still visible (Story 2.2 regression)
    await waitFor(() => {
      expect(screen.getByText('Empresa Error Campos Preservados')).toBeInTheDocument();
    });

    // AND: NIT is visible
    await waitFor(() => {
      expect(screen.getByText('900888777-6')).toBeInTheDocument();
    });

    // AND: ContactManager section is present (even in error state)
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-1-CMP-5 (P1) — useContactosByCliente with valid clienteId calls correct URL
// AC #1: hook calls GET /api/v1/contactos?clienteId=:id
// ─────────────────────────────────────────────────────────────────────────────

describe('useContactosByCliente hook — valid clienteId (TC-E4-4-1-CMP-5)', () => {
  it('TC-E4-4-1-CMP-5: should call GET /api/v1/contactos?clienteId=:id and return contact array when clienteId is defined', async () => {
    // GIVEN: NETWORK intercepted BEFORE hook render (network-first pattern)
    const clienteId = '88888888-8888-8888-8888-888888888888';
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Hook Contact Test',
      clienteId,
    });

    let capturedClienteId: string | null = null;

    // CRITICAL: Intercept BEFORE hook render
    server.use(
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        capturedClienteId = url.searchParams.get('clienteId');
        return HttpResponse.json([contacto]);
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: useContactosByCliente is rendered with a valid clienteId
    const { result } = renderHook(() => useContactosByCliente(clienteId), { wrapper });

    // THEN: Hook fetches data and returns contact array
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // AND: The API was called with the correct clienteId query param
    expect(capturedClienteId).toBe(clienteId);

    // AND: The returned data contains the expected contact
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe(contacto.id);
    expect(result.current.data?.[0]?.nombre).toBe(contacto.nombre);
  });

  it('useContactosByCliente query key must be [contactos, { clienteId }] — canonical key per architecture', async () => {
    // GIVEN: NETWORK intercepted BEFORE hook render
    const clienteId = '99999999-9999-9999-9999-999999999999';

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: useContactosByCliente is rendered
    const { result } = renderHook(() => useContactosByCliente(clienteId), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: The query cache entry uses the canonical key ['contactos', { clienteId }]
    const cacheKeys = queryClient.getQueryCache().getAll().map((q) => q.queryKey);
    expect(cacheKeys).toContainEqual(['contactos', { clienteId }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-1-CMP-6 (P1) — useContactosByCliente with undefined does NOT fire HTTP request
// AC #1: enabled: !!clienteId guard — no fetch when clienteId is undefined
// ─────────────────────────────────────────────────────────────────────────────

describe('useContactosByCliente hook — undefined clienteId (TC-E4-4-1-CMP-6)', () => {
  it('TC-E4-4-1-CMP-6: should NOT call GET /api/v1/contactos when clienteId is undefined (enabled: !!clienteId guard)', () => {
    // GIVEN: A handler that fails loudly if called
    let wasCalled = false;
    server.use(
      http.get(CONTACTOS_URL, () => {
        wasCalled = true;
        return HttpResponse.json([], { status: 500 });
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: useContactosByCliente is rendered with undefined
    renderHook(() => useContactosByCliente(undefined), { wrapper });

    // THEN: No HTTP request was made (enabled: !!clienteId = false)
    expect(wasCalled).toBe(false);
  });

  it('should return isLoading=false and data=undefined when clienteId is undefined', () => {
    // GIVEN: No network handler needed

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: useContactosByCliente with undefined
    const { result } = renderHook(() => useContactosByCliente(undefined), { wrapper });

    // THEN: Hook is in idle state — not fetching, no data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
  });
});
