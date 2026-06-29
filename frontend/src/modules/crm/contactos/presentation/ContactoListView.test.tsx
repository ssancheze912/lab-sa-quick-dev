/**
 * Component tests — ContactoListView
 * Story 3.1 — Contact List & Search
 *
 * Test IDs covered (all in RED phase — component does not exist yet):
 *   TC-E3-P0-01  Contact list renders all contacts from API (nombre, cargo, email visible)
 *   TC-E3-P0-02  Empty state when no contacts exist
 *   TC-E3-P0-03  ErrorPanel + Reintentar button triggers re-fetch on 500
 *   TC-E3-P1-01  Real-time search filters list by Nombre
 *   TC-E3-P1-02  Real-time search filters list by Email
 *   TC-E3-P1-03  Search performance: 1,000 records filter < 150ms
 *   TC-E3-P2-01  Loading skeleton shown during initial fetch (delayed response)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module '../ContactoListView'"
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import {
  handleGetContactosSuccess,
  handleGetContactosEmpty,
  handleGetContactosError,
  handleGetContactos1000,
  handleGetContactosDelayed,
} from '../../../../test/msw/handlers/contactos.handlers';
import { createContactos, createContacto, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ContactoListView } from './ContactoListView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoListView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoListView />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// TC-E3-P0-01: Contact list renders all contacts from API
// ---------------------------------------------------------------------------

describe('TC-E3-P0-01: Contact list renders all contacts from API', () => {
  it('should show loading skeleton before data arrives', async () => {
    // GIVEN: MSW returns 3 contacts with a small delay
    const contactos = createContactos(3);
    server.use(handleGetContactosDelayed(contactos, 50));

    // WHEN: ContactoListView is rendered
    renderContactoListView();

    // THEN: Loading skeleton is visible before response resolves
    expect(screen.getByTestId('contactos-list-skeleton')).toBeInTheDocument();
  });

  it('should render all 3 contacts after data arrives', async () => {
    // GIVEN: MSW returns 3 contacts
    const contactos = createContactos(3);
    server.use(handleGetContactosSuccess(contactos));

    // WHEN: ContactoListView renders and data resolves
    renderContactoListView();

    // THEN: All 3 contact items appear in the list
    for (const contacto of contactos) {
      await waitFor(() => {
        expect(screen.getByTestId(`contacto-item-${contacto.id}`)).toBeInTheDocument();
      });
    }
  });

  it('should display Nombre, Cargo, and Email for each contact item', async () => {
    // GIVEN: MSW returns 3 contacts
    const contactos = createContactos(3);
    server.use(handleGetContactosSuccess(contactos));

    // WHEN: ContactoListView renders and data resolves
    renderContactoListView();

    // THEN: Each list item shows Nombre, Cargo, and Email
    const first = contactos[0];
    await waitFor(() => {
      expect(screen.getByText(first.nombre)).toBeInTheDocument();
      expect(screen.getByText(first.cargo)).toBeInTheDocument();
      expect(screen.getByText(first.email)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P0-02: Empty state when no contacts exist
// ---------------------------------------------------------------------------

describe('TC-E3-P0-02: Empty state when no contacts exist', () => {
  it('should render EmptyState component when API returns empty array', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetContactosEmpty());

    // WHEN: ContactoListView renders
    renderContactoListView();

    // THEN: EmptyState is rendered with Spanish guidance text
    await waitFor(() => {
      expect(screen.getByTestId('contactos-empty-state')).toBeInTheDocument();
    });
  });

  it('should show zero contact list items when empty', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetContactosEmpty());

    // WHEN: ContactoListView renders
    renderContactoListView();

    // THEN: No contact items in DOM
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^contacto-item-/)).toHaveLength(0);
    });
  });

  it('should display Spanish creation-prompt message in EmptyState', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetContactosEmpty());

    // WHEN: ContactoListView renders
    renderContactoListView();

    // THEN: EmptyState contains Spanish text guiding user to create first contact
    await waitFor(() => {
      const emptyState = screen.getByTestId('contactos-empty-state');
      expect(emptyState).toHaveTextContent(/contacto/i);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P0-03: ErrorPanel + Reintentar button triggers re-fetch
// ---------------------------------------------------------------------------

describe('TC-E3-P0-03: ErrorPanel with Reintentar on API failure', () => {
  it('should render ErrorPanel when GET /api/v1/contactos returns 500', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(handleGetContactosError());

    // WHEN: ContactoListView renders
    renderContactoListView();

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-panel')).toBeInTheDocument();
    });
  });

  it('should display Reintentar button in ErrorPanel', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(handleGetContactosError());

    // WHEN: ContactoListView renders
    renderContactoListView();

    // THEN: "Reintentar" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('contactos-retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('contactos-retry-button')).toHaveTextContent(/reintentar/i);
    });
  });

  it('should trigger a new fetch when Reintentar button is clicked', async () => {
    // GIVEN: MSW starts with 500
    const contactos = createContactos(2);
    server.use(handleGetContactosError());

    // WHEN: ContactoListView renders and error panel appears
    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('contactos-retry-button')).toBeInTheDocument();
    });

    // Switch handler to success for the retry
    server.resetHandlers();
    server.use(handleGetContactosSuccess(contactos));

    // WHEN: User clicks Reintentar
    fireEvent.click(screen.getByTestId('contactos-retry-button'));

    // THEN: The list eventually shows contacts (fetch was retried)
    await waitFor(() => {
      expect(screen.queryByTestId('contactos-error-panel')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-01: Real-time search filters list by Nombre
// ---------------------------------------------------------------------------

describe('TC-E3-P1-01: Real-time search filters by Nombre', () => {
  it('should show only matching contacts when searching by partial Nombre', async () => {
    // GIVEN: MSW returns 3 contacts with distinct names
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'ana@test.com' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@test.com' }),
      createContacto({ nombre: 'Ana Martínez', email: 'ana.m@test.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    // Wait for list to render
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // WHEN: User types "Ana" in the search field
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'Ana' },
    });

    // THEN: Only contacts containing "Ana" in Nombre are visible
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
    });

    // THEN: "Luis Pérez" is NOT visible
    expect(screen.queryByText('Luis Pérez')).not.toBeInTheDocument();
  });

  it('should restore full list when search is cleared', async () => {
    // GIVEN: MSW returns 3 contacts
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'ana@test.com' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@test.com' }),
      createContacto({ nombre: 'Ana Martínez', email: 'ana.m@test.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
    });

    // WHEN: Search filters then is cleared
    const searchInput = screen.getByTestId('contactos-search-input');
    fireEvent.change(searchInput, { target: { value: 'Ana' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: All 3 contacts visible again
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
      expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
    });
  });

  it('should perform case-insensitive search on Nombre', async () => {
    // GIVEN: A contact named "Ana García"
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'ana@test.com' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@test.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // WHEN: User types lowercase "ana"
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'ana' },
    });

    // THEN: "Ana García" still matches (case-insensitive)
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.queryByText('Luis Pérez')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-02: Real-time search filters list by Email
// ---------------------------------------------------------------------------

describe('TC-E3-P1-02: Real-time search filters by Email', () => {
  it('should show only matching contacts when searching by partial email domain', async () => {
    // GIVEN: 3 contacts with distinct emails
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'ana@siesa.com' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@empresa.co' }),
      createContacto({ nombre: 'Carlos Ruiz', email: 'carlos@siesa.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // WHEN: User types "@siesa" to match by email domain
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: '@siesa' },
    });

    // THEN: Only contacts with "@siesa" email are visible
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    });
    expect(screen.queryByText('Luis Pérez')).not.toBeInTheDocument();
  });

  it('should match email substring (not only prefix)', async () => {
    // GIVEN: Contacts with different email patterns
    const contactos = [
      createContacto({ nombre: 'Contacto X', email: 'test.usuario@empresa.com' }),
      createContacto({ nombre: 'Contacto Y', email: 'otro@diferente.co' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Contacto X')).toBeInTheDocument();
    });

    // WHEN: User types a middle part of the email (not the prefix)
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'usuario@' },
    });

    // THEN: Contacto X matches (substring match)
    await waitFor(() => {
      expect(screen.getByText('Contacto X')).toBeInTheDocument();
      expect(screen.queryByText('Contacto Y')).not.toBeInTheDocument();
    });
  });

  it('should perform case-insensitive search on Email', async () => {
    // GIVEN: A contact with a mixed-case email
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'Ana.Garcia@Siesa.COM' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@otro.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // WHEN: User types lowercase version of email
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'ana.garcia@siesa' },
    });

    // THEN: Ana García still matches (case-insensitive)
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.queryByText('Luis Pérez')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-03: Search performance with 1,000 records < 150ms
// ---------------------------------------------------------------------------

describe('TC-E3-P1-03: Search performance with 1,000 contacts', () => {
  it('should filter 1,000 contacts in under 150ms', async () => {
    // GIVEN: MSW returns 1,000 contacts
    server.use(handleGetContactos1000());

    renderContactoListView();

    // Wait for all 1,000 to load
    await waitFor(
      () => {
        expect(screen.getAllByTestId(/^contacto-item-/).length).toBeGreaterThan(0);
      },
      { timeout: 10000 }
    );

    const searchInput = screen.getByTestId('contactos-search-input');

    // WHEN: Measure filter time
    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Contacto Test 000' } });
    const elapsed = performance.now() - start;

    // THEN: Filter completes in under 150ms (NFR1 — well within 1s threshold)
    expect(elapsed).toBeLessThan(150);
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P2-01: Loading skeleton shown during initial fetch (delayed response)
// ---------------------------------------------------------------------------

describe('TC-E3-P2-01: Loading skeleton during initial fetch', () => {
  it('should display loading skeleton before data arrives (200ms delay)', async () => {
    // GIVEN: MSW delays response by 200ms
    const contactos = createContactos(2);
    server.use(handleGetContactosDelayed(contactos, 200));

    // WHEN: ContactoListView is rendered
    renderContactoListView();

    // THEN: Loading skeleton is visible immediately
    expect(screen.getByTestId('contactos-list-skeleton')).toBeInTheDocument();

    // THEN: After data arrives, loading skeleton is gone and list appears
    await waitFor(
      () => {
        expect(screen.queryByTestId('contactos-list-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByText(contactos[0].nombre)).toBeInTheDocument();
    });
  });
});
