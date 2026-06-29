import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('rtl design', () => {
  // Detail panel alone — h2 has nombre, sr-only Nombre label, DL has 3 rows
  test('component test scenario: h2={nombre} + sr-only Nombre + DL(NIT,Tel,Ciudad)', () => {
    render(
      <div>
        <h2>ACME</h2>
        <span className="sr-only">Nombre</span>
        <div>NIT/RUC</div>
        <div>900111222</div>
        <div>Teléfono</div>
        <div>3001234567</div>
        <div>Ciudad</div>
        <div>Bogotá</div>
      </div>
    )
    expect(screen.queryAllByText('ACME').length).toBe(1)
    expect(screen.queryAllByText('Nombre').length).toBe(1)
    expect(screen.queryAllByText('NIT/RUC').length).toBe(1)
  })

  // Route integration test scenario: list item shows nombre, detail h2 shows nombre
  test('integration scenario: list shows ACME, detail h2 shows ACME', () => {
    render(
      <div>
        <button>
          <span>ACME</span>
          <span>900111222</span>
        </button>
        <h2>ACME</h2>
      </div>
    )
    // 2 matches expected: list item span AND h2
    expect(screen.queryAllByText('ACME').length).toBe(2)
  })
})
