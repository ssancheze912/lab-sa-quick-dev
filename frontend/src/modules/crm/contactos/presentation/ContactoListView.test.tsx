/**
 * Story 3.1: ContactoListView component — Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: View renders full-width list with Nombre (bold), Cargo, Email per contact item
 * - AC2: Search input filters list in real time (case-insensitive, nombre and email)
 * - AC3: EmptyState shown when API returns empty array; search input and list container still rendered
 * - AC4: ErrorPanel shown on fetch failure; "Reintentar" button triggers TanStack Query refetch
 * - NFR1 (R-001): Filter completes in < 1,000ms with 1,000 seeded contacts
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until implemented
import { ContactoListView } from './ContactoListView';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/contactos';

const buildContacto = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  nombre: 'Juan Pérez',
  cargo: 'Gerente Comercial',
  telefono: '3001234567',
  email: 'juan.perez@empresa.com',
  clienteId: null as string | null,
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T10:30:00Z',
  ...overrides,
});

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([buildContacto()])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

// ─── AC1: List renders with contact data ─────────────────────────────────────

describe('AC1 — ContactoListView renders contact list', () => {
  it('should render the list container', async () => {
    // GIVEN: API returns one contact
    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: The list container is present
    await waitFor(() => {
      expect(screen.getByTestId('contactos-list-container')).toBeInTheDocument();
    });
  });

  it('should render contact nombre in list item', async () => {
    // GIVEN: API returns a contact with known nombre
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ nombre: 'María García' })]),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: Contact nombre is visible
    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('should render contact cargo in list item', async () => {
    // GIVEN: API returns a contact with known cargo
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ cargo: 'Directora de Ventas' })]),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: Contact cargo is visible
    await waitFor(() => {
      expect(screen.getByText('Directora de Ventas')).toBeInTheDocument();
    });
  });

  it('should render contact email in list item', async () => {
    // GIVEN: API returns a contact with known email
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ email: 'm.garcia@freelance.com' })]),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: Contact email is visible
    await waitFor(() => {
      expect(screen.getByText('m.garcia@freelance.com')).toBeInTheDocument();
    });
  });

  it('should render the search input with aria-label in Spanish', async () => {
    // GIVEN: API returns contacts
    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: Search input is present with correct data-testid
    await waitFor(() => {
      expect(screen.getByTestId('contactos-search-input')).toBeInTheDocument();
    });
  });
});

// ─── AC2: Real-time search filtering ─────────────────────────────────────────

describe('AC2 — ContactoListView search filtering', () => {
  it('should filter list items by nombre substring', async () => {
    // GIVEN: API returns two contacts with different nombres
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildContacto({ id: '1', nombre: 'Ana Torres', email: 'ana@empresa.com' }),
          buildContacto({ id: '2', nombre: 'Luis Mendoza', email: 'luis@empresa.com' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2));

    // WHEN: User types 'Ana' in search
    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'Ana');

    // THEN: Only Ana Torres is shown
    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
  });

  it('should filter list items by email substring', async () => {
    // GIVEN: API returns two contacts with different emails
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildContacto({ id: '1', nombre: 'Carlos Ruiz', email: 'carlos@alpha.com' }),
          buildContacto({ id: '2', nombre: 'Diana Lopez', email: 'diana@beta.com' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2));

    // WHEN: User types an email substring
    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'beta.com');

    // THEN: Only Diana Lopez is shown
    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
    expect(screen.getByText('Diana Lopez')).toBeInTheDocument();
  });

  it('should perform case-insensitive filtering by nombre', async () => {
    // GIVEN: API returns a contact with mixed-case nombre
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ nombre: 'Valentina Sánchez' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1));

    // WHEN: User types lowercase nombre substring
    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'valentina');

    // THEN: The contact is still displayed
    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
  });

  it('should perform case-insensitive filtering by email', async () => {
    // GIVEN: API returns a contact with mixed-case email
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ email: 'Pedro.Gomez@Empresa.COM' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1));

    // WHEN: User types lowercase email substring
    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'pedro.gomez');

    // THEN: The contact is still displayed
    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
  });

  it('should show zero items when search matches nothing', async () => {
    // GIVEN: API returns one contact
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ nombre: 'Jorge Ramos' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1));

    // WHEN: User types a non-matching term
    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'ZZZNOMATCH');

    // THEN: No items displayed
    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
  });
});

// ─── AC3: EmptyState when data is empty ──────────────────────────────────────

describe('AC3 — EmptyState when no contacts', () => {
  it('should display EmptyState when API returns empty array', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: EmptyState component is visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should display Spanish guidance message in EmptyState', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: EmptyState has a message in Spanish about contacts
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByTestId('empty-state').textContent).toMatch(/contacto/i);
  });

  it('should not show contact list items when data is empty', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());

    // THEN: No list items are rendered
    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
  });

  it('should still render search input when data is empty', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: Search input is still present
    await waitFor(() => {
      expect(screen.getByTestId('contactos-search-input')).toBeInTheDocument();
    });
  });

  it('should still render list container when data is empty', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: List container is still rendered
    await waitFor(() => {
      expect(screen.getByTestId('contactos-list-container')).toBeInTheDocument();
    });
  });
});

// ─── AC4: ErrorPanel and retry ────────────────────────────────────────────────

describe('AC4 — ErrorPanel on fetch failure', () => {
  it('should display ErrorPanel when API returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ContactoListView));

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should display "Reintentar" button inside ErrorPanel', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Component is rendered and error panel shown
    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    // THEN: "Reintentar" button is present
    const retryBtn = screen.getByTestId('error-panel-retry-button');
    expect(retryBtn).toBeInTheDocument();
  });

  it('should call refetch when "Reintentar" button is clicked', async () => {
    // GIVEN: API returns 500 on first call, then 200 on second call
    let callCount = 0;
    server.use(
      http.get(API_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 500, title: 'Internal Server Error' },
            { status: 500 },
          );
        }
        return HttpResponse.json([buildContacto({ nombre: 'Contacto Recuperado' })]);
      }),
    );

    // WHEN: User sees ErrorPanel and clicks Reintentar
    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    const retryBtn = screen.getByTestId('error-panel-retry-button');
    await userEvent.click(retryBtn);

    // THEN: A second fetch is triggered and the list is shown
    await waitFor(() => {
      expect(screen.getByText('Contacto Recuperado')).toBeInTheDocument();
    });
  });
});

// ─── NFR1 (R-001): Performance with 1,000 records ────────────────────────────

describe('NFR1 — Performance: filter completes in < 1,000ms with 1,000 records', () => {
  it('should complete filter in under 1,000ms with 1,000 contacts (R-001)', async () => {
    // GIVEN: API returns 1,000 contacts
    const contactos = Array.from({ length: 1000 }, (_, i) =>
      buildContacto({
        id: String(i),
        nombre: `Contacto ${i}`,
        email: `contacto${i}@empresa.com`,
      }),
    );
    server.use(http.get(API_URL, () => HttpResponse.json(contactos)));

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1000));

    // WHEN: User types a search term — measure filter time
    const searchInput = screen.getByTestId('contactos-search-input');
    const start = performance.now();
    await userEvent.type(searchInput, 'Contacto 5');
    const elapsed = performance.now() - start;

    // THEN: Filter completes in under 1,000ms
    expect(elapsed).toBeLessThan(1000);
  });
});
