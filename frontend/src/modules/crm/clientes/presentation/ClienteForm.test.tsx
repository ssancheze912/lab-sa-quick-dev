/**
 * Story 2.3: Create Client — ClienteForm Component Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC1 — Form renders 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   AC2 — Valid submit calls POST /api/v1/clientes and invokes onSuccess callback
 *   AC3 — Empty fields show inline error messages, no HTTP request sent
 *   AC4 — Whitespace-only fields show inline errors, no HTTP request sent
 *   AC5 — 409 response shows "El NIT/RUC ya está registrado" without stack trace
 *   AC6 — "Cancelar" calls onCancel without sending any HTTP request
 *
 * Test scenarios from test-design-epic-2.md:
 *   TC-E2-P0-08 — ClienteForm: submit empty → 4 inline errors, zero MSW calls
 *
 * Test status: RED — tests will fail until ClienteForm.tsx is implemented:
 *   - frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx does NOT exist yet
 *
 * Framework: Vitest + @testing-library/react + MSW
 * Patterns: Network-first MSW intercepts, data-testid selectors, Given-When-Then,
 *           explicit waits via findBy*, no hard waits.
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';

// Module under test — does NOT exist yet (RED phase)
// @ts-expect-error module does not exist until implementation
import { ClienteForm } from './ClienteForm';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const mockCreatedCliente = {
  id: '33333333-3333-4333-8333-333333333333',
  nombre: 'Empresa Test SA',
  nit: '900123456-7',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-05-24T15:00:00Z',
  updatedAt: '2026-05-24T15:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first intercepts
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.post('*/api/v1/clientes', () =>
    HttpResponse.json(mockCreatedCliente, { status: 201 })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Render helper with QueryClientProvider
// ─────────────────────────────────────────────────────────────────────────────

function renderForm(props: {
  onSuccess?: (cliente: unknown) => void;
  onCancel?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteForm, props)
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Form renders 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC1: renders all 4 required fields', () => {
  it('should render a Nombre input field', () => {
    // GIVEN: ClienteForm is mounted
    renderForm();

    // WHEN: Form is rendered

    // THEN: Nombre input is visible
    expect(screen.getByTestId('input-nombre')).toBeTruthy();
  });

  it('should render a NIT/RUC input field', () => {
    // GIVEN: ClienteForm is mounted
    renderForm();

    // THEN: NIT/RUC input is visible
    expect(screen.getByTestId('input-nit')).toBeTruthy();
  });

  it('should render a Teléfono input field', () => {
    // GIVEN: ClienteForm is mounted
    renderForm();

    // THEN: Teléfono input is visible
    expect(screen.getByTestId('input-telefono')).toBeTruthy();
  });

  it('should render a Ciudad input field', () => {
    // GIVEN: ClienteForm is mounted
    renderForm();

    // THEN: Ciudad input is visible
    expect(screen.getByTestId('input-ciudad')).toBeTruthy();
  });

  it('should have aria-label="Crear nuevo cliente" on the form container (WCAG 2.1 AA)', () => {
    // GIVEN: ClienteForm is mounted
    renderForm();

    // THEN: Form container has correct ARIA label
    expect(screen.getByRole('form', { name: /crear nuevo cliente/i })).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-08 — AC3: Empty submit shows 4 inline errors, zero HTTP requests
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC3: empty submit shows inline errors and sends no HTTP request', () => {
  it('TC-E2-P0-08: should show inline error for Nombre when form is submitted empty', async () => {
    // GIVEN: ClienteForm is mounted with all fields empty
    renderForm();
    const user = userEvent.setup();

    // WHEN: User clicks "Guardar" without filling any fields
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Inline error for Nombre is visible
    expect(await screen.findByTestId('error-nombre')).toBeTruthy();
  });

  it('TC-E2-P0-08: should show inline error for NIT/RUC when form is submitted empty', async () => {
    // GIVEN: ClienteForm is mounted with all fields empty
    renderForm();
    const user = userEvent.setup();

    // WHEN: User clicks "Guardar" without filling any fields
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Inline error for NIT is visible
    expect(await screen.findByTestId('error-nit')).toBeTruthy();
  });

  it('TC-E2-P0-08: should show inline error for Teléfono when form is submitted empty', async () => {
    // GIVEN: ClienteForm is mounted with all fields empty
    renderForm();
    const user = userEvent.setup();

    // WHEN: User clicks "Guardar" without filling any fields
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Inline error for Teléfono is visible
    expect(await screen.findByTestId('error-telefono')).toBeTruthy();
  });

  it('TC-E2-P0-08: should show inline error for Ciudad when form is submitted empty', async () => {
    // GIVEN: ClienteForm is mounted with all fields empty
    renderForm();
    const user = userEvent.setup();

    // WHEN: User clicks "Guardar" without filling any fields
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Inline error for Ciudad is visible
    expect(await screen.findByTestId('error-ciudad')).toBeTruthy();
  });

  it('TC-E2-P0-08: should NOT send any HTTP request when form is submitted empty', async () => {
    // GIVEN: ClienteForm is mounted
    let postCalled = false;
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCalled = true;
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User clicks "Guardar" without filling fields
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: No HTTP request was sent to the backend
    await waitFor(() => {
      expect(postCalled).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Whitespace-only inputs show inline errors, no HTTP request
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC4: whitespace-only inputs show errors without HTTP request', () => {
  it('should show inline error for Nombre when only spaces are entered', async () => {
    // GIVEN: ClienteForm is mounted
    renderForm();
    const user = userEvent.setup();

    // WHEN: User types whitespace in Nombre and submits
    await user.type(screen.getByTestId('input-nombre'), '   ');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Inline error for Nombre is visible
    expect(await screen.findByTestId('error-nombre')).toBeTruthy();
  });

  it('should NOT send any HTTP request when Nombre contains only whitespace', async () => {
    // GIVEN: ClienteForm is mounted
    let postCalled = false;
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCalled = true;
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User fills whitespace in Nombre, valid data in rest, and submits
    await user.type(screen.getByTestId('input-nombre'), '   ');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: No HTTP request was sent
    await waitFor(() => {
      expect(postCalled).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Happy path: valid submit calls POST and invokes onSuccess
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC2: valid submit calls POST /api/v1/clientes', () => {
  it('should call POST /api/v1/clientes with correct body when all fields are valid', async () => {
    // GIVEN: MSW intercepts POST and captures the request body
    let capturedBody: unknown = null;
    server.use(
      http.post('*/api/v1/clientes', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User fills all fields and submits
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Test SA');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: POST was called with the correct body
    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        nombre: 'Empresa Test SA',
        nit: '900123456-7',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      });
    });
  });

  it('should invoke onSuccess callback with the created cliente on successful submit', async () => {
    // GIVEN: ClienteForm with onSuccess spy
    const onSuccess = vi.fn();
    renderForm({ onSuccess });
    const user = userEvent.setup();

    // WHEN: User fills all fields and submits
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Test SA');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: onSuccess is invoked
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — 409 response shows "El NIT/RUC ya está registrado" without technical details
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC5: 409 shows conflict message without technical details', () => {
  it('should show "El NIT/RUC ya está registrado" when POST returns 409', async () => {
    // GIVEN: MSW returns 409 Conflict
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: "El NIT/RUC '900123456-7' ya está registrado.",
          },
          { status: 409 }
        )
      )
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User submits valid form data
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Test SA');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: The hardcoded Spanish conflict message is shown
    expect(await screen.findByText(/nit.*ya está registrado|ya está registrado/i)).toBeTruthy();
  });

  it('should NOT dismiss the form on 409 response', async () => {
    // GIVEN: MSW returns 409
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json({ status: 409 }, { status: 409 })
      )
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User submits
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Test SA');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Form remains visible (not dismissed)
    await waitFor(() => {
      expect(screen.getByTestId('input-nombre')).toBeTruthy();
    });
  });

  it('should NOT expose any stack trace or technical message on 409 (NFR6)', async () => {
    // GIVEN: MSW returns 409 with backend error details
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            status: 409,
            detail: "El NIT/RUC '900123456-7' ya está registrado.",
            stackTrace: 'at SiesaAgents.Application...',
          },
          { status: 409 }
        )
      )
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User submits
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Test SA');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: No stack trace text is visible in the rendered UI
    await waitFor(() => {
      const pageText = document.body.textContent ?? '';
      expect(pageText).not.toContain('at SiesaAgents');
      expect(pageText).not.toContain('stackTrace');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — "Cancelar" calls onCancel without sending any HTTP request
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC6: Cancelar calls onCancel without HTTP request', () => {
  it('should call onCancel when "Cancelar" button is clicked', async () => {
    // GIVEN: ClienteForm with onCancel spy
    const onCancel = vi.fn();
    renderForm({ onCancel });
    const user = userEvent.setup();

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: onCancel is invoked
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should NOT send any HTTP request when "Cancelar" is clicked', async () => {
    // GIVEN: MSW intercept watching for POST calls
    let postCalled = false;
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCalled = true;
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );
    renderForm({ onCancel: vi.fn() });
    const user = userEvent.setup();

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: No POST request was made
    await waitFor(() => {
      expect(postCalled).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Guardar" button is disabled while mutation is pending
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — "Guardar" is disabled while mutation is pending', () => {
  it('should have aria-disabled on "Guardar" while the mutation is in flight', async () => {
    // GIVEN: MSW returns 201 with a slight delay
    server.use(
      http.post('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );
    renderForm();
    const user = userEvent.setup();

    // WHEN: User fills all fields and clicks "Guardar"
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Test SA');
    await user.type(screen.getByTestId('input-nit'), '900123456-7');
    await user.type(screen.getByTestId('input-telefono'), '3001234567');
    await user.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: "Guardar" button becomes aria-disabled while pending
    await waitFor(() => {
      const guardarBtn = screen.getByRole('button', { name: /guardar/i });
      const isDisabledOrAriaDisabled =
        guardarBtn.hasAttribute('disabled') ||
        guardarBtn.getAttribute('aria-disabled') === 'true';
      expect(isDisabledOrAriaDisabled).toBe(true);
    });
  });
});
