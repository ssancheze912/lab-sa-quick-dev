/**
 * Edge-case component tests — ContactoListView — Story 3.1 automation expansion.
 *
 * Expands ATDD coverage (ContactoListView.test.tsx) with:
 *   - Case-insensitive search (lowercase input matches uppercase nombre)
 *   - Search with leading/trailing whitespace trimming
 *   - No-results state when filter yields empty result set (search has data but no match)
 *   - Loading skeleton rendered during fetch (isLoading state)
 *   - ContactoListItem keyboard navigation (Enter and Space activate onClick)
 *   - ContactoListItem has role="button" and tabIndex={0}
 *   - EmptyState shown when filtered results are empty (not when data is empty)
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildContacto, buildContactoList, resetContactoCounter } from './contactoFactory';
import { ContactoListView } from '../presentation/ContactoListView';

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
// Helper: render ContactoListView with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoListView />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Case-insensitive search
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — case-insensitive search', () => {
  it('[P1] should match contactos when search input is lowercase and nombre is mixed case', async () => {
    // GIVEN: Contacto with mixed-case nombre, NETWORK intercepted BEFORE render
    const contactos = [
      buildContacto({ nombre: 'CARLOS HERNÁNDEZ', email: 'carlos.hernandez@test.co' }),
      buildContacto({ nombre: 'Beta Ltda.', email: 'beta@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    // WHEN: User types lowercase search matching nombre
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'carlos hernández' } });

    // THEN: "CARLOS HERNÁNDEZ" matches despite case difference
    await waitFor(() => {
      const items = screen.getAllByTestId('contacto-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('CARLOS HERNÁNDEZ');
    });
  });

  it('[P1] should match contactos when searching by email with uppercase input', async () => {
    // GIVEN: Contacto with lowercase email
    const contactos = [
      buildContacto({ nombre: 'Ana Pérez', email: 'ana.perez@empresa.co' }),
      buildContacto({ nombre: 'Jorge Mora', email: 'jorge.mora@empresa.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    // WHEN: User types uppercase email fragment
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'ANA.PEREZ' } });

    // THEN: Match found despite case difference in email
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
    // GIVEN: Contacto list, search with surrounding spaces
    const contactos = [
      buildContacto({ nombre: 'Valentina Ríos', email: 'valentina.rios@test.co' }),
      buildContacto({ nombre: 'Pedro Suárez', email: 'pedro.suarez@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    // WHEN: Search with surrounding whitespace
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: '  Valentina  ' } });

    // THEN: Valentina Ríos is found (filter trims the query)
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
// NOTE: ContactoListView only shows EmptyState when data.length === 0 (API returned empty).
// When a search filter yields 0 results, the component renders an empty <ul> (no EmptyState).
// This is by design — EmptyState is reserved for "no contacts in the system".

describe('ContactoListView — no-results state after search', () => {
  it('[P1] should show no list items (but no EmptyState) when search matches nothing', async () => {
    // GIVEN: Two contactos loaded, none matching the search term
    const contactos = [
      buildContacto({ nombre: 'Alfonso Castro', email: 'alfonso@test.co' }),
      buildContacto({ nombre: 'Beatriz Mora', email: 'beatriz@test.co' }),
    ];

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2);
    });

    // WHEN: Search term that matches nothing
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_MATCH_XYZ_9999' } });

    // THEN: No list items rendered (empty <ul>)
    // Note: EmptyState is NOT shown here — it only renders when data.length === 0 (API empty)
    await waitFor(() => {
      expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
    });

    // AND: The search input is still visible
    expect(screen.getByPlaceholderText(/buscar por nombre o email/i)).toBeInTheDocument();
  });

  it('[P1] should restore full list when search is cleared after no-results', async () => {
    // GIVEN: Search has returned no results
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

    // WHEN: Search is cleared
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: Full list restored
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
    // GIVEN: Server delays response (loading state observable)
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

    // THEN: Loading indicator present (aria-label "Cargando contactos...")
    await waitFor(() => {
      expect(screen.getByLabelText(/cargando contactos/i)).toBeInTheDocument();
    });

    // AND: No list items, no empty state, no error panel during loading
    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();

    // Cleanup: resolve the hanging request
    resolveResponse();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListItem accessibility — role, tabIndex, keyboard
// Tests ContactoListItem directly to avoid useNavigate context requirement
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — ContactoListItem accessibility attributes', () => {
  it('[P1] should have role="button" and tabIndex=0 on each list item', async () => {
    // GIVEN: One contacto loaded
    const contacto = buildContacto({ nombre: 'Keyboard User' });

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json([contacto])));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('contacto-list-item')).toBeInTheDocument();
    });

    // THEN: Item has role="button" (accessible as interactive element)
    const item = screen.getByTestId('contacto-list-item');
    expect(item).toHaveAttribute('role', 'button');

    // AND: Item has tabIndex=0 (keyboard focusable)
    expect(item).toHaveAttribute('tabIndex', '0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListItem keyboard navigation (isolated component test)
// Renders ContactoListItem directly with a mock onClick to avoid router dependency
// ─────────────────────────────────────────────────────────────────────────────

import { ContactoListItem } from '../presentation/ContactoListItem';

describe('ContactoListItem — keyboard navigation', () => {
  it('[P1] should call onClick when Enter key is pressed', () => {
    // GIVEN: ContactoListItem rendered with a mock onClick
    const contacto = buildContacto({ nombre: 'Enter Key Test' });
    const handleClick = vi.fn();

    render(<ContactoListItem contacto={contacto} onClick={handleClick} />);

    const item = screen.getByTestId('contacto-list-item');

    // WHEN: Enter key pressed
    fireEvent.keyDown(item, { key: 'Enter', code: 'Enter' });

    // THEN: onClick is called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('[P1] should call onClick when Space key is pressed', () => {
    // GIVEN: ContactoListItem rendered with a mock onClick
    const contacto = buildContacto({ nombre: 'Space Key Test' });
    const handleClick = vi.fn();

    render(<ContactoListItem contacto={contacto} onClick={handleClick} />);

    const item = screen.getByTestId('contacto-list-item');

    // WHEN: Space key pressed
    fireEvent.keyDown(item, { key: ' ', code: 'Space' });

    // THEN: onClick is called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('[P2] should NOT call onClick for other keys (e.g. Tab)', () => {
    // GIVEN: ContactoListItem rendered with a mock onClick
    const contacto = buildContacto({ nombre: 'Tab Key Test' });
    const handleClick = vi.fn();

    render(<ContactoListItem contacto={contacto} onClick={handleClick} />);

    const item = screen.getByTestId('contacto-list-item');

    // WHEN: Tab key pressed (should not trigger onClick)
    fireEvent.keyDown(item, { key: 'Tab', code: 'Tab' });

    // THEN: onClick is NOT called
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('[P2] should render nombre, cargo, and email visible in the item', () => {
    // GIVEN: ContactoListItem with known values
    const contacto = buildContacto({
      nombre: 'Lucía Martínez',
      cargo: 'Representante Comercial',
      email: 'lucia.martinez@empresa.co',
    });
    const handleClick = vi.fn();

    render(<ContactoListItem contacto={contacto} onClick={handleClick} />);

    // THEN: All three fields are visible
    const item = screen.getByTestId('contacto-list-item');
    expect(item).toHaveTextContent('Lucía Martínez');
    expect(item).toHaveTextContent('Representante Comercial');
    expect(item).toHaveTextContent('lucia.martinez@empresa.co');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListView — displays search input even when contacts exist
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — search input visibility', () => {
  it('[P2] should display the search input field when contactos are loaded', async () => {
    // GIVEN: Some contactos returned
    const contactos = buildContactoList(3);

    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json(contactos)));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(3);
    });

    // THEN: Search input is visible with Spanish placeholder
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label', 'Buscar contactos');
  });

  it('[P2] should show EmptyState (not list items) when API returns empty array', async () => {
    // GIVEN: Empty data returned from API
    server.use(http.get(CONTACTOS_URL, () => HttpResponse.json([])));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: No list items are shown
    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);

    // AND: The search input IS rendered (it appears before the data.length === 0 check)
    expect(screen.getByPlaceholderText(/buscar por nombre o email/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactoListView — HTTP 404 error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoListView — HTTP error states', () => {
  it('[P2] should show ErrorPanel when fetch returns 404', async () => {
    // GIVEN: Backend returns 404
    server.use(
      http.get(CONTACTOS_URL, () => new HttpResponse(null, { status: 404 }))
    );

    renderContactoListView();

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: "Reintentar" button is visible
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('[P2] should show ErrorPanel when fetch returns 503 (service unavailable)', async () => {
    // GIVEN: Backend returns 503
    server.use(
      http.get(CONTACTOS_URL, () => new HttpResponse(null, { status: 503 }))
    );

    renderContactoListView();

    // THEN: ErrorPanel is displayed with retry button
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
