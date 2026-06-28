/**
 * Automation expansion — ClienteForm edit mode edge cases — Story 2.4
 *
 * Expands ATDD coverage (EditClienteForm.test.tsx) with:
 *   - Non-409 server errors on PUT (500, 503) — form stays open, no crash
 *   - Whitespace-only field values — Zod min(1) rejects them client-side, no PUT sent
 *   - Max-length boundary violations in edit mode
 *   - onSuccess prop is called on successful edit (not on error)
 *   - onSuccess is NOT called when PUT returns 409 conflict
 *   - onSuccess is NOT called when PUT returns 500 error
 *   - Submit button shows "Guardando..." text while PUT mutation is pending
 *   - Form is accessible: role="form" or data-testid, aria-describedby wired to error spans
 *   - btn-editar visibility: only shown in data-loaded state of ClienteDetailView (AC #1)
 *   - ClienteDetailView renders edit dialog overlay when btn-editar is clicked
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'sonner';

import { buildCliente, resetClienteCounter } from './clienteFactory';
import { ClienteForm } from '../presentation/ClienteForm';
import { ClienteDetailView } from '../presentation/ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected async/mutation warnings in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('act(...)') ||
    msg.includes('not wrapped in act') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('Network Error')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteFormEditMode(props: {
  clienteId: string;
  defaultValues: {
    nombre: string;
    nit: string;
    telefono: string;
    ciudad: string;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClose = props.onClose ?? vi.fn();
  const onSuccess = props.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ClienteForm
        clienteId={props.clienteId}
        defaultValues={props.defaultValues}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

function renderDetailView(clienteId: string | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default values helper
// ─────────────────────────────────────────────────────────────────────────────

const validEditDefaults = {
  nombre: 'Empresa Original SA',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
};

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Non-409 server errors on PUT — form stays open, no crash
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — server error handling (non-409)', () => {
  it('[P1] should keep form open when PUT returns 500 Internal Server Error', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 500
    const clienteId = 'aaaa0001-0000-0000-0000-000000000001';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 })
      )
    );

    const onClose = vi.fn();
    renderClienteFormEditMode({
      clienteId,
      defaultValues: validEditDefaults,
      onClose,
    });

    // WHEN: User clicks "Guardar cambios"
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Form stays open (onClose NOT called after 500)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P1] should NOT expose technical error details when PUT returns 500', async () => {
    // GIVEN: PUT returns 500 with internal error details
    const clienteId = 'aaaa0001-0000-0000-0000-000000000002';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(
          {
            title: 'Internal Server Error',
            status: 500,
            detail: 'Microsoft.EntityFrameworkCore.DbException: command timeout',
          },
          { status: 500 }
        )
      )
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Technical error detail is NOT rendered in UI (NFR6)
    await waitFor(() => {
      expect(screen.queryByText(/Microsoft\.EntityFrameworkCore/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/command timeout/i)).not.toBeInTheDocument();
    });
  });

  it('[P2] should keep form open when PUT returns 503 Service Unavailable', async () => {
    // GIVEN: PUT returns 503
    const clienteId = 'aaaa0001-0000-0000-0000-000000000003';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 })
      )
    );

    const onClose = vi.fn();
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults, onClose });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Form stays open
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P2] should NOT set NIT inline error for non-409 server errors in edit mode', async () => {
    // GIVEN: PUT returns generic 500
    const clienteId = 'aaaa0001-0000-0000-0000-000000000004';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: 409-specific NIT error NOT shown for a 500 error
    await waitFor(() => {
      expect(
        screen.queryByText('El NIT/RUC ya está registrado')
      ).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Whitespace-only field values in edit mode — Zod rejects, no PUT sent
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — whitespace-only field values', () => {
  it('[P2] should reject whitespace-only Nombre and show inline error without calling PUT', async () => {
    // GIVEN: NETWORK intercepted BEFORE render to track PUT calls
    const clienteId = 'bbbb0002-0000-0000-0000-000000000001';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: User overwrites Nombre with whitespace-only
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, '   ');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side Zod validation fires and PUT is NOT sent
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('[P2] should reject whitespace-only NIT in edit mode and show inline error without PUT', async () => {
    // GIVEN: NETWORK intercepted
    const clienteId = 'bbbb0002-0000-0000-0000-000000000002';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: NIT overwritten with whitespace only
    await userEvent.clear(screen.getByTestId('input-nit'));
    await userEvent.type(screen.getByTestId('input-nit'), '   ');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error, no PUT
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('[P2] should reject whitespace-only Telefono in edit mode without calling PUT', async () => {
    // GIVEN: NETWORK intercepted
    const clienteId = 'bbbb0002-0000-0000-0000-000000000003';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: Telefono overwritten with whitespace
    await userEvent.clear(screen.getByTestId('input-telefono'));
    await userEvent.type(screen.getByTestId('input-telefono'), '   ');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error, no PUT
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('[P2] should reject whitespace-only Ciudad in edit mode without calling PUT', async () => {
    // GIVEN: NETWORK intercepted
    const clienteId = 'bbbb0002-0000-0000-0000-000000000004';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: Ciudad overwritten with whitespace
    await userEvent.clear(screen.getByTestId('input-ciudad'));
    await userEvent.type(screen.getByTestId('input-ciudad'), '   ');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error, no PUT
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Max-length boundary violations in edit mode — Zod rejects, no PUT sent
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — max-length boundary violations', () => {
  it('[P2] should reject Nombre exceeding 255 characters in edit mode without calling PUT', async () => {
    // GIVEN: NETWORK intercepted
    const clienteId = 'cccc0003-0000-0000-0000-000000000001';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: Nombre overwritten with 256 chars (over max)
    const nombre256 = 'A'.repeat(256);
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), nombre256);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side max-length validation fires, PUT not sent
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('[P2] should reject NIT exceeding 50 characters in edit mode without calling PUT', async () => {
    // GIVEN: NETWORK intercepted
    const clienteId = 'cccc0003-0000-0000-0000-000000000002';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: NIT overwritten with 51 chars
    await userEvent.clear(screen.getByTestId('input-nit'));
    await userEvent.type(screen.getByTestId('input-nit'), 'N'.repeat(51));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side max-length validation fires
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('[P2] should reject Ciudad exceeding 100 characters in edit mode without calling PUT', async () => {
    // GIVEN: NETWORK intercepted
    const clienteId = 'cccc0003-0000-0000-0000-000000000003';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: Ciudad overwritten with 101 chars
    await userEvent.clear(screen.getByTestId('input-ciudad'));
    await userEvent.type(screen.getByTestId('input-ciudad'), 'C'.repeat(101));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side max-length validation fires
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: onSuccess prop behavior in edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — onSuccess prop behavior', () => {
  it('[P1] should call onSuccess AND onClose after successful PUT 200', async () => {
    // GIVEN: PUT returns 200 with updated ClienteDto
    const clienteId = 'dddd0004-0000-0000-0000-000000000001';
    const updatedCliente = buildCliente({ id: clienteId });
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(updatedCliente, { status: 200 })
      )
    );

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults, onClose, onSuccess });

    // WHEN: User submits valid edit form
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Both onSuccess and onClose are called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('[P2] should NOT call onSuccess when PUT returns 409 (conflict stays inline)', async () => {
    // GIVEN: PUT returns 409
    const clienteId = 'dddd0004-0000-0000-0000-000000000002';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(
          { title: 'Conflicto de datos', status: 409, detail: 'El NIT/RUC ya está registrado' },
          { status: 409 }
        )
      )
    );

    const onSuccess = vi.fn();
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults, onSuccess });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onSuccess is NOT called (error handled inline)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('[P2] should NOT call onSuccess when PUT returns 500', async () => {
    // GIVEN: PUT returns 500
    const clienteId = 'dddd0004-0000-0000-0000-000000000003';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults, onSuccess, onClose });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Neither onSuccess nor onClose called (form stays open)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P2] should NOT call onClose when PUT returns 409 (form remains for correction)', async () => {
    // GIVEN: PUT returns 409
    const clienteId = 'dddd0004-0000-0000-0000-000000000004';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El NIT/RUC ya está registrado' },
          { status: 409 }
        )
      )
    );

    const onClose = vi.fn();
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults, onClose });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Form stays open (onClose not called — user must correct NIT)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Submit button shows "Guardando..." in edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — submit button pending state', () => {
  it('[P1] should show "Guardando..." text on submit button while PUT mutation is in flight', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed PUT response
    const clienteId = 'eeee0005-0000-0000-0000-000000000001';
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, async () => {
        await delayedRequest;
        return HttpResponse.json(buildCliente({ id: clienteId }), { status: 200 });
      })
    );

    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // Confirm initial label
    expect(screen.getByTestId('btn-submit')).toHaveTextContent(/guardar cambios/i);

    // WHEN: Submit click
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Button shows "Guardando..." and is disabled while PUT is in-flight
    await waitFor(() => {
      const btn = screen.getByTestId('btn-submit');
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent(/guardando/i);
    });

    // AND: Button does NOT show "Creando..." (that is create-mode text)
    expect(screen.getByTestId('btn-submit')).not.toHaveTextContent(/creando/i);

    // Cleanup
    resolveRequest();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Cancel during pending mutation does not block form closure
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — cancel does not trigger PUT', () => {
  it('[P2] should call onClose immediately when Cancelar is clicked mid-edit (partial input change)', async () => {
    // GIVEN: NETWORK intercepted — PUT must never be called
    const clienteId = 'ffff0006-0000-0000-0000-000000000001';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onClose = vi.fn();
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults, onClose });

    // WHEN: User partially modifies a field, then clicks Cancelar
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), 'Nombre Parcial Cancelado');
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose called, no PUT sent
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ClienteDetailView — btn-editar visibility per UI state (AC #1)
// btn-editar should ONLY appear in the data-loaded state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — btn-editar visibility (AC #1)', () => {
  it('[P1] should show btn-editar only in data-loaded state', async () => {
    // GIVEN: NETWORK intercepted — GET returns a valid cliente
    const cliente = buildCliente({ id: 'gggg0007-0000-0000-0000-000000000001' });
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderDetailView(cliente.id);

    // THEN: btn-editar appears once data is loaded
    await waitFor(() => {
      expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    });
  });

  it('[P1] should NOT show btn-editar in placeholder (no clienteId) state', () => {
    // GIVEN: No clienteId
    renderDetailView(undefined);

    // THEN: btn-editar is NOT present (AC #1 — only visible in data state)
    expect(screen.queryByTestId('btn-editar')).not.toBeInTheDocument();
  });

  it('[P1] should NOT show btn-editar in error (500) state', async () => {
    // GIVEN: GET returns 500
    const clienteId = 'gggg0007-0000-0000-0000-000000000002';
    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderDetailView(clienteId);

    // THEN: ErrorPanel shown, btn-editar NOT present
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('btn-editar')).not.toBeInTheDocument();
  });

  it('[P1] should NOT show btn-editar in not-found (404) state', async () => {
    // GIVEN: GET returns 404
    const clienteId = 'gggg0007-0000-0000-0000-000000000003';
    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    );

    renderDetailView(clienteId);

    // THEN: NotFoundPanel shown, btn-editar NOT present
    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('btn-editar')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ClienteDetailView — Editar button opens edit dialog overlay (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — Editar button opens form overlay', () => {
  it('[P1] should render role="dialog" overlay with ClienteForm when btn-editar is clicked', async () => {
    // GIVEN: A valid cliente is loaded
    const cliente = buildCliente({
      id: 'hhhh0008-0000-0000-0000-000000000001',
      nombre: 'Empresa Para Editar',
      nit: '900000099-1',
    });
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    // GIVEN: QueryClient needed for detail view (it renders useCliente)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={cliente.id} />
      </QueryClientProvider>
    );

    // WHEN: Data loads and user clicks "Editar"
    await waitFor(() => {
      expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-editar'));

    // THEN: Edit form dialog overlay is shown (role="dialog" per story spec)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // AND: ClienteForm is rendered inside the overlay
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
  });

  it('[P1] should pre-fill Nombre field in the edit dialog with the loaded cliente name', async () => {
    // GIVEN: A valid cliente with a specific nombre
    const cliente = buildCliente({
      id: 'hhhh0008-0000-0000-0000-000000000002',
      nombre: 'Industrias del Sur SAS',
      nit: '800500200-3',
    });
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={cliente.id} />
      </QueryClientProvider>
    );

    // WHEN: Data loads and user opens edit form
    await waitFor(() => {
      expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-editar'));

    // THEN: Nombre input is pre-filled with the client's name (AC #1 — FR6)
    await waitFor(() => {
      const nombreInput = screen.getByTestId('input-nombre') as HTMLInputElement;
      expect(nombreInput.value).toBe('Industrias del Sur SAS');
    });
  });

  it('[P1] should close dialog when Cancelar is clicked inside the overlay', async () => {
    // GIVEN: A valid cliente is loaded
    const cliente = buildCliente({ id: 'hhhh0008-0000-0000-0000-000000000003' });
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={cliente.id} />
      </QueryClientProvider>
    );

    // WHEN: Edit form opened then Cancelar clicked
    await waitFor(() => {
      expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-editar'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: Dialog is closed (role="dialog" element removed)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Accessibility — aria-describedby wired to error spans in edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — accessibility (WCAG 2.1 AA)', () => {
  it('[P2] should add aria-describedby to Nombre input when validation error is shown', async () => {
    // GIVEN: Edit form rendered
    const clienteId = 'iiii0009-0000-0000-0000-000000000001';
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // WHEN: User clears Nombre and submits
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Nombre input has aria-describedby pointing to error element
    await waitFor(() => {
      const input = screen.getByTestId('input-nombre');
      const ariaDescribedBy = input.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();

      // AND: The referenced element exists and contains an error
      if (ariaDescribedBy) {
        const errorEl = document.getElementById(ariaDescribedBy);
        expect(errorEl).toBeInTheDocument();
      }
    });
  });

  it('[P2] should NOT add aria-describedby when no validation error is present initially', () => {
    // GIVEN: Edit form with valid pre-filled values (no errors at mount)
    const clienteId = 'iiii0009-0000-0000-0000-000000000002';
    renderClienteFormEditMode({ clienteId, defaultValues: validEditDefaults });

    // THEN: Nombre input has no aria-describedby (no error yet)
    const nombreInput = screen.getByTestId('input-nombre');
    // null or undefined means no attribute set (valid state — no error)
    expect(nombreInput.getAttribute('aria-describedby')).toBeFalsy();
  });
});
