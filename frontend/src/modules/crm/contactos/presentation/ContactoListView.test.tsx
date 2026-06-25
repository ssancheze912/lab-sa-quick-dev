/**
 * Story 3.1: ContactoListView component — Component Tests
 *
 * Acceptance Criteria covered:
 * - AC1: List renders when data present (Nombre, Cargo, Email visible)
 * - AC2: Search filters in real time by nombre and email (case-insensitive)
 * - AC3: EmptyState shown when array is empty
 * - AC4: ErrorPanel shown on fetch failure; "Reintentar" triggers refetch
 * - NFR1/R-001: Performance — filter completes < 1,000ms with 1,000 records
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { ContactoListView } from './ContactoListView';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/contactos';

const buildContacto = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  nombre: 'Juan Pérez',
  cargo: 'Gerente Comercial',
  telefono: '3001234567',
  email: 'juan.perez@empresa.com',
  clienteId: null,
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

// ─── AC1: List renders when data present ─────────────────────────────────────

describe('AC1 — ContactoListView renders contact list', () => {
  it('should render nombre in list item', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ nombre: 'María García' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('should render cargo in list item', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ cargo: 'Directora de Ventas' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByText('Directora de Ventas')).toBeInTheDocument();
    });
  });

  it('should render email in list item', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ email: 'm.garcia@test.com' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByText('m.garcia@test.com')).toBeInTheDocument();
    });
  });

  it('should render search input with aria-label "Buscar contactos"', async () => {
    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByLabelText('Buscar contactos')).toBeInTheDocument();
    });
  });

  it('should render list container', async () => {
    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByTestId('contactos-list-container')).toBeInTheDocument();
    });
  });
});

// ─── AC2: Real-time search filtering ─────────────────────────────────────────

describe('AC2 — ContactoListView search filtering', () => {
  it('should filter list by nombre substring', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildContacto({ id: '1', nombre: 'Alpha López', email: 'a@test.com' }),
          buildContacto({ id: '2', nombre: 'Beta Torres', email: 'b@test.com' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2));

    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'Alpha');

    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
    expect(screen.getByText('Alpha López')).toBeInTheDocument();
  });

  it('should filter list by email substring', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildContacto({ id: '1', nombre: 'Contacto Uno', email: 'uno@empresa.com' }),
          buildContacto({ id: '2', nombre: 'Contacto Dos', email: 'dos@otro.com' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(2));

    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'empresa');

    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
    expect(screen.getByText('Contacto Uno')).toBeInTheDocument();
  });

  it('should perform case-insensitive filtering', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ nombre: 'Tecnologías Avanzadas' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1));

    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'tecnologías');

    expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1);
  });

  it('should show zero items when search matches nothing', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildContacto({ nombre: 'Juan Pérez' })]),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1));

    const searchInput = screen.getByTestId('contactos-search-input');
    await userEvent.type(searchInput, 'ZZZNOMATCH');

    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
  });
});

// ─── AC3: EmptyState when data is empty ───────────────────────────────────────

describe('AC3 — EmptyState when no contacts', () => {
  it('should display EmptyState when API returns empty array', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should still render search input when data is empty', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByTestId('contactos-search-input')).toBeInTheDocument();
    });
  });

  it('should not show contact list items when data is empty', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());

    expect(screen.queryAllByTestId('contacto-list-item')).toHaveLength(0);
  });
});

// ─── AC4: ErrorPanel and retry ────────────────────────────────────────────────

describe('AC4 — ErrorPanel on fetch failure', () => {
  it('should display ErrorPanel when API returns 500', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should display "Reintentar" button inside ErrorPanel', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    const retryBtn = screen.getByTestId('error-panel-retry-button');
    expect(retryBtn).toBeInTheDocument();
  });

  it('should call refetch when "Reintentar" button is clicked', async () => {
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

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    const retryBtn = screen.getByTestId('error-panel-retry-button');
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Contacto Recuperado')).toBeInTheDocument();
    });
  });
});

// ─── NFR1/R-001: Performance test ─────────────────────────────────────────────

describe('NFR1 — Performance: filter < 1,000ms with 1,000 records', () => {
  it('should complete filter in under 1,000ms with 1,000 seeded contacts', async () => {
    const contacts = Array.from({ length: 1000 }, (_, i) => ({
      id: crypto.randomUUID(),
      nombre: `Contacto ${i}`,
      cargo: 'Cargo',
      telefono: '3001234567',
      email: `contacto${i}@test.com`,
      clienteId: null,
      createdAt: '2026-06-25T10:00:00Z',
      updatedAt: '2026-06-25T10:00:00Z',
    }));

    server.use(http.get(API_URL, () => HttpResponse.json(contacts)));

    renderWithQuery(createElement(ContactoListView));
    await waitFor(() =>
      expect(screen.getAllByTestId('contacto-list-item')).toHaveLength(1000),
    );

    const searchInput = screen.getByTestId('contactos-search-input');

    const start = performance.now();
    await userEvent.type(searchInput, 'Contacto 1');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1000);
  });
});

// ─── WCAG 2.1 AA accessibility checks ────────────────────────────────────────

describe('Accessibility — WCAG 2.1 AA (structural checks)', () => {
  it('should render search input with aria-label for screen readers', async () => {
    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      const input = screen.getByLabelText('Buscar contactos');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'search');
    });
  });

  it('should render contact list with accessible listbox role and label', async () => {
    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      const listbox = screen.getByRole('listbox', { name: 'Lista de contactos' });
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should render each contact list item with role="option" and tabIndex=0', async () => {
    renderWithQuery(createElement(ContactoListView));

    await waitFor(() => {
      const items = screen.getAllByRole('option');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });
  });
});
