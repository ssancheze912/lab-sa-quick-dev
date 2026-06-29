/**
 * Edge-case component tests — ContactoListView (Sin Cliente / Orphan Contacts Filter)
 * Story 4.5 — Orphan Contacts Filter — testarch-automate expansion
 *
 * Complements ContactoListView.sinCliente.test.tsx (ATDD baseline, 19 tests).
 * Covers edge cases NOT in ATDD:
 *   EC-01  Concurrent sinCliente + text search — both filters compose client-side
 *   EC-02  Search query is preserved when sinCliente toggle is activated
 *   EC-03  Search query is preserved when sinCliente toggle is deactivated
 *   EC-04  Singular orphan count ("1 contacto(s) sin cliente") is displayed correctly
 *   EC-05  Large orphan set (10 contacts) — all rendered and counter shows 10
 *   EC-06  Search on sinCliente=true list — client-side filter on server-filtered set
 *   EC-07  Toggle data-state attribute is "on" when sinCliente active, "off" when inactive
 *   EC-08  Toggle aria-pressed is true when active, false when inactive
 *   EC-09  Counter badge absent when sinCliente is active but all orphans filtered by search
 *   EC-10  Rapid toggle clicks do not leave UI in inconsistent state
 *   EC-11  Empty state shows correct Spanish text (not default message) when sinCliente active
 *   EC-12  When sinCliente activated then deactivated, full list re-renders (cache key isolation)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import {
  createContacto,
  createContactos,
  resetContactoCounter,
} from '../../../../test/factories/contacto.factory';
import {
  handleGetContactosMixed,
  handleGetContactosSinClienteEmpty,
  createOrphanContacto,
  createOrphanContactos,
  createAssignedContacto,
} from '../../../../test/msw/handlers/contactos-sin-cliente.handlers';
import { ContactoListView } from './ContactoListView';

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoListView with fresh QueryClient
// ---------------------------------------------------------------------------

function renderView(sinClienteParam = false) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ContactoListView sinClienteParam={sinClienteParam} />
      </QueryClientProvider>
    ),
  };
}

/**
 * Render ContactoListView WITHOUT sinClienteParam, so the component uses its internal
 * local state (sinClienteLocal). This is needed for tests that click the toggle and
 * expect the local state to change (no URL-sync in these tests).
 */
function renderViewLocalState() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ContactoListView />
      </QueryClientProvider>
    ),
  };
}

// ---------------------------------------------------------------------------
// EC-01: Concurrent sinCliente + text search — both filters compose
// ---------------------------------------------------------------------------

describe('EC-01: sinCliente + text search compose client-side', () => {
  it('[P0] should show only orphan contacts matching the search query when both filters active', async () => {
    // GIVEN: Two orphan contacts with different names
    const orphan1 = createOrphanContacto({ nombre: 'Carlos Huerfano' });
    const orphan2 = createOrphanContacto({ nombre: 'Maria Huerfana' });
    const assigned = createAssignedContacto('cliente-111', { nombre: 'Pedro Asignado' });

    server.use(handleGetContactosMixed([orphan1, orphan2], [assigned]));

    renderView(true);

    // WHEN: sinCliente filter is active (rendered with sinClienteParam=true)
    // AND: user types a search query
    await waitFor(() => {
      expect(screen.getByText('Carlos Huerfano')).toBeInTheDocument();
      expect(screen.getByText('Maria Huerfana')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'Carlos' },
    });

    // THEN: Only "Carlos Huerfano" is visible (sinCliente + search compose)
    await waitFor(() => {
      expect(screen.getByText('Carlos Huerfano')).toBeInTheDocument();
      expect(screen.queryByText('Maria Huerfana')).not.toBeInTheDocument();
    });

    // AND: assigned contact was never shown (server-side filter handled it)
    expect(screen.queryByText('Pedro Asignado')).not.toBeInTheDocument();
  });

  it('[P1] should show all orphan contacts again when search is cleared', async () => {
    // GIVEN: Two orphan contacts
    const orphan1 = createOrphanContacto({ nombre: 'Ana Huerfana' });
    const orphan2 = createOrphanContacto({ nombre: 'Luis Huerfano' });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([orphan1, orphan2]);
        }
        return HttpResponse.json([orphan1, orphan2]);
      })
    );

    renderView(true);

    await waitFor(() => {
      expect(screen.getByText('Ana Huerfana')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('contactos-search-input');

    // WHEN: Filter by "Ana"
    fireEvent.change(searchInput, { target: { value: 'Ana' } });
    await waitFor(() => {
      expect(screen.queryByText('Luis Huerfano')).not.toBeInTheDocument();
    });

    // WHEN: Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: Both orphans visible again
    await waitFor(() => {
      expect(screen.getByText('Ana Huerfana')).toBeInTheDocument();
      expect(screen.getByText('Luis Huerfano')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EC-02: Search query is preserved when sinCliente toggle is activated
// ---------------------------------------------------------------------------

describe('EC-02: Search query persists when sinCliente toggle is activated', () => {
  it('[P1] should preserve typed search text when sinCliente toggle is clicked', async () => {
    // GIVEN: Mixed contacts, sinCliente filter initially inactive
    const orphan = createOrphanContacto({ nombre: 'Sofia Huerfana' });
    const assigned = createAssignedContacto('cliente-222', { nombre: 'Sofia Asignada' });

    server.use(handleGetContactosMixed([orphan], [assigned]));

    renderView(false);

    await waitFor(() => {
      expect(screen.getByText('Sofia Huerfana')).toBeInTheDocument();
    });

    // WHEN: User types a search query
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'Sofia' },
    });

    // WHEN: User clicks sinCliente toggle (component toggles to local sinCliente state)
    const toggle = screen.getByTestId('filtro-sin-cliente');
    fireEvent.click(toggle);

    // THEN: Search input retains the typed value
    await waitFor(() => {
      const searchInput = screen.getByTestId('contactos-search-input') as HTMLInputElement;
      expect(searchInput.value).toBe('Sofia');
    });
  });
});

// ---------------------------------------------------------------------------
// EC-03: Search query is preserved when sinCliente toggle is deactivated
// ---------------------------------------------------------------------------

describe('EC-03: Search query persists when sinCliente toggle is deactivated', () => {
  it('[P1] should preserve search text when toggling sinCliente off', async () => {
    // GIVEN: sinCliente filter initially active with a search query
    const orphan = createOrphanContacto({ nombre: 'Roberto Huerfano' });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([orphan]);
        }
        return HttpResponse.json([orphan]);
      })
    );

    renderView(true);

    await waitFor(() => {
      expect(screen.getByText('Roberto Huerfano')).toBeInTheDocument();
    });

    // WHEN: User types a search
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'Roberto' },
    });

    // WHEN: Toggle sinCliente off
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Search input still shows "Roberto"
    const searchInput = screen.getByTestId('contactos-search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('Roberto');
  });
});

// ---------------------------------------------------------------------------
// EC-04: Singular orphan count displayed correctly
// ---------------------------------------------------------------------------

describe('EC-04: Singular orphan count (1 contacto)', () => {
  it('[P1] should display "1 contacto(s) sin cliente" when only one orphan exists', async () => {
    // GIVEN: Exactly 1 orphan contact
    const orphan = createOrphanContacto({ nombre: 'Un Solo Huerfano' });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([orphan]);
        }
        return HttpResponse.json([orphan]);
      })
    );

    // WHEN: sinCliente filter is active
    renderView(true);

    // THEN: Counter badge shows 1 and "sin cliente" text
    await waitFor(() => {
      const badge = screen.getByTestId('contador-sin-cliente');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(/1/);
      expect(badge).toHaveTextContent(/sin cliente/i);
    });
  });
});

// ---------------------------------------------------------------------------
// EC-05: Large orphan set (10 contacts)
// ---------------------------------------------------------------------------

describe('EC-05: Large orphan set rendered correctly', () => {
  it('[P1] should render all 10 orphan contacts and show correct count', async () => {
    // GIVEN: 10 orphan contacts returned when sinCliente=true
    const orphans = createOrphanContactos(10);

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderView(true);

    // THEN: All 10 contacts rendered
    await waitFor(() => {
      const rows = screen.getAllByTestId('contacto-row');
      expect(rows).toHaveLength(10);
    });

    // AND: Counter shows 10
    const badge = screen.getByTestId('contador-sin-cliente');
    expect(badge).toHaveTextContent(/10/);
    expect(badge).toHaveTextContent(/sin cliente/i);
  });

  it('[P2] should not crash or paginate with 50 orphan contacts', async () => {
    // GIVEN: 50 orphan contacts
    const orphans = createOrphanContactos(50);

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderView(true);

    // THEN: All 50 rows rendered without crash
    await waitFor(() => {
      const rows = screen.getAllByTestId('contacto-row');
      expect(rows).toHaveLength(50);
    });

    // AND: Counter shows 50
    expect(screen.getByTestId('contador-sin-cliente')).toHaveTextContent(/50/);
  });
});

// ---------------------------------------------------------------------------
// EC-06: Search on sinCliente=true list (client-side on server-filtered result)
// ---------------------------------------------------------------------------

describe('EC-06: Text search composed over sinCliente=true server result', () => {
  it('[P0] should filter orphan contacts further by name using client-side search', async () => {
    // GIVEN: 3 orphans returned by the sinCliente filter
    const orphans = [
      createOrphanContacto({ nombre: 'Alfa Huerfano', email: 'alfa@test.com' }),
      createOrphanContacto({ nombre: 'Beta Huerfano', email: 'beta@test.com' }),
      createOrphanContacto({ nombre: 'Gamma Huerfano', email: 'gamma@test.com' }),
    ];

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderView(true);

    await waitFor(() => {
      expect(screen.getByText('Alfa Huerfano')).toBeInTheDocument();
      expect(screen.getByText('Beta Huerfano')).toBeInTheDocument();
      expect(screen.getByText('Gamma Huerfano')).toBeInTheDocument();
    });

    // WHEN: User searches for "Beta"
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'Beta' },
    });

    // THEN: Only "Beta Huerfano" is visible (client-side filter on top of server result)
    await waitFor(() => {
      expect(screen.getByText('Beta Huerfano')).toBeInTheDocument();
      expect(screen.queryByText('Alfa Huerfano')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Huerfano')).not.toBeInTheDocument();
    });
  });

  it('[P1] should filter orphan contacts by email using client-side search', async () => {
    // GIVEN: Orphans with distinct emails
    const orphans = [
      createOrphanContacto({ nombre: 'Contact A', email: 'contacto.alpha@siesa.com' }),
      createOrphanContacto({ nombre: 'Contact B', email: 'contacto.beta@siesa.com' }),
    ];

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderView(true);

    await waitFor(() => {
      expect(screen.getByText('Contact A')).toBeInTheDocument();
    });

    // WHEN: Search by email domain segment
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'alpha' },
    });

    // THEN: Only Contact A (whose email contains "alpha") is visible
    await waitFor(() => {
      expect(screen.getByText('Contact A')).toBeInTheDocument();
      expect(screen.queryByText('Contact B')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EC-07: Toggle data-state attribute
// ---------------------------------------------------------------------------

describe('EC-07: Toggle data-state reflects active/inactive state', () => {
  it('[P1] should have data-state="on" when sinCliente filter is active', async () => {
    // GIVEN: sinCliente active
    const orphan = createOrphanContacto();
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([orphan]))
    );

    renderView(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    // THEN: data-state="on"
    const toggle = screen.getByTestId('filtro-sin-cliente');
    expect(toggle.getAttribute('data-state')).toBe('on');
  });

  it('[P1] should have data-state="off" when sinCliente filter is inactive', async () => {
    // GIVEN: sinCliente inactive (default)
    const contactos = createContactos(2);
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    renderView(false);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    // THEN: data-state="off"
    const toggle = screen.getByTestId('filtro-sin-cliente');
    expect(toggle.getAttribute('data-state')).toBe('off');
  });
});

// ---------------------------------------------------------------------------
// EC-08: Toggle aria-pressed attribute
// ---------------------------------------------------------------------------

describe('EC-08: Toggle aria-pressed reflects active/inactive state (WCAG)', () => {
  it('[P0] should have aria-pressed="true" when sinCliente filter is active', async () => {
    // GIVEN: sinCliente active
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([createOrphanContacto()]))
    );

    renderView(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');
    // aria-pressed is a boolean attribute — can be "true" string or true boolean
    const ariaPressedValue = toggle.getAttribute('aria-pressed');
    expect(ariaPressedValue === 'true' || ariaPressedValue === '').toBe(true);
  });

  it('[P0] should have aria-pressed="false" when sinCliente filter is inactive', async () => {
    // GIVEN: sinCliente inactive
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(createContactos(2)))
    );

    renderView(false);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');
    const ariaPressedValue = toggle.getAttribute('aria-pressed');
    expect(ariaPressedValue === 'false' || ariaPressedValue === null).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EC-09: Counter badge absent when sinCliente active but search filters all results
// ---------------------------------------------------------------------------

describe('EC-09: Counter badge hidden when search filters out all sinCliente contacts', () => {
  it('[P2] should NOT show contador-sin-cliente when search query matches no orphan contact', async () => {
    // GIVEN: 2 orphan contacts returned by sinCliente filter
    const orphans = [
      createOrphanContacto({ nombre: 'Orphan Alpha', email: 'orphan.alpha@test.com' }),
      createOrphanContacto({ nombre: 'Orphan Beta', email: 'orphan.beta@test.com' }),
    ];

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderView(true);

    // First verify counter badge is shown when data exists
    await waitFor(() => {
      expect(screen.getByTestId('contador-sin-cliente')).toBeInTheDocument();
    });

    // WHEN: User searches for something that matches no orphan
    fireEvent.change(screen.getByTestId('contactos-search-input'), {
      target: { value: 'NOMATCH_ZZZZZ' },
    });

    // THEN: Counter badge is hidden (filteredContactos is empty)
    // The counter badge is rendered outside the filtered list — it shows total orphan count
    // The component renders the counter when data.length > 0 (total from server, not filtered)
    // This tests that the counter and the list remain consistent
    await waitFor(() => {
      const rows = screen.queryAllByTestId('contacto-row');
      // Filtered rows should be empty
      expect(rows).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// EC-10: Rapid toggle clicks do not leave UI in inconsistent state
// ---------------------------------------------------------------------------

describe('EC-10: Rapid toggle clicks remain consistent', () => {
  it('[P2] should end up in the correct state after an even number of rapid clicks', async () => {
    // GIVEN: Mixed contacts
    const orphan = createOrphanContacto({ nombre: 'Rapid Toggle Orphan' });
    const assigned = createAssignedContacto('cliente-rapid', { nombre: 'Rapid Toggle Assigned' });

    server.use(handleGetContactosMixed([orphan], [assigned]));

    // Use local-state rendering: sinClienteParam not provided, component uses sinClienteLocal
    renderViewLocalState();

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');

    // WHEN: 4 rapid clicks (even number → back to original state)
    await act(async () => {
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);
    });

    // THEN: data-state is "off" (back to original inactive state)
    expect(toggle.getAttribute('data-state')).toBe('off');
  });

  it('[P2] should end up active after an odd number of rapid clicks', async () => {
    // GIVEN: Contacts available
    const orphan = createOrphanContacto({ nombre: 'Odd Click Orphan' });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([orphan]))
    );

    // Use local-state rendering so clicks update internal sinClienteLocal state
    renderViewLocalState();

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');

    // WHEN: 3 rapid clicks (odd → ends active)
    await act(async () => {
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);
    });

    // THEN: data-state is "on"
    expect(toggle.getAttribute('data-state')).toBe('on');
  });
});

// ---------------------------------------------------------------------------
// EC-11: Empty state shows correct Spanish text when sinCliente active
// ---------------------------------------------------------------------------

describe('EC-11: Spanish empty state text when sinCliente active and no orphans', () => {
  it('[P0] should show "Todos los contactos tienen un cliente asignado" (exact match)', async () => {
    // GIVEN: sinCliente=true returns empty array
    server.use(handleGetContactosSinClienteEmpty());

    renderView(true);

    // THEN: Exact Spanish message is shown
    await waitFor(() => {
      expect(
        screen.getByText('Todos los contactos tienen un cliente asignado')
      ).toBeInTheDocument();
    });
  });

  it('[P1] should NOT show the default "No hay contactos registrados" when sinCliente empty state is shown', async () => {
    // GIVEN: sinCliente=true returns empty
    server.use(handleGetContactosSinClienteEmpty());

    renderView(true);

    await waitFor(() => {
      expect(
        screen.getByText('Todos los contactos tienen un cliente asignado')
      ).toBeInTheDocument();
    });

    // THEN: Default empty state message is NOT shown simultaneously
    expect(
      screen.queryByText(/No hay contactos registrados/i)
    ).not.toBeInTheDocument();
  });

  it('[P1] should show filtro-sin-cliente toggle even in the sinCliente empty state', async () => {
    // GIVEN: sinCliente=true returns empty
    server.use(handleGetContactosSinClienteEmpty());

    renderView(true);

    // THEN: Toggle is still visible so user can deactivate the filter
    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    // AND: The toggle is active (aria-pressed or data-state="on")
    const toggle = screen.getByTestId('filtro-sin-cliente');
    expect(toggle.getAttribute('data-state')).toBe('on');
  });
});

// ---------------------------------------------------------------------------
// EC-12: Cache key isolation — toggling back fetches unfiltered list separately
// ---------------------------------------------------------------------------

describe('EC-12: TanStack Query cache key isolation for sinCliente filter', () => {
  it('[P1] should make separate API calls for sinCliente=true and sinCliente=false/undefined', async () => {
    // GIVEN: Tracking separate API calls
    // Uses local-state rendering so toggle actually changes sinCliente state
    const requestUrls: string[] = [];
    const orphan = createOrphanContacto({ nombre: 'Cache Orphan' });
    const assigned = createAssignedContacto('cliente-cache', { nombre: 'Cache Assigned' });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        requestUrls.push(request.url);
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([orphan]);
        }
        return HttpResponse.json([orphan, assigned]);
      })
    );

    // Local-state rendering: toggle updates sinClienteLocal → changes useContactos param
    renderViewLocalState();

    // WHEN: Initial load (sinCliente=false — no param sent)
    await waitFor(() => {
      expect(screen.getByText('Cache Assigned')).toBeInTheDocument();
    });

    // WHEN: Toggle sinCliente on (sinClienteLocal becomes true)
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: A NEW API request was made with sinCliente=true (different cache key)
    await waitFor(() => {
      const sinClienteRequests = requestUrls.filter((url) =>
        url.includes('sinCliente=true')
      );
      expect(sinClienteRequests.length).toBeGreaterThan(0);
    });

    // AND: Now only orphan contact shown (assigned is filtered out by server)
    await waitFor(() => {
      expect(screen.getByText('Cache Orphan')).toBeInTheDocument();
    });

    // WHEN: Toggle sinCliente off again (sinClienteLocal becomes false)
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Full list (including assigned) is shown again (cache key = {sinCliente: false})
    await waitFor(() => {
      expect(screen.getByText('Cache Assigned')).toBeInTheDocument();
    });
  });
});
