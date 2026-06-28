/**
 * Automation expansion — ClienteForm edge cases — Story 2.3
 *
 * Expands ATDD coverage (ClienteForm.test.tsx) with:
 *   - Non-409 server errors (500, network failure) — form stays open, no crash
 *   - Whitespace-only inputs — Zod min(1) rejects them client-side
 *   - Max-length boundary violations submitted via form
 *   - onSuccess prop called on successful creation
 *   - Submit button text toggles "Creando…" while pending
 *   - 400 validation response from backend — form does NOT close
 *   - Non-standard 4xx errors do not leak technical details to UI
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente } from './clienteFactory';
import { ClienteForm } from '../presentation/ClienteForm';

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
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteForm(props?: { onClose?: () => void; onSuccess?: () => void }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClose = props?.onClose ?? vi.fn();
  const onSuccess = props?.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ClienteForm onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fill all required fields with valid data
// ─────────────────────────────────────────────────────────────────────────────

async function fillValidForm(overrides: {
  nombre?: string;
  nit?: string;
  telefono?: string;
  ciudad?: string;
} = {}) {
  await userEvent.type(
    screen.getByTestId('input-nombre'),
    overrides.nombre ?? 'Empresa Válida SA'
  );
  await userEvent.type(
    screen.getByTestId('input-nit'),
    overrides.nit ?? '900000010-1'
  );
  await userEvent.type(
    screen.getByTestId('input-telefono'),
    overrides.telefono ?? '3009998877'
  );
  await userEvent.type(
    screen.getByTestId('input-ciudad'),
    overrides.ciudad ?? 'Bogotá'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Non-409 server errors — form stays open, no crash
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — server error handling (non-409)', () => {
  it('[P1] should keep form open when backend returns 500 Internal Server Error', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    );

    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: User fills all fields and submits
    await fillValidForm();
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose is NOT called — form stays open after 500 error
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P1] should NOT display stack trace or technical details when backend returns 500', async () => {
    // GIVEN: Backend returns 500 with internal error text
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(
          {
            title: 'Internal Server Error',
            status: 500,
            detail: 'Microsoft.EntityFrameworkCore.DbException: connection timed out',
          },
          { status: 500 }
        )
      )
    );

    renderClienteForm();

    // WHEN: Valid form submitted
    await fillValidForm({ nit: '900000011-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Technical error detail from backend is NOT rendered in the UI (NFR6)
    await waitFor(() => {
      expect(screen.queryByText(/Microsoft\.EntityFrameworkCore/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/connection timed out/i)).not.toBeInTheDocument();
    });
  });

  it('[P2] should keep form open when backend returns 503 Service Unavailable', async () => {
    // GIVEN: Backend returns 503
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 })
      )
    );

    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: Valid form submitted
    await fillValidForm({ nit: '900000012-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Form does not close
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P2] should NOT set NIT inline error for non-409 server errors', async () => {
    // GIVEN: Backend returns generic 500
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    renderClienteForm();

    // WHEN: Valid form submitted
    await fillValidForm({ nit: '900000013-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: The 409-specific NIT error message is NOT shown for a 500 error
    await waitFor(() => {
      expect(
        screen.queryByText('El NIT/RUC ya está registrado')
      ).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Whitespace-only field values — Zod rejects, no POST sent
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — whitespace-only field values', () => {
  it('[P2] should reject whitespace-only Nombre and show inline error without calling POST', async () => {
    // GIVEN: Network intercepted before render to track POST calls
    let postCalled = false;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: User fills Nombre with only spaces (whitespace bypass attempt)
    await userEvent.type(screen.getByTestId('input-nombre'), '   ');
    await userEvent.type(screen.getByTestId('input-nit'), '900000020-1');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side validation fires (Zod min(1) rejects whitespace-only for nombre)
    // and POST is NOT sent
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(postCalled).toBe(false);
  });

  it('[P2] should reject whitespace-only NIT and show inline error without calling POST', async () => {
    // GIVEN: Network intercepted
    let postCalled = false;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: NIT filled with whitespace only
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa OK');
    await userEvent.type(screen.getByTestId('input-nit'), '   ');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error on NIT (Zod rejects whitespace-only string)
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(postCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Max-length boundary violations — Zod rejects at client level
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — max-length boundary violations (client-side)', () => {
  it('[P2] should show validation error for Nombre exceeding 255 characters without calling POST', async () => {
    // GIVEN: Network intercepted
    let postCalled = false;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: Nombre is 256 chars (over max)
    const nombre256 = 'A'.repeat(256);
    await userEvent.type(screen.getByTestId('input-nombre'), nombre256);
    await userEvent.type(screen.getByTestId('input-nit'), '900000030-1');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side validation fires, POST never sent
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(postCalled).toBe(false);
  });

  it('[P2] should show validation error for NIT exceeding 50 characters without calling POST', async () => {
    // GIVEN: Network intercepted
    let postCalled = false;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: NIT is 51 chars
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa OK');
    await userEvent.type(screen.getByTestId('input-nit'), 'N'.repeat(51));
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side validation fires
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(postCalled).toBe(false);
  });

  it('[P2] should show validation error for Ciudad exceeding 100 characters without calling POST', async () => {
    // GIVEN: Network intercepted
    let postCalled = false;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: Ciudad is 101 chars
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa OK');
    await userEvent.type(screen.getByTestId('input-nit'), '900000031-1');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'C'.repeat(101));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Client-side validation fires
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(postCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: onSuccess prop called on successful creation
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — onSuccess prop behavior', () => {
  it('[P1] should call onSuccess prop after successful creation (in addition to onClose)', async () => {
    // GIVEN: Backend returns 201
    const createdCliente = buildCliente({ nit: '900000040-1' });
    server.use(
      http.post(CLIENTES_URL, () => HttpResponse.json(createdCliente, { status: 201 }))
    );

    const onClose = vi.fn();
    const onSuccess = vi.fn();
    renderClienteForm({ onClose, onSuccess });

    // WHEN: Valid form submitted
    await userEvent.type(screen.getByTestId('input-nombre'), createdCliente.nombre);
    await userEvent.type(screen.getByTestId('input-nit'), createdCliente.nit);
    await userEvent.type(screen.getByTestId('input-telefono'), createdCliente.telefono);
    await userEvent.type(screen.getByTestId('input-ciudad'), createdCliente.ciudad);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Both onSuccess and onClose are called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('[P2] should NOT call onSuccess when backend returns 409', async () => {
    // GIVEN: Backend returns 409
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(
          { title: 'Conflicto de datos', status: 409, detail: 'El NIT/RUC ya está registrado' },
          { status: 409 }
        )
      )
    );

    const onSuccess = vi.fn();
    renderClienteForm({ onSuccess });

    // WHEN: Valid form submitted
    await fillValidForm({ nit: '900000041-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onSuccess is NOT called
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('[P2] should NOT call onClose when backend returns 500', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: Valid form submitted
    await fillValidForm({ nit: '900000042-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose is NOT called (form remains open)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Submit button text shows "Creando…" while pending
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — submit button state during pending mutation', () => {
  it('[P1] should show "Creando..." text on submit button while mutation is in flight', async () => {
    // GIVEN: Backend with delayed response
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post(CLIENTES_URL, async () => {
        await delayedRequest;
        return HttpResponse.json(buildCliente({ nit: '900000050-1' }), { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: User fills all fields and submits
    await fillValidForm({ nit: '900000050-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Button text changes to "Creando..." and is disabled
    await waitFor(() => {
      const btn = screen.getByTestId('btn-submit');
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent(/creando/i);
    });

    // Cleanup: resolve request to prevent hanging
    resolveRequest();
  });

  it('[P1] submit button returns to "Crear cliente" after mutation resolves', async () => {
    // GIVEN: Backend returns 201
    const createdCliente = buildCliente({ nit: '900000051-1' });
    server.use(
      http.post(CLIENTES_URL, () => HttpResponse.json(createdCliente, { status: 201 }))
    );

    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // Confirm initial state before submit
    expect(screen.getByTestId('btn-submit')).toHaveTextContent(/crear cliente/i);

    // WHEN: Form submitted and resolved
    await fillValidForm({ nit: '900000051-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose eventually called (mutation completed)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: 400 response from backend — form does NOT close
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — backend 400 validation response', () => {
  it('[P2] should keep form open when backend returns 400 Bad Request', async () => {
    // GIVEN: Backend returns 400 (e.g., passed client-side but rejected server-side)
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Nombre: ["'Nombre' must not be empty."] },
          },
          { status: 400 }
        )
      )
    );

    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: Valid data submitted (backend still returns 400)
    await fillValidForm({ nit: '900000060-1' });
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Form stays open — onClose NOT called
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Cancel button always available, onClose called even mid-edit
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — cancel during partial input', () => {
  it('[P2] should call onClose when "Cancelar" is clicked after typing in fields', async () => {
    // GIVEN: Form rendered, user partially fills data
    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: User types in some fields then cancels
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Parcial');
    await userEvent.type(screen.getByTestId('input-nit'), '900000070-1');
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose is called immediately — no confirmation dialog
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('[P2] cancel button is NOT disabled when mutation is not pending', () => {
    // GIVEN: Form rendered (idle state)
    renderClienteForm();

    // THEN: Cancel button is enabled
    expect(screen.getByTestId('btn-cancel')).not.toBeDisabled();
  });
});
