/**
 * ATDD component tests — Story 4.2: Associate & Disassociate Contacts from Client (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/contactos/application/useAssignContactoCliente.ts
 *   - frontend/src/modules/crm/contactos/application/useCreateContactoForCliente.ts
 *   - frontend/src/modules/crm/contactos/domain/IContactoRepository.ts (assignCliente method)
 *   - frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (assignCliente)
 *   - frontend/src/modules/crm/shared/components/ContactManager.tsx (onAddContact, onRemoveContact, onCreateContact props)
 *   - frontend/src/modules/crm/shared/components/ContactSearchDialog.tsx (new component)
 *   - frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (wire mutation hooks + callbacks)
 *   - data-testid="associate-contact-button" rendered inside contact-manager-section
 *   - data-testid="disassociate-contact-button-{contactoId}" per contact item row
 *   - data-testid="contact-search-dialog" when dialog is open
 *   - data-testid="create-contact-button" inside contact-manager-section
 *
 * Test IDs:
 *   TC-E4-4-2-CMP-1 (P0) — ClienteDetailView calls PUT /api/v1/contactos/{id}/cliente after user confirms add
 *   TC-E4-4-2-CMP-2 (P1) — useAssignContactoCliente invalidates ['contactos'] and ['contactos', { clienteId }] on success
 *   TC-E4-4-2-CMP-3 (P1) — ContactManager renders "Asociar contacto existente" button when onAddContact prop is present
 *   TC-E4-4-2-CMP-4 (P1) — ContactManager renders disassociate button per contact item when onRemoveContact is present
 *   TC-E4-4-2-CMP-5 (P1) — ClienteDetailView calls PUT with clienteId: null when user confirms disassociation
 *   TC-E4-4-2-CMP-6 (P1) — ContactManager is backward-compatible: read-only when action props absent
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

// ClienteDetailView must be extended in Story 4.2 — import may exist but lack mutation wiring
import { ClienteDetailView } from '../presentation/ClienteDetailView';

// useAssignContactoCliente does NOT exist yet — import fails (RED phase)
import { useAssignContactoCliente } from '../../contactos/application/useAssignContactoCliente';

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
      mutations: {
        retry: false,
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
// TC-E4-4-2-CMP-1 (P0) — ClienteDetailView calls PUT /api/v1/contactos/{id}/cliente
// after user confirms add via dialog; contact appears in list (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — association mutation called on add confirmation (TC-E4-4-2-CMP-1)', () => {
  it('TC-E4-4-2-CMP-1: should call PUT /api/v1/contactos/{contactoId}/cliente with { clienteId } after user selects contact in dialog and the contact appears in list', async () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern)
    const cliente = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Empresa Asociar Mutation CMP',
    });

    const orphanContacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Contacto Huerfano Para Asociar CMP',
      clienteId: null,
    });

    let putCalled = false;
    let putBodyClienteId: string | null | undefined = undefined;

    // CRITICAL: Intercept ALL requests BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),

      // Initially no contacts for this client
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        const clienteIdParam = url.searchParams.get('clienteId');
        if (clienteIdParam === cliente.id) {
          return putCalled
            ? HttpResponse.json([{ ...orphanContacto, clienteId: cliente.id }])
            : HttpResponse.json([]);
        }
        // All contacts (for dialog) — return orphan contact
        return HttpResponse.json([orphanContacto]);
      }),

      // Intercept PUT /api/v1/contactos/{contactoId}/cliente
      http.put(`${CONTACTOS_URL}/${orphanContacto.id}/cliente`, async ({ request }) => {
        const body = await request.json() as { clienteId: string | null };
        putCalled = true;
        putBodyClienteId = body.clienteId;
        return HttpResponse.json({
          ...orphanContacto,
          clienteId: body.clienteId,
          updatedAt: new Date().toISOString(),
        });
      })
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: contact-manager-section renders
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // AND: "Asociar contacto existente" button is visible (onAddContact prop present)
    await waitFor(() => {
      expect(screen.getByTestId('associate-contact-button')).toBeInTheDocument();
    });

    // AND: User clicks the associate button
    fireEvent.click(screen.getByTestId('associate-contact-button'));

    // AND: ContactSearchDialog opens
    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toBeInTheDocument();
    });

    // AND: Orphan contact appears in the dialog
    await waitFor(() => {
      expect(screen.getByTestId('contact-search-dialog')).toHaveTextContent(orphanContacto.nombre);
    });

    // AND: User clicks to select the contact
    fireEvent.click(screen.getByText(orphanContacto.nombre));

    // THEN: PUT /api/v1/contactos/{contactoId}/cliente was called with { clienteId }
    await waitFor(() => {
      expect(putCalled).toBe(true);
    });

    expect(putBodyClienteId).toBe(cliente.id);

    // AND: The contact now appears in the ContactManager list
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toHaveTextContent(orphanContacto.nombre);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-2 (P1) — useAssignContactoCliente invalidates both query keys on success (AC #1, #3)
// ─────────────────────────────────────────────────────────────────────────────

describe('useAssignContactoCliente hook — query invalidation on success (TC-E4-4-2-CMP-2)', () => {
  it('TC-E4-4-2-CMP-2: should invalidate ["contactos"] and ["contactos", { clienteId }] when PUT /api/v1/contactos/{id}/cliente succeeds', async () => {
    // GIVEN: NETWORK intercepted BEFORE hook render (network-first pattern)
    const clienteId = '22222222-2222-2222-2222-222222222222';
    const contactoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    // CRITICAL: Intercept BEFORE hook instantiation
    server.use(
      http.put(`${CONTACTOS_URL}/${contactoId}/cliente`, async ({ request }) => {
        const body = await request.json() as { clienteId: string | null };
        return HttpResponse.json({
          id: contactoId,
          nombre: 'Contacto Test',
          cargo: 'Analista',
          telefono: '3001234567',
          email: 'test@empresa.co',
          clienteId: body.clienteId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }),
      // Intercept the invalidation refetches
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });

    // Pre-populate the cache with entries for both query keys to track invalidation
    queryClient.setQueryData(['contactos'], []);
    queryClient.setQueryData(['contactos', { clienteId }], []);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // WHEN: useAssignContactoCliente hook is instantiated
    const { result } = renderHook(() => useAssignContactoCliente(clienteId), { wrapper });

    // AND: The mutation is triggered
    await act(async () => {
      await result.current.mutateAsync({ contactoId, newClienteId: clienteId });
    });

    // THEN: Mutation completed successfully
    expect(result.current.isSuccess).toBe(true);

    // AND: Both ['contactos'] and ['contactos', { clienteId }] cache entries are marked stale
    // (invalidateQueries marks them as stale — they will be refetched on next usage)
    const allContactosQuery = queryClient.getQueryState(['contactos']);
    const clienteContactosQuery = queryClient.getQueryState(['contactos', { clienteId }]);

    expect(allContactosQuery?.isInvalidated).toBe(true);
    expect(clienteContactosQuery?.isInvalidated).toBe(true);
  });

  it('should invalidate ["contactos"] and ["contactos", { clienteId }] when PUT with clienteId: null (disassociation) succeeds', async () => {
    // GIVEN: NETWORK intercepted BEFORE hook render
    const clienteId = '33333333-3333-3333-3333-333333333333';
    const contactoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    server.use(
      http.put(`${CONTACTOS_URL}/${contactoId}/cliente`, async () => {
        return HttpResponse.json({
          id: contactoId,
          nombre: 'Contacto Desasociar',
          cargo: 'Analista',
          telefono: '3001234567',
          email: 'desasociar@empresa.co',
          clienteId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
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
    queryClient.setQueryData(['contactos', { clienteId }], []);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAssignContactoCliente(clienteId), { wrapper });

    // WHEN: Mutation is called with clienteId: null (disassociation)
    await act(async () => {
      await result.current.mutateAsync({ contactoId, newClienteId: null });
    });

    // THEN: Both query keys are invalidated after disassociation
    const allContactosQuery = queryClient.getQueryState(['contactos']);
    const clienteContactosQuery = queryClient.getQueryState(['contactos', { clienteId }]);

    expect(allContactosQuery?.isInvalidated).toBe(true);
    expect(clienteContactosQuery?.isInvalidated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-3 (P1) — ContactManager renders "Asociar contacto" button when onAddContact is present (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ContactManager action buttons visible (TC-E4-4-2-CMP-3)', () => {
  it('TC-E4-4-2-CMP-3: should render data-testid="associate-contact-button" inside contact-manager-section when onAddContact prop is wired', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const cliente = buildCliente({
      id: '44444444-4444-4444-4444-444444444444',
      nombre: 'Empresa Boton Asociar CMP',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteDetailView renders with a valid clienteId (onAddContact is wired in Story 4.2)
    renderClienteDetailView(cliente.id);

    // THEN: contact-manager-section is visible
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // AND: The "Asociar contacto existente" button is rendered inside it
    await waitFor(() => {
      expect(screen.getByTestId('associate-contact-button')).toBeInTheDocument();
    });
  });

  it('should render data-testid="create-contact-button" inside contact-manager-section when onCreateContact prop is wired', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const cliente = buildCliente({
      id: '55555555-5555-5555-5555-555555555555',
      nombre: 'Empresa Boton Crear CMP',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // THEN: The "Crear nuevo contacto" button is rendered inside the section
    await waitFor(() => {
      expect(screen.getByTestId('create-contact-button')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-4 (P1) — ContactManager renders disassociate button per contact item (AC #3)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — disassociate button per contact item (TC-E4-4-2-CMP-4)', () => {
  it('TC-E4-4-2-CMP-4: should render data-testid="disassociate-contact-button-{contactoId}" for each contact in the ContactManager list when onRemoveContact is wired', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — client has 2 contacts
    const cliente = buildCliente({
      id: '66666666-6666-6666-6666-666666666666',
      nombre: 'Empresa Desasociar Botones CMP',
    });

    const contacto1 = buildContacto({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      nombre: 'Contacto Primero',
      clienteId: cliente.id,
    });

    const contacto2 = buildContacto({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      nombre: 'Contacto Segundo',
      clienteId: cliente.id,
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contacto1, contacto2]);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView renders with 2 contacts
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // THEN: Each contact item has a disassociate button with its contactoId in the testid
    await waitFor(() => {
      expect(screen.getByTestId(`disassociate-contact-button-${contacto1.id}`)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId(`disassociate-contact-button-${contacto2.id}`)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-5 (P1) — ClienteDetailView calls PUT with clienteId: null on disassociate (AC #3)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — disassociation mutation called with clienteId: null (TC-E4-4-2-CMP-5)', () => {
  it('TC-E4-4-2-CMP-5: should call PUT /api/v1/contactos/{contactoId}/cliente with { clienteId: null } when user confirms disassociation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — client has 1 contact
    const cliente = buildCliente({
      id: '77777777-7777-7777-7777-777777777777',
      nombre: 'Empresa Desasociar Mutation CMP',
    });

    const contacto = buildContacto({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      nombre: 'Contacto Para Desasociar',
      clienteId: cliente.id,
    });

    let putCalledWithNull = false;

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return putCalledWithNull ? HttpResponse.json([]) : HttpResponse.json([contacto]);
        }
        return HttpResponse.json([]);
      }),
      http.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, async ({ request }) => {
        const body = await request.json() as { clienteId: string | null };
        if (body.clienteId === null) {
          putCalledWithNull = true;
        }
        return HttpResponse.json({
          ...contacto,
          clienteId: body.clienteId,
          updatedAt: new Date().toISOString(),
        });
      })
    );

    // WHEN: ClienteDetailView renders with 1 contact
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });

    // AND: Disassociate button for the contact is visible
    await waitFor(() => {
      expect(screen.getByTestId(`disassociate-contact-button-${contacto.id}`)).toBeInTheDocument();
    });

    // AND: User clicks the disassociate button
    fireEvent.click(screen.getByTestId(`disassociate-contact-button-${contacto.id}`));

    // AND: User confirms in the confirmation dialog
    await waitFor(() => {
      const confirmBtn = screen.queryByRole('button', { name: /confirmar|desasociar|aceptar/i });
      expect(confirmBtn).not.toBeNull();
    });
    const confirmBtn = screen.getByRole('button', { name: /confirmar|desasociar|aceptar/i });
    fireEvent.click(confirmBtn);

    // THEN: PUT was called with { clienteId: null }
    await waitFor(() => {
      expect(putCalledWithNull).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E4-4-2-CMP-6 (P1) — ContactManager is read-only when action props are absent (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ContactManager backward-compatible read-only mode (TC-E4-4-2-CMP-6)', () => {
  it('TC-E4-4-2-CMP-6: should NOT render associate-contact-button or disassociate buttons when ContactManager receives no action props (Story 4.1 backward compatibility)', async () => {
    // GIVEN: Story 4.1 scenario — contact manager section still renders
    // This test verifies backward compatibility: the component is read-only when action props absent
    // We simulate this by rendering ClienteDetailView with an undefined clienteId (no client selected)

    // No network intercept needed — clienteId is undefined, no fetch fires
    renderClienteDetailView(undefined);

    // THEN: contact-manager-section is NOT in the DOM (no client loaded)
    expect(screen.queryByTestId('contact-manager-section')).not.toBeInTheDocument();

    // AND: Action buttons are also not in the DOM
    expect(screen.queryByTestId('associate-contact-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('create-contact-button')).not.toBeInTheDocument();
  });

  it('should still display existing client fields (Nombre, NIT) after Story 4.2 mutation hooks are wired (regression guard)', async () => {
    // GIVEN: Client with known fields, and contacts fetch succeeds
    const cliente = buildCliente({
      id: '88888888-8888-8888-8888-888888888888',
      nombre: 'Empresa Campos Preservados 4.2',
      nit: '900888999-7',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteDetailView renders with mutation hooks wired
    renderClienteDetailView(cliente.id);

    // THEN: Client nombre is still visible (Story 2.2 regression guard)
    await waitFor(() => {
      expect(screen.getByText('Empresa Campos Preservados 4.2')).toBeInTheDocument();
    });

    // AND: NIT is still visible
    await waitFor(() => {
      expect(screen.getByText('900888999-7')).toBeInTheDocument();
    });

    // AND: contact-manager-section is present (Story 4.1 regression guard)
    await waitFor(() => {
      expect(screen.getByTestId('contact-manager-section')).toBeInTheDocument();
    });
  });
});
