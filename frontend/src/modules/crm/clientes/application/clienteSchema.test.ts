/**
 * Story 2.3: Create Client — clienteSchema Unit Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC3 — Empty required fields fail with Spanish error messages (Zod validation)
 *   AC4 — Whitespace-only fields are treated as empty (fail validation)
 *
 * Test status: RED — tests will fail until clienteSchema.ts is created:
 *   - frontend/src/modules/crm/clientes/application/clienteSchema.ts does NOT exist yet
 *
 * Framework: Vitest
 * Patterns: Given-When-Then, one assertion per test.
 */

import { describe, it, expect } from 'vitest';

// Module under test — does NOT exist yet (RED phase)
// @ts-expect-error module does not exist until implementation
import { createClienteSchema } from './clienteSchema';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Empty fields fail with Spanish error messages
// ─────────────────────────────────────────────────────────────────────────────

describe('createClienteSchema — AC3: empty fields fail with Spanish error messages', () => {
  it('should fail when "nombre" is empty', () => {
    // GIVEN: Form data with empty nombre
    const data = { nombre: '', nit: '900123456-7', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails for nombre
    expect(result.success).toBe(false);
  });

  it('should return a Spanish error message when "nombre" is empty', () => {
    // GIVEN: Form data with empty nombre
    const data = { nombre: '', nit: '900123456-7', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Error message is in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const nombreError = result.error.issues.find((i: { path: string[] }) => i.path.includes('nombre'));
      expect(nombreError?.message).toBeTruthy();
      expect(nombreError?.message).toMatch(/requerido|nombre/i);
    }
  });

  it('should fail when "nit" is empty', () => {
    // GIVEN: Form data with empty nit
    const data = { nombre: 'Empresa Test SA', nit: '', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails for nit
    expect(result.success).toBe(false);
  });

  it('should return a Spanish error message when "nit" is empty', () => {
    // GIVEN: Form data with empty nit
    const data = { nombre: 'Empresa Test SA', nit: '', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Error message is in Spanish for nit
    expect(result.success).toBe(false);
    if (!result.success) {
      const nitError = result.error.issues.find((i: { path: string[] }) => i.path.includes('nit'));
      expect(nitError?.message).toBeTruthy();
      expect(nitError?.message).toMatch(/requerido|nit/i);
    }
  });

  it('should fail when "telefono" is empty', () => {
    // GIVEN: Form data with empty telefono
    const data = { nombre: 'Empresa Test SA', nit: '900123456-7', telefono: '', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails for telefono
    expect(result.success).toBe(false);
  });

  it('should fail when "ciudad" is empty', () => {
    // GIVEN: Form data with empty ciudad
    const data = { nombre: 'Empresa Test SA', nit: '900123456-7', telefono: '3001234567', ciudad: '' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails for ciudad
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Whitespace-only fields treated as empty (fail validation)
// ─────────────────────────────────────────────────────────────────────────────

describe('createClienteSchema — AC4: whitespace-only fields treated as empty', () => {
  it('should fail when "nombre" is whitespace-only', () => {
    // GIVEN: Form data with whitespace-only nombre
    const data = { nombre: '   ', nit: '900123456-7', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails (trim + min(1) pattern)
    expect(result.success).toBe(false);
  });

  it('should fail when "nit" is whitespace-only', () => {
    // GIVEN: Form data with whitespace-only nit
    const data = { nombre: 'Empresa Test SA', nit: '   ', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails
    expect(result.success).toBe(false);
  });

  it('should fail when "telefono" is whitespace-only', () => {
    // GIVEN: Form data with whitespace-only telefono
    const data = { nombre: 'Empresa Test SA', nit: '900123456-7', telefono: '   ', ciudad: 'Bogotá' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails
    expect(result.success).toBe(false);
  });

  it('should fail when "ciudad" is whitespace-only', () => {
    // GIVEN: Form data with whitespace-only ciudad
    const data = { nombre: 'Empresa Test SA', nit: '900123456-7', telefono: '3001234567', ciudad: '   ' };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation fails
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path — all valid fields pass
// ─────────────────────────────────────────────────────────────────────────────

describe('createClienteSchema — happy path: valid data passes', () => {
  it('should pass when all fields have non-empty, non-whitespace values', () => {
    // GIVEN: Valid form data
    const data = {
      nombre: 'Empresa Test SA',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: Zod schema is parsed
    const result = createClienteSchema.safeParse(data);

    // THEN: Validation passes
    expect(result.success).toBe(true);
  });
});
