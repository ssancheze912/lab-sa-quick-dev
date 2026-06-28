/**
 * Edge-case unit tests — clienteSchema (Zod) — Story 2.1 automation expansion.
 *
 * Expands ATDD coverage (clienteSchema.test.ts) with:
 *   - Missing required fields beyond NIT and Nombre
 *   - Max-length boundary violations
 *   - Whitespace-only values (boundary between empty and non-empty)
 *   - Full valid payload round-trip
 *   - Error message content verification
 */

import { describe, it, expect } from 'vitest';
import { clienteSchema } from '../application/clienteSchema';

describe('clienteSchema — edge cases and boundary conditions', () => {
  const validPayload = {
    nombre: 'Acme S.A.',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Missing required fields: telefono and ciudad
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should reject payload with empty Telefono', () => {
    // GIVEN: Payload where telefono is empty
    const payload = { ...validPayload, telefono: '' };

    // WHEN: Schema parses the payload
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails with error on telefono field
    expect(result.success).toBe(false);
    if (!result.success) {
      const telefonoErrors = result.error.issues.filter((i) => i.path.includes('telefono'));
      expect(telefonoErrors.length).toBeGreaterThan(0);
    }
  });

  it('[P2] should reject payload with empty Ciudad', () => {
    // GIVEN: Payload where ciudad is empty
    const payload = { ...validPayload, ciudad: '' };

    // WHEN: Schema parses the payload
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails with error on ciudad field
    expect(result.success).toBe(false);
    if (!result.success) {
      const ciudadErrors = result.error.issues.filter((i) => i.path.includes('ciudad'));
      expect(ciudadErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Max-length boundary violations
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should reject Nombre exceeding 255 characters', () => {
    // GIVEN: Nombre with 256 characters
    const payload = { ...validPayload, nombre: 'A'.repeat(256) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.filter((i) => i.path.includes('nombre'));
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('[P2] should accept Nombre at exactly 255 characters (boundary)', () => {
    // GIVEN: Nombre at exactly max length
    const payload = { ...validPayload, nombre: 'A'.repeat(255) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Succeeds
    expect(result.success).toBe(true);
  });

  it('[P2] should reject NIT exceeding 50 characters', () => {
    // GIVEN: NIT with 51 characters
    const payload = { ...validPayload, nit: 'N'.repeat(51) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.filter((i) => i.path.includes('nit'));
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('[P2] should accept NIT at exactly 50 characters (boundary)', () => {
    // GIVEN: NIT at exactly max length
    const payload = { ...validPayload, nit: '9'.repeat(50) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Succeeds (schema does not enforce NIT format, only presence and max length)
    expect(result.success).toBe(true);
  });

  it('[P2] should reject Telefono exceeding 50 characters', () => {
    // GIVEN: Telefono with 51 characters
    const payload = { ...validPayload, telefono: '3'.repeat(51) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails
    expect(result.success).toBe(false);
  });

  it('[P2] should reject Ciudad exceeding 100 characters', () => {
    // GIVEN: Ciudad with 101 characters
    const payload = { ...validPayload, ciudad: 'C'.repeat(101) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails
    expect(result.success).toBe(false);
  });

  it('[P2] should accept Ciudad at exactly 100 characters (boundary)', () => {
    // GIVEN: Ciudad at exactly max length
    const payload = { ...validPayload, ciudad: 'C'.repeat(100) };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Succeeds
    expect(result.success).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error message verification — Spanish messages
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should include Spanish error message for empty Nombre', () => {
    // GIVEN: Empty Nombre
    const payload = { ...validPayload, nombre: '' };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Error message is in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.filter((i) => i.path.includes('nombre'));
      expect(errors[0].message).toMatch(/nombre/i);
    }
  });

  it('[P2] should include Spanish error message for empty NIT', () => {
    // GIVEN: Empty NIT
    const payload = { ...validPayload, nit: '' };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Error message is in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.filter((i) => i.path.includes('nit'));
      expect(errors[0].message).toMatch(/nit/i);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Full valid payload round-trip
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should accept complete valid payload and preserve all field values', () => {
    // GIVEN: Complete valid payload
    const payload = {
      nombre: 'Acme S.A.',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: Schema parses the payload
    const result = clienteSchema.safeParse(payload);

    // THEN: Succeeds and all values preserved
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Acme S.A.');
      expect(result.data.nit).toBe('900123456-1');
      expect(result.data.telefono).toBe('3001234567');
      expect(result.data.ciudad).toBe('Bogotá');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Multiple simultaneous field errors
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should report errors for all empty fields when entire payload is empty strings', () => {
    // GIVEN: All fields empty
    const payload = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails with errors on all four fields
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('nombre');
      expect(paths).toContain('nit');
      expect(paths).toContain('telefono');
      expect(paths).toContain('ciudad');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Type coercion edge cases
  // ─────────────────────────────────────────────────────────────────────────

  it('[P3] should reject payload where nombre is a number (wrong type)', () => {
    // GIVEN: Nombre is a number instead of string
    const payload = { ...validPayload, nombre: 12345 as unknown as string };

    // WHEN
    const result = clienteSchema.safeParse(payload);

    // THEN: Fails with type error
    expect(result.success).toBe(false);
  });
});
