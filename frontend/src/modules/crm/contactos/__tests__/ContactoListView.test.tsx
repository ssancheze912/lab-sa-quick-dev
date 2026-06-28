/**
 * ATDD component tests — Story 3.1: ContactoListView (RED phase)
 * Updated in Story 3.2: ContactoListItem now uses TanStack Router Link.
 *
 * Test IDs:
 *   TC-E3-3-1-CMP-1 (P0) — 1,000 records — search filter executes ≤150ms (NFR1 R-003)
 *   TC-E3-3-1-CMP-2 (P1) — Search by nombre partial match filters list
 *   TC-E3-3-1-CMP-3 (P1) — Search by email partial match filters list
 *   TC-E3-3-1-CMP-4 (P1) — Empty data shows EmptyState, no list items
 *   TC-E3-3-1-CMP-5 (P1) — MSW 500 shows ErrorPanel + "Reintentar" button
 *   TC-E3-3-1-CMP-6 (P1) — Click "Reintentar" triggers new GET /api/v1/contactos
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router';

import { buildContacto, buildContactoList, resetContactoCounter } from './contactoFactory';
import { ContactoListView } from '../presentation/ContactoListView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress console.error for expected React query errors in test environment
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first pattern: handlers registered before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoListView with isolated QueryClient + Router
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoListView() {
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
        <ContactoListView />
      </QueryClientProvider>
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

  const result = render(<RouterProvider router={router} />);

  return { ...result, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-1-CMP-1 (P0) — 1,000 records filter executes ≤150ms (NFR1 R-003)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — performance (NFR1 R-003)', () => {
  it('TC-E3-3-1-CMP-1: should filter 1,000 records in ≤150ms when user types in search field', async () => {
    const largeList = buildContactoList(1000);

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json(largeList))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1000);
    }, { timeout: 10000 });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);

    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'María' } });
    const elapsed = performance.now() - start;

    await waitFor(() => {
      const items = screen.queryAllByTestId('contacto-list-item');
      const emptyState = screen.queryByTestId('empty-state');
      expect(items.length < 1000 || emptyState !== null).toBe(true);
    });

    expect(elapsed).toBeLessThanOrEqual(150);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-1-CMP-2 (P1) — Search by nombre partial match filters list
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — search filter by nombre', () => {
  it('TC-E3-3-1-CMP-2: should show only matching items when user types nombre in search field', async () => {
    const contactos = [
      buildContacto({ nombre: 'Ana Gómez Única', email: 'ana.gomez@test.co' }),
      buildContacto({ nombre: 'Pedro Ramírez', email: 'pedro.ramirez@test.co' }),
      buildContacto({ nombre: 'Laura Sánchez', email: 'laura.sanchez@test.co' }),
    ];

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json(contactos))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'Ana Gómez Única' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('contacto-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Ana Gómez Única');
    });

    expect(screen.queryByText('Pedro Ramírez')).not.toBeInTheDocument();
    expect(screen.queryByText('Laura Sánchez')).not.toBeInTheDocument();
  });

  it('should show all items when search field is cleared', async () => {
    const contactos = [
      buildContacto({ nombre: 'Ana Gómez', email: 'ana@test.co' }),
      buildContacto({ nombre: 'Pedro Ramírez', email: 'pedro@test.co' }),
    ];

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json(contactos))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'Ana' } });

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
    });

    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-1-CMP-3 (P1) — Search by email partial match filters list
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — search filter by email', () => {
  it('TC-E3-3-1-CMP-3: should show only matching items when user types email fragment in search field', async () => {
    const contactos = [
      buildContacto({ nombre: 'Carlos Torres', email: 'carlos.torres.unico@empresa.co' }),
      buildContacto({ nombre: 'Valentina Castro', email: 'valentina.castro@empresa.co' }),
      buildContacto({ nombre: 'Andrés Vargas', email: 'andres.vargas@empresa.co' }),
    ];

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json(contactos))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'carlos.torres.unico' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('contacto-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Carlos Torres');
    });

    expect(screen.queryByText('Valentina Castro')).not.toBeInTheDocument();
    expect(screen.queryByText('Andrés Vargas')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-1-CMP-4 (P1) — Empty data shows EmptyState, no list items
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — empty state', () => {
  it('TC-E3-3-1-CMP-4: should show EmptyState component and no list items when data is empty', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-1-CMP-5 (P1) — MSW 500 shows ErrorPanel + "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — error state', () => {
  it('TC-E3-3-1-CMP-5: should show ErrorPanel with "Reintentar" button when fetch returns 500', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => new HttpResponse(null, { status: 500 }))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();

    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
  });

  it('should show ErrorPanel when network request fails completely', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.error())
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-CMP-6 (P1) — Click "Reintentar" triggers new GET request
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E3-3-1-CMP-6: should trigger a new GET request when "Reintentar" button is clicked', async () => {
    let requestCount = 0;

    server.use(
      http.get(CONTACTOS_URL, () => {
        requestCount += 1;
        if (requestCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json([buildContacto({ nombre: 'María López', email: 'maria@test.co' })]);
      })
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const initialRequestCount = requestCount;

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(initialRequestCount);
    });

    await waitFor(() => {
      expect(screen.getByTestId('contacto-list-item')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListView — list item structure (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — list item structure', () => {
  it('should render each contact item with Nombre, Cargo, and Email visible', async () => {
    const contacto = buildContacto({
      nombre: 'María López',
      cargo: 'Gerente Comercial',
      email: 'maria.lopez@empresa.co',
    });

    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([contacto]))
    );

    renderContactoListView();

    await waitFor(() => {
      const item = screen.getByTestId('contacto-list-item');
      expect(item).toHaveTextContent('María López');
      expect(item).toHaveTextContent('Gerente Comercial');
      expect(item).toHaveTextContent('maria.lopez@empresa.co');
    });
  });

  it('should render the search input with Spanish placeholder text', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    renderContactoListView();

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/buscar por nombre o email/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should render the section heading "Contactos" in Spanish', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => HttpResponse.json([]))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contactos/i })).toBeInTheDocument();
    });
  });
});
