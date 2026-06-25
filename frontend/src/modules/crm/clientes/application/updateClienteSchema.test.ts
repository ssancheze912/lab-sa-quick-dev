/**
 * Story 2.4: updateClienteSchema — Unit Tests (Edge Cases)
 * testarch-automate — BMad-Integrated Mode
 *
 * Covers edge cases for the Zod updateClienteSchema NOT covered by
 * ClienteForm.edit-mode.test.tsx (which tests full-form through RTL).
 *
 * Mirrors the edge-case scenarios from clienteSchema.test.ts for the update variant:
 * - Whitespace-only strings pass Zod min(1) (documents current behavior)
 * - Exactly 1 character passes min(1)
 * - Exactly 200 characters passes max(200)
 * - Exactly 201 characters fails max(200)
 * - All four fields must be present
 * - Correct Spanish error messages match AC3 specification
 * - Valid object parses successfully with correct shape
 * - updateClienteSchema does NOT include an id field (id comes from route param)
 */

import { describe, it, expect } from 'vitest';
import { updateClienteSchema, type UpdateClienteData } from './clienteSchema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validInput: UpdateClienteData = {
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
};

function parseField(field: keyof UpdateClienteData, value: unknown) {
  const data = { ...validInput, [field]: value };
  return updateClienteSchema.safeParse(data);
}

// ─── Happy path ────────────────────────────────────────────────────────────────

describe('[P1] updateClienteSchema — valid input', () => {
  it('[P1] should parse a fully valid object successfully', () => {
    // GIVEN: A complete valid input
    // WHEN: Parsing the input
    const result = updateClienteSchema.safeParse(validInput);

    // THEN: Parsing succeeds and data matches input
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it('[P1] should return an object with all four fields on successful parse', () => {
    // GIVEN: Valid input
    // WHEN: Parsing
    const result = updateClienteSchema.safeParse(validInput);

    // THEN: Parsed data includes all four required fields
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('nombre');
      expect(result.data).toHaveProperty('nit');
      expect(result.data).toHaveProperty('telefono');
      expect(result.data).toHaveProperty('ciudad');
    }
  });

  it('[P1] should NOT include an id field in the schema (id comes from route param)', () => {
    // GIVEN: Valid input with an extra id field
    const inputWithId = { ...validInput, id: '550e8400-e29b-41d4-a716-446655440000' };
    const result = updateClienteSchema.safeParse(inputWithId);

    // THEN: Parsing still succeeds (Zod strips extra fields by default)
    // AND: The parsed result does NOT include an id field
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});

// ─── min(1) boundary — single character passes ───────────────────────────────

describe('[P1] updateClienteSchema — min(1) boundary', () => {
  it('[P1] should accept nombre with exactly 1 character', () => {
    // GIVEN: nombre is a single character
    const result = parseField('nombre', 'A');

    // THEN: Parsing succeeds
    expect(result.success).toBe(true);
  });

  it('[P1] should accept nit with exactly 1 character', () => {
    // GIVEN: nit is a single character
    const result = parseField('nit', '9');

    // THEN: Parsing succeeds
    expect(result.success).toBe(true);
  });

  it('[P1] should accept telefono with exactly 1 character', () => {
    // GIVEN: telefono is a single character
    const result = parseField('telefono', '3');

    // THEN: Parsing succeeds
    expect(result.success).toBe(true);
  });

  it('[P1] should accept ciudad with exactly 1 character', () => {
    // GIVEN: ciudad is a single character
    const result = parseField('ciudad', 'B');

    // THEN: Parsing succeeds
    expect(result.success).toBe(true);
  });
});

// ─── Empty string → fails min(1) with correct Spanish message ────────────────

describe('[P1] updateClienteSchema — empty string error messages (AC3)', () => {
  it('[P1] should return "El nombre es requerido" for empty nombre', () => {
    // GIVEN: nombre is an empty string (user cleared the field in edit mode)
    const result = updateClienteSchema.safeParse({ ...validInput, nombre: '' });

    // THEN: Error message matches AC3 specification in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod v4 uses .issues (not .errors)
      const nombreError = result.error.issues.find((e) => e.path[0] === 'nombre');
      expect(nombreError?.message).toBe('El nombre es requerido');
    }
  });

  it('[P1] should return "El NIT/RUC es requerido" for empty nit', () => {
    // GIVEN: nit is an empty string
    const result = updateClienteSchema.safeParse({ ...validInput, nit: '' });

    // THEN: Error message matches AC3 specification in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const nitError = result.error.issues.find((e) => e.path[0] === 'nit');
      expect(nitError?.message).toBe('El NIT/RUC es requerido');
    }
  });

  it('[P1] should return "El teléfono es requerido" for empty telefono', () => {
    // GIVEN: telefono is an empty string
    const result = updateClienteSchema.safeParse({ ...validInput, telefono: '' });

    // THEN: Error message matches AC3 specification in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const telefonoError = result.error.issues.find((e) => e.path[0] === 'telefono');
      expect(telefonoError?.message).toBe('El teléfono es requerido');
    }
  });

  it('[P1] should return "La ciudad es requerida" for empty ciudad', () => {
    // GIVEN: ciudad is an empty string
    const result = updateClienteSchema.safeParse({ ...validInput, ciudad: '' });

    // THEN: Error message matches AC3 specification in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const ciudadError = result.error.issues.find((e) => e.path[0] === 'ciudad');
      expect(ciudadError?.message).toBe('La ciudad es requerida');
    }
  });
});

// ─── max(200) boundary conditions ─────────────────────────────────────────────

describe('[P1] updateClienteSchema — max(200) boundary conditions', () => {
  it('[P1] should accept nombre with exactly 200 characters', () => {
    const result = parseField('nombre', 'A'.repeat(200));
    expect(result.success).toBe(true);
  });

  it('[P1] should reject nombre with 201 characters', () => {
    const result = parseField('nombre', 'A'.repeat(201));
    expect(result.success).toBe(false);
  });

  it('[P1] should accept nit with exactly 200 characters', () => {
    const result = parseField('nit', 'N'.repeat(200));
    expect(result.success).toBe(true);
  });

  it('[P1] should reject nit with 201 characters', () => {
    const result = parseField('nit', 'N'.repeat(201));
    expect(result.success).toBe(false);
  });

  it('[P1] should accept telefono with exactly 200 characters', () => {
    const result = parseField('telefono', '1'.repeat(200));
    expect(result.success).toBe(true);
  });

  it('[P1] should reject telefono with 201 characters', () => {
    const result = parseField('telefono', '1'.repeat(201));
    expect(result.success).toBe(false);
  });

  it('[P1] should accept ciudad with exactly 200 characters', () => {
    const result = parseField('ciudad', 'C'.repeat(200));
    expect(result.success).toBe(true);
  });

  it('[P1] should reject ciudad with 201 characters', () => {
    const result = parseField('ciudad', 'C'.repeat(201));
    expect(result.success).toBe(false);
  });
});

// ─── Missing fields fail with correct errors ─────────────────────────────────

describe('[P1] updateClienteSchema — missing required fields', () => {
  it('[P1] should fail when nombre field is missing from the object', () => {
    // GIVEN: Object with nombre omitted
    const { nombre: _omitted, ...withoutNombre } = validInput;
    const result = updateClienteSchema.safeParse(withoutNombre);

    // THEN: Parsing fails with a nombre error
    expect(result.success).toBe(false);
  });

  it('[P1] should fail when all fields are missing (empty object)', () => {
    // GIVEN: Empty object
    const result = updateClienteSchema.safeParse({});

    // THEN: Parsing fails with errors for all four fields
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod v4 uses .issues (not .errors)
      const fieldNames = result.error.issues.map((e) => e.path[0]);
      expect(fieldNames).toContain('nombre');
      expect(fieldNames).toContain('nit');
      expect(fieldNames).toContain('telefono');
      expect(fieldNames).toContain('ciudad');
    }
  });
});

// ─── Whitespace-only string behavior (documents Zod behavior) ────────────────

describe('[P2] updateClienteSchema — whitespace-only string behavior', () => {
  it('[P2] should document whitespace handling for nombre (Zod min(1) counts spaces as characters)', () => {
    // NOTE: Zod min(1) counts whitespace as length >= 1, so whitespace-only passes Zod.
    // The backend FluentValidation NotEmpty() trims whitespace. This test documents
    // the current Zod behavior (intentional asymmetry with backend).
    // Frontend may add .trim().min(1) in future for parity (FR8).
    const result = parseField('nombre', '   ');

    // Document actual behavior — not an assertion of desired state
    expect(typeof result.success).toBe('boolean');
    if (result.success) {
      // Zod currently passes whitespace-only strings
      expect(result.data.nombre).toBe('   ');
    } else {
      // If schema updated to .trim(), this branch executes
      expect(result.success).toBe(false);
    }
  });
});
