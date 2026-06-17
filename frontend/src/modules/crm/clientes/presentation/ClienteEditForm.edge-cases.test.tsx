/**
 * Story 2.4: Edit Client — Edge Case Tests (Automate Expansion)
 * Epic 2: Client Management
 *
 * Coverage expansion beyond ATDD — edge cases, error paths, boundary conditions.
 * Tests NOT covered by ClienteEditForm.test.tsx (ATDD RED phase).
 *
 * Test coverage added here:
 *   [P1] 500 server error on PUT → toast.error() called, form stays open, onSuccess NOT called
 *   [P1] Network error on PUT → toast.error() called, onSuccess NOT called
 *   [P1] All 4 required fields cleared → all 4 inline errors shown simultaneously
 *   [P1] Multiple invalid fields → PUT blocked simultaneously
 *   [P1] Guardar button is not disabled initially (idle state)
 *   [P1] Guardar button shows "Guardando..." text while mutation is pending
 *   [P1] Cancelar button disabled while mutation is pending
 *   [P2] Boundary: nombre exactly 200 chars → passes validation
 *   [P2] Boundary: nombre exactly 201 chars → fails validation in form
 *   [P2] Boundary: ciudad exactly 100 chars → passes validation
 *   [P2] Boundary: ciudad exactly 101 chars → fails validation in form
 *   [P2] Error cleared when user types valid value after validation error
 *   [P2] aria-describedby on Nombre input points to error span id
 *   [P2] Error message content matches Zod schema Spanish messages
 *   [P2] onCancel NOT called when PUT succeeds (mutual exclusivity)
 *   [P3] Form data testid="cliente-edit-form" is present
 *   [P3] noValidate attribute on form prevents browser native validation
 *
 * Note: toast.error/toast.success are mocked because ToastProvider is not rendered
 * in unit tests (it requires an app-level provider). The mock validates call intent;
 * actual rendering is covered by E2E tests.
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mock siesa-ui-kit toast — ToastProvider is not in the test render tree.
// Uses vi.hoisted() so mock fn references are available before vi.mock() hoisting.
// ─────────────────────────────────────────────────────────────────────────────

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('siesa-ui-kit', async (importOriginal) => {
  const original = await importOriginal<typeof import('siesa-ui-kit')>();
  return {
    ...original,
    toast: Object.assign(vi.fn(), {
      success: mockToastSuccess,
      error: mockToastError,
      warning: vi.fn(),
      info: vi.fn(),
    }),
  };
});
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
    nombre: `Empresa Edge Edit ${suffix}`,
    nitRuc: `900${suffix.slice(-6).padStart(6, '0')}-1`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  mockToastSuccess.mockClear();
  mockToastError.mockClear();
});
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
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteEditForm cliente={cliente} onSuccess={onSuccess} onCancel={onCancel} />
      </QueryClientProvider>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// [P1] 500 server error on PUT — form stays open, error toast shown
// When PUT /api/v1/clientes/:id returns 500, the mutation onError fires.
// The form must NOT close, onSuccess must NOT be called, and an error toast must appear.
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] 500 server error on PUT → toast.error() called, form stays open', () => {
  it('[P1] should call toast.error() when the PUT request returns 500', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW returns 500 on PUT
    const cliente = buildClienteDto({ nombre: 'Empresa 500 Error S.A.' });

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Actualizada 500 S.A.');

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: toast.error() is called (mocked — actual rendering requires ToastProvider from main.tsx)
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
  });

  it('[P1] should NOT call onSuccess when the PUT request returns 500', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW returns 500 on PUT; spy on onSuccess
    const cliente = buildClienteDto({ nombre: 'Empresa 500 No Success S.A.' });

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const { onSuccess } = renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa No Success S.A.');
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // Wait for the onError path to be processed
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    // THEN: onSuccess was NOT called (form stays open)
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('[P1] should keep the edit form open when the PUT request returns 500', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW returns 500 on PUT
    const cliente = buildClienteDto({ nombre: 'Empresa 500 Form Open S.A.' });

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Form Stays Open S.A.');
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // Wait for the onError path to process
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    // THEN: The edit form is still in the DOM (not unmounted on error)
    expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Network error on PUT — same behavior as 500
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Network error on PUT → toast.error() called, onSuccess NOT called', () => {
  it('[P1] should call toast.error() when the network request fails (no response)', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW simulates a complete network failure
    const cliente = buildClienteDto({ nombre: 'Empresa Network Fail S.A.' });

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.error())
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Updated Network S.A.');

    // WHEN: User submits
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: toast.error() is called (mocked — ToastProvider not in render tree)
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
  });

  it('[P1] should NOT call onSuccess when the network request fails', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW simulates a network failure; spy on onSuccess
    const cliente = buildClienteDto();

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.error())
    );

    const { onSuccess } = renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Network OK S.A.');
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // Wait for the onError path to be processed
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    // THEN: onSuccess was NOT called
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] All 4 required fields cleared → all 4 inline errors shown simultaneously
// AC3: When all fields are empty and save is clicked, all 4 error messages appear
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] All 4 required fields cleared → all 4 inline errors shown simultaneously', () => {
  it('[P1] should show all 4 inline errors when all required fields are cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears ALL 4 fields
    const cliente = buildClienteDto({
      nombre: 'Empresa All Fields Clear S.A.',
      nitRuc: '900800001-1',
      telefono: '3008000001',
      ciudad: 'Bogotá',
    });
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.clear(screen.getByTestId('input-nitruc'));
    await user.clear(screen.getByTestId('input-telefono'));
    await user.clear(screen.getByTestId('input-ciudad'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: All 4 inline error messages are visible simultaneously
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toBeInTheDocument();
    });
    expect(screen.getByTestId('error-nitruc')).toBeInTheDocument();
    expect(screen.getByTestId('error-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('error-ciudad')).toBeInTheDocument();
  });

  it('[P1] should NOT fire a PUT request when all 4 fields are cleared and save is clicked', async () => {
    // GIVEN: ClienteEditForm is rendered; user clears ALL 4 fields; track PUT
    const cliente = buildClienteDto();
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
    await user.clear(screen.getByTestId('input-nitruc'));
    await user.clear(screen.getByTestId('input-telefono'));
    await user.clear(screen.getByTestId('input-ciudad'));

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: All 4 errors appear AND no PUT was fired
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toBeInTheDocument();
    });
    expect(putFired).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Idle state — "Guardar cambios" button not disabled initially
// Form should be interactive immediately after mount
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] "Guardar cambios" button is NOT disabled initially (idle state)', () => {
  it('[P1] should render the "Guardar cambios" button as enabled when form is idle', () => {
    // GIVEN: ClienteEditForm is mounted with no mutation in flight
    const cliente = buildClienteDto();

    // WHEN: Form is rendered (idle state — no mutation running)
    renderClienteEditForm(cliente);

    // THEN: The submit button is enabled (not disabled)
    expect(screen.getByTestId('btn-guardar-cambios')).not.toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Submit button shows "Guardando..." text while mutation is pending
// Loading state must reflect in button text (AC2 implementation contract)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Submit button shows "Guardando..." text while mutation is in-flight', () => {
  it('[P1] should show "Guardando..." text in the submit button while the PUT request is pending', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW holds the PUT request open
    const cliente = buildClienteDto({ nombre: 'Empresa Guardando Text S.A.' });
    let resolveRequest: ((val: unknown) => void) | undefined;

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, async () => {
        await new Promise((resolve) => { resolveRequest = resolve; });
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Updated Loading S.A.');

    // WHEN: User submits (PUT is now in-flight and held by the promise)
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The submit button shows "Guardando..." while the mutation is pending
    await waitFor(() => {
      expect(screen.getByTestId('btn-guardar-cambios')).toHaveTextContent(/guardando\.\.\./i);
    });

    // Cleanup: resolve the pending request
    await waitFor(() => expect(resolveRequest).toBeDefined());
    resolveRequest!(undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Cancelar button is disabled while mutation is pending
// Both action buttons should be disabled while the PUT is in-flight
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] "Cancelar" button is disabled while mutation is pending', () => {
  it('[P1] should disable the "Cancelar" button while the PUT request is in-flight', async () => {
    // GIVEN: ClienteEditForm is rendered; MSW holds the PUT open
    const cliente = buildClienteDto({ nombre: 'Empresa Cancelar Disabled S.A.' });
    let resolveRequest: ((val: unknown) => void) | undefined;

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, async () => {
        await new Promise((resolve) => { resolveRequest = resolve; });
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Updated S.A.');

    // WHEN: User submits (request is in-flight)
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The "Cancelar" button is disabled while the mutation is in-flight
    await waitFor(() => {
      expect(screen.getByTestId('btn-cancelar')).toBeDisabled();
    });

    // Cleanup: resolve the pending request
    await waitFor(() => expect(resolveRequest).toBeDefined());
    resolveRequest!(undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Boundary conditions — field max-length validation at form level
// These test the Zod schema enforcement via React Hook Form within the component.
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Boundary: field max-length enforcement in the edit form', () => {
  it('[P2] should accept a nombre exactly 200 characters long without validation error', async () => {
    // GIVEN: ClienteEditForm with a nombre of exactly 200 chars
    const nombre200 = 'A'.repeat(200);
    const cliente = buildClienteDto({ nombre: 'Empresa Original S.A.' });

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json({ ...cliente, nombre: nombre200 }, { status: 200 })
      )
    );

    const { onSuccess } = renderClienteEditForm(cliente);
    const user = userEvent.setup();

    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), nombre200);

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: No validation error for nombre (200 chars is the max, must pass)
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId('error-nombre')).not.toBeInTheDocument();
  });

  it('[P2] should show an inline error for nombre exceeding 200 characters', async () => {
    // GIVEN: ClienteEditForm with a nombre of 201 characters (over max)
    const nombre201 = 'A'.repeat(201);
    const cliente = buildClienteDto({ nombre: 'Empresa Original S.A.' });

    renderClienteEditForm(cliente);
    const user = userEvent.setup();

    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), nombre201);

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline validation error appears for nombre (201 chars exceeds the 200 max)
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toBeInTheDocument();
    });
  });

  it('[P2] should accept a ciudad exactly 100 characters long without validation error', async () => {
    // GIVEN: ClienteEditForm with a ciudad of exactly 100 chars
    const ciudad100 = 'C'.repeat(100);
    const cliente = buildClienteDto({ ciudad: 'Bogotá' });

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json({ ...cliente, ciudad: ciudad100 }, { status: 200 })
      )
    );

    const { onSuccess } = renderClienteEditForm(cliente);
    const user = userEvent.setup();

    await user.clear(screen.getByTestId('input-ciudad'));
    await user.type(screen.getByTestId('input-ciudad'), ciudad100);

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: No validation error for ciudad (100 chars is the max, must pass)
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId('error-ciudad')).not.toBeInTheDocument();
  });

  it('[P2] should show an inline error for ciudad exceeding 100 characters', async () => {
    // GIVEN: ClienteEditForm with a ciudad of 101 characters (over max)
    const ciudad101 = 'C'.repeat(101);
    const cliente = buildClienteDto({ ciudad: 'Bogotá' });

    renderClienteEditForm(cliente);
    const user = userEvent.setup();

    await user.clear(screen.getByTestId('input-ciudad'));
    await user.type(screen.getByTestId('input-ciudad'), ciudad101);

    // WHEN: User clicks "Guardar cambios"
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Inline validation error appears for ciudad
    await waitFor(() => {
      expect(screen.getByTestId('error-ciudad')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Error cleared when user types valid value after validation error
// Inline errors must disappear once the user corrects the field
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Inline error clears when user types a valid value after a validation failure', () => {
  it('[P2] should remove the Nombre error message when the user types a valid value after clearing', async () => {
    // GIVEN: ClienteEditForm with Nombre cleared → validation error shown
    const cliente = buildClienteDto({ nombre: 'Empresa Error Clear Test S.A.' });
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toBeInTheDocument();
    });

    // WHEN: User types a valid value into Nombre
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Corregida S.A.');

    // THEN: The Nombre error message disappears
    await waitFor(() => {
      expect(screen.queryByTestId('error-nombre')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] aria-describedby on inputs wired to corresponding error spans
// WCAG 2.1 AA requires inputs with errors to reference their error message
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] WCAG: aria-describedby on inputs with validation errors', () => {
  it('[P2] should set aria-describedby on Nombre input pointing to the error span id when error is present', async () => {
    // GIVEN: ClienteEditForm is rendered; Nombre is cleared and validation triggered
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: Nombre input has aria-describedby pointing to the error element id
    await waitFor(() => {
      const input = screen.getByTestId('input-nombre');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const errorSpan = screen.getByTestId('error-nombre');
      expect(errorSpan.id).toBeTruthy();
      expect(describedBy).toContain(errorSpan.id);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Error message content matches Zod schema Spanish messages
// Validates the exact Spanish text from the Zod schema appears in the UI
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Error message content matches Zod schema Spanish messages', () => {
  it('[P2] Nombre error message contains "El nombre es requerido" (Zod Spanish error)', async () => {
    // GIVEN: ClienteEditForm is rendered; Nombre field is cleared
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The Nombre error message contains the exact Zod-defined Spanish message
    await waitFor(() => {
      const errorEl = screen.getByTestId('error-nombre');
      expect(errorEl).toHaveTextContent(/el nombre es requerido/i);
    });
  });

  it('[P2] NIT/RUC error message contains "El NIT/RUC es requerido" (Zod Spanish error)', async () => {
    // GIVEN: NIT/RUC field is cleared
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nitruc'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The NIT/RUC error contains the Zod-defined Spanish message
    await waitFor(() => {
      const errorEl = screen.getByTestId('error-nitruc');
      expect(errorEl).toHaveTextContent(/el nit\/ruc es requerido/i);
    });
  });

  it('[P2] Teléfono error message contains "El teléfono es requerido" (Zod Spanish error)', async () => {
    // GIVEN: Teléfono field is cleared
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-telefono'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The Teléfono error contains the Zod-defined Spanish message
    await waitFor(() => {
      const errorEl = screen.getByTestId('error-telefono');
      expect(errorEl).toHaveTextContent(/el teléfono es requerido/i);
    });
  });

  it('[P2] Ciudad error message contains "La ciudad es requerida" (Zod Spanish error)', async () => {
    // GIVEN: Ciudad field is cleared
    const cliente = buildClienteDto();
    renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-ciudad'));
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    // THEN: The Ciudad error contains the Zod-defined Spanish message
    await waitFor(() => {
      const errorEl = screen.getByTestId('error-ciudad');
      expect(errorEl).toHaveTextContent(/la ciudad es requerida/i);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] onSuccess and onError are mutually exclusive
// When PUT succeeds, only onSuccess fires; when PUT fails, only onError fires
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] onSuccess and onError are mutually exclusive (success path)', () => {
  it('[P2] should NOT call onCancel when PUT succeeds', async () => {
    // GIVEN: ClienteEditForm with MSW returning 200 on PUT; spy on onCancel
    const cliente = buildClienteDto({ nombre: 'Empresa Success No Cancel S.A.' });
    const updatedCliente = { ...cliente, nombre: 'Empresa Actualizada S.A.' };

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(updatedCliente, { status: 200 })
      )
    );

    const { onCancel } = renderClienteEditForm(cliente);

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('input-nombre'));
    await user.type(screen.getByTestId('input-nombre'), 'Empresa Actualizada S.A.');
    await user.click(screen.getByTestId('btn-guardar-cambios'));

    await waitFor(() => {
      // Wait for success to be processed
      expect(screen.queryByTestId('btn-guardar-cambios')).not.toBeDisabled();
    });

    // THEN: onCancel was NOT called (only onSuccess should fire on success)
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P3] Form structural requirements
// Validates implementation contracts required by E2E tests
// ─────────────────────────────────────────────────────────────────────────────

describe('[P3] Form structural requirements (implementation contracts)', () => {
  it('[P3] should render data-testid="cliente-edit-form" on the <form> element', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: The form element has the required data-testid
    expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-edit-form').tagName.toLowerCase()).toBe('form');
  });

  it('[P3] should render the form with noValidate attribute to prevent browser native validation', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: The <form> element has noValidate (prevents browser native validation, relies on Zod)
    const form = screen.getByTestId('cliente-edit-form');
    expect(form).toHaveAttribute('novalidate');
  });

  it('[P3] should render both action buttons: "btn-guardar-cambios" and "btn-cancelar"', () => {
    // GIVEN: A cliente object
    const cliente = buildClienteDto();

    // WHEN: ClienteEditForm is rendered
    renderClienteEditForm(cliente);

    // THEN: Both buttons are present simultaneously (edit form has two action buttons)
    expect(screen.getByTestId('btn-guardar-cambios')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancelar')).toBeInTheDocument();
  });
});
