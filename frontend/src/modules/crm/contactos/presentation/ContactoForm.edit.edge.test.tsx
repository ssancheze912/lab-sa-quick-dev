/**
 * Edge-case component tests — ContactoForm in edit mode
 * Story 3.4 — Edit Contact — Automation Expansion
 *
 * Complements ContactoForm.edit.test.tsx (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Guardar button shows "Guardando..." text while isPending
 *   - Guardar button is NOT disabled before any submission
 *   - 500 server error shows generic error toast without stack trace (NFR6)
 *   - onSuccess NOT called when backend returns 500
 *   - Input labels are linked to inputs via htmlFor (WCAG 2.1 AA)
 *   - Inputs have correct aria-required="true" in edit mode
 *   - Form renders in create mode (no contacto prop) — no pre-filled values
 *   - Whitespace-only nombre blocks submission and shows inline error
 *   - Multiple validation errors cleared individually after correction
 *   - Toast "Contacto actualizado correctamente" is Spanish (not English)
 *   - onCancel NOT called when submit button is clicked (isolation)
 *   - onSuccess NOT called when Cancelar is clicked (isolation)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import {
  handlePutContactoSuccess,
  handlePutContactoServerError,
} from '../../../../test/msw/handlers/contactos-update.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import { ContactoForm } from './ContactoForm';
import type { Contacto } from '../domain/Contacto';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const EXISTING_CONTACTO: Contacto = {
  id: '00000000-0000-0000-0000-000000000042',
  nombre: 'Ana López',
  cargo: 'Vendedora',
  telefono: '3001234567',
  email: 'ana.lopez@example.com',
  clienteId: null,
  createdAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helper: render ContactoForm in edit mode with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoFormEdit(props: {
  contacto?: Contacto;
  onSuccess?: () => void;
  onCancel?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ContactoForm
          contacto={props.contacto ?? EXISTING_CONTACTO}
          mode="edit"
          onSuccess={props.onSuccess}
          onCancel={props.onCancel}
        />
      </QueryClientProvider>
    ),
  };
}

function renderContactoFormCreate(props: {
  onSuccess?: () => void;
  onCancel?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoForm
        mode="create"
        onSuccess={props.onSuccess}
        onCancel={props.onCancel}
      />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Edge: Guardar button shows "Guardando..." while isPending
// ---------------------------------------------------------------------------

describe('ContactoForm edit — Guardar button loading text while pending', () => {
  it('[P2] should show "Guardando..." text on Guardar button while PUT is in flight', async () => {
    // GIVEN: PUT resolves slowly (never resolves in this test — just checks text)
    let resolveRequest: () => void;
    const pendingRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', async ({ params }) => {
        await pendingRequest;
        return HttpResponse.json(
          {
            id: params.contactoId,
            ...EXISTING_CONTACTO,
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    // WHEN: Edit form is rendered and submitted
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Button text changes to "Guardando..." while pending
    await waitFor(() => {
      const button = screen.getByTestId('contacto-form-submit');
      expect(button.textContent).toMatch(/guardando/i);
    });

    // Cleanup: resolve to avoid open handles
    resolveRequest!();
  });

  it('[P2] should show "Guardar" (not "Guardando...") before any submission', () => {
    // GIVEN: ContactoForm in edit mode just rendered
    server.use(handleGetContactosSuccess([]));

    // WHEN: Edit form is rendered and nothing is clicked
    renderContactoFormEdit();

    // THEN: Submit button shows "Guardar" text (idle state)
    const submitButton = screen.getByTestId('contacto-form-submit');
    expect(submitButton.textContent).toMatch(/guardar/i);
    expect(submitButton.textContent).not.toMatch(/guardando/i);
  });
});

// ---------------------------------------------------------------------------
// Edge: Guardar button is NOT disabled before any interaction
// ---------------------------------------------------------------------------

describe('ContactoForm edit — Guardar button enabled initially', () => {
  it('[P1] should have Guardar button enabled when form is first rendered with pre-filled values', () => {
    // GIVEN: Edit form with all valid pre-filled fields
    server.use(handleGetContactosSuccess([]));

    // WHEN: Edit form renders
    renderContactoFormEdit();

    // THEN: Guardar button is NOT disabled (valid defaults are pre-filled)
    expect(screen.getByTestId('contacto-form-submit')).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Edge: 500 server error shows generic toast without technical details
// ---------------------------------------------------------------------------

describe('ContactoForm edit — 500 server error shows generic toast (NFR6)', () => {
  it('[P1] should show generic "Error al actualizar el contacto" toast when backend returns 500', async () => {
    // GIVEN: MSW returns 500 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoServerError()
    );

    // WHEN: Edit form is rendered and submitted
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Generic error toast appears
    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });
  });

  it('[P1] should NOT expose stack trace or technical details in UI on 500 (NFR6)', async () => {
    // GIVEN: MSW returns 500 simulating unexpected server failure
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoServerError()
    );

    // WHEN: Edit form is submitted and backend returns 500
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: No stack trace or internal error details visible (NFR6)
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/System\./i)).not.toBeInTheDocument();
    expect(screen.queryByText(/500/)).not.toBeInTheDocument();
  });

  it('[P1] should NOT call onSuccess when backend returns 500', async () => {
    // GIVEN: MSW returns 500 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoServerError()
    );

    const onSuccessMock = vi.fn();

    // WHEN: Edit form is submitted with valid data and backend returns 500
    renderContactoFormEdit({ onSuccess: onSuccessMock });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: onSuccess was NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Edge: Accessibility — labels linked to inputs via htmlFor
// ---------------------------------------------------------------------------

describe('ContactoForm edit — WCAG 2.1 AA label accessibility', () => {
  it('[P1] should have label associated to Nombre input via htmlFor (accessibility)', () => {
    // GIVEN: Edit form is rendered
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm renders in edit mode
    renderContactoFormEdit();

    // THEN: Nombre input can be found by its associated label text
    const nombreInput = screen.getByLabelText(/nombre/i);
    expect(nombreInput).toBeInTheDocument();
    expect(nombreInput.getAttribute('data-testid')).toBe('contacto-form-nombre');
  });

  it('[P1] should have label associated to Email input via htmlFor (accessibility)', () => {
    // GIVEN: Edit form is rendered
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm renders in edit mode
    renderContactoFormEdit();

    // THEN: Email input can be found by its associated label text
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput.getAttribute('data-testid')).toBe('contacto-form-email');
  });

  it('[P2] should have aria-required="true" on all 4 inputs in edit mode', () => {
    // GIVEN: Edit form is rendered
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm renders in edit mode
    renderContactoFormEdit();

    // THEN: All 4 inputs have aria-required="true" (required field accessibility)
    ['contacto-form-nombre', 'contacto-form-cargo', 'contacto-form-telefono', 'contacto-form-email']
      .forEach((testId) => {
        const input = screen.getByTestId(testId);
        expect(input.getAttribute('aria-required')).toBe('true');
      });
  });
});

// ---------------------------------------------------------------------------
// Edge: Form in create mode has empty inputs (no pre-fill)
// ---------------------------------------------------------------------------

describe('ContactoForm create mode — inputs are empty (no contacto prop)', () => {
  it('[P2] should render empty inputs when mode is "create" and no contacto prop is given', () => {
    // GIVEN: MSW is set up
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm renders in create mode without a contacto prop
    renderContactoFormCreate();

    // THEN: All inputs are empty (no pre-filled values)
    expect(
      (screen.getByTestId('contacto-form-nombre') as HTMLInputElement).value
    ).toBe('');
    expect(
      (screen.getByTestId('contacto-form-cargo') as HTMLInputElement).value
    ).toBe('');
    expect(
      (screen.getByTestId('contacto-form-telefono') as HTMLInputElement).value
    ).toBe('');
    expect(
      (screen.getByTestId('contacto-form-email') as HTMLInputElement).value
    ).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Edge: Whitespace-only nombre blocks submission
// ---------------------------------------------------------------------------

describe('ContactoForm edit — whitespace-only nombre blocks PUT', () => {
  it('[P2] should show inline error and NOT call PUT when nombre is whitespace-only', async () => {
    // GIVEN: MSW would capture any PUT request
    let putWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', () => {
        putWasCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    // WHEN: Edit form is rendered and nombre is set to whitespace only
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: '   ' },
    });

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Inline error for Nombre field is visible (Zod trims whitespace → fails min(1))
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
    });

    // THEN: PUT was NOT called (Zod blocked submission)
    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: Success toast is in Spanish
// ---------------------------------------------------------------------------

describe('ContactoForm edit — success toast language is Spanish', () => {
  it('[P1] success toast text is in Spanish (not English) after PUT 200', async () => {
    // GIVEN: MSW returns 200 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoSuccess()
    );

    // WHEN: Edit form is rendered and submitted
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Spanish success message appears
    await waitFor(() => {
      expect(
        screen.getByText(/contacto actualizado correctamente/i)
      ).toBeInTheDocument();
    });

    // THEN: English equivalent NOT shown
    expect(screen.queryByText(/contact updated successfully/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: onCancel NOT called when submit is clicked (isolation)
// ---------------------------------------------------------------------------

describe('ContactoForm edit — onCancel not called on submit click', () => {
  it('[P2] should NOT call onCancel when Guardar is clicked', async () => {
    // GIVEN: MSW returns 200 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoSuccess()
    );

    const onCancelMock = vi.fn();
    const onSuccessMock = vi.fn();

    // WHEN: Edit form is submitted
    renderContactoFormEdit({ onCancel: onCancelMock, onSuccess: onSuccessMock });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });

    // THEN: onCancel was NOT called during submit
    expect(onCancelMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Edge: onSuccess NOT called when Cancelar is clicked (isolation)
// ---------------------------------------------------------------------------

describe('ContactoForm edit — onSuccess not called on cancel click', () => {
  it('[P2] should NOT call onSuccess when Cancelar is clicked', () => {
    // GIVEN: MSW is set up
    server.use(handleGetContactosSuccess([]));

    const onSuccessMock = vi.fn();
    const onCancelMock = vi.fn();

    // WHEN: Edit form renders and Cancelar is clicked
    renderContactoFormEdit({ onSuccess: onSuccessMock, onCancel: onCancelMock });
    fireEvent.click(screen.getByTestId('contacto-form-cancel'));

    // THEN: onSuccess was NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();

    // THEN: onCancel was called (confirm the click worked)
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Edge: Inline validation error disappears after correcting the field
// ---------------------------------------------------------------------------

describe('ContactoForm edit — inline validation error clears after correction', () => {
  it('[P2] should clear Nombre error when user types a valid value after validation failure', async () => {
    // GIVEN: MSW is set up
    server.use(handleGetContactosSuccess([]));

    // WHEN: Edit form is rendered, nombre cleared, submitted (triggers error)
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // Wait for the error to appear
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
    });

    // WHEN: User corrects the nombre field
    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: 'Nuevo Nombre Válido' },
    });

    // THEN: Error for nombre is no longer visible after correction
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-form-error-nombre')).not.toBeInTheDocument();
    });
  });
});
