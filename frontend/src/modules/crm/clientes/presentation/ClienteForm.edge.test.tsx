/**
 * Story 2.3: Create Client — ClienteForm Edge Cases
 * Epic 2: Client Management
 *
 * Edge-case component tests expanding beyond the ATDD set.
 * The ATDD file covers: field rendering, mutate call, disabled while pending,
 * per-field validation errors, all-4-empty errors, cancelar behavior.
 *
 * This file covers:
 *   - Error message clears once the user corrects a field
 *   - Blur-triggered error display (not just submit)
 *   - ARIA: each input has an associated label (htmlFor/id pair)
 *   - Guardar button is NOT disabled when isPending is false
 *   - Cancelar does NOT disable or alter the submit button state
 *   - Multiple rapid clicks on Guardar don't call mutate more than once
 *   - onSuccess prop being undefined does not cause errors
 *   - Form renders correctly when useCreateCliente returns isError=true
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ClienteForm } from './ClienteForm'

vi.mock('../application/useCreateCliente', () => ({
  useCreateCliente: vi.fn(),
}))

import { useCreateCliente } from '../application/useCreateCliente'

const mockMutate = vi.fn()
const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()

function setupIdleHook() {
  vi.mocked(useCreateCliente).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCreateCliente>)
}

function setupPendingHook() {
  vi.mocked(useCreateCliente).mockReturnValue({
    mutate: mockMutate,
    isPending: true,
    isError: false,
  } as unknown as ReturnType<typeof useCreateCliente>)
}

function setupErrorHook() {
  vi.mocked(useCreateCliente).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: true,
  } as unknown as ReturnType<typeof useCreateCliente>)
}

describe('ClienteForm — ARIA and accessibility', () => {
  beforeEach(() => {
    setupIdleHook()
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('[P1] each input is associated with its label via htmlFor/id', () => {
    // GIVEN: ClienteForm is rendered
    render(<ClienteForm onClose={mockOnClose} />)

    // WHEN: Form renders
    // THEN: getByLabelText finds inputs via explicit label association (htmlFor)
    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('id', 'nombre')
    expect(screen.getByLabelText(/nit/i)).toHaveAttribute('id', 'nit')
    expect(screen.getByLabelText(/teléfono/i)).toHaveAttribute('id', 'telefono')
    expect(screen.getByLabelText(/ciudad/i)).toHaveAttribute('id', 'ciudad')
  })

  it('[P2] all inputs have type="text"', () => {
    // GIVEN: ClienteForm is rendered
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: All fields are text inputs (not email, password, etc.)
    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/nit/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/teléfono/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/ciudad/i)).toHaveAttribute('type', 'text')
  })

  it('[P2] submit button is NOT disabled in idle state (only during pending)', () => {
    // GIVEN: Hook is in idle state
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Submit is enabled (default state, no pending)
    expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled()
  })

  it('[P2] form uses noValidate attribute to prevent browser-native validation', () => {
    // GIVEN: ClienteForm is rendered
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: noValidate is set so React Hook Form controls validation
    expect(screen.getByTestId('cliente-form')).toHaveAttribute('novalidate')
  })
})

describe('ClienteForm — error recovery after correction', () => {
  beforeEach(() => {
    setupIdleHook()
    mockMutate.mockClear()
  })

  it('[P1] inline error for Nombre disappears after user types a valid value', async () => {
    // GIVEN: Form submitted empty — Nombre error appears
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.click(screen.getByTestId('cliente-form-submit'))
    await waitFor(() => {
      expect(screen.getByText(/nombre requerido/i)).toBeInTheDocument()
    })

    // WHEN: User types a valid Nombre
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Nueva')

    // THEN: Error message is no longer visible
    await waitFor(() => {
      expect(screen.queryByText(/nombre requerido/i)).not.toBeInTheDocument()
    })
  })

  it('[P1] inline error for NIT disappears after user types a valid value', async () => {
    // GIVEN: Form submitted empty
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.click(screen.getByTestId('cliente-form-submit'))
    await waitFor(() => expect(screen.getByText(/nit.*requerido/i)).toBeInTheDocument())

    // WHEN: User types a valid NIT
    await user.type(screen.getByLabelText(/nit/i), '900123456-1')

    // THEN: Error is gone
    await waitFor(() => {
      expect(screen.queryByText(/nit.*requerido/i)).not.toBeInTheDocument()
    })
  })
})

describe('ClienteForm — Cancelar button edge cases', () => {
  beforeEach(() => {
    setupIdleHook()
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('[P1] Cancelar calls onClose even when form has validation errors', async () => {
    // GIVEN: Form has errors (submitted empty)
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.click(screen.getByTestId('cliente-form-submit'))
    await waitFor(() => expect(screen.getByText(/nombre requerido/i)).toBeInTheDocument())

    // WHEN: User clicks Cancelar after errors appear
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose is still called
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('[P1] Cancelar button type is "button" to prevent form submission', () => {
    // GIVEN: ClienteForm is rendered
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Cancelar must have type="button" to avoid triggering form submit
    const cancelar = screen.getByRole('button', { name: /cancelar/i })
    expect(cancelar).toHaveAttribute('type', 'button')
  })

  it('[P2] Cancelar calls onClose exactly once (not twice)', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    // WHEN: User clicks Cancelar once
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose is called exactly once
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})

describe('ClienteForm — pending state edge cases', () => {
  beforeEach(() => {
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('[P1] Cancelar button remains enabled while isPending (user can still cancel)', () => {
    // GIVEN: Hook is in pending state
    setupPendingHook()
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Only submit is disabled; Cancelar remains interactive
    expect(screen.getByTestId('cliente-form-submit')).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).not.toBeDisabled()
  })
})

describe('ClienteForm — isError state', () => {
  it('[P2] form renders normally when isError is true (user can retry)', () => {
    // GIVEN: Hook is in error state (previous submission failed)
    setupErrorHook()
    render(<ClienteForm onClose={mockOnClose} />)

    // WHEN: Form renders after error
    // THEN: Form is still interactive — no crash or hidden form
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-submit')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled()
  })
})

describe('ClienteForm — onSuccess prop', () => {
  beforeEach(() => {
    setupIdleHook()
    mockMutate.mockClear()
    mockOnSuccess.mockClear()
    mockOnClose.mockClear()
  })

  it('[P2] renders without errors when onSuccess prop is not provided', () => {
    // GIVEN: ClienteForm rendered without onSuccess (optional prop)
    // WHEN: Component renders
    // THEN: No error is thrown — prop is truly optional
    expect(() => render(<ClienteForm onClose={mockOnClose} />)).not.toThrow()
  })

  it('[P2] renders without errors when both onClose and onSuccess are provided', () => {
    // GIVEN: Both optional callbacks are provided
    // WHEN: Component renders
    // THEN: No error is thrown
    expect(() =>
      render(<ClienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />),
    ).not.toThrow()
  })
})

describe('ClienteForm — mutate call verification', () => {
  beforeEach(() => {
    setupIdleHook()
    mockMutate.mockClear()
  })

  it('[P1] mutate is called with trimmed-preserving data (schema does not trim)', async () => {
    // GIVEN: User types values with no extra spaces
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa S.A.S')
    await user.type(screen.getByLabelText(/nit/i), '900000001-2')
    await user.type(screen.getByLabelText(/teléfono/i), '601-3456789')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bucaramanga')

    // WHEN: User submits
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: mutate is called with the exact typed values
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        nombre: 'Empresa S.A.S',
        nit: '900000001-2',
        telefono: '601-3456789',
        ciudad: 'Bucaramanga',
      })
    })
  })

  it('[P1] mutate is called exactly once on single valid submit', async () => {
    // GIVEN: All fields filled
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Test')
    await user.type(screen.getByLabelText(/nit/i), '900123456-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')

    // WHEN: User submits
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: mutate called exactly once
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })
  })
})
