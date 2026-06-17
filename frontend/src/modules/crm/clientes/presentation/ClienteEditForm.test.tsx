/**
 * Story 2.4: Edit Client — Component Tests for ClienteEditForm
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL + MSW)
 * These tests FAIL until the implementation is complete.
 *
 * Test IDs covered:
 *   TC-E2-P2-03 — Open edit form → clear Nombre → click "Guardar cambios" → inline error; no PUT fired
 *   TC-E2-P2-02 (edit form portion) — Cancel restores original data; no PUT fired
 *   General form pre-fill and interaction tests for ClienteEditForm
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteEditForm } from './ClienteEditForm';
import type { Cliente } from '../domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 0;
function uniqueSuffix() {
  return `${Date.now()}-${++_counter}`;
}

function buildClienteDto(overrides?: Partial<Cliente>): Cliente {
  const suffix = uniqueSuffix();
  return {
    id: crypto.randomUUID(),
    nombre: `Empresa Test Edit ${suffix}`,
    nitRuc: `900${suffix.slice(-6).padStart(6, '0')}-1`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup — intercepts PUT /api/v1/clientes/:id
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderClienteEditForm(
  cliente: Cliente,
  { onSuccess = vi.fn(), onCancel = vi.fn() }: { onSuccess?: () => void; onCancel?: () => void } = {}
) {
  const queryClient = createQueryClient();
  return {
    onSuccess,
    onCancel,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteEditForm cliente={cliente} onSuccess={onSuccess} onCancel={onCancel} />
      </QueryClientProvider>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Pre-fill Tests — AC1
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteEditForm — form renders pre-filled with current client values (AC1)', () => {
  it('should render a form with all 4 fields pre-filled from the cliente prop', async () => {
    // GIVEN: A cliente object with known values
    const cliente = buildClienteDto({
      nombre: 'Empresa Pre-fill Visible S.A.',
      nitRuc: '900500001-1',
      telefono: '3005000001',
      ciudad: 'Bogotá',
    });

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: All 4 fields are visible with the correct pre-filled values
    expect(screen.getByTestId('input-nombre')).toHaveValue('Empresa Pre-fill Visible S.A.');
  });

  it('should pre-fill the NIT/RUC input with the cliente.nitRuc value', async () => {
    // GIVEN: A cliente with a known nitRuc
    const cliente = buildClienteDto({ nitRuc: '900500002-2' });

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: NIT/RUC input has the correct value
    expect(screen.getByTestId('input-nitruc')).toHaveValue('900500002-2');
  });

  it('should pre-fill the Teléfono input with the cliente.telefono value', async () => {
    // GIVEN: A cliente with a known telefono
    const cliente = buildClienteDto({ telefono: '3005000003' });

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: Teléfono input has the correct value
    expect(screen.getByTestId('input-telefono')).toHaveValue('3005000003');
  });

  it('should pre-fill the Ciudad input with the cliente.ciudad value', async () => {
    // GIVEN: A cliente with a known ciudad
    const cliente = buildClienteDto({ ciudad: 'Cartagena' });

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: Ciudad input has the correct value
    expect(screen.getByTestId('input-ciudad')).toHaveValue('Cartagena');
  });

  it('should render a "Guardar cambios" submit button', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: The "Guardar cambios" button is present
    expect(screen.getByTestId('btn-guardar-cambios')).toBeInTheDocument();
    expect(screen.getByTestId('btn-guardar-cambios')).toHaveTextContent(/guardar cambios/i);
  });

  it('should render a "Cancelar" button', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: The "Cancelar" button is present
    expect(screen.getByTestId('btn-cancelar')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancelar')).toHaveTextContent(/cancelar/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-03 — Required field cleared → inline error shown; no API request fired
// AC3: Form validation blocks submission when required field is empty
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-03 — Required field cleared shows inline error; no PUT fired (AC3)', () => {
  it('TC-E2-P2-03 — should display an inline error under Nombre when field is cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears the Nombre field
    const cliente = buildClienteDto({ nombre: 'Empresa Validacion Nombre S.A.' });
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline error message for Nombre is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toBeInTheDocument();
    });
  });

  it('TC-E2-P2-03 — should NOT fire a PUT request when Nombre is cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; track any PUT calls via MSW
    const cliente = buildClienteDto({ nombre: 'Empresa No PUT Nombre S.A.' });
    let putFired = false;
    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => {
        putFired = true;
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline error is shown AND no PUT was fired
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toBeInTheDocument();
    });
    expect(putFired).toBe(false);
  });

  it('should display an inline error under NIT/RUC when field is cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears the NIT/RUC field
    const cliente = buildClienteDto({ nitRuc: '900600001-1' });
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nitruc'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline error message for NIT/RUC is visible
    await waitFor(() => {
      expect(screen.getByTestId('error-nitruc')).toBeInTheDocument();
    });
  });

  it('should display an inline error under Teléfono when field is cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears Teléfono
    const cliente = buildClienteDto({ telefono: '3006000001' });
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-telefono'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline error message for Teléfono is visible
    await waitFor(() => {
      expect(screen.getByTestId('error-telefono')).toBeInTheDocument();
    });
  });

  it('should display an inline error under Ciudad when field is cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears Ciudad
    const cliente = buildClienteDto({ ciudad: 'Medellín' });
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-ciudad'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline error message for Ciudad is visible
    await waitFor(() => {
      expect(screen.getByTestId('error-ciudad')).toBeInTheDocument();
    });
  });

  it('should render error messages in Spanish (MANDATORY)', async () => {
    // GIVEN: ClienteEditForm is rendered with a Nombre that will fail validation
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The error message text is in Spanish
    await waitFor(() => {
      const errorMsg = screen.getByTestId('error-nombre');
      expect(errorMsg).toHaveTextContent(/nombre es requerido/i);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-02 (edit form portion) — Cancel calls onCancel without firing PUT
// AC4: Cancel keeps original data and fires no API call
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-02 — Clicking "Cancelar" calls onCancel and fires no PUT request (AC4)', () => {
  it('TC-E2-P2-02 — should call the onCancel callback when "Cancelar" is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered with a spy on onCancel
    const cliente = buildClienteDto();
    const { onCancel } = renderClienteEditForm(cliente);

    const user = userEvent.setup();

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('btn-cancelar'));

    // THEN: onCancel was called once
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('TC-E2-P2-02 — should NOT fire a PUT request when "Cancelar" is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user modifies Nombre then clicks Cancelar
    const cliente = buildClienteDto({ nombre: 'Empresa No PUT Cancel S.A.' });
    let putFired = false;
    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => {
        putFired = true;
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Nombre Cancelado Sin Guardar');

    // WHEN: User clicks "Cancelar" instead of save
    await user.click(screen.getByTestId('btn-cancelar'));

    // THEN: No PUT request was fired
    expect(putFired).toBe(false);
  });

  it('TC-E2-P2-02 — should NOT call onSuccess when "Cancelar" is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered with spies on both callbacks
    const cliente = buildClienteDto();
    const { onSuccess, onCancel } = renderClienteEditForm(cliente);

    const user = userEvent.setup();

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('btn-cancelar'));

    // THEN: onCancel was called; onSuccess was NOT called
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Successful submission — AC2
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteEditForm — successful save calls onSuccess and fires PUT (AC2)', () => {
  it('should call onSuccess after a successful PUT response', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW intercepts PUT with 200
    const cliente = buildClienteDto({ nombre: 'Empresa Guardar OK S.A.' });
    const updatedCliente = { ...cliente, nombre: 'Empresa Actualizada S.A.' };

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(updatedCliente, { status: 200 })
      )
    );

    const { onSuccess } = renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Actualizada S.A.');

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: onSuccess is called once after the API responds
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should show the submit button as disabled/loading while the mutation is pending', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW holds the PUT request open
    const cliente = buildClienteDto();
    let resolveRequest: ((val: unknown) => void) | undefined;

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, async () => {
        await new Promise((resolve) => { resolveRequest = resolve; });
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();

    // WHEN: User modifies a field and clicks "Guardar cambios" (request is pending)
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Pending S.A.');
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Submit button is disabled while mutation is in-flight
    await waitFor(() => {
      expect(screen.getByTestId('btn-guardar-cambios')).toBeDisabled();
    });

    // Resolve the pending request for cleanup
    await waitFor(() => expect(resolveRequest).toBeDefined());
    resolveRequest!(undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility tests — WCAG 2.1 AA
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteEditForm — WCAG 2.1 AA accessibility requirements', () => {
  it('should render a <form> element with aria-label for screen readers', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: A form with accessible name exists
    expect(screen.getByRole('form', { name: /formulario de edición/i })).toBeInTheDocument();
  });

  it('should render a <label> for the Nombre input (WCAG 2.1 AA)', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: Nombre input has an associated label
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('should set aria-invalid="true" on Nombre input when validation error is present', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears Nombre and triggers validation
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: aria-invalid is set to "true" on the Nombre input
    await waitFor(() => {
      expect(screen.getByTestId('input-nombre')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should use role="alert" on error messages for screen reader announcements', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears Nombre and triggers validation
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The error message element has role="alert"
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toHaveAttribute('role', 'alert');
    });
  });

  it('should render all field labels in Spanish (MANDATORY)', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: All labels are in Spanish
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nit\/ruc/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument();
  });
});
