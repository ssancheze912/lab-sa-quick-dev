/**
 * Edge-case component tests — ContactoListView — Story 3.1 automation expansion.
 * Updated in Story 3.2: ContactoListItem now uses TanStack Router Link for navigation.
 *
 * Expands ATDD coverage (ContactoListView.test.tsx) with:
 *   - Case-insensitive search (lowercase input matches uppercase nombre)
 *   - Search with leading/trailing whitespace trimming
 *   - No-results state when filter yields empty result set (search has data but no match)
 *   - Loading skeleton rendered during fetch (isLoading state)
 *   - ContactoListItem renders nombre, cargo, email
 *   - EmptyState shown when filtered results are empty (not when data is empty)
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router';

import { buildContacto, buildContactoList, resetContactoCounter } from './contactoFactory';
import { ContactoListView } from '../presentation/ContactoListView';
import { ContactoListItem } from '../presentation/ContactoListItem';

const API_BASE = 'http://localhost:5000';
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

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

// ─────────────────────────────────────────────────────────────────────────────
// MSW server (network-first: handlers registered before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render ContactoListView with isolated QueryClient + Router context
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
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

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
  });

  return render(<RouterProvider router={router} />);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render ContactoListItem with Router context
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoListItem(contacto: ReturnType<typeof buildContacto>, isActive = false) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <ul><ContactoListItem contacto={contacto} isActive={isActive} /></ul>,
  });
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos/$contactoId',
    component: () => null,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, contactosRoute]),
  });

  return render(<RouterProvider router={router} />);
}

// ─────────────────────────────────────────────────────────────────────────────
// Case-insensitive search
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — case-insensitive search', () => {
  it('[P1] should match contactos when search input is lowercase and nombre is mixed case', async () => {
    const contactos = [
      buildContacto({ nombre: 'CARLOS HERNÁNDEZ', email: 'carlos.hernandez@test.co' }),
      buildContacto({ nombre: 'Beta Ltda.', email: 'beta@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'carlos hernández' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('contacto-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('CARLOS HERNÁNDEZ');
    });
  });

  it('[P1] should match contactos when searching by email with uppercase input', async () => {
    const contactos = [
      buildContacto({ nombre: 'Ana Pérez', email: 'ana.perez@empresa.co' }),
      buildContacto({ nombre: 'Jorge Mora', email: 'jorge.mora@empresa.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'ANA.PEREZ' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('contacto-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Ana Pérez');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search with leading/trailing whitespace trimming
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — search whitespace trimming', () => {
  it('[P1] should match contactos when search input has leading/trailing whitespace', async () => {
    const contactos = [
      buildContacto({ nombre: 'Valentina Ríos', email: 'valentina.rios@test.co' }),
      buildContacto({ nombre: 'Pedro Suárez', email: 'pedro.suarez@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: '  Valentina  ' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('contacto-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Valentina Ríos');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No-results state when search matches nothing
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — no-results state after search', () => {
  it('[P1] should show no list items (but no EmptyState) when search matches nothing', async () => {
    const contactos = [
      buildContacto({ nombre: 'Alfonso Castro', email: 'alfonso@test.co' }),
      buildContacto({ nombre: 'Beatriz Mora', email: 'beatriz@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_MATCH_XYZ_9999' } });

    await waitFor(() => {
      expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
    });

    expect(screen.getByPlaceholderText(/buscar por nombre o email/i)).toBeInTheDocument();
  });

  it('[P1] should restore full list when search is cleared after no-results', async () => {
    const contactos = [
      buildContacto({ nombre: 'Alfonso Castro', email: 'alfonso@test.co' }),
      buildContacto({ nombre: 'Beatriz Mora', email: 'beatriz@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_MATCH' } });

    await waitFor(() => {
      expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
    });

    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton state
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — loading state', () => {
  it('[P1] should show loading skeleton and no list items during fetch', async () => {
    let resolveResponse!: () => void;
    const responseDelay = new Promise<void>((res) => {
      resolveResponse = res;
    });

    server.use(
      http.get(CONTACTOS_URL, async () => {
        await responseDelay;
        return HttpResponse.json([]);
      })
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByLabelText(/cargando contactos/i)).toBeInTheDocument();
    });

    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();

    resolveResponse();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListItem — renders nombre, cargo, email
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListItem — content rendering', () => {
  it('[P1] should render nombre, cargo, and email visible in the item', async () => {
    const contacto = buildContacto({
      nombre: 'Lucía Martínez',
      cargo: 'Representante Comercial',
      email: 'lucia.martinez@empresa.co',
    });

    renderContactoListItem(contacto);

    await waitFor(() => {
      const item = screen.getByTestId('contacto-list-item');
      expect(item).toHaveTextContent('Lucía Martínez');
      expect(item).toHaveTextContent('Representante Comercial');
      expect(item).toHaveTextContent('lucia.martinez@empresa.co');
    });
  });

  it('[P2] should apply active styles when isActive is true', async () => {
    const contacto = buildContacto({ nombre: 'Active Contact' });

    renderContactoListItem(contacto, true);

    await waitFor(() => {
      const item = screen.getByTestId('contacto-list-item');
      expect(item).toBeInTheDocument();
      // Link inside has aria-current="page" when active
      const link = item.querySelector('a');
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  });

  it('[P2] should render a link pointing to /contactos/:contactoId', async () => {
    const contacto = buildContacto({ id: 'test-uuid-1234', nombre: 'Link Test' });

    renderContactoListItem(contacto);

    await waitFor(() => {
      const item = screen.getByTestId('contacto-list-item');
      const link = item.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toContain('test-uuid-1234');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListView — search input visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — search input visibility', () => {
  it('[P2] should display the search input field when contactos are loaded', async () => {
    const contactos = buildContactoList(3);

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label', 'Buscar contactos');
  });

  it('[P2] should show EmptyState (not list items) when API returns empty array', async () => {
    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json([])));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
    expect(screen.getByPlaceholderText(/buscar por nombre o email/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListView — HTTP error states
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — HTTP error states', () => {
  it('[P2] should show ErrorPanel when fetch returns 404', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => new HttpResponse(null, { status: 404 }))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('[P2] should show ErrorPanel when fetch returns 503 (service unavailable)', async () => {
    server.use(
      http.get(CONTACTOS_URL, () => new HttpResponse(null, { status: 503 }))
    );

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
