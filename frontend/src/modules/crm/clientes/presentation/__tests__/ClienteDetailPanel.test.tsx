/**
 * Story 2.2: Client Detail View — Component Tests
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL)
 * These tests are intentionally FAILING until the implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — ClienteDetailPanel displays Nombre, NIT/RUC, Teléfono, Ciudad from client data
 *   AC3 — ClienteDetailPanel shows "Cliente no encontrado" when data is undefined/null
 *   AC4 — ClienteDetailPanel shows skeleton placeholders while isLoading is true
 *   AC5 — ClienteDetailPanel shows ErrorPanel with "Reintentar" when isError is true
 *   AC6 — ClienteDetailPanel shows EmptyState (no-selection) when no clienteId is provided
 */

import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// These imports will FAIL in RED phase — implementation does not exist yet
import { ClienteDetailPanel } from '../ClienteDetailPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface ClienteDto {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  contactCount: number;
}

function buildTestCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Empresa Test SAS',
    nit: '900123456',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-15T10:30:00Z',
    contactCount: 2,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — ClienteDetailPanel renders client fields correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — ClienteDetailPanel renders client data', () => {
  test('should render the client Nombre as a heading when data is loaded', () => {
    // GIVEN: A ClienteDetailPanel with loaded data
    const cliente = buildTestCliente({ nombre: 'Acme Colombia SAS' });

    // WHEN: The component is rendered with isLoading=false and data provided
    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The Nombre is rendered as a heading
    const heading = screen.getByTestId('cliente-detail-nombre');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Acme Colombia SAS');
  });

  test('should render the NIT/RUC value in the description list', () => {
    // GIVEN: A ClienteDetailPanel with loaded data
    const cliente = buildTestCliente({ nit: '900999111' });

    // WHEN: The component is rendered
    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The NIT/RUC value is visible
    const nitField = screen.getByTestId('cliente-detail-nit');
    expect(nitField).toBeInTheDocument();
    expect(nitField).toHaveTextContent('900999111');
  });

  test('should render the Teléfono value in the description list', () => {
    // GIVEN: A ClienteDetailPanel with loaded data
    const cliente = buildTestCliente({ telefono: '3219876543' });

    // WHEN: The component is rendered
    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The Teléfono value is visible
    const telefonoField = screen.getByTestId('cliente-detail-telefono');
    expect(telefonoField).toBeInTheDocument();
    expect(telefonoField).toHaveTextContent('3219876543');
  });

  test('should render the Ciudad value in the description list', () => {
    // GIVEN: A ClienteDetailPanel with loaded data
    const cliente = buildTestCliente({ ciudad: 'Cali' });

    // WHEN: The component is rendered
    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The Ciudad value is visible
    const ciudadField = screen.getByTestId('cliente-detail-ciudad');
    expect(ciudadField).toBeInTheDocument();
    expect(ciudadField).toHaveTextContent('Cali');
  });

  test('should render an amber badge (sin-contactos) when contactCount is 0', () => {
    // GIVEN: A client with zero contacts
    const cliente = buildTestCliente({ contactCount: 0 });

    // WHEN: The component is rendered
    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The sin-contactos badge is shown
    const badge = screen.getByTestId('sin-contactos-badge');
    expect(badge).toBeInTheDocument();
  });

  test('should NOT render the sin-contactos badge when contactCount is greater than 0', () => {
    // GIVEN: A client with contacts
    const cliente = buildTestCliente({ contactCount: 3 });

    // WHEN: The component is rendered
    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: No sin-contactos badge is shown
    expect(screen.queryByTestId('sin-contactos-badge')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Not-found message when data is undefined/null (404 resolved as no-data)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — ClienteDetailPanel shows not-found state when data is absent', () => {
  test('should show "Cliente no encontrado" when isLoading=false, isError=false, and data is undefined', () => {
    // GIVEN: A clienteId is present but data resolved to undefined (404)
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-ffffffffffff"
        isLoading={false}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The not-found container is visible
    const notFound = screen.getByTestId('cliente-not-found');
    expect(notFound).toBeInTheDocument();
    expect(notFound).toHaveTextContent('Cliente no encontrado');
  });

  test('should NOT show client fields when data is undefined (404 state)', () => {
    // GIVEN: A clienteId present but data is undefined
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-ffffffffffff"
        isLoading={false}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: No client data fields are rendered
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Skeleton placeholders while isLoading is true
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ClienteDetailPanel shows skeleton placeholders while loading', () => {
  test('should render skeleton placeholders when isLoading is true', () => {
    // GIVEN: A ClienteDetailPanel in loading state
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={true}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The skeleton container is visible
    const skeleton = screen.getByTestId('cliente-detail-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  test('should set aria-busy="true" on the panel container while loading', () => {
    // GIVEN: A ClienteDetailPanel in loading state
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={true}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The panel container has aria-busy="true"
    const panel = screen.getByTestId('cliente-detail-panel');
    expect(panel).toHaveAttribute('aria-busy', 'true');
  });

  test('should NOT render client data fields while loading', () => {
    // GIVEN: A ClienteDetailPanel in loading state
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={true}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: No client data fields are rendered while loading
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument();
  });

  test('should NOT render the skeleton when isLoading is false and data is available', () => {
    // GIVEN: A ClienteDetailPanel that has finished loading
    const cliente = buildTestCliente();

    render(
      <ClienteDetailPanel
        clienteId={cliente.id}
        isLoading={false}
        isError={false}
        data={cliente}
        onRetry={vi.fn()}
      />,
    );

    // THEN: Skeleton is not present once data is loaded
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ErrorPanel with "Reintentar" when isError is true
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — ClienteDetailPanel shows ErrorPanel when fetch fails', () => {
  test('should render an ErrorPanel when isError is true', () => {
    // GIVEN: A ClienteDetailPanel in error state
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={false}
        isError={true}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The error panel is visible
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel).toBeInTheDocument();
  });

  test('should display "No se pudo cargar el detalle del cliente" in the ErrorPanel', () => {
    // GIVEN: A ClienteDetailPanel in error state
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={false}
        isError={true}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The correct error message is shown
    expect(
      screen.getByText('No se pudo cargar el detalle del cliente'),
    ).toBeInTheDocument();
  });

  test('should render an "Intentar de nuevo" retry button in the ErrorPanel', () => {
    // GIVEN: A ClienteDetailPanel in error state
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={false}
        isError={true}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The retry button is visible
    const retryButton = screen.getByRole('button', { name: /intentar de nuevo/i });
    expect(retryButton).toBeInTheDocument();
  });

  test('should call onRetry when the "Intentar de nuevo" button is clicked', async () => {
    // GIVEN: A ClienteDetailPanel in error state with an onRetry mock
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={false}
        isError={true}
        data={undefined}
        onRetry={onRetry}
      />,
    );

    // WHEN: The user clicks "Intentar de nuevo"
    const retryButton = screen.getByRole('button', { name: /intentar de nuevo/i });
    await user.click(retryButton);

    // THEN: The onRetry callback is called once
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — EmptyState (no-selection) when no clienteId is provided
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — ClienteDetailPanel shows no-selection EmptyState when clienteId is absent', () => {
  test('should render the no-selection EmptyState when clienteId is undefined', () => {
    // GIVEN: A ClienteDetailPanel without a clienteId
    render(
      <ClienteDetailPanel
        clienteId={undefined}
        isLoading={false}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The no-selection empty state is visible
    const emptyState = screen.getByTestId('empty-state-no-selection');
    expect(emptyState).toBeInTheDocument();
  });

  test('should display "Selecciona un cliente para ver sus detalles" in the no-selection state', () => {
    // GIVEN: A ClienteDetailPanel without a clienteId
    render(
      <ClienteDetailPanel
        clienteId={undefined}
        isLoading={false}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The guidance text is visible
    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles'),
    ).toBeInTheDocument();
  });

  test('should NOT render a CTA button in the no-selection EmptyState', () => {
    // GIVEN: A ClienteDetailPanel without a clienteId
    render(
      <ClienteDetailPanel
        clienteId={undefined}
        isLoading={false}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: No action button is present in the no-selection empty state
    const emptyState = screen.getByTestId('empty-state-no-selection');
    // The no-selection variant has no CTA
    expect(emptyState.querySelector('button')).toBeNull();
  });

  test('should NOT render the no-selection EmptyState when a clienteId is provided', () => {
    // GIVEN: A ClienteDetailPanel with a clienteId (loading state)
    render(
      <ClienteDetailPanel
        clienteId="00000000-0000-0000-0000-000000000001"
        isLoading={true}
        isError={false}
        data={undefined}
        onRetry={vi.fn()}
      />,
    );

    // THEN: The no-selection EmptyState is not rendered (loading skeleton is shown instead)
    expect(screen.queryByTestId('empty-state-no-selection')).not.toBeInTheDocument();
  });
});
