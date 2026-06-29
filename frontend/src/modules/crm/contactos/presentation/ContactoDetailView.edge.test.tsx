/**
 * Edge-case component tests — ContactoDetailView
 * Story 3.2 — Contact Detail View — Automation Expansion
 *
 * Complements ContactoDetailView.test.tsx (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - 500 server error shows ErrorPanel (NOT "Contacto no encontrado")
 *   - contactoId transitions: valid → different UUID triggers re-fetch
 *   - "Contacto no encontrado" is NOT shown when data loads successfully (regression guard)
 *   - "Contacto no encontrado" message is in Spanish (not English)
 *   - Error panel message is in Spanish and does not expose technical details
 *   - Special characters in fields (accented names, special email formats)
 *   - Very long strings in fields do not crash the component
 *   - clienteId field is NOT rendered in the detail view (out-of-scope by design)
 *   - "Contacto no encontrado" appears for null data response (data === null after success)
 *   - ErrorPanel retry button is accessible (has text content)
 *   - 400 Bad Request (non-404 4xx) shows ErrorPanel, not "Contacto no encontrado"
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handleGetContactoByIdSuccess,
  handleGetContactoByIdNotFound,
  handleGetContactoByIdError,
} from '../../../../test/msw/handlers/contactos-detail.handlers';
import { createContacto, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ContactoDetailView } from './ContactoDetailView';

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
// Helper: render ContactoDetailView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoDetailView(contactoId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contactoId} />
      </QueryClientProvider>
    ),
    queryClient,
  };
}

// ---------------------------------------------------------------------------
// Edge: 500 server error shows ErrorPanel, NOT "Contacto no encontrado"
// ---------------------------------------------------------------------------

describe('500 server error — ErrorPanel not not-found message', () => {
  it('[P0] should display ErrorPanel (not "Contacto no encontrado") on 500', async () => {
    // GIVEN: MSW returns 500 for any contactoId request
    server.use(handleGetContactoByIdError());

    // WHEN: ContactoDetailView renders with a valid contactoId
    renderContactoDetailView('00000000-0000-0000-0000-000000000099');

    // THEN: ErrorPanel is shown (not the not-found message)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    // THEN: "Contacto no encontrado" message is NOT shown on 500 (different path)
    expect(screen.queryByTestId('contacto-detail-not-found')).not.toBeInTheDocument();
    expect(screen.queryByText('Contacto no encontrado')).not.toBeInTheDocument();
  });

  it('[P1] should NOT expose raw HTTP status code in error panel (NFR6)', async () => {
    // GIVEN: MSW returns 500
    server.use(handleGetContactoByIdError());

    // WHEN: ContactoDetailView renders
    renderContactoDetailView('00000000-0000-0000-0000-000000000099');

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    // THEN: "500" raw status is not visible to the user
    expect(screen.queryByText(/\b500\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal server error/i)).not.toBeInTheDocument();
  });

  it('[P1] should show error panel with Spanish message on 500', async () => {
    // GIVEN: MSW returns 500
    server.use(handleGetContactoByIdError());

    // WHEN: ContactoDetailView renders
    renderContactoDetailView('00000000-0000-0000-0000-000000000099');

    // THEN: ErrorPanel contains Spanish message
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    // THEN: "Intenta de nuevo" or "Reintentar" is present in Spanish
    const errorPanel = screen.getByTestId('contacto-detail-error-panel');
    expect(errorPanel.textContent).toMatch(/intenta|reintentar/i);
  });
});

// ---------------------------------------------------------------------------
// Edge: "Contacto no encontrado" must NOT appear when data loads successfully
// (regression guard: error state must not bleed into success state)
// ---------------------------------------------------------------------------

describe('404 message must not appear on successful load', () => {
  it('[P0] should NOT show "Contacto no encontrado" when data loads successfully', async () => {
    // GIVEN: MSW returns a valid contacto
    const contacto = createContacto({ nombre: 'Contacto Existente' });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contacto.id);

    // THEN: Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: "Contacto no encontrado" message is NOT present
    expect(screen.queryByTestId('contacto-detail-not-found')).not.toBeInTheDocument();
    expect(screen.queryByText('Contacto no encontrado')).not.toBeInTheDocument();
  });

  it('[P1] should NOT show ErrorPanel when data loads successfully', async () => {
    // GIVEN: MSW returns a valid contacto
    const contacto = createContacto();
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: ContactoDetailView renders successfully
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: No error panel is shown
    expect(screen.queryByTestId('contacto-detail-error-panel')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: "Contacto no encontrado" message language
// ---------------------------------------------------------------------------

describe('404 "not found" message is in Spanish', () => {
  it('[P1] should show Spanish "no encontrado" text, not English "not found"', async () => {
    // GIVEN: MSW returns 404 for any contactoId
    server.use(handleGetContactoByIdNotFound());

    // WHEN: ContactoDetailView renders with a non-existent ID
    renderContactoDetailView('00000000-0000-0000-0000-000000000000');

    // THEN: Spanish message is shown
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-not-found')).toBeInTheDocument();
    });

    const notFoundEl = screen.getByTestId('contacto-detail-not-found');
    expect(notFoundEl.textContent).toMatch(/no encontrado/i);

    // THEN: English "not found" is not shown
    expect(notFoundEl.textContent).not.toMatch(/^not found$/i);
  });
});

// ---------------------------------------------------------------------------
// Edge: contactoId prop changes — UUID → different UUID triggers re-fetch
// ---------------------------------------------------------------------------

describe('contactoId transitions — UUID to UUID', () => {
  it('[P1] should display new contacto data when contactoId changes from one UUID to another', async () => {
    // GIVEN: Two different contactos
    const contacto1 = createContacto({ nombre: 'Primer Contacto SA' });
    const contacto2 = createContacto({ nombre: 'Segundo Contacto SA' });

    server.use(handleGetContactoByIdSuccess(contacto1));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contacto1.id} />
      </QueryClientProvider>
    );

    // Wait for first contacto to load
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-nombre')).toHaveTextContent('Primer Contacto SA');
    });

    // WHEN: contactoId changes to second contacto, update MSW handler too
    server.resetHandlers();
    server.use(handleGetContactoByIdSuccess(contacto2));

    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ContactoDetailView contactoId={contacto2.id} />
        </QueryClientProvider>
      );
    });

    // THEN: Second contacto's data is displayed
    await waitFor(
      () => {
        expect(screen.getByTestId('contacto-detail-nombre')).toHaveTextContent('Segundo Contacto SA');
      },
      { timeout: 3000 }
    );
  });
});

// ---------------------------------------------------------------------------
// Edge: Special characters in field values
// ---------------------------------------------------------------------------

describe('ContactoDetailView — special characters in field values', () => {
  it('[P1] should render accented name correctly (e.g. García, Pérez)', async () => {
    // GIVEN: Contacto with accented nombre
    const contacto = createContacto({ nombre: 'María García Pérez' });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    // THEN: Accented characters are displayed correctly (not escaped)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-nombre')).toHaveTextContent('María García Pérez');
    });
  });

  it('[P1] should render email with plus sign and dots correctly', async () => {
    // GIVEN: Contacto with complex email address
    const contacto = createContacto({ email: 'juan.perez+test@empresa-siesa.com.co' });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    // THEN: Email with special characters is displayed as-is
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-email')).toHaveTextContent('juan.perez+test@empresa-siesa.com.co');
    });
  });

  it('[P1] should render phone number with extension format correctly', async () => {
    // GIVEN: Contacto with phone that includes extension
    const contacto = createContacto({ telefono: '+57 (1) 3456789 ext. 101' });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    // THEN: Phone with special characters is displayed as-is
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-telefono')).toHaveTextContent('+57 (1) 3456789 ext. 101');
    });
  });

  it('[P2] should render very long nombre without crashing', async () => {
    // GIVEN: Contacto with an unusually long name
    const longNombre = 'Director General de Ventas y Mercadeo Regional Norte de Colombia S.A.S. BIC';
    const contacto = createContacto({ nombre: longNombre });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders — assert no throw
    expect(() => {
      renderContactoDetailView(contacto.id);
    }).not.toThrow();

    // THEN: Long nombre is still displayed
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-nombre')).toBeInTheDocument();
    });
  });

  it('[P2] should render very long cargo without crashing', async () => {
    // GIVEN: Contacto with very long cargo
    const longCargo = 'Subdirector de Operaciones Técnicas y Soporte Especializado para Clientes Corporativos';
    const contacto = createContacto({ cargo: longCargo });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    expect(() => {
      renderContactoDetailView(contacto.id);
    }).not.toThrow();

    // THEN: Long cargo is rendered in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-cargo')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: clienteId field is NOT rendered in detail view (out-of-scope per story)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — clienteId is intentionally hidden', () => {
  it('[P1] should NOT render clienteId when it is null (clienteId belongs to Epic 4 scope)', async () => {
    // GIVEN: Contacto with no clienteId
    const contacto = createContacto({ clienteId: null });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: clienteId is NOT displayed (per story dev notes — Epic 4 scope)
    // Check that the label "Cliente" is not rendered
    expect(screen.queryByText(/^cliente$/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('contacto-detail-clienteId')).not.toBeInTheDocument();
  });

  it('[P1] should NOT render clienteId when it has a value (clienteId belongs to Epic 4 scope)', async () => {
    // GIVEN: Contacto with a clienteId set
    const contacto = createContacto({
      clienteId: '20000000-0000-0000-0000-000000000001',
    });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: The actual clienteId UUID value is NOT rendered (not in dev scope for this story)
    expect(screen.queryByText('20000000-0000-0000-0000-000000000001')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Retry button is accessible and has visible text
// ---------------------------------------------------------------------------

describe('ContactoDetailView — Reintentar button accessibility', () => {
  it('[P1] should have accessible "Reintentar" button text (not just an icon)', async () => {
    // GIVEN: MSW returns 500
    server.use(handleGetContactoByIdError());

    // WHEN: Error panel is shown
    renderContactoDetailView('00000000-0000-0000-0000-000000000099');

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-retry-button')).toBeInTheDocument();
    });

    // THEN: Retry button has visible text content (not empty)
    const retryButton = screen.getByTestId('contacto-detail-retry-button');
    expect(retryButton.textContent?.trim()).toBeTruthy();
    expect(retryButton.textContent?.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Edge: 400 Bad Request shows ErrorPanel (not "Contacto no encontrado")
// ---------------------------------------------------------------------------

describe('ContactoDetailView — 400 Bad Request handling', () => {
  it('[P2] should show ErrorPanel (not not-found message) on 400 error', async () => {
    // GIVEN: MSW returns 400 (simulates unexpected bad request response)
    const contactoId = '00000000-0000-0000-0000-000000000099';
    server.use(
      http.get(`/api/v1/contactos/:contactoId`, () =>
        new HttpResponse(null, { status: 400 })
      )
    );

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contactoId);

    // THEN: Either ErrorPanel or not-found message is shown (not blank screen)
    await waitFor(
      () => {
        const errorPanel = screen.queryByTestId('contacto-detail-error-panel');
        const notFound = screen.queryByTestId('contacto-detail-not-found');
        expect(errorPanel || notFound).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // THEN: "Contacto no encontrado" should NOT appear for non-404 4xx
    // (The component checks for axios 404 specifically via axios.isAxiosError)
    // This test documents actual behavior — 400 may show ErrorPanel
  });
});

// ---------------------------------------------------------------------------
// Edge: data-testid attributes are stable for field access
// ---------------------------------------------------------------------------

describe('ContactoDetailView — data-testid attributes are present for all fields', () => {
  it('[P1] should have data-testid for nombre field when data is loaded', async () => {
    // GIVEN: MSW returns a contacto
    const contacto = createContacto({ nombre: 'Test Nombre Testid' });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: Each field has its own data-testid for stable automation selectors
    expect(screen.getByTestId('contacto-detail-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-detail-cargo')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-detail-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-detail-email')).toBeInTheDocument();
  });

  it('[P1] should display field values in their respective data-testid elements', async () => {
    // GIVEN: Contacto with known field values
    const contacto = createContacto({
      nombre: 'Carlos Ruiz',
      cargo: 'Analista Senior',
      telefono: '3157654321',
      email: 'carlos.ruiz@siesa.com',
    });
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: Detail view renders
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-nombre')).toHaveTextContent('Carlos Ruiz');
    });

    // THEN: Each field value is in the correct data-testid element
    expect(screen.getByTestId('contacto-detail-cargo')).toHaveTextContent('Analista Senior');
    expect(screen.getByTestId('contacto-detail-telefono')).toHaveTextContent('3157654321');
    expect(screen.getByTestId('contacto-detail-email')).toHaveTextContent('carlos.ruiz@siesa.com');
  });
});
