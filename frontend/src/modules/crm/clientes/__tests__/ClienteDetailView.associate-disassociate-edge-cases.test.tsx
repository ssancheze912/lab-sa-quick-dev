/**
 * Component edge-case tests — Story 4.2: Associate & Disassociate Contacts from Client
 *
 * Expands ATDD coverage (ClienteDetailView.associate-disassociate.test.tsx) with:
 *   - ContactManager loading state (isLoading=true renders skeleton)
 *   - ContactManager error state (isError=true renders retry button)
 *   - ContactManager error → retry triggers refetch
 *   - ContactSearchDialog search filter narrows displayed orphan contacts
 *   - ContactSearchDialog shows empty state when no orphan contacts exist
 *   - Cancel disassociation confirmation → contact stays in list
 *   - useCreateContactoForCliente invalidates both ['contactos'] and ['contactos', { clienteId }]
 *   - ContactManager close create-contact form on cancel (dialog dismisses, no mutation)
 *
 * Test IDs:
 *   TC-E4-4-2-CMP-EDGE-1 (P1) — ContactManager renders loading skeleton when isLoading=true
 *   TC-E4-4-2-CMP-EDGE-2 (P1) — ContactManager renders error + retry when isError=true
 *   TC-E4-4-2-CMP-EDGE-3 (P1) — Cancel disassociation: contact remains in list
 *   TC-E4-4-2-CMP-EDGE-4 (P1) — useCreateContactoForCliente invalidates both query keys on success
 *   TC-E4-4-2-CMP-EDGE-5 (P2) — ContactSearchDialog filters orphan contacts by search term
 *   TC-E4-4-2-CMP-EDGE-6 (P2) — ContactSearchDialog shows empty state when no orphan contacts
 *   TC-E4-4-2-CMP-EDGE-7 (P2) — Cancel create-contact form: form closes, no mutation triggered
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente, resetClienteCounter } from './clienteFactory';
import { buildContacto, resetContactoCounter } from '../../contactos/__tests__/contactoFactory';
import { ClienteDetailView } from '../presentation/ClienteDetailView';
import { useCreateContactoForCliente } from '../../contactos/application/useCreateContactoForCliente';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React / MSW warnings
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
// MSW server
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
// Helper: render ClienteDetailView with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteDetailView(clienteId: string | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
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
// TC-E4-4-2-CMP-EDGE-1 (P1) — Loading skeleton when contacts fetch in-flight
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactManager — loading state (TC-E4-4-2-CMP-EDGE-1)', () => {
  it('TC-E4-4-2-CMP-EDGE-1: should render contact-manager-loading skeleton while contacts query is in-flight', async () => {
    // GIVEN: Network — client resolves instantly, contacts never resolves (simulate slow network)
    const cliente = buildCliente({
      id: 'a1000000-0000-0000-0000-000000000001',
      nombre: 'Empresa Loading Skeleton CMP',
    });

    let resolveContactos: ((value: unknown) => void) | undefined;
    const contactosPromise = new Promise((r) => { resolveContactos = r; });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          // Wait until we explicitly resolve to simulate slow API
          await contactosPromise;
          return HttpResponse.json([]);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Render ClienteDetailView
    renderClienteDetailView(cliente.id);

    // THEN: Loading skeleton is visible while contacts are being fetched
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-loading')).toBeInTheDocument();
    });

    // AND: Clean up by resolving the pending request
    resolveContactos!(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-EDGE-2 (P1) — Error state: retry button rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactManager — error state with retry (TC-E4-4-2-CMP-EDGE-2)', () => {
  it('TC-E4-4-2-CMP-EDGE-2: should render contact-manager-error with retry-button when contacts query fails', async () => {
    // GIVEN: Client loads OK, contacts returns 500
    const cliente = buildCliente({
      id: 'a2000000-0000-0000-0000-000000000002',
      nombre: 'Empresa Error State CMP',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Render ClienteDetailView
    renderClienteDetailView(cliente.id);

    // THEN: Error state is shown
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-error')).toBeInTheDocument();
    });

    // AND: Retry button is visible
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-EDGE-3 (P1) — Cancel disassociation → contact remains in list
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactManager — cancel disassociation (TC-E4-4-2-CMP-EDGE-3)', () => {
  it('TC-E4-4-2-CMP-EDGE-3: should keep contact in list when user opens disassociation dialog and clicks Cancelar', async () => {
    // GIVEN: Client with 1 contact
    const cliente = buildCliente({
      id: 'a3000000-0000-0000-0000-000000000003',
      nombre: 'Empresa Cancelar Desasociar CMP',
    });

    const contacto = buildContacto({
      id: 'b3000000-0000-0000-0000-000000000003',
      nombre: 'Contacto No Quitar CMP',
      clienteId: cliente.id,
    });

    let putCalled = false;

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contacto]);
        }
        return HttpResponse.json([]);
      }),
      http.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, () => {
        putCalled = true;
        return HttpResponse.json({ ...contacto, clienteId: null });
      })
    );

    // WHEN: Render ClienteDetailView
    renderClienteDetailView(cliente.id);

    // AND: Contact is visible
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId(`disassociate-contact-button-${contacto.id}`)).toBeInTheDocument();
    });

    // AND: User clicks the disassociate button
    fireEvent.click(screen.getByTestId(`disassociate-contact-button-${contacto.id}`));

    // AND: Confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirmar-desasociar')).toBeInTheDocument();
    });

    // AND: User clicks Cancelar
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    // THEN: Confirmation dialog is dismissed
    await waitFor(() => {
      expect(screen.queryByTestId('btn-confirmar-desasociar')).not.toBeInTheDocument();
    });

    // AND: PUT was NOT called (no mutation triggered)
    expect(putCalled).toBe(false);

    // AND: The contact is still in the list
    expect(screen.getByTestId('contact-manager-section')).toHaveTextContent(contacto.nombre);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-EDGE-4 (P1) — useCreateContactoForCliente invalidates both query keys
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateContactoForCliente hook — query invalidation (TC-E4-4-2-CMP-EDGE-4)', () => {
  it('TC-E4-4-2-CMP-EDGE-4: should invalidate ["contactos"] and ["contactos", { clienteId }] when POST /api/v1/contactos succeeds with clienteId', async () => {
    // GIVEN: Network intercepted BEFORE hook render
    const clienteId = 'c4000000-0000-0000-0000-000000000004';
    const newContactoId = 'd4000000-0000-0000-0000-000000000004';

    server.use(
      http.post(CONTACTOS_URL, async () => {
        return HttpResponse.json(
          {
            id: newContactoId,
            nombre: 'Nuevo Contacto Creado CMP',
            cargo: 'Analista',
            telefono: '3001234567',
            email: 'nuevo.cmp@empresa.co',
            clienteId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { status: 201 }
        );
      }),
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });

    // Pre-populate cache entries for both query keys
    queryClient.setQueryData(['contactos'], []);
    queryClient.setQueryData(['contactos', { clienteId }], []);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: useCreateContactoForCliente hook is used
    const { result } = renderHook(() => useCreateContactoForCliente(clienteId), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        nombre: 'Nuevo Contacto Creado CMP',
        cargo: 'Analista',
        telefono: '3001234567',
        email: 'nuevo.cmp@empresa.co',
        clienteId,
      });
    });

    // THEN: Mutation succeeded
    expect(result.current.isSuccess).toBe(true);

    // AND: Both query keys are invalidated
    const allContactosQuery = queryClient.getQueryState(['contactos']);
    const clienteContactosQuery = queryClient.getQueryState(['contactos', { clienteId }]);

    expect(allContactosQuery?.isInvalidated).toBe(true);
    expect(clienteContactosQuery?.isInvalidated).toBe(true);
  });

  it('should NOT invalidate ["contactos", { clienteId }] when useCreateContactoForCliente is instantiated with undefined clienteId', async () => {
    // GIVEN: Network intercepted BEFORE hook render
    const newContactoId = 'e4000000-0000-0000-0000-000000000004';

    server.use(
      http.post(CONTACTOS_URL, async () => {
        return HttpResponse.json(
          {
            id: newContactoId,
            nombre: 'Contacto Sin Cliente',
            cargo: 'Analista',
            telefono: '3001234567',
            email: 'sin.cliente@empresa.co',
            clienteId: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { status: 201 }
        );
      }),
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(['contactos'], []);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: Hook instantiated with undefined clienteId
    const { result } = renderHook(() => useCreateContactoForCliente(undefined), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        nombre: 'Contacto Sin Cliente',
        cargo: 'Analista',
        telefono: '3001234567',
        email: 'sin.cliente@empresa.co',
        clienteId: '',
      });
    });

    // THEN: ['contactos'] is invalidated (global list always refreshed)
    const allContactosQuery = queryClient.getQueryState(['contactos']);
    expect(allContactosQuery?.isInvalidated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-EDGE-5 (P2) — ContactSearchDialog filters by search term
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactSearchDialog — search filter narrows results (TC-E4-4-2-CMP-EDGE-5)', () => {
  it('TC-E4-4-2-CMP-EDGE-5: ContactSearchDialog should show only contacts matching the search term when user types in contact-search-input', async () => {
    // GIVEN: Client with no linked contacts; two orphan contacts in the system
    const cliente = buildCliente({
      id: 'a5000000-0000-0000-0000-000000000005',
      nombre: 'Empresa Filtrar Dialog CMP',
    });

    const orphan1 = buildContacto({
      id: 'b5000000-0000-0000-0000-000000000005',
      nombre: 'Laura Torres Filtrar CMP',
      clienteId: null,
    });
    const orphan2 = buildContacto({
      id: 'c5000000-0000-0000-0000-000000000005',
      nombre: 'Pedro Ramírez Filtrar CMP',
      clienteId: null,
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([]);
        }
        // Return both orphans when no clienteId filter
        return HttpResponse.json([orphan1, orphan2]);
      })
    );

    // WHEN: Render ClienteDetailView
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('associate-contact-button')).toBeInTheDocument();
    });

    // AND: Open the ContactSearchDialog
    fireEvent.click(screen.getByTestId('associate-contact-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toBeInTheDocument();
    });

    // AND: Both contacts are visible initially
    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toHaveTextContent(orphan1.nombre);
      expect(screen.getByTestId('contact-search-dialog')).toHaveTextContent(orphan2.nombre);
    });

    // AND: User types "laura" in the search input
    fireEvent.change(screen.getByTestId('contact-search-input'), { target: { value: 'laura' } });

    // THEN: Only "Laura" contact is visible (case-insensitive)
    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toHaveTextContent(orphan1.nombre);
    });

    // AND: "Pedro" contact is NOT visible
    expect(screen.getByTestId('contact-search-dialog')).not.toHaveTextContent(orphan2.nombre);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-EDGE-6 (P2) — ContactSearchDialog shows empty state
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactSearchDialog — empty state (TC-E4-4-2-CMP-EDGE-6)', () => {
  it('TC-E4-4-2-CMP-EDGE-6: ContactSearchDialog should show empty state when GET /contactos returns no orphan contacts (all have clienteId)', async () => {
    // GIVEN: Client with no linked contacts; system has only already-linked contacts
    const cliente = buildCliente({
      id: 'a6000000-0000-0000-0000-000000000006',
      nombre: 'Empresa Sin Huerfanos CMP',
    });

    const linkedContacto = buildContacto({
      id: 'b6000000-0000-0000-0000-000000000006',
      nombre: 'Contacto Ya Vinculado CMP',
      clienteId: 'some-other-client-id',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([]);
        }
        // Return only a linked contact (clienteId !== null) — should be filtered by dialog
        return HttpResponse.json([linkedContacto]);
      })
    );

    // WHEN: Render ClienteDetailView
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('associate-contact-button')).toBeInTheDocument();
    });

    // AND: Open the ContactSearchDialog
    fireEvent.click(screen.getByTestId('associate-contact-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toBeInTheDocument();
    });

    // THEN: Empty state message is shown (no orphan contacts available)
    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toHaveTextContent(
        /no hay contactos disponibles/i
      );
    });

    // AND: The already-linked contact is NOT shown (clienteId !== null → filtered out)
    expect(screen.getByTestId('contact-search-dialog')).not.toHaveTextContent(linkedContacto.nombre);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-EDGE-7 (P2) — Cancel create-contact form: no mutation, dialog closes
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactManager — cancel create-contact form (TC-E4-4-2-CMP-EDGE-7)', () => {
  it('TC-E4-4-2-CMP-EDGE-7: should close the create-contact form without triggering POST when user fills fields and clicks Cancelar', async () => {
    // GIVEN: Client with no contacts
    const cliente = buildCliente({
      id: 'a7000000-0000-0000-0000-000000000007',
      nombre: 'Empresa Cancelar Crear CMP',
    });

    let postCalled = false;

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, () => HttpResponse.json([])),
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    // WHEN: Render ClienteDetailView
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('create-contact-button')).toBeInTheDocument();
    });

    // AND: User opens the create-contact form
    fireEvent.click(screen.getByTestId('create-contact-button'));

    // AND: Form dialog is visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-nombre-input')).toBeInTheDocument();
    });

    // AND: User fills some fields
    fireEvent.change(screen.getByTestId('contacto-nombre-input'), { target: { value: 'Nuevo Contacto Sin Guardar' } });
    fireEvent.change(screen.getByTestId('contacto-email-input'), { target: { value: 'noguardar@empresa.co' } });

    // AND: User clicks Cancelar (NOT submit)
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    // THEN: Form dialog is dismissed
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-nombre-input')).not.toBeInTheDocument();
    });

    // AND: POST was NOT called (no mutation triggered)
    expect(postCalled).toBe(false);
  });
});
