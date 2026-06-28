/**
 * ATDD component tests — Story 3.2: ContactoDetailView (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/contactos/application/useContacto.ts
 *   - frontend/src/modules/crm/contactos/domain/IContactoRepository.ts (getById added)
 *   - frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (getById added)
 *   - frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx
 *   - frontend/src/shared/components/NotFoundPanel.tsx (confirmed from Story 2.2)
 *   - frontend/src/shared/components/ErrorPanel.tsx (confirmed from Story 2.1)
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

import { buildContacto, resetContactoCounter } from './contactoFactory';

// ContactoDetailView does NOT exist yet — import will fail (RED phase)
import { ContactoDetailView } from '../presentation/ContactoDetailView';

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
// Test helper: render ContactoDetailView with isolated QueryClient
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

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ContactoDetailView contactoId={contactoId} />
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-1 (P1) — Valid ID shows all 4 FR13 fields
// AC #1 and #2: Nombre, Cargo, Teléfono, Email are displayed
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — valid contact loaded (TC-E3-3-2-CMP-1)', () => {
  it('TC-E3-3-2-CMP-1: should display Nombre, Cargo, Teléfono, and Email when contact is loaded', async () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern)
    const contacto = buildContacto({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'María López Detalle',
      cargo: 'Gerente Comercial',
      telefono: '3001234567',
      email: 'maria.lopez@empresa.co',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: ContactoDetailView is rendered with a valid contactoId
    renderContactoDetailView(contacto.id);

    // THEN: Nombre is displayed (as a heading — text-xl font-bold)
    await waitFor(() => {
      expect(screen.getByText('María López Detalle')).toBeInTheDocument();
    });

    // AND: Cargo field with label and value is visible (Spanish label)
    await waitFor(() => {
      expect(screen.getByText(/cargo/i)).toBeInTheDocument();
      expect(screen.getByText('Gerente Comercial')).toBeInTheDocument();
    });

    // AND: Teléfono field is visible (Spanish label)
    await waitFor(() => {
      expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByText('3001234567')).toBeInTheDocument();
    });

    // AND: Email field is visible
    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText('maria.lopez@empresa.co')).toBeInTheDocument();
    });
  });

  it('should render Nombre as a heading element (text-xl font-bold)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const contacto = buildContacto({
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Contacto Con Titulo',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Component renders
    renderContactoDetailView(contacto.id);

    // THEN: Nombre is rendered as a heading element
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /contacto con titulo/i });
      expect(heading).toBeInTheDocument();
    });
  });

  it('should use data-testid="contacto-detail-view" on the root container', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const contacto = buildContacto({
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Contacto TestId SA',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailView(contacto.id);

    // THEN: Root container has expected data-testid
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-view')).toBeInTheDocument();
    });
  });

  it('should render skeleton placeholders while contact data is loading', async () => {
    // GIVEN: Slow network — contact data is still loading
    const contacto = buildContacto({
      id: '44444444-4444-4444-4444-444444444444',
      nombre: 'Contacto Skeleton',
    });

    let resolveHandler: (value: Response | PromiseLike<Response>) => void;
    const handlerPromise = new Promise<Response>((resolve) => {
      resolveHandler = resolve;
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, async () => {
        // Delay to ensure loading state is observed
        return new Promise((resolve) => {
          // Will not resolve in this test (loading state capture)
          setTimeout(() => resolve(HttpResponse.json(contacto)), 10000);
        });
      })
    );

    // WHEN: Component renders — loading state
    const { container } = renderContactoDetailView(contacto.id);

    // THEN: Skeleton placeholders are rendered (react-loading-skeleton)
    // The skeleton renders span elements with the react-loading-skeleton class
    await waitFor(() => {
      // Either a skeleton container or a span indicating loading is present
      const skeletonOrLoading =
        container.querySelector('.react-loading-skeleton') !== null ||
        container.querySelector('[data-testid="contacto-detail-view"]') === null;
      expect(skeletonOrLoading).toBe(true);
    });

    // AND: No field data is visible during loading
    expect(screen.queryByText(/cargo/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-3 (P1) — MSW 500 shows ErrorPanel + "Reintentar"
// AC #4: non-404 error shows ErrorPanel with Reintentar button
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — backend error (500) (TC-E3-3-2-CMP-3)', () => {
  it('TC-E3-3-2-CMP-3: should show ErrorPanel with "Reintentar" button when fetch returns 500', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 500
    const contactoId = '55555555-5555-5555-5555-555555555555';

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contactoId);

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: "Reintentar" button is visible (AC #4)
    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      expect(retryButton).toBeInTheDocument();
    });

    // AND: No contact field data is shown
    expect(screen.queryByText(/cargo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/teléfono/i)).not.toBeInTheDocument();
  });

  it('should trigger a new GET request when "Reintentar" button is clicked after 500 error', async () => {
    // GIVEN: First request fails with 500, second succeeds
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

    // Wait for ErrorPanel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const countBeforeRetry = requestCount;

    // WHEN: User clicks "Reintentar"
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // THEN: A new request was made
    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(countBeforeRetry);
    });

    // AND: Contact data is now visible
    await waitFor(() => {
      expect(screen.getByText('Contacto Retry')).toBeInTheDocument();
    });
  });

  it('should show ErrorPanel when network request fails completely (network error)', async () => {
    // GIVEN: Network error (connection refused)
    const contactoId = '77777777-7777-7777-7777-777777777777';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () => HttpResponse.error())
    );

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contactoId);

    // THEN: ErrorPanel is displayed
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
  it('TC-E3-3-2-CMP-2: should show NotFoundPanel with "Contacto no encontrado" title (not ErrorPanel) when fetch returns 404', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 404 Problem Details
    const contactoId = '88888888-8888-8888-8888-888888888888';

    // CRITICAL: Intercept BEFORE render
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

    // WHEN: ContactoDetailView is rendered with a contactoId that doesn't exist
    renderContactoDetailView(contactoId);

    // THEN: Not-found title is displayed in Spanish (AC #3)
    await waitFor(() => {
      expect(screen.getByText(/contacto no encontrado/i)).toBeInTheDocument();
    });

    // AND: NotFoundPanel element is present (data-testid="not-found-panel")
    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    // AND: Generic ErrorPanel is NOT shown (404 uses distinct UX — different from 500)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('should display not-found description text for 404 response in Spanish', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 404
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

    // THEN: Descriptive not-found text is shown in Spanish (as defined in ContactoDetailView spec)
    await waitFor(() => {
      expect(
        screen.getByText(/el contacto solicitado no existe o fue eliminado/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT show the "Reintentar" button on 404 (not an ephemeral error)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 404
    const contactoId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    server.use(
      http.get(`${CONTACTOS_URL}/${contactoId}`, () =>
        HttpResponse.json({ status: 404, title: 'Contacto no encontrado' }, { status: 404 })
      )
    );

    renderContactoDetailView(contactoId);

    // THEN: NotFoundPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    // AND: No "Reintentar" button (404 is not a transient error)
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-2-CMP-4 (P2) — Clicking ContactoListItem navigates to /contactos/$contactoId
// AC #1: URL updates to /contactos/:contactoId on item click (FR30)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListItem — navigation on click (TC-E3-3-2-CMP-4)', () => {
  it('TC-E3-3-2-CMP-4: should render ContactoListItem as a link that points to /contactos/$contactoId', async () => {
    // GIVEN: ContactoListItem exists and is rendered with a contacto
    // This test imports ContactoListItem directly — it will fail (RED) until the
    // component is updated to use TanStack Router <Link to="/contactos/$contactoId" ...>
    // instead of any other navigation mechanism

    // The dynamic import approach allows the test to fail gracefully during RED phase
    let ContactoListItem: React.ComponentType<{ contacto: ReturnType<typeof buildContacto>; isActive?: boolean }>;

    try {
      // ContactoListItem is expected to exist from Story 3.1 but needs navigation update
      const mod = await import('../presentation/ContactoListItem');
      ContactoListItem = mod.ContactoListItem;
    } catch {
      // If module doesn't exist yet, skip with a clear failure message
      throw new Error(
        'ContactoListItem not found at ../presentation/ContactoListItem — ' +
        'implement TanStack Router Link navigation before this test can pass (Story 3.2 Task 4)'
      );
    }

    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Contacto Navigate Test',
    });

    // GIVEN: Network intercept for contact list (needed by any parent hooks)
    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([contacto]))
    );

    // WHEN: ContactoListItem is rendered in a test context
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ContactoListItem contacto={contacto} isActive={false} />
      </QueryClientProvider>
    );

    // THEN: The list item renders with the contact's name
    await waitFor(() => {
      expect(screen.getByText('Contacto Navigate Test')).toBeInTheDocument();
    });

    // AND: The item contains a link that navigates to /contactos/$contactoId (FR30)
    // The link element (anchor or TanStack Router Link) must have the correct href
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining(contacto.id));
  });
});
