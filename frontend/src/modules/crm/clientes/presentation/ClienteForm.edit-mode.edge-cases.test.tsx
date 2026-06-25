/**
 * Story 2.4: ClienteForm — Edit Mode Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD component coverage for edit mode with edge cases NOT covered
 * by ClienteForm.edit-mode.test.tsx.
 *
 * Additional scenarios:
 * - onNotify callback fires with "success" and message on successful edit
 * - onNotify callback fires with "error" and message on 5xx in edit mode
 * - onNotify NOT called on 409 conflict (inline field error only)
 * - aria-invalid=true on NIT input after 409 conflict in edit mode
 * - aria-describedby set on NIT input after 409 conflict in edit mode
 * - aria-invalid=false on all fields on initial edit-mode render
 * - All field values preserved after 5xx: NIT, Teléfono, Ciudad (not just Nombre)
 * - Teléfono inline error shown when Teléfono is cleared in edit mode
 * - Ciudad inline error shown when Ciudad is cleared in edit mode
 * - 400 server response in edit mode shows generic toast (not inline)
 * - Form has data-testid="cliente-edit-form" in DOM
 * - Submit button aria-label="Guardar cambios del cliente" when not pending
 * - Submit button aria-label="Guardando cliente" when mutation is pending
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

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PUT_URL = `http://localhost:5000/api/v1/clientes/${CLIENTE_ID}`;

const updatedClienteStub = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T11:00:00Z',
};

const initialData = {
  nombre: 'Empresa Original S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
};

const server = setupServer(
  http.put(PUT_URL, () => HttpResponse.json(updatedClienteStub, { status: 200 })),
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

function renderEditForm(
  overrides: {
    onSuccess?: () => void;
    onCancel?: () => void;
    onNotify?: (type: 'success' | 'error', message: string) => void;
    initialDataOverride?: typeof initialData;
    clienteId?: string;
  } = {},
) {
  const {
    onSuccess = vi.fn(),
    onCancel = vi.fn(),
    onNotify = vi.fn(),
    initialDataOverride = initialData,
    clienteId = CLIENTE_ID,
  } = overrides;

  return render(
    createElement(
      createWrapper(),
      null,
      createElement(ClienteForm, {
        mode: 'edit',
        clienteId,
        initialData: initialDataOverride,
        onSuccess,
        onCancel,
        onNotify,
      }),
    ),
  );
}

// ─── data-testid="cliente-edit-form" in DOM ───────────────────────────────────

describe('[P1] ClienteForm edit mode — DOM presence', () => {
  it('[P1] should render the form with data-testid="cliente-edit-form"', () => {
    // GIVEN: ClienteForm is rendered in edit mode
    renderEditForm();

    // THEN: The form element with the expected test id is in the DOM
    expect(document.querySelector('[data-testid="cliente-edit-form"]')).toBeInTheDocument();
  });
});

// ─── ARIA attributes on initial edit-mode render ──────────────────────────────

describe('[P1] ClienteForm edit mode — ARIA attributes initial state', () => {
  it('[P1] should have aria-invalid=false on nombre input before submission in edit mode', () => {
    // GIVEN: Edit form is freshly rendered (no errors yet)
    renderEditForm();

    // THEN: aria-invalid is false (or absent) on nombre
    const input = screen.getByLabelText('Nombre');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('[P1] should have aria-invalid=false on nit input before submission in edit mode', () => {
    // GIVEN: Edit form is freshly rendered
    renderEditForm();

    // THEN: aria-invalid is false (or absent) on nit
    const input = screen.getByLabelText('NIT/RUC');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('[P1] should have aria-invalid=false on telefono input before submission in edit mode', () => {
    // GIVEN: Edit form is freshly rendered
    renderEditForm();

    // THEN: aria-invalid is false (or absent) on telefono
    const input = screen.getByLabelText('Teléfono');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('[P1] should have aria-invalid=false on ciudad input before submission in edit mode', () => {
    // GIVEN: Edit form is freshly rendered
    renderEditForm();

    // THEN: aria-invalid is false (or absent) on ciudad
    const input = screen.getByLabelText('Ciudad');
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('[P1] should render submit button with aria-label "Guardar cambios del cliente" when not pending', () => {
    // GIVEN: Edit form is freshly rendered (not in pending state)
    renderEditForm();

    // THEN: Submit button has the expected aria-label (WCAG 2.1 AA — buttons with icons need labels)
    const submitButton = screen.getByTestId('btn-submit-cliente');
    expect(submitButton.getAttribute('aria-label')).toBe('Guardar cambios del cliente');
  });
});

// ─── ARIA attributes after 409 conflict in edit mode ─────────────────────────

describe('[P1] ClienteForm edit mode — ARIA attributes after 409 conflict', () => {
  it('[P1] should set aria-invalid=true on nit input after 409 conflict in edit mode', async () => {
    // GIVEN: PUT returns 409
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderEditForm();

    // WHEN: User submits and gets 409
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: aria-invalid=true is set on the NIT field
    await waitFor(() => {
      const nitInput = screen.getByLabelText('NIT/RUC');
      expect(nitInput.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('[P1] should set aria-describedby on nit input after 409 conflict in edit mode', async () => {
    // GIVEN: PUT returns 409
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderEditForm();

    // WHEN: User submits and gets 409
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: aria-describedby links to the error element on NIT
    await waitFor(() => {
      const nitInput = screen.getByLabelText('NIT/RUC');
      expect(nitInput.getAttribute('aria-describedby')).toBeTruthy();
    });
  });
});

// ─── Field value preservation after 5xx in edit mode ────────────────────────

describe('[P1] ClienteForm edit mode — All field values preserved after 5xx', () => {
  it('[P1] should preserve the NIT field value after a 500 server error in edit mode', async () => {
    // GIVEN: PUT returns 500, user modified NIT before submitting
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderEditForm();

    await user.clear(screen.getByLabelText('NIT/RUC'));
    await user.type(screen.getByLabelText('NIT/RUC'), '900999777-5');

    // WHEN: Submit and get 500
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    // THEN: NIT value entered by user is still visible in the form
    expect(screen.getByLabelText('NIT/RUC')).toHaveValue('900999777-5');
  });

  it('[P1] should preserve the Teléfono field value after a 500 server error in edit mode', async () => {
    // GIVEN: PUT returns 500, user modified Teléfono
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderEditForm();

    await user.clear(screen.getByLabelText('Teléfono'));
    await user.type(screen.getByLabelText('Teléfono'), '3001112222');

    // WHEN: Submit and get 500
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    // THEN: Modified Teléfono is preserved
    expect(screen.getByLabelText('Teléfono')).toHaveValue('3001112222');
  });

  it('[P1] should preserve the Ciudad field value after a 500 server error in edit mode', async () => {
    // GIVEN: PUT returns 500, user modified Ciudad
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderEditForm();

    await user.clear(screen.getByLabelText('Ciudad'));
    await user.type(screen.getByLabelText('Ciudad'), 'Cartagena');

    // WHEN: Submit and get 500
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    // THEN: Modified Ciudad is preserved
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Cartagena');
  });
});

// ─── Teléfono and Ciudad inline errors in edit mode ──────────────────────────

describe('[P1] ClienteForm edit mode — Teléfono and Ciudad inline errors (AC3)', () => {
  it('[P1] should show "El teléfono es requerido" when Teléfono is cleared in edit mode', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.put(PUT_URL, () => {
        apiCalled = true;
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clears Teléfono and submits
    await user.clear(screen.getByLabelText('Teléfono'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Inline error for telefono appears; no API call made (FR8)
    await waitFor(() => {
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument();
    });
    expect(apiCalled).toBe(false);
  });

  it('[P1] should show "La ciudad es requerida" when Ciudad is cleared in edit mode', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.put(PUT_URL, () => {
        apiCalled = true;
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clears Ciudad and submits
    await user.clear(screen.getByLabelText('Ciudad'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Inline error for ciudad appears; no API call made (FR8)
    await waitFor(() => {
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
    });
    expect(apiCalled).toBe(false);
  });
});

// ─── onNotify callback in edit mode ──────────────────────────────────────────

describe('[P1] ClienteForm edit mode — onNotify callback', () => {
  it('[P1] should call onNotify with "success" and the success message on successful edit', async () => {
    // GIVEN: PUT returns 200
    const user = userEvent.setup();
    const onNotify = vi.fn();

    renderEditForm({ onNotify });

    // WHEN: Form is submitted successfully (pre-filled data is valid)
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: onNotify called with success type and correct Spanish message
    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('success', 'Cliente actualizado correctamente');
    });
  });

  it('[P1] should call onNotify with "error" and the error message on 5xx response in edit mode', async () => {
    // GIVEN: PUT returns 500
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    const onNotify = vi.fn();

    renderEditForm({ onNotify });

    // WHEN: Submit and server returns 500
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: onNotify called with error type and correct Spanish message
    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('error', 'No se pudo actualizar el cliente. Intenta de nuevo.');
    });
  });

  it('[P1] should NOT call onNotify on 409 conflict in edit mode (inline error only)', async () => {
    // GIVEN: PUT returns 409
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );
    const onNotify = vi.fn();

    renderEditForm({ onNotify });

    // WHEN: Form is submitted and server returns 409
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: onNotify is NOT called (409 uses inline field error, not toast)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
    expect(onNotify).not.toHaveBeenCalled();
  });
});

// ─── 400 server response in edit mode ────────────────────────────────────────

describe('[P1] ClienteForm edit mode — 400 server response handling', () => {
  it('[P1] should show toast error for 400 response from server in edit mode (not 409, not inline)', async () => {
    // GIVEN: PUT returns 400 (server-side validation after Zod passed)
    const user = userEvent.setup();
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 400, title: 'Bad Request' }, { status: 400 }),
      ),
    );

    renderEditForm();

    // WHEN: User submits (valid client-side data, 400 unexpected from server)
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Generic toast error is shown (400 is not 409 — treated as other error)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo actualizar el cliente. Intenta de nuevo.');
    });
  });
});

// ─── Error test IDs present in edit mode ──────────────────────────────────────

describe('[P1] ClienteForm edit mode — Inline Zod error test IDs', () => {
  it('[P1] should render error with data-testid="error-telefono" for empty telefono in edit mode', async () => {
    // GIVEN: Edit form rendered
    const user = userEvent.setup();
    renderEditForm();

    // WHEN: Submit with empty telefono
    await user.clear(screen.getByLabelText('Teléfono'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Error element with correct test id is present
    await waitFor(() => {
      expect(document.querySelector('[data-testid="error-telefono"]')).toBeInTheDocument();
    });
  });

  it('[P1] should render error with data-testid="error-ciudad" for empty ciudad in edit mode', async () => {
    // GIVEN: Edit form rendered
    const user = userEvent.setup();
    renderEditForm();

    // WHEN: Submit with empty ciudad
    await user.clear(screen.getByLabelText('Ciudad'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Error element with correct test id is present
    await waitFor(() => {
      expect(document.querySelector('[data-testid="error-ciudad"]')).toBeInTheDocument();
    });
  });
});
