/**
 * Edge-case component tests — Story 3.2: ContactoDetailView
 * Expands ATDD coverage with boundary conditions, error paths, and accessibility cases.
 *
 * Test IDs:
 *   TC-E3-3-2-CMP-EC-1 (P1) — useContacto is disabled when contactoId is empty string
 *   TC-E3-3-2-CMP-EC-2 (P1) — ContactoDetailView does NOT show clienteId (only 4 FR13 fields)
 *   TC-E3-3-2-CMP-EC-3 (P1) — Fields use Spanish labels (Cargo, Teléfono, Email — dt elements)
 *   TC-E3-3-2-CMP-EC-4 (P1) — 401 HTTP status renders ErrorPanel (not NotFoundPanel)
 *   TC-E3-3-2-CMP-EC-5 (P1) — 403 HTTP status renders ErrorPanel (not NotFoundPanel)
 *   TC-E3-3-2-CMP-EC-6 (P2) — ContactoListItem renders aria-current="page" when isActive=true
 *   TC-E3-3-2-CMP-EC-7 (P2) — ContactoListItem does NOT render aria-current when isActive=false
 *   TC-E3-3-2-CMP-EC-8 (P2) — ContactoDetailView with special characters in nombre renders correctly
 *   TC-E3-3-2-CMP-EC-9 (P2) — ContactoDetailView with 503 HTTP status renders ErrorPanel
 *   TC-E3-3-2-CMP-EC-10 (P2) — ErrorPanel message is in Spanish (no se pudo cargar el contacto)
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router';

import { buildContacto, resetContactoCounter } from './contactoFactory';
import { ContactoDetailView } from '../presentation/ContactoDetailView';
import { ContactoListItem } from '../presentation/ContactoListItem';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoDetailView with isolated QueryClient + Router
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoDetailView(contactoId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contactoId} />
      </QueryClientProvider>
    ),
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
  });

  const result = render(<RouterProvider router={router} />);
  return { ...result, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-1 (P1) — useContacto is disabled when contactoId is empty string
// Boundary: enabled: !!id — empty string is falsy, so no fetch should occur
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — empty contactoId boundary (TC-E3-3-2-CMP-EC-1)', () => {
  it('TC-E3-3-2-CMP-EC-1: should not make any API request when contactoId is empty string', async () => {
    let fetchCalled = false;

    server.use(
      http.get(`${CONTACTOS_URL}/:id`, () => {
        fetchCalled = true;
        return HttpResponse.json({});
      })
    );

    renderContactoDetailView('');

    // Wait a tick to ensure no async request fires
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-2 (P1) — ContactoDetailView does NOT show clienteId (only 4 FR13 fields)
// Scope: FR13 specifies exactly Nombre, Cargo, Teléfono, Email — clienteId is infrastructure-only
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — FR13 field scope (TC-E3-3-2-CMP-EC-2)', () => {
  it('TC-E3-3-2-CMP-EC-2: should NOT display clienteId in the rendered detail card', async () => {
    const contacto = buildContacto({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Ana Scope Test',
      cargo: 'Coordinadora',
      telefono: '3101112233',
      email: 'ana.scope@empresa.co',
      clienteId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText('Ana Scope Test')).toBeInTheDocument();
    });

    // clienteId must NOT appear in the rendered output
    expect(
      screen.queryByText(/clienteId/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/ffffffff-ffff-ffff-ffff-ffffffffffff/i)
    ).not.toBeInTheDocument();
    // createdAt and updatedAt must NOT appear as visible fields
    expect(screen.queryByText(/createdAt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/updatedAt/i)).not.toBeInTheDocument();
  });

  it('should display exactly 3 field labels (Cargo, Teléfono, Email) in addition to the Nombre heading', async () => {
    const contacto = buildContacto({
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Campos Exactos',
      cargo: 'Analista',
      telefono: '3001234567',
      email: 'campos@empresa.co',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    const { container } = renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-view')).toBeInTheDocument();
    });

    // There should be exactly 3 dt elements (field labels for Cargo, Teléfono, Email)
    const dtElements = container.querySelectorAll('dt');
    expect(dtElements).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-3 (P1) — Field labels in Spanish using dt elements
// Enforcement: All user-facing text in Spanish (architecture Spanish text rule)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — Spanish dt labels (TC-E3-3-2-CMP-EC-3)', () => {
  it('TC-E3-3-2-CMP-EC-3: should render field labels as dt elements with Spanish text', async () => {
    const contacto = buildContacto({
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Pedro Labels Test',
      cargo: 'Supervisor',
      telefono: '3151234567',
      email: 'pedro.labels@empresa.co',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    const { container } = renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-view')).toBeInTheDocument();
    });

    // Field labels must be in Spanish and rendered as dt elements
    const dtElements = container.querySelectorAll('dt');
    const dtTexts = Array.from(dtElements).map((el) => el.textContent?.toLowerCase() ?? '');

    expect(dtTexts.some((t) => t.includes('cargo'))).toBe(true);
    expect(dtTexts.some((t) => t.includes('tel'))).toBe(true); // Teléfono
    expect(dtTexts.some((t) => t.includes('email'))).toBe(true);

    // No English labels
    expect(dtTexts.some((t) => t.includes('phone'))).toBe(false);
    expect(dtTexts.some((t) => t.includes('position'))).toBe(false);
    expect(dtTexts.some((t) => t.includes('title'))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-4 (P1) — 401 Unauthorized renders ErrorPanel (not NotFoundPanel)
// Boundary: Only 404 should show NotFoundPanel; all other 4xx/5xx show ErrorPanel
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — 401 Unauthorized (TC-E3-3-2-CMP-EC-4)', () => {
  it('TC-E3-3-2-CMP-EC-4: should show ErrorPanel (not NotFoundPanel) when fetch returns 401', async () => {
    const contactoId = '44444444-4444-4444-4444-444444444444';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // Must NOT show NotFoundPanel for a 401
    expect(screen.queryByTestId('not-found-panel')).not.toBeInTheDocument();
    // Must NOT show contact data
    expect(screen.queryByTestId('contacto-detail-view')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-5 (P1) — 403 Forbidden renders ErrorPanel (not NotFoundPanel)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — 403 Forbidden (TC-E3-3-2-CMP-EC-5)', () => {
  it('TC-E3-3-2-CMP-EC-5: should show ErrorPanel (not NotFoundPanel) when fetch returns 403', async () => {
    const contactoId = '55555555-5555-5555-5555-555555555555';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        new HttpResponse(null, { status: 403 })
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('not-found-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contacto-detail-view')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-6 (P2) — ContactoListItem renders aria-current="page" when active
// Accessibility: active item indicates current page for screen readers
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListItem — aria-current when active (TC-E3-3-2-CMP-EC-6)', () => {
  it('TC-E3-3-2-CMP-EC-6: should render aria-current="page" on the link when isActive=true', async () => {
    const contacto = buildContacto({
      id: '66666666-6666-6666-6666-666666666666',
      nombre: 'Activo Test',
    });

    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => (
        <ul>
          <ContactoListItem contacto={contacto} isActive={true} />
        </ul>
      ),
    });
    const contactosDetailRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/contactos/$contactoId',
      component: () => null,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, contactosDetailRoute]),
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Activo Test')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /ver contacto activo test/i });
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-7 (P2) — ContactoListItem does NOT render aria-current when inactive
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListItem — no aria-current when inactive (TC-E3-3-2-CMP-EC-7)', () => {
  it('TC-E3-3-2-CMP-EC-7: should NOT render aria-current attribute when isActive=false', async () => {
    const contacto = buildContacto({
      id: '77777777-7777-7777-7777-777777777777',
      nombre: 'Inactivo Test',
    });

    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => (
        <ul>
          <ContactoListItem contacto={contacto} isActive={false} />
        </ul>
      ),
    });
    const contactosDetailRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/contactos/$contactoId',
      component: () => null,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, contactosDetailRoute]),
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Inactivo Test')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /ver contacto inactivo test/i });
    // aria-current must be absent when not active
    expect(link).not.toHaveAttribute('aria-current');
  });

  it('should NOT render aria-current when isActive prop is omitted (default false)', async () => {
    const contacto = buildContacto({
      id: '88888888-8888-8888-8888-888888888888',
      nombre: 'Default Activo Test',
    });

    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => (
        <ul>
          {/* isActive omitted — defaults to false */}
          <ContactoListItem contacto={contacto} />
        </ul>
      ),
    });
    const contactosDetailRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/contactos/$contactoId',
      component: () => null,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, contactosDetailRoute]),
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Default Activo Test')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /ver contacto default activo test/i });
    expect(link).not.toHaveAttribute('aria-current');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-8 (P2) — Special characters in nombre render correctly
// Boundary: Spanish names with accents/tildes (e.g., "María Ángela González")
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — special characters in fields (TC-E3-3-2-CMP-EC-8)', () => {
  it('TC-E3-3-2-CMP-EC-8: should render correctly when nombre, cargo contain Spanish special characters', async () => {
    const contacto = buildContacto({
      id: '99999999-9999-9999-9999-999999999999',
      nombre: 'María Ángela González',
      cargo: 'Gerente de Área Técnica',
      telefono: '3001234567',
      email: 'maria.angela@empresa.co',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText('María Ángela González')).toBeInTheDocument();
    });

    expect(screen.getByText('Gerente de Área Técnica')).toBeInTheDocument();
    expect(screen.getByText('maria.angela@empresa.co')).toBeInTheDocument();
  });

  it('should handle nombre with a single word correctly (no spaces)', async () => {
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Valentina',
      cargo: 'CEO',
      telefono: '3159876543',
      email: 'valentina@empresa.co',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /valentina/i })).toBeInTheDocument();
    });

    expect(screen.getByText('CEO')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-9 (P2) — 503 Service Unavailable renders ErrorPanel
// Boundary: Verifies generic 5xx errors are treated as recoverable (Reintentar)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — 503 Service Unavailable (TC-E3-3-2-CMP-EC-9)', () => {
  it('TC-E3-3-2-CMP-EC-9: should show ErrorPanel with Reintentar button on 503 response', async () => {
    const contactoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        new HttpResponse(null, { status: 503 })
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    expect(screen.queryByTestId('not-found-panel')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-EC-10 (P2) — ErrorPanel message is in Spanish
// Enforcement: All user-facing text must be in Spanish (architecture rule)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — Spanish error message (TC-E3-3-2-CMP-EC-10)', () => {
  it('TC-E3-3-2-CMP-EC-10: should display Spanish error message in ErrorPanel on non-404 error', async () => {
    const contactoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // The error message in ContactoDetailView is "No se pudo cargar el contacto."
    expect(
      screen.getByText(/no se pudo cargar el contacto/i)
    ).toBeInTheDocument();

    // Must NOT display English fallback message
    expect(
      screen.queryByText(/could not load/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/failed to fetch/i)
    ).not.toBeInTheDocument();
  });

  it('should display Spanish not-found description in NotFoundPanel on 404', async () => {
    const contactoId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        HttpResponse.json(
          { title: 'Contacto no encontrado', status: 404 },
          { status: 404 }
        )
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    // Title and description must be in Spanish
    expect(screen.getByText(/contacto no encontrado/i)).toBeInTheDocument();
    expect(
      screen.getByText(/el contacto solicitado no existe o fue eliminado/i)
    ).toBeInTheDocument();
  });
});
