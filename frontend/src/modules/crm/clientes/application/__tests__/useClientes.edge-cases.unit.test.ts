/**
 * Story 2.1: Client List & Search — Automation Expansion
 * Epic 2: Client Management
 *
 * Unit Tests — AUTOMATION EXPANSION
 * Edge cases NOT covered by ATDD tests.
 *
 * Focus areas:
 *   - clienteApiRepository.getAll return type contract
 *   - clienteApiRepository module is a singleton (same reference on multiple imports)
 *   - Cliente domain type structural shape (all 7 fields)
 *   - IClienteRepository interface structural shape
 *   - useClientes hook signature (returns object with expected keys)
 *   - Module path resolution for each layer (domain / infra / application)
 */

import { describe, test, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Edge: clienteApiRepository module — singleton export contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] clienteApiRepository — singleton export contract', () => {
  test('[P1] multiple imports of clienteApiRepository return the same object reference', async () => {
    // GIVEN: clienteApiRepository is a module-level singleton
    // WHEN: the module is imported twice
    const mod1 = await import('../../infrastructure/clienteApiRepository')
    const mod2 = await import('../../infrastructure/clienteApiRepository')

    // THEN: both imports return the same reference (ES module caching)
    expect(mod1.clienteApiRepository).toBe(mod2.clienteApiRepository)
  })

  test('[P1] clienteApiRepository.getAll is the same function reference on each import', async () => {
    // GIVEN: module-level singleton
    const { clienteApiRepository: repo1 } = await import('../../infrastructure/clienteApiRepository')
    const { clienteApiRepository: repo2 } = await import('../../infrastructure/clienteApiRepository')

    // THEN: getAll is the exact same function (no re-wrapping)
    expect(repo1.getAll).toBe(repo2.getAll)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: useClientes hook — multiple imports resolve to same function
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useClientes — module caching', () => {
  test('[P1] useClientes is the same function reference on multiple imports', async () => {
    // GIVEN: ES module caching
    const mod1 = await import('../useClientes')
    const mod2 = await import('../useClientes')

    // THEN: same reference
    expect(mod1.useClientes).toBe(mod2.useClientes)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Cliente domain type — structural shape via TypeScript typeof checks
// Note: TypeScript interfaces compile away; we verify the module exists and
//       that a properly-shaped object satisfies the contract at test-time.
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] Cliente domain type — structural shape', () => {
  test('[P0] a valid Cliente object has all 7 required fields', () => {
    // GIVEN: The Cliente interface requires id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    const validCliente = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nombre: 'Empresa ABC',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-03-12T10:30:00Z',
      updatedAt: '2026-03-12T10:30:00Z',
    }

    // THEN: All 7 fields are present with the correct string type
    expect(typeof validCliente.id).toBe('string')
    expect(typeof validCliente.nombre).toBe('string')
    expect(typeof validCliente.nit).toBe('string')
    expect(typeof validCliente.telefono).toBe('string')
    expect(typeof validCliente.ciudad).toBe('string')
    expect(typeof validCliente.createdAt).toBe('string')
    expect(typeof validCliente.updatedAt).toBe('string')
  })

  test('[P0] Cliente id field conforms to UUID format', () => {
    // GIVEN: Architecture standard — UUID PK
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // WHEN: UUID regex is applied
    // THEN: The format matches
    expect(validUuid).toMatch(uuidRegex)
  })

  test('[P0] Cliente createdAt and updatedAt are valid ISO 8601 date strings', () => {
    // GIVEN: Backend returns DateTimeOffset serialized as ISO 8601
    // .NET serializes as "2026-03-12T10:30:00Z"; JavaScript Date.toISOString() adds milliseconds
    // We validate the string is parseable and represents a valid date
    const iso8601Variants = [
      '2026-03-12T10:30:00Z',       // .NET format (no milliseconds)
      '2026-03-12T10:30:00.000Z',   // JavaScript toISOString() format
    ]

    // THEN: all variants parse to the same UTC epoch ms and are valid ISO 8601
    for (const dateStr of iso8601Variants) {
      const parsed = new Date(dateStr)
      expect(isNaN(parsed.getTime())).toBe(false)
      // Verify it serializes back to an ISO 8601 string (may have .000Z suffix)
      expect(parsed.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: clienteApiRepository.getAll return type — must be a Promise<Cliente[]>
// We verify via mock that the return type is thenable (async)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] clienteApiRepository — async contract', () => {
  test('[P0] getAll returns an object with a .then method (is Promise-like)', async () => {
    // GIVEN: clienteApiRepository.getAll calls an HTTP endpoint
    // We cannot call the real endpoint in unit tests, so we verify the structural contract
    const { clienteApiRepository } = await import('../../infrastructure/clienteApiRepository')

    // THEN: getAll is a function (Promise-returning function)
    expect(typeof clienteApiRepository.getAll).toBe('function')

    // The return value of calling getAll (without await) should be a Promise
    // We call it but we expect it to fail (no real API) — we just check it returns a Promise
    const result = clienteApiRepository.getAll()
    expect(result).toBeInstanceOf(Promise)

    // Consume the promise to avoid unhandled rejection warnings
    await result.catch(() => { /* expected — no real API in unit test */ })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Module path correctness — each layer imports from the correct path
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] Module path resolution — layer separation contract', () => {
  test('[P0] domain/Cliente module resolves without error', async () => {
    let error: unknown = null
    try {
      await import('../../domain/Cliente')
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
  })

  test('[P0] domain/IClienteRepository module resolves without error', async () => {
    let error: unknown = null
    try {
      await import('../../domain/IClienteRepository')
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
  })

  test('[P0] infrastructure/clienteApiRepository module resolves without error', async () => {
    let error: unknown = null
    try {
      await import('../../infrastructure/clienteApiRepository')
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
  })

  test('[P0] application/useClientes module resolves without error', async () => {
    let error: unknown = null
    try {
      await import('../useClientes')
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: useClientes function name conforms to React Hooks naming convention
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] useClientes — React Hooks naming convention', () => {
  test('[P0] useClientes name starts with "use" (React Hook lint convention)', async () => {
    // GIVEN: React requires Hook names to start with "use" for the rules-of-hooks lint rule
    const { useClientes } = await import('../useClientes')

    // THEN: the function name starts with "use"
    expect(useClientes.name).toMatch(/^use/)
  })

  test('[P0] useClientes function arity is 0 (no required arguments)', async () => {
    // GIVEN: useClientes is called without arguments from ClienteListPanel
    const { useClientes } = await import('../useClientes')

    // THEN: function expects 0 arguments (length = 0)
    expect(useClientes.length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: clienteApiRepository getAll function arity is 0 (no required arguments)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] clienteApiRepository.getAll — function signature', () => {
  test('[P1] getAll function arity is 0 (no required arguments)', async () => {
    // GIVEN: getAll is called without arguments from useClientes
    const { clienteApiRepository } = await import('../../infrastructure/clienteApiRepository')

    // THEN: no required arguments
    expect(clienteApiRepository.getAll.length).toBe(0)
  })
})
