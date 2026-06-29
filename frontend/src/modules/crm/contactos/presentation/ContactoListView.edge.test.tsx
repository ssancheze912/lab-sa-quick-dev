/**
 * Component tests — ContactoListView edge cases & boundary conditions
 * Story 3.1 — Contact List & Search (testarch-automate expansion)
 *
 * Coverage gap areas addressed:
 *   TC-E3-VIEW-EDGE-01  Search with whitespace-only input shows full list (trim behavior)
 *   TC-E3-VIEW-EDGE-02  Search matches no contacts → zero items visible (not EmptyState)
 *   TC-E3-VIEW-EDGE-03  Single contact matches both nombre AND email simultaneously
 *   TC-E3-VIEW-EDGE-04  Rapid sequential search queries → final state reflects last query
 *   TC-E3-VIEW-EDGE-05  ContactListItem renders correct hierarchy (nombre bold, cargo, email)
 *   TC-E3-VIEW-EDGE-06  Search with accented characters (case-insensitive, UTF-8 normalization)
 *   TC-E3-VIEW-EDGE-07  Error panel state does NOT show search input or contact list
 *   TC-E3-VIEW-EDGE-08  Empty state triggered only on data=[] NOT on zero search results
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import {
  handleGetContactosSuccess,
  handleGetContactosEmpty,
  handleGetContactosError,
} from '../../../../test/msw/handlers/contactos.handlers';
import { createContacto, createContactos, resetContactoCounter } from '../../../../test/factories/contacto.factory';
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
// TC-E3-VIEW-EDGE-01: Whitespace-only search input shows full list
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-01: Whitespace-only search shows full list', () => {
  it('[P2] should display all contacts when search input contains only spaces', async () => {
    // GIVEN: MSW returns 3 contacts
    const contactos = createContactos(3);
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText(contactos[0].nombre)).toBeInTheDocument();
    });

    // WHEN: User types only whitespace in the search field
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: '   ' },
    });

    // THEN: All 3 contacts are still visible (whitespace is trimmed → empty query)
    await waitFor(() => {
      for (const c of contactos) {
        expect(screen.getByText(c.nombre)).toBeInTheDocument();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-02: Search with no matches shows zero items — NOT EmptyState
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-02: Zero-match search shows no items, not EmptyState', () => {
  it('[P1] should show zero contact items when search matches no contacts', async () => {
    // GIVEN: MSW returns 2 contacts
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'ana@siesa.com' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@empresa.co' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // WHEN: User types a query that matches nobody
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'zzzNonexistentQuery123' },
    });

    // THEN: No contact items visible
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^contacto-item-/)).toHaveLength(0);
    });
  });

  it('[P2] should NOT show the EmptyState component when search has zero results', async () => {
    // GIVEN: MSW returns contacts (data is non-empty — EmptyState should NOT appear)
    const contactos = [createContacto({ nombre: 'Ana García', email: 'ana@siesa.com' })];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    // WHEN: User types a query that matches nobody
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'zzNobodyMatches' },
    });

    // THEN: EmptyState is NOT shown (EmptyState is only for data=[], not filtered=[])
    await waitFor(() => {
      expect(screen.queryByTestId('contactos-empty-state')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-03: Contact matching both nombre AND email
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-03: Contact visible when query matches nombre OR email', () => {
  it('[P1] should show contact when query matches nombre, even if email does not match', async () => {
    // GIVEN: Contact whose nombre matches but email does not
    const contactos = [
      createContacto({ nombre: 'María Rodríguez', email: 'xyzunique@other.co' }),
      createContacto({ nombre: 'Pedro Álvarez', email: 'pedro@siesa.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('María Rodríguez')).toBeInTheDocument();
    });

    // WHEN: User searches for "María" (matches nombre, not email)
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'María' },
    });

    // THEN: María is visible, Pedro is not
    await waitFor(() => {
      expect(screen.getByText('María Rodríguez')).toBeInTheDocument();
      expect(screen.queryByText('Pedro Álvarez')).not.toBeInTheDocument();
    });
  });

  it('[P1] should show contact when query matches email domain fragment', async () => {
    // GIVEN: Contact whose email contains the query but nombre does not
    const contactos = [
      createContacto({ nombre: 'Carlos López', email: 'carlos@uniquedomain.com' }),
      createContacto({ nombre: 'Isabel Torres', email: 'isabel@otherdomain.co' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    // WHEN: User searches by the unique email domain
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'uniquedomain' },
    });

    // THEN: Carlos visible (email matches), Isabel not visible
    await waitFor(() => {
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
      expect(screen.queryByText('Isabel Torres')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-04: Rapid sequential search queries
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-04: Rapid sequential search queries', () => {
  it('[P2] should reflect the last query after multiple rapid filter changes', async () => {
    // GIVEN: MSW returns 3 contacts
    const contactos = [
      createContacto({ nombre: 'Ana García', email: 'ana@siesa.com' }),
      createContacto({ nombre: 'Luis Pérez', email: 'luis@empresa.co' }),
      createContacto({ nombre: 'Ana Martínez', email: 'ana.m@test.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('contactos-search-input');

    // WHEN: Multiple rapid query changes (simulating fast typing)
    fireEvent.change(searchInput, { target: { value: 'A' } });
    fireEvent.change(searchInput, { target: { value: 'An' } });
    fireEvent.change(searchInput, { target: { value: 'Ana' } });
    fireEvent.change(searchInput, { target: { value: 'Luis' } });

    // THEN: Only "Luis" is visible — last query wins
    await waitFor(() => {
      expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
      expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
      expect(screen.queryByText('Ana Martínez')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-05: ContactListItem renders correct data hierarchy
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-05: ContactListItem renders nombre, cargo, and email', () => {
  it('[P1] should render all three fields (nombre, cargo, email) for each contact', async () => {
    // GIVEN: MSW returns 1 contact with distinct values for each field
    const contacto = createContacto({
      nombre: 'Juanita Pérez',
      cargo: 'Directora Regional',
      email: 'juanita.perez@unique.co',
    });
    server.use(handleGetContactosSuccess([contacto]));

    renderContactoListView();

    // THEN: All three fields are visible in the rendered output
    await waitFor(() => {
      expect(screen.getByText('Juanita Pérez')).toBeInTheDocument();
      expect(screen.getByText('Directora Regional')).toBeInTheDocument();
      expect(screen.getByText('juanita.perez@unique.co')).toBeInTheDocument();
    });
  });

  it('[P2] should render telefono field is NOT displayed in the list item', async () => {
    // GIVEN: Contact with a distinctive telefono value not expected in the view
    const contacto = createContacto({
      nombre: 'Marco Polo',
      cargo: 'Viajero',
      telefono: '9999999999',
      email: 'marco@viajes.co',
    });
    server.use(handleGetContactosSuccess([contacto]));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Marco Polo')).toBeInTheDocument();
    });

    // THEN: The telefono is NOT rendered (ContactListItem only shows nombre, cargo, email)
    expect(screen.queryByText('9999999999')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-06: Case-insensitive search with accented Spanish characters
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-06: Accented character handling in search', () => {
  it('[P2] should find contact when searching lowercase accented name', async () => {
    // GIVEN: Contact with accented uppercase name
    const contactos = [
      createContacto({ nombre: 'Álvaro Martínez', email: 'alvaro@siesa.com' }),
      createContacto({ nombre: 'Roberto Suárez', email: 'roberto@siesa.com' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Álvaro Martínez')).toBeInTheDocument();
    });

    // WHEN: User types lowercase version "álvaro"
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'álvaro' },
    });

    // THEN: Álvaro Martínez is still found (toLowerCase() handles accented chars)
    await waitFor(() => {
      expect(screen.getByText('Álvaro Martínez')).toBeInTheDocument();
      expect(screen.queryByText('Roberto Suárez')).not.toBeInTheDocument();
    });
  });

  it('[P2] should find contact when searching uppercase from lowercase name', async () => {
    // GIVEN: Contact with a mixed-case nombre containing accents
    const contactos = [
      createContacto({ nombre: 'José Luis García', email: 'jose@empresa.co' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('José Luis García')).toBeInTheDocument();
    });

    // WHEN: User searches with uppercase "JOSÉ"
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'JOSÉ' },
    });

    // THEN: Contact is found (case-insensitive)
    await waitFor(() => {
      expect(screen.getByText('José Luis García')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-07: Error state does NOT render search input or list
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-07: Error state hides search input and contact list', () => {
  it('[P1] should NOT render the search input when ErrorPanel is shown', async () => {
    // GIVEN: MSW returns 500
    server.use(handleGetContactosError());

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-panel')).toBeInTheDocument();
    });

    // THEN: Search input is not in the DOM during error state
    expect(screen.queryByTestId('contactos-search-input')).not.toBeInTheDocument();
  });

  it('[P1] should NOT render any contact items when ErrorPanel is shown', async () => {
    // GIVEN: MSW returns 500
    server.use(handleGetContactosError());

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-panel')).toBeInTheDocument();
    });

    // THEN: No contact items in the DOM
    expect(screen.queryAllByTestId(/^contacto-item-/)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-E3-VIEW-EDGE-08: EmptyState appears only for API empty array, not for filtered results
// ---------------------------------------------------------------------------

describe('TC-E3-VIEW-EDGE-08: EmptyState semantics — data=[] vs filtered=[]', () => {
  it('[P0] should show EmptyState for API empty array and NOT show search input', async () => {
    // GIVEN: API returns genuinely empty dataset
    server.use(handleGetContactosEmpty());

    renderContactoListView();

    // THEN: EmptyState component is shown
    await waitFor(() => {
      expect(screen.getByTestId('contactos-empty-state')).toBeInTheDocument();
    });

    // THEN: No search input shown when there is nothing to search (EmptyState path)
    // NOTE: This tests that the render tree for empty state doesn't include the search input
    expect(screen.queryByTestId('contactos-search-input')).not.toBeInTheDocument();
  });

  it('[P1] should NOT show EmptyState when there are contacts but zero match the search', async () => {
    // GIVEN: Contacts exist — data is non-empty
    const contactos = [
      createContacto({ nombre: 'Beatriz Herrera', email: 'beatriz@corp.co' }),
    ];
    server.use(handleGetContactosSuccess(contactos));

    renderContactoListView();

    await waitFor(() => {
      expect(screen.getByText('Beatriz Herrera')).toBeInTheDocument();
    });

    // WHEN: Search produces no matches
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'zzNobodyMatches999' },
    });

    // THEN: EmptyState is NOT shown (EmptyState only triggers when data=[], not filter=[])
    await waitFor(() => {
      expect(screen.queryByTestId('contactos-empty-state')).not.toBeInTheDocument();
    });
  });
});
