/**
 * Component Edge Case Tests — Story 4.6: ReassignClienteDialog
 *
 * The ATDD baseline for Story 4.6 only covers the hook (useReassignContacto) at the
 * unit level. This file adds component-level coverage for the dialog itself, focusing
 * on rendering, state, accessibility and integration with useClientes / useReassignContacto:
 *
 *   COMP-46-EDGE-01 [P1] Loading clientes shows react-loading-skeleton (no spinner)
 *   COMP-46-EDGE-02 [P1] Current clienteId is filtered out from the options list
 *   COMP-46-EDGE-03 [P1] Empty state message rendered when no other clients are available
 *   COMP-46-EDGE-04 [P1] "Confirmar" disabled until a cliente option is selected
 *   COMP-46-EDGE-05 [P1] Dialog title is "Reasignar contacto" (Spanish)
 *   COMP-46-EDGE-06 [P1] Confirmar invokes the reassign mutation with the selected clienteId
 *   COMP-46-EDGE-07 [P2] Selected option carries aria-selected="true"
 *   COMP-46-EDGE-08 [P2] Cancelar invokes onClose without firing the mutation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock useClientes
vi.mock('../../../clientes/application/useClientes', () => ({
  useClientes: vi.fn(),
}))

// Mock useReassignContacto
vi.mock('../../application/useReassignContacto', () => ({
  useReassignContacto: vi.fn(),
}))

// Mock react-loading-skeleton to be easily detectable
vi.mock('react-loading-skeleton', () => ({
  default: ({ count, height }: { count?: number; height?: number }) =>
    createElement('div', {
      'data-testid': 'loading-skeleton',
      'data-count': count,
      'data-height': height,
    }),
}))

// Mock the skeleton CSS import (Vitest cannot parse CSS by default)
vi.mock('react-loading-skeleton/dist/skeleton.css', () => ({}))

import { useClientes } from '../../../clientes/application/useClientes'
import { useReassignContacto } from '../../application/useReassignContacto'
import { ReassignClienteDialog } from '../ReassignClienteDialog'

const mockUseClientes = useClientes as unknown as ReturnType<typeof vi.fn>
const mockUseReassignContacto = useReassignContacto as unknown as ReturnType<typeof vi.fn>

const CONTACTO_ID = 'c-1'
const CURRENT_CLIENTE_ID = 'cl-current'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function buildMutationReturn(overrides: Partial<ReturnType<typeof useReassignContacto>> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useReassignContacto>
}

describe('ReassignClienteDialog — Edge Cases (Story 4.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-01 [P1]
  // While useClientes is loading
  // Then the dialog renders react-loading-skeleton (NOT a spinner)
  // (Company UX standard — skeletons for list/data loaders.)
  // ---------------------------------------------------------------------------
  it('[P1] COMP-46-EDGE-01 — esqueleto de carga renderizado mientras useClientes está loading', () => {
    // ARRANGE
    mockUseClientes.mockReturnValue({ data: [], isLoading: true })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn())

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    // ASSERT — skeleton placeholder is present
    const skeleton = screen.getByTestId('loading-skeleton')
    expect(skeleton).toBeInTheDocument()
    // No options rendered while loading
    expect(screen.queryAllByTestId('cliente-option')).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-02 [P1]
  // Given useClientes returns 3 clients including the currentClienteId
  // Then the option list only renders the 2 clients OTHER than currentClienteId
  //   AND the current cliente.nombre is NOT in the option list
  // (Prevents re-assigning to the same cliente — UX guard.)
  // ---------------------------------------------------------------------------
  it('[P1] COMP-46-EDGE-02 — el cliente actual es filtrado de la lista de opciones', () => {
    // ARRANGE
    mockUseClientes.mockReturnValue({
      data: [
        { id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' },
        { id: 'cl-otro-1', nombre: 'Cliente Otro 1' },
        { id: 'cl-otro-2', nombre: 'Cliente Otro 2' },
      ],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn())

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    // ASSERT — exactly 2 options, current cliente excluded
    const options = screen.getAllByTestId('cliente-option')
    expect(options).toHaveLength(2)

    const optionTexts = options.map((o) => o.textContent)
    expect(optionTexts).toContain('Cliente Otro 1')
    expect(optionTexts).toContain('Cliente Otro 2')
    expect(optionTexts).not.toContain('Cliente Actual')
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-03 [P1]
  // Given useClientes returns ONLY the current cliente
  // Then the empty-state Spanish message "No hay otros clientes disponibles" is shown
  //   AND there are zero cliente-option elements
  // (Boundary: 1-element list with no available reassignment targets)
  // ---------------------------------------------------------------------------
  it('[P1] COMP-46-EDGE-03 — mensaje "No hay otros clientes disponibles" cuando solo existe el cliente actual', () => {
    // ARRANGE
    mockUseClientes.mockReturnValue({
      data: [{ id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' }],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn())

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    // ASSERT
    expect(screen.getByText('No hay otros clientes disponibles')).toBeInTheDocument()
    expect(screen.queryAllByTestId('cliente-option')).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-04 [P1]
  // Given useClientes resolves with 2 options other than the current
  // Then "Confirmar" button is disabled until a cliente is selected
  //   AND becomes enabled after selecting any cliente
  // ---------------------------------------------------------------------------
  it('[P1] COMP-46-EDGE-04 — botón Confirmar deshabilitado hasta seleccionar un cliente', async () => {
    // ARRANGE
    const user = userEvent.setup()
    mockUseClientes.mockReturnValue({
      data: [
        { id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' },
        { id: 'cl-otro-1', nombre: 'Cliente Otro 1' },
      ],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn())

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    const confirmBtn = screen.getByTestId('btn-confirmar-reasignar') as HTMLButtonElement

    // ASSERT — Initially disabled (no selection)
    expect(confirmBtn).toBeDisabled()

    // AND — After clicking an option, button becomes enabled
    const option = screen.getByText('Cliente Otro 1').closest('button') as HTMLElement
    await user.click(option)
    expect(confirmBtn).toBeEnabled()
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-05 [P1]
  // Given the dialog is open
  // Then the Dialog.Title contains the Spanish text "Reasignar contacto"
  // (Company standard — no English UI text.)
  // ---------------------------------------------------------------------------
  it('[P1] COMP-46-EDGE-05 — el título del diálogo es "Reasignar contacto" en español', () => {
    // ARRANGE
    mockUseClientes.mockReturnValue({
      data: [
        { id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' },
        { id: 'cl-otro-1', nombre: 'Cliente Otro 1' },
      ],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn())

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    // ASSERT
    expect(screen.getByText('Reasignar contacto')).toBeInTheDocument()
    expect(screen.queryByText(/^reassign contact$/i)).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-06 [P1]
  // Given the user picks a cliente and clicks "Confirmar"
  // Then reassignMutation.mutate is called with the selected clienteId
  // ---------------------------------------------------------------------------
  it('[P1] COMP-46-EDGE-06 — Confirmar invoca mutate con el clienteId seleccionado', async () => {
    // ARRANGE
    const user = userEvent.setup()
    const mutateSpy = vi.fn()
    mockUseClientes.mockReturnValue({
      data: [
        { id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' },
        { id: 'cl-target-99', nombre: 'Cliente Objetivo' },
      ],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn({ mutate: mutateSpy }))

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    const targetOption = screen.getByText('Cliente Objetivo').closest('button') as HTMLElement
    await user.click(targetOption)
    await user.click(screen.getByTestId('btn-confirmar-reasignar'))

    // ASSERT — mutate called with the selected clienteId
    expect(mutateSpy).toHaveBeenCalledTimes(1)
    expect(mutateSpy.mock.calls[0][0]).toBe('cl-target-99')
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-07 [P2]
  // When the user selects an option
  // Then the corresponding button has aria-selected="true" and the others have "false"
  // (Critical for screen-reader users — WCAG 2.1 AA + role="option".)
  // ---------------------------------------------------------------------------
  it('[P2] COMP-46-EDGE-07 — la opción seleccionada expone aria-selected="true" (WCAG 2.1 AA)', async () => {
    // ARRANGE
    const user = userEvent.setup()
    mockUseClientes.mockReturnValue({
      data: [
        { id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' },
        { id: 'cl-a', nombre: 'Cliente A' },
        { id: 'cl-b', nombre: 'Cliente B' },
      ],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn())

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose: vi.fn(),
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    const optionA = screen.getByText('Cliente A').closest('button') as HTMLElement
    const optionB = screen.getByText('Cliente B').closest('button') as HTMLElement

    // Pre-condition: nothing selected
    expect(optionA.getAttribute('aria-selected')).toBe('false')
    expect(optionB.getAttribute('aria-selected')).toBe('false')

    // Click A
    await user.click(optionA)

    // ASSERT
    expect(optionA.getAttribute('aria-selected')).toBe('true')
    expect(optionB.getAttribute('aria-selected')).toBe('false')
  })

  // ---------------------------------------------------------------------------
  // COMP-46-EDGE-08 [P2]
  // When the user clicks "Cancelar"
  // Then onClose is invoked AND mutate is NOT called
  // ---------------------------------------------------------------------------
  it('[P2] COMP-46-EDGE-08 — Cancelar invoca onClose sin disparar mutate', async () => {
    // ARRANGE
    const user = userEvent.setup()
    const mutateSpy = vi.fn()
    const onClose = vi.fn()
    mockUseClientes.mockReturnValue({
      data: [
        { id: CURRENT_CLIENTE_ID, nombre: 'Cliente Actual' },
        { id: 'cl-a', nombre: 'Cliente A' },
      ],
      isLoading: false,
    })
    mockUseReassignContacto.mockReturnValue(buildMutationReturn({ mutate: mutateSpy }))

    // ACT
    render(
      createElement(ReassignClienteDialog, {
        isOpen: true,
        onClose,
        contactoId: CONTACTO_ID,
        currentClienteId: CURRENT_CLIENTE_ID,
        contactoNombre: 'Ana Torres',
      }),
      { wrapper: createWrapper() }
    )

    // Select an option just to demonstrate state doesn't leak into a mutation call
    const optionA = screen.getByText('Cliente A').closest('button') as HTMLElement
    await user.click(optionA)

    await user.click(screen.getByTestId('btn-cancelar-reasignar'))

    // ASSERT
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mutateSpy).not.toHaveBeenCalled()
  })
})
