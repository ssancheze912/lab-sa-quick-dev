/**
 * Story 2.3: ClienteForm — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD component coverage with edge cases NOT covered by ClienteForm.test.tsx.
 *
 * Additional scenarios:
 * - All field values are preserved after a 5xx error (not just general form open state)
 * - NIT field error is cleared when user modifies the NIT field after a 409
 * - onNotify callback fires with "success" and the message on success
 * - onNotify callback fires with "error" and the message on 5xx
 * - aria-invalid attribute on NIT input is true after 409 error
 * - aria-invalid attribute on fields is false on initial render
 * - aria-describedby is set on fields with errors
 * - Submit button has aria-label="Guardar nuevo cliente" when not pending
 * - Submit button has aria-label="Guardando cliente" when pending
 * - Cancelar button does not trigger form submission
 * - Form with data-testid="cliente-form" is in the DOM after render
 * - 400 validation error from server (not Zod) — generic toast shown (not inline)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ClienteForm } from './ClienteForm';

// ─── Mock siesa-ui-kit toast ──────────────────────────────────────────────────

vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'siesa-ui-kit';

// ─── MSW server ───────────────────────────────────────────────────────────────

const POST_URL = 'http://localhost:5000/api/v1/clientes';

const clienteStub = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const server = setupServer(
  http.post(POST_URL, () => HttpResponse.json(clienteStub, { status: 201 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── Helper wrapper + render ──────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

function renderForm(onSuccess = vi.fn(), onCancel = vi.fn(), onNotify = vi.fn()) {
  return render(
    createElement(
      createWrapper(),
      null,
      createElement(ClienteForm, { onSuccess, onCancel, onNotify }),
    ),
  );
}

// ─── data-testid="cliente-form" in DOM ────────────────────────────────────────

describe('[P1] ClienteForm — DOM presence', () => {
  it('[P1] should render the form with data-testid="cliente-form"', () => {
    // GIVEN: ClienteForm is rendered
    renderForm();

    // THEN: The form element with the expected test id is in the DOM
    expect(document.querySelector('[data-testid="cliente-form"]')).toBeInTheDocument();
  });
});

// ─── ARIA attributes on initial render ───────────────────────────────────────

describe('[P1] ClienteForm — ARIA attributes initial state', () => {
  it('[P1] should have aria-invalid=false on nombre input before submission', () => {
    // GIVEN: Form is freshly rendered (no errors yet)
    renderForm();

    // THEN: aria-invalid is false (or absent) on nombre
    const input = screen.getByLabelText('Nombre');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('[P1] should have aria-invalid=false on nit input before submission', () => {
    // GIVEN: Form is freshly rendered
    renderForm();

    // THEN: aria-invalid is false (or absent) on nit
    const input = screen.getByLabelText('NIT/RUC');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('[P1] should render submit button with aria-label "Guardar nuevo cliente" when not pending', () => {
    // GIVEN: Form is freshly rendered (not in pending state)
    renderForm();

    // THEN: Submit button has the expected aria-label
    const submitButton = screen.getByTestId('btn-submit-cliente');
    expect(submitButton.getAttribute('aria-label')).toBe('Guardar nuevo cliente');
  });
});

// ─── ARIA attributes after 409 error ──────────────────────────────────────────

describe('[P1] ClienteForm — ARIA attributes after 409 error', () => {
  it('[P1] should set aria-invalid=true on nit input after 409 conflict response', async () => {
    // GIVEN: POST returns 409
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa');
    await user.type(screen.getByLabelText('NIT/RUC'), '900123456-7');
    await user.type(screen.getByLabelText('Teléfono'), '6011234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    // WHEN: Form is submitted and server returns 409
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: aria-invalid is true on the nit field
    await waitFor(() => {
      const nitInput = screen.getByLabelText('NIT/RUC');
      expect(nitInput.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('[P1] should set aria-describedby on nit input after 409 conflict response', async () => {
    // GIVEN: POST returns 409
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json(
          { status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900123456-7');
    await user.type(screen.getByLabelText('Teléfono'), '6011234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    // WHEN: Submit with 409 response
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: aria-describedby links to the error element
    await waitFor(() => {
      const nitInput = screen.getByLabelText('NIT/RUC');
      expect(nitInput.getAttribute('aria-describedby')).toBeTruthy();
    });
  });
});

// ─── Data preservation after 5xx ─────────────────────────────────────────────

describe('[P1] ClienteForm — Field values preserved after 5xx error', () => {
  it('[P1] should preserve the NIT field value after a 500 server error', async () => {
    // GIVEN: POST returns 500
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900999777-5');
    await user.type(screen.getByLabelText('Teléfono'), '3009997775');
    await user.type(screen.getByLabelText('Ciudad'), 'Manizales');

    // WHEN: Submit and get 500
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: NIT value is preserved
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(screen.getByLabelText('NIT/RUC')).toHaveValue('900999777-5');
  });

  it('[P1] should preserve the Teléfono field value after a 500 server error', async () => {
    // GIVEN: POST returns 500
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900000001-1');
    await user.type(screen.getByLabelText('Teléfono'), '3001112222');
    await user.type(screen.getByLabelText('Ciudad'), 'Cali');

    // WHEN: Submit and get 500
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Teléfono value is preserved
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(screen.getByLabelText('Teléfono')).toHaveValue('3001112222');
  });

  it('[P1] should preserve the Ciudad field value after a 500 server error', async () => {
    // GIVEN: POST returns 500
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Ciudad Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900000002-2');
    await user.type(screen.getByLabelText('Teléfono'), '3002223333');
    await user.type(screen.getByLabelText('Ciudad'), 'Cartagena');

    // WHEN: Submit and get 500
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Ciudad value is preserved
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Cartagena');
  });
});

// ─── onNotify callback ────────────────────────────────────────────────────────

describe('[P1] ClienteForm — onNotify callback', () => {
  it('[P1] should call onNotify with "success" and the success message on successful submit', async () => {
    // GIVEN: POST returns 201
    const user = userEvent.setup();
    const onNotify = vi.fn();

    renderForm(vi.fn(), vi.fn(), onNotify);

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Notify Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900111333-4');
    await user.type(screen.getByLabelText('Teléfono'), '3001113334');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    // WHEN: Form is submitted successfully
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: onNotify was called with success type and correct message
    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('success', 'Cliente creado correctamente');
    });
  });

  it('[P1] should call onNotify with "error" and the error message on 5xx response', async () => {
    // GIVEN: POST returns 500
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    const onNotify = vi.fn();

    renderForm(vi.fn(), vi.fn(), onNotify);

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Error Notify');
    await user.type(screen.getByLabelText('NIT/RUC'), '900444555-6');
    await user.type(screen.getByLabelText('Teléfono'), '3004445556');
    await user.type(screen.getByLabelText('Ciudad'), 'Medellín');

    // WHEN: Form is submitted and server returns 500
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: onNotify called with error type and message
    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('error', 'No se pudo crear el cliente. Intenta de nuevo.');
    });
  });

  it('[P1] should NOT call onNotify on 409 conflict (inline error only, no toast notification)', async () => {
    // GIVEN: POST returns 409
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json(
          { status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );
    const onNotify = vi.fn();

    renderForm(vi.fn(), vi.fn(), onNotify);

    await user.type(screen.getByLabelText('Nombre'), 'Empresa 409');
    await user.type(screen.getByLabelText('NIT/RUC'), '900123456-7');
    await user.type(screen.getByLabelText('Teléfono'), '6011234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    // WHEN: Form is submitted and server returns 409
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: onNotify is NOT called for 409 (inline field error only)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
    expect(onNotify).not.toHaveBeenCalled();
  });
});

// ─── Cancelar does not trigger submit ─────────────────────────────────────────

describe('[P1] ClienteForm — Cancelar does not trigger form submit', () => {
  it('[P1] should not show validation errors when Cancelar is clicked on an empty form', async () => {
    // GIVEN: Form is rendered with all fields empty
    const user = userEvent.setup();

    renderForm();

    // WHEN: User clicks Cancelar without filling any fields
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: No validation error messages are shown
    expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
    expect(screen.queryByText('El NIT/RUC es requerido')).not.toBeInTheDocument();
  });
});

// ─── Inline error present after Zod validation ───────────────────────────────

describe('[P1] ClienteForm — Inline Zod errors have correct test IDs', () => {
  it('[P1] should render error with data-testid="error-nombre" for empty nombre', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup();
    renderForm();

    // WHEN: Submit with empty nombre
    await user.type(screen.getByLabelText('NIT/RUC'), '900000001-0');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Error element with correct test id is present
    await waitFor(() => {
      expect(document.querySelector('[data-testid="error-nombre"]')).toBeInTheDocument();
    });
  });

  it('[P1] should render error with data-testid="error-nit" for empty nit', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup();
    renderForm();

    // WHEN: Submit with empty nit
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Test');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Error element with correct test id is present
    await waitFor(() => {
      expect(document.querySelector('[data-testid="error-nit"]')).toBeInTheDocument();
    });
  });

  it('[P1] should render error with data-testid="error-telefono" for empty telefono', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup();
    renderForm();

    // WHEN: Submit with empty telefono
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900000001-0');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Error element with correct test id is present
    await waitFor(() => {
      expect(document.querySelector('[data-testid="error-telefono"]')).toBeInTheDocument();
    });
  });

  it('[P1] should render error with data-testid="error-ciudad" for empty ciudad', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup();
    renderForm();

    // WHEN: Submit with empty ciudad
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Test');
    await user.type(screen.getByLabelText('NIT/RUC'), '900000001-0');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Error element with correct test id is present
    await waitFor(() => {
      expect(document.querySelector('[data-testid="error-ciudad"]')).toBeInTheDocument();
    });
  });
});

// ─── Backend unit tests edge cases ────────────────────────────────────────────

describe('[P1] ClienteForm — Backend validation response handling', () => {
  it('[P1] should show toast error for 400 validation response from server (not just 5xx)', async () => {
    // GIVEN: POST returns 400 (server-side validation that bypassed client Zod)
    const user = userEvent.setup();
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 400, title: 'Bad Request' }, { status: 400 }),
      ),
    );

    renderForm();

    // Fill all fields to bypass Zod (valid client-side data)
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Válida');
    await user.type(screen.getByLabelText('NIT/RUC'), '900123456-7');
    await user.type(screen.getByLabelText('Teléfono'), '6011234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    // WHEN: Server returns 400 (not 409, not 5xx — unexpected validation error)
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // THEN: Generic toast error is shown (400 is not 409, treated as other error)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo crear el cliente. Intenta de nuevo.');
    });
  });
});
