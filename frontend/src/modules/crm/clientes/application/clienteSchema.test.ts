/**
 * Unit tests — clienteSchema (Zod)
 * Story 2.1 | Task 9 | TC-E2-P0-05 (Part A) + TC-E2-P2-07
 *
 * These tests are in the RED phase — clienteSchema.ts does not exist yet.
 * Expected failure: "Cannot find module '../clienteSchema'"
 *
 * Given-When-Then format.
 */

import { describe, it, expect } from 'vitest';
import { clienteSchema } from './clienteSchema';

describe('clienteSchema', () => {
  // ---------------------------------------------------------------------------
  // TC-E2-P0-05 Part A — safeParse({}) returns { success: false } with errors
  // on nombre, nit, telefono, ciudad
  // ---------------------------------------------------------------------------

  it('TC-E2-P0-05A: should reject an empty object with errors on all required fields', () => {
    // GIVEN: An empty payload (no fields provided)
    const payload = {};

    // WHEN: We parse it with clienteSchema
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails
    expect(result.success).toBe(false);

    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0]);
      // THEN: All 4 required fields are in the error paths
      expect(errorPaths).toContain('nombre');
      expect(errorPaths).toContain('nit');
      expect(errorPaths).toContain('telefono');
      expect(errorPaths).toContain('ciudad');
    }
  });

  // ---------------------------------------------------------------------------
  // TC-E2-P2-07 — Schema rejects partial payloads (only nombre filled)
  // ---------------------------------------------------------------------------

  it('TC-E2-P2-07: should reject partial payload when only nombre is provided', () => {
    // GIVEN: A payload with only nombre set
    const payload = { nombre: 'Empresa Parcial' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails and nit, telefono, ciudad are in error paths
    expect(result.success).toBe(false);

    if (!result.success) {
      const errorPaths = result.error.issues.map((i) => i.path[0]);
      expect(errorPaths).toContain('nit');
      expect(errorPaths).toContain('telefono');
      expect(errorPaths).toContain('ciudad');
    }
  });

  // ---------------------------------------------------------------------------
  // Positive case — full valid object should parse successfully
  // ---------------------------------------------------------------------------

  it('should accept a fully valid cliente payload', () => {
    // GIVEN: A complete, valid payload
    const payload = {
      nombre: 'Acme Corp',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse succeeds
    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Edge case — empty string fields should also fail (non-empty string check)
  // ---------------------------------------------------------------------------

  it('should reject payload where all fields are empty strings', () => {
    // GIVEN: All fields present but empty
    const payload = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN: We parse it
    const result = clienteSchema.safeParse(payload);

    // THEN: Parse fails (schema requires non-empty strings)
    expect(result.success).toBe(false);
  });
});
