/**
 * Edge-case unit tests — clienteSchema (Zod)
 * Story 2.1 — Client List & Search — Automation Expansion
 *
 * Complements clienteSchema.test.ts (ATDD baseline).
 * Covers boundary conditions, whitespace, non-string types, extra fields,
 * and special-character values not present in the ATDD tests.
 *
 * Test levels: Unit (P1–P2)
 * Given-When-Then format.
 */

import { describe, it, expect } from 'vitest';
import { clienteSchema } from './clienteSchema';

describe('clienteSchema — edge cases', () => {
  // ---------------------------------------------------------------------------
  // Boundary: whitespace-only strings must be rejected
  // ---------------------------------------------------------------------------

  it('[P1] should reject nombre that is whitespace-only', () => {
    // GIVEN: nombre contains only spaces (looks non-empty but is semantically empty)
    const payload = { nombre: '   ', nit: '900123456-7', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails — schema must trim-check or use min(1) with trim validation
    expect(result.success).toBe(false);
  });

  it('[P1] should reject nit that is whitespace-only', () => {
    // GIVEN: nit contains only spaces
    const payload = { nombre: 'Acme Corp', nit: '   ', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);
  });

  it('[P1] should reject telefono that is whitespace-only', () => {
    // GIVEN: telefono contains only spaces
    const payload = { nombre: 'Acme Corp', nit: '900123456-7', telefono: '\t ', ciudad: 'Bogotá' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);
  });

  it('[P1] should reject ciudad that is whitespace-only', () => {
    // GIVEN: ciudad contains only spaces
    const payload = { nombre: 'Acme Corp', nit: '900123456-7', telefono: '3001234567', ciudad: '  ' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Non-string field types must be rejected
  // ---------------------------------------------------------------------------

  it('[P2] should reject nombre when given a number instead of string', () => {
    // GIVEN: nombre is a number (wrong type from an unsafe form binding)
    const payload = { nombre: 12345, nit: '900123456-7', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails with type error on nombre
    expect(result.success).toBe(false);

    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0]);
      expect(errorPaths).toContain('nombre');
    }
  });

  it('[P2] should reject nit when given null', () => {
    // GIVEN: nit is null (common when a controlled input is reset incorrectly)
    const payload = { nombre: 'Acme Corp', nit: null, telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);

    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0]);
      expect(errorPaths).toContain('nit');
    }
  });

  it('[P2] should reject telefono when given undefined', () => {
    // GIVEN: telefono is explicitly undefined
    const payload = { nombre: 'Acme Corp', nit: '900123456-7', telefono: undefined, ciudad: 'Bogotá' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);
  });

  it('[P2] should reject ciudad when given a boolean', () => {
    // GIVEN: ciudad is a boolean (incorrect type)
    const payload = { nombre: 'Acme Corp', nit: '900123456-7', telefono: '3001234567', ciudad: true };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Extra fields: schema must not fail on additional properties (be permissive)
  // ---------------------------------------------------------------------------

  it('[P2] should accept a valid payload that has extra unknown fields', () => {
    // GIVEN: Valid required fields plus an unexpected extra field
    const payload = {
      nombre: 'Acme Corp',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      extraField: 'should be ignored',
      id: 'some-uuid',
    };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse succeeds — Zod strips or ignores unknown fields by default
    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Special characters in NIT (Colombian/LATAM format)
  // ---------------------------------------------------------------------------

  it('[P1] should accept NIT with Colombian format (digits-digit)', () => {
    // GIVEN: NIT in the standard Colombian format e.g. "900123456-7"
    const payload = {
      nombre: 'Empresa Colombiana SAS',
      nit: '900123456-7',
      telefono: '6014567890',
      ciudad: 'Medellín',
    };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse succeeds — hyphens are allowed in NIT
    expect(result.success).toBe(true);
  });

  it('[P1] should accept NIT with dots and hyphens (alternative format)', () => {
    // GIVEN: NIT with dots as used in some regions
    const payload = {
      nombre: 'Empresa ABC',
      nit: '900.123.456-7',
      telefono: '3001234567',
      ciudad: 'Cali',
    };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse succeeds — schema accepts any non-empty string for NIT
    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Minimum length: single-character values (boundary)
  // ---------------------------------------------------------------------------

  it('[P2] should accept single-character values for all fields', () => {
    // GIVEN: Each field is exactly 1 character (minimum valid value)
    const payload = { nombre: 'A', nit: '1', telefono: '1', ciudad: 'X' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse succeeds — no minimum > 1 is enforced per story spec
    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // ClienteFormData type export: parsed result must have correct shape
  // ---------------------------------------------------------------------------

  it('[P2] should return parsed data with only the expected keys', () => {
    // GIVEN: A valid payload
    const payload = {
      nombre: 'Acme Corp',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parsed data contains all 4 expected keys
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('nombre', 'Acme Corp');
      expect(result.data).toHaveProperty('nit', '900123456-7');
      expect(result.data).toHaveProperty('telefono', '3001234567');
      expect(result.data).toHaveProperty('ciudad', 'Bogotá');
    }
  });

  // ---------------------------------------------------------------------------
  // Partial payload edge cases (3 of 4 fields present)
  // ---------------------------------------------------------------------------

  it('[P2] should report only the missing field when 3 of 4 fields are provided — missing nit', () => {
    // GIVEN: All fields except nit
    const payload = { nombre: 'Empresa Z', telefono: '3001234567', ciudad: 'Barranquilla' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails specifically on nit
    expect(result.success).toBe(false);

    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0]);
      expect(errorPaths).toContain('nit');
      // THEN: nombre, telefono, ciudad should NOT be in error paths
      expect(errorPaths).not.toContain('nombre');
      expect(errorPaths).not.toContain('telefono');
      expect(errorPaths).not.toContain('ciudad');
    }
  });

  it('[P2] should report only the missing field when 3 of 4 fields are provided — missing ciudad', () => {
    // GIVEN: All fields except ciudad
    const payload = { nombre: 'Empresa Z', nit: '900000001-0', telefono: '3001234567' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails specifically on ciudad
    expect(result.success).toBe(false);

    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0]);
      expect(errorPaths).toContain('ciudad');
      expect(errorPaths).not.toContain('nombre');
      expect(errorPaths).not.toContain('nit');
      expect(errorPaths).not.toContain('telefono');
    }
  });
});
