/**
 * ATDD component tests — Story 3.2: ContactoDetailView
 *
 * Test IDs:
 *   TC-E3-3-2-CMP-1 (P1) — ContactoDetailView with valid ID shows Nombre, Cargo, Teléfono, Email
 *   TC-E3-3-2-CMP-2 (P2) — ContactoDetailView with MSW 404 shows NotFoundPanel "Contacto no encontrado"
 *   TC-E3-3-2-CMP-3 (P1) — ContactoDetailView with MSW 500 shows ErrorPanel + "Reintentar"
 *   TC-E3-3-2-CMP-4 (P2) — Clicking ContactoListItem navigates to /contactos/$contactoId
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
// MSW server setup (network-first: handlers registered before tests run)
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
// TC-E3-3-2-CMP-1 (P1) — Valid ID shows all 4 FR13 fields
// AC #1 and #2: Nombre, Cargo, Teléfono, Email are displayed
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — valid contact loaded (TC-E3-3-2-CMP-1)', () => {
  it('TC-E3-3-2-CMP-1: should display Nombre, Cargo, Teléfono, and Email when contact is loaded', async () => {
    const contacto = buildContacto({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'María López Detalle',
      cargo: 'Gerente Comercial',
      telefono: '3001234567',
      email: 'maria.lopez@empresa.co',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText('María López Detalle')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/cargo/i)).toBeInTheDocument();
      expect(screen.getByText('Gerente Comercial')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByText('3001234567')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText('maria.lopez@empresa.co')).toBeInTheDocument();
    });
  });

  it('should render Nombre as a heading element (text-xl font-bold)', async () => {
    const contacto = buildContacto({
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Contacto Con Titulo',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /contacto con titulo/i });
      expect(heading).toBeInTheDocument();
    });
  });

  it('should use data-testid="contacto-detail-view" on the root container', async () => {
    const contacto = buildContacto({
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Contacto TestId SA',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-view')).toBeInTheDocument();
    });
  });

  it('should render skeleton placeholders while contact data is loading', async () => {
    const contacto = buildContacto({
      id: '44444444-4444-4444-4444-444444444444',
      nombre: 'Contacto Skeleton',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(HttpResponse.json(contacto)), 10000);
        });
      })
    );

    const { container } = renderContactoDetailView(contacto.id);

    await waitFor(() => {
      const skeletonOrLoading =
        container.querySelector('.react-loading-skeleton') !== null ||
        container.querySelector('[data-testid="contacto-detail-view"]') === null;
      expect(skeletonOrLoading).toBe(true);
    });

    expect(screen.queryByText(/cargo/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-3 (P1) — MSW 500 shows ErrorPanel + "Reintentar"
// AC #4: non-404 error shows ErrorPanel with Reintentar button
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — backend error (500) (TC-E3-3-2-CMP-3)', () => {
  it('TC-E3-3-2-CMP-3: should show ErrorPanel with "Reintentar" button when fetch returns 500', async () => {
    const contactoId = '55555555-5555-5555-5555-555555555555';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      expect(retryButton).toBeInTheDocument();
    });

    expect(screen.queryByText(/cargo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/teléfono/i)).not.toBeInTheDocument();
  });

  it('should trigger a new GET request when "Reintentar" button is clicked after 500 error', async () => {
    const contactoId = '66666666-6666-6666-6666-666666666666';
    const contacto = buildContacto({
      id: contactoId,
      nombre: 'Contacto Retry',
    });

    let requestCount = 0;
    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () => {
        requestCount += 1;
        if (requestCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(contacto);
      })
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const countBeforeRetry = requestCount;

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(countBeforeRetry);
    });

    await waitFor(() => {
      expect(screen.getByText('Contacto Retry')).toBeInTheDocument();
    });
  });

  it('should show ErrorPanel when network request fails completely (network error)', async () => {
    const contactoId = '77777777-7777-7777-7777-777777777777';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () => HttpResponse.error())
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-2 (P2) — MSW 404 shows NotFoundPanel "Contacto no encontrado"
// AC #3: not-found renders NotFoundPanel, NOT ErrorPanel
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — 404 not found (TC-E3-3-2-CMP-2)', () => {
  it('TC-E3-3-2-CMP-2: should show NotFoundPanel with "Contacto no encontrado" (not ErrorPanel) when fetch returns 404', async () => {
    const contactoId = '88888888-8888-8888-8888-888888888888';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Contacto no encontrado',
            status: 404,
            detail: 'El contacto solicitado no fue encontrado.',
          },
          { status: 404 }
        )
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByText(/contacto no encontrado/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('should display not-found description text for 404 response in Spanish', async () => {
    const contactoId = '99999999-9999-9999-9999-999999999999';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        HttpResponse.json(
          {
            title: 'Contacto no encontrado',
            status: 404,
            detail: 'El contacto solicitado no fue encontrado.',
          },
          { status: 404 }
        )
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(
        screen.getByText(/el contacto solicitado no existe o fue eliminado/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT show the "Reintentar" button on 404 (not an ephemeral error)', async () => {
    const contactoId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        HttpResponse.json({ status: 404, title: 'Contacto no encontrado' }, { status: 404 })
      )
    );

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-4 (P2) — Clicking ContactoListItem navigates to /contactos/$contactoId
// AC #1: URL updates to /contactos/:contactoId on item click (FR30)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListItem — navigation on click (TC-E3-3-2-CMP-4)', () => {
  it('TC-E3-3-2-CMP-4: should render ContactoListItem as a link that points to /contactos/$contactoId', async () => {
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Contacto Navigate Test',
    });

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([contacto]))
    );

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
      expect(screen.getByText('Contacto Navigate Test')).toBeInTheDocument();
    });

    // AND: The item contains a link that navigates to /contactos/$contactoId (FR30)
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining(contacto.id));
  });
});
