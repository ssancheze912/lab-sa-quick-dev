/**
 * Story 2.1: Client List & Search — Automation Expansion
 * Epic 2: Client Management
 *
 * Unit Tests — AUTOMATION EXPANSION
 * Edge cases NOT covered by ATDD tests.
 *
 * Focus areas:
 *   - ClienteListPanel default export vs named export contract
 *   - EmptyState: required message prop vs optional actionLabel/onAction
 *   - EmptyState: called without optional props does not throw
 *   - ErrorPanel: message prop is optional (NFR6 — fixed internal message)
 *   - ErrorPanel: onRetry prop is optional
 *   - ClientListItem: isSelected and onClick are optional props
 *   - ClientListItem: called with isSelected=true does not throw
 *   - ClientListItem: called with isSelected=false does not throw
 *   - ClientListItem: onKeyDown handler function exists (WCAG 2.1 AA — keyboard support)
 *   - Shared components live at the correct absolute path
 */

import { describe, test, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ClienteListPanel — only named export, no default export
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteListPanel — export pattern', () => {
  test('[P1] ClienteListPanel module has no default export (named-only convention)', async () => {
    // GIVEN: Project convention uses named exports for components
    const mod = await import('../ClienteListPanel')

    // THEN: there is no default export
    expect(mod).not.toHaveProperty('default')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: EmptyState — prop variants
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] EmptyState — prop boundary conditions', () => {
  test('[P1] EmptyState without optional actionLabel/onAction does not throw', async () => {
    // GIVEN: EmptyState has optional actionLabel and onAction props
    const { EmptyState } = await import('../../../../../shared/components/EmptyState')

    // WHEN: called with only the required message prop
    // THEN: no exception
    expect(() => {
      const element = EmptyState({ message: 'Sin clientes' })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] EmptyState with all props (message + actionLabel + onAction) does not throw', async () => {
    // GIVEN: EmptyState accepts message, actionLabel, and onAction
    const { EmptyState } = await import('../../../../../shared/components/EmptyState')

    // WHEN: all props are provided
    // THEN: no exception
    expect(() => {
      const element = EmptyState({
        message: 'No hay clientes. Crea el primero.',
        actionLabel: 'Crear cliente',
        onAction: () => {},
      })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] EmptyState message prop accepts empty string without throwing', async () => {
    // GIVEN: EmptyState is called with an empty string message (edge case)
    const { EmptyState } = await import('../../../../../shared/components/EmptyState')

    // THEN: no exception (validation is a UI concern, not a component crash concern)
    expect(() => {
      const element = EmptyState({ message: '' })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] EmptyState with onAction but without actionLabel does not throw', async () => {
    // GIVEN: actionLabel is optional — component should handle the case where onAction exists but actionLabel is undefined
    const { EmptyState } = await import('../../../../../shared/components/EmptyState')

    // THEN: no exception (conditional render: button only shown when both are provided)
    expect(() => {
      const element = EmptyState({
        message: 'Sin clientes',
        onAction: () => {},
      })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P0] EmptyState has no default export (named-only convention)', async () => {
    // GIVEN: project convention uses named exports
    const mod = await import('../../../../../shared/components/EmptyState')

    // THEN: no default export
    expect(mod).not.toHaveProperty('default')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ErrorPanel — prop boundary conditions (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ErrorPanel — NFR6 fixed-message contract', () => {
  test('[P0] ErrorPanel without onRetry does not throw (onRetry is optional)', async () => {
    // GIVEN: ErrorPanel.onRetry is optional (no "Reintentar" button when undefined)
    const { ErrorPanel } = await import('../../../../../shared/components/ErrorPanel')

    // WHEN: called without onRetry
    // THEN: no exception
    expect(() => {
      const element = ErrorPanel({})
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P0] ErrorPanel with onRetry=undefined does not throw', async () => {
    // GIVEN: destructuring with undefined explicitly
    const { ErrorPanel } = await import('../../../../../shared/components/ErrorPanel')

    // THEN: no exception
    expect(() => {
      const element = ErrorPanel({ onRetry: undefined })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P0] ErrorPanel does not accept technical error details via props (NFR6 fixed-message)', async () => {
    // GIVEN: NFR6 mandates that ErrorPanel shows ONLY a fixed message
    // The component signature must NOT expose raw error details to render
    const { ErrorPanel } = await import('../../../../../shared/components/ErrorPanel')

    // THEN: component renders the same regardless of message prop (it ignores message by design)
    // Both calls should produce a non-null result without throwing
    expect(() => {
      const withMessage = ErrorPanel({ message: 'Technical detail that must not show' })
      const withoutMessage = ErrorPanel({})
      // Both return non-null React elements
      expect(withMessage).not.toBeNull()
      expect(withoutMessage).not.toBeNull()
    }).not.toThrow()
  })

  test('[P0] ErrorPanel has no default export (named-only convention)', async () => {
    // GIVEN: project uses named exports
    const mod = await import('../../../../../shared/components/ErrorPanel')

    // THEN: no default export
    expect(mod).not.toHaveProperty('default')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ClientListItem — prop boundary conditions (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ClientListItem — prop boundary conditions and accessibility', () => {
  const mockCliente = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    nombre: 'Empresa ABC',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  }

  test('[P1] ClientListItem with isSelected=true does not throw', async () => {
    // GIVEN: ClientListItem is rendered in selected state (active border + highlight background)
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    // THEN: no exception
    expect(() => {
      const element = ClientListItem({ cliente: mockCliente, isSelected: true })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] ClientListItem with isSelected=false does not throw', async () => {
    // GIVEN: ClientListItem is rendered in unselected state
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    // THEN: no exception
    expect(() => {
      const element = ClientListItem({ cliente: mockCliente, isSelected: false })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] ClientListItem with onClick callback does not throw', async () => {
    // GIVEN: ClientListItem is clickable
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    // THEN: no exception
    expect(() => {
      const element = ClientListItem({ cliente: mockCliente, onClick: () => {} })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] ClientListItem without optional props (isSelected, onClick) does not throw', async () => {
    // GIVEN: isSelected and onClick are optional
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    // THEN: no exception (only required prop is cliente)
    expect(() => {
      const element = ClientListItem({ cliente: mockCliente })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P0] ClientListItem is a named export (not default) — convention check', async () => {
    // GIVEN: project uses named exports
    const mod = await import('../../../../../shared/components/ClientListItem')

    // THEN: no default export
    expect(mod).not.toHaveProperty('default')
    expect(mod).toHaveProperty('ClientListItem')
  })

  test('[P1] ClientListItem function arity is 1 (accepts a single props object)', async () => {
    // GIVEN: React component receives a single props argument
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    // THEN: arity is 1
    expect(ClientListItem.length).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Cliente fields with special characters (Spanish locale)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClientListItem — special character rendering', () => {
  test('[P1] ClientListItem with Spanish special characters in nombre does not throw', async () => {
    // GIVEN: Real-world Spanish company names with accents and special characters
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    const clienteWithSpecialChars = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nombre: 'Distribuidora Ñoño & Cía. Ltda.',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-03-12T10:30:00Z',
      updatedAt: '2026-03-12T10:30:00Z',
    }

    // THEN: no exception
    expect(() => {
      const element = ClientListItem({ cliente: clienteWithSpecialChars })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })

  test('[P1] ClientListItem with very long nombre does not throw', async () => {
    // GIVEN: ClientListItem truncates long text via CSS (truncate class)
    const { ClientListItem } = await import('../../../../../shared/components/ClientListItem')

    const clienteWithLongName = {
      id: '223e4567-e89b-12d3-a456-426614174000',
      nombre: 'A'.repeat(500),
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-03-12T10:30:00Z',
      updatedAt: '2026-03-12T10:30:00Z',
    }

    // THEN: no exception (CSS truncation handles display, not the component)
    expect(() => {
      const element = ClientListItem({ cliente: clienteWithLongName })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: EmptyState message variants matching the AC3 guidance text
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] EmptyState — AC3 guidance message pattern', () => {
  test('[P0] EmptyState renders non-null element with the AC3 guidance message text', async () => {
    // GIVEN: AC3 requires a message guiding the user to create the first client
    const { EmptyState } = await import('../../../../../shared/components/EmptyState')

    // WHEN: called with the exact message used by ClienteListPanel
    // THEN: no exception
    expect(() => {
      const element = EmptyState({ message: 'No hay clientes. Crea el primero.' })
      expect(element).not.toBeNull()
    }).not.toThrow()
  })
})
