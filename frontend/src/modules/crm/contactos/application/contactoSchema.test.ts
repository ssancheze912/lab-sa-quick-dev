/**
 * Unit tests — contactoSchema (Zod validation)
 * Story 3.1 — Contact List & Search
 *
 * Test IDs covered (RED phase — schema module does not exist yet):
 *   TC-E3-SCHEMA-01  Empty object fails with errors on nombre, cargo, telefono, email
 *   TC-E3-SCHEMA-02  Valid full object passes validation
 *   TC-E3-SCHEMA-03  Invalid email format fails with error on email field
 *   TC-E3-SCHEMA-04  Missing individual fields fails with specific field error
 *
 * Test stack: Vitest
 *
 * Expected RED failure: "Cannot find module '../contactoSchema'"
 */

import { describe, it, expect } from 'vitest';
import { contactoSchema } from './contactoSchema';

// ---------------------------------------------------------------------------
// TC-E3-SCHEMA-01: Empty object fails with errors on required fields
// ---------------------------------------------------------------------------

describe('TC-E3-SCHEMA-01: Empty object fails validation', () => {
  it('safeParse({}) returns { success: false } with errors on nombre', () => {
    // GIVEN: An empty object
    // WHEN: Parsed against contactoSchema
    const result = contactoSchema.safeParse({});

    // THEN: Validation fails
    expect(result.success).toBe(false);

    // THEN: Error includes 'nombre' field
    if (!result.success) {
      const fieldPaths = result.error.errors.map((e) => e.path[0]);
      expect(fieldPaths).toContain('nombre');
    }
  });

  it('safeParse({}) returns { success: false } with errors on cargo', () => {
    const result = contactoSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldPaths = result.error.errors.map((e) => e.path[0]);
      expect(fieldPaths).toContain('cargo');
    }
  });

  it('safeParse({}) returns { success: false } with errors on telefono', () => {
    const result = contactoSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldPaths = result.error.errors.map((e) => e.path[0]);
      expect(fieldPaths).toContain('telefono');
    }
  });

  it('safeParse({}) returns { success: false } with errors on email', () => {
    const result = contactoSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldPaths = result.error.errors.map((e) => e.path[0]);
      expect(fieldPaths).toContain('email');
    }
  });
});

// ---------------------------------------------------------------------------
// TC-E3-SCHEMA-02: Full valid object passes validation
// ---------------------------------------------------------------------------

describe('TC-E3-SCHEMA-02: Valid full object passes validation', () => {
  it('should return { success: true } for a completely valid contacto', () => {
    // GIVEN: A fully valid contacto object
    const validContacto = {
      nombre: 'Ana García',
      cargo: 'Directora Comercial',
      telefono: '3101234567',
      email: 'ana.garcia@siesa.com',
    };

    // WHEN: Parsed against contactoSchema
    const result = contactoSchema.safeParse(validContacto);

    // THEN: Validation succeeds
    expect(result.success).toBe(true);
  });

  it('should preserve all field values when valid', () => {
    // GIVEN: A valid contacto
    const validContacto = {
      nombre: 'Luis Pérez',
      cargo: 'Analista Senior',
      telefono: '3009876543',
      email: 'luis.perez@empresa.co',
    };

    // WHEN: Parsed
    const result = contactoSchema.safeParse(validContacto);

    // THEN: Parsed data matches input
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Luis Pérez');
      expect(result.data.cargo).toBe('Analista Senior');
      expect(result.data.telefono).toBe('3009876543');
      expect(result.data.email).toBe('luis.perez@empresa.co');
    }
  });
});

// ---------------------------------------------------------------------------
// TC-E3-SCHEMA-03: Invalid email format fails with error on email field
// ---------------------------------------------------------------------------

describe('TC-E3-SCHEMA-03: Invalid email format fails', () => {
  it('should return { success: false } with error on email when format is invalid', () => {
    // GIVEN: A contacto with an invalid email format
    const invalidEmailContacto = {
      nombre: 'Ana García',
      cargo: 'Analista',
      telefono: '3101234567',
      email: 'not-a-valid-email',
    };

    // WHEN: Parsed against contactoSchema
    const result = contactoSchema.safeParse(invalidEmailContacto);

    // THEN: Validation fails
    expect(result.success).toBe(false);

    // THEN: Error is on the email field
    if (!result.success) {
      const emailErrors = result.error.errors.filter((e) => e.path[0] === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });

  it('should fail for email without domain', () => {
    const result = contactoSchema.safeParse({
      nombre: 'Ana',
      cargo: 'Analista',
      telefono: '310000000',
      email: 'test@',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.errors.filter((e) => e.path[0] === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });

  it('should fail for email without @ symbol', () => {
    const result = contactoSchema.safeParse({
      nombre: 'Ana',
      cargo: 'Analista',
      telefono: '310000000',
      email: 'testsinArroba.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.errors.filter((e) => e.path[0] === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-E3-SCHEMA-04: Missing individual required fields each fail independently
// ---------------------------------------------------------------------------

describe('TC-E3-SCHEMA-04: Missing individual fields fail with specific error', () => {
  const validBase = {
    nombre: 'Ana García',
    cargo: 'Analista',
    telefono: '3101234567',
    email: 'ana@siesa.com',
  };

  it('should fail when nombre is missing', () => {
    const { nombre: _omitted, ...withoutNombre } = validBase;
    const result = contactoSchema.safeParse(withoutNombre);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'nombre')).toBe(true);
    }
  });

  it('should fail when cargo is missing', () => {
    const { cargo: _omitted, ...withoutCargo } = validBase;
    const result = contactoSchema.safeParse(withoutCargo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'cargo')).toBe(true);
    }
  });

  it('should fail when telefono is missing', () => {
    const { telefono: _omitted, ...withoutTelefono } = validBase;
    const result = contactoSchema.safeParse(withoutTelefono);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'telefono')).toBe(true);
    }
  });

  it('should fail when email is missing', () => {
    const { email: _omitted, ...withoutEmail } = validBase;
    const result = contactoSchema.safeParse(withoutEmail);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'email')).toBe(true);
    }
  });

  it('should fail when nombre is an empty string', () => {
    const result = contactoSchema.safeParse({ ...validBase, nombre: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'nombre')).toBe(true);
    }
  });

  it('should fail when cargo is an empty string', () => {
    const result = contactoSchema.safeParse({ ...validBase, cargo: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'cargo')).toBe(true);
    }
  });

  it('should fail when telefono is an empty string', () => {
    const result = contactoSchema.safeParse({ ...validBase, telefono: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === 'telefono')).toBe(true);
    }
  });
});
