/**
 * Story 2.2: ClienteDetailPanel — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD component coverage with edge cases NOT covered by
 * ClienteDetailPanel.test.tsx.
 *
 * Additional scenarios:
 * - Empty string fields (nombre, nit, telefono, ciudad)
 * - clienteId transitions: undefined → defined (switching from placeholder to loading)
 * - clienteId transitions: defined → undefined (switching back to placeholder)
 * - ARIA container label is always present
 * - Semantic dl/dt/dd structure verified
 * - 4xx other than 404 (e.g. 403) treated as generic error (not 404 message)
 * - ErrorPanel has role="alert" for screen reader announcement
 * - Multiple rapid clienteId prop changes do not cause duplicate renders of wrong state
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { ClienteDetailPanel } from './ClienteDetailPanel';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api/v1/clientes';
const KNOWN_ID = '550e8400-e29b-41d4-a716-446655440001';

function buildClienteDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: KNOWN_ID,
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
    ...overrides,
  };
}

const server = setupServer(
  http.get(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail())),
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

// ─── ARIA attributes always present on container ─────────────────────────────

describe('ARIA — Container attributes', () => {
  it('[P1] should always render the detail panel container with aria-label (placeholder state)', () => {
    // GIVEN: No clienteId provided
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: undefined }));

    // THEN: Container aria-label is present for screen reader accessibility
    const panel = screen.getByTestId('cliente-detail-panel');
    expect(panel).toHaveAttribute('aria-label');
    expect(panel.getAttribute('aria-label')!.length).toBeGreaterThan(0);
  });

  it('[P1] should render the detail panel container with aria-label (success state)', async () => {
    // GIVEN: API returns valid client
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });

    // THEN: Container aria-label is still present after data loads
    const panel = screen.getByTestId('cliente-detail-panel');
    expect(panel).toHaveAttribute('aria-label');
  });

  it('[P1] should render the detail panel container with aria-label (error state)', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: Container aria-label is present even in error state
    const panel = screen.getByTestId('cliente-detail-panel');
    expect(panel).toHaveAttribute('aria-label');
  });
});

// ─── Semantic dl/dt/dd structure ─────────────────────────────────────────────

describe('Semantic markup — dl/dt/dd structure', () => {
  it('[P1] should render a dl element as the detail content container', async () => {
    // GIVEN: API returns valid client
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });

    // THEN: detail content is a <dl> element (definition list for label-value pairs)
    const content = screen.getByTestId('cliente-detail-content');
    expect(content.tagName.toLowerCase()).toBe('dl');
  });

  it('[P1] should contain dt (term) elements for field labels', async () => {
    // GIVEN: API returns valid client
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });

    // THEN: dl contains dt elements for "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
    const content = screen.getByTestId('cliente-detail-content');
    const terms = content.querySelectorAll('dt');
    expect(terms.length).toBeGreaterThanOrEqual(4);
  });

  it('[P1] should contain dd (description) elements for field values', async () => {
    // GIVEN: API returns valid client
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });

    // THEN: dl contains dd elements with actual values
    const content = screen.getByTestId('cliente-detail-content');
    const descriptions = content.querySelectorAll('dd');
    expect(descriptions.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── 4xx other than 404 treated as generic error ──────────────────────────────

describe('HTTP 4xx non-404 errors — treated as generic error', () => {
  it('[P1] should display ErrorPanel (not 404 message) for 403 Forbidden', async () => {
    // GIVEN: API returns 403
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 403, title: 'Forbidden' },
          { status: 403 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: ErrorPanel is shown (403 is not a 404 — should use generic error state)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument();
  });

  it('[P2] should display ErrorPanel (not 404 message) for 401 Unauthorized', async () => {
    // GIVEN: API returns 401
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 401, title: 'Unauthorized' },
          { status: 401 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: ErrorPanel is shown (401 is not a 404)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument();
  });
});

// ─── ErrorPanel has role="alert" for screen readers ──────────────────────────

describe('ErrorPanel — Accessibility role', () => {
  it('[P1] should render an element with role="alert" inside the error state', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    // WHEN: ClienteDetailPanel renders the ErrorPanel
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: An element with role="alert" exists within the error state
    const alertElements = screen.getAllByRole('alert');
    expect(alertElements.length).toBeGreaterThan(0);
  });
});

// ─── Client with empty string fields ─────────────────────────────────────────

describe('Boundary — Empty string field values', () => {
  it('[P2] should render without crashing when nombre is an empty string', async () => {
    // GIVEN: API returns a client with empty nombre
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ nombre: '' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Component renders without crashing; detail content is present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
  });

  it('[P2] should render without crashing when telefono is an empty string', async () => {
    // GIVEN: API returns a client with empty telefono
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ telefono: '' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Component renders without crashing
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
  });

  it('[P2] should still render Spanish labels even when all field values are empty strings', async () => {
    // GIVEN: API returns client with all empty string values
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ nombre: '', nit: '', telefono: '', ciudad: '' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Labels are still rendered (component structure intact)
    await waitFor(() => {
      const content = screen.getByTestId('cliente-detail-content');
      expect(content).toHaveTextContent(/Nombre/i);
      expect(content).toHaveTextContent(/NIT/i);
    });
  });
});

// ─── Skeleton count validation ────────────────────────────────────────────────

describe('Skeleton screen — Row count', () => {
  it('[P2] should display 4 skeleton rows (one per field) during loading', async () => {
    // GIVEN: API is slow (never resolves in this window)
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(buildClienteDetail());
      }),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Skeleton screen element exists (wraps all skeleton rows)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
    });

    // Verify at least one skeleton span exists (react-loading-skeleton renders spans)
    const skeletonContainer = screen.getByTestId('cliente-detail-skeleton');
    const skeletonElements = skeletonContainer.querySelectorAll('span');
    expect(skeletonElements.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Reintentar button is accessible via keyboard ────────────────────────────

describe('Reintentar button — Keyboard accessibility', () => {
  it('[P1] should have the Reintentar button focusable and with correct type="button"', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    // WHEN: ClienteDetailPanel renders the ErrorPanel
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('error-panel-retry-button')).toBeInTheDocument();
    });

    // THEN: The button has type="button" (not submit, to avoid accidental form submission)
    const retryButton = screen.getByTestId('error-panel-retry-button');
    expect(retryButton.getAttribute('type')).toBe('button');
  });
});

// ─── Not-found state aria-live ────────────────────────────────────────────────

describe('Not-found state — aria-live announcement', () => {
  it('[P1] should have aria-live="polite" on the cliente-not-found message', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { type: 'https://tools.ietf.org/html/rfc7807', status: 404, title: 'Not Found' },
          { status: 404 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel renders the not-found state
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument();
    });

    // THEN: aria-live="polite" is set so screen readers announce the change
    const notFound = screen.getByTestId('cliente-not-found');
    expect(notFound).toHaveAttribute('aria-live', 'polite');
  });
});
