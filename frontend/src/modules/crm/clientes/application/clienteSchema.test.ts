/**
 * Story 2.4: Edit Client — Schema Unit Tests
 * Epic 2: Client Management
 *
 * Test IDs covered:
 *   TC-E2-P3-02: clienteFormSchema validates all 4 required fields
 *
 * Tooling: Vitest
 */

import { describe, it, expect } from 'vitest';
import { clienteFormSchema } from './clienteSchema';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P3-02: Zod schema validates all 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P3-02 — clienteFormSchema validates all 4 required fields', () => {
  it('should fail when all fields are empty', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({});

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nombre).toBeDefined();
      expect(fieldErrors.nitRuc).toBeDefined();
      expect(fieldErrors.telefono).toBeDefined();
      expect(fieldErrors.ciudad).toBeDefined();
    }
  });

  it('should fail when nombre is empty string', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({
      nombre: '',
      nitRuc: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nombre).toBeDefined();
      expect(fieldErrors.nitRuc).toBeUndefined();
    }
  });

  it('should fail when nitRuc is empty string', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test',
      nitRuc: '',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nitRuc).toBeDefined();
    }
  });

  it('should fail when telefono is empty string', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test',
      nitRuc: '900123456-1',
      telefono: '',
      ciudad: 'Bogotá',
    });

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.telefono).toBeDefined();
    }
  });

  it('should fail when ciudad is empty string', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test',
      nitRuc: '900123456-1',
      telefono: '3001234567',
      ciudad: '',
    });

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.ciudad).toBeDefined();
    }
  });

  it('should succeed when all required fields are provided', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({
      nombre: 'X',
      nitRuc: 'Y',
      telefono: 'Z',
      ciudad: 'W',
    });

    // ASSERT
    expect(result.success).toBe(true);
  });

  it('should succeed with valid full data', () => {
    // ARRANGE / ACT
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Ejemplo S.A.S.',
      nitRuc: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    // ASSERT
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Empresa Ejemplo S.A.S.');
      expect(result.data.nitRuc).toBe('900123456-1');
    }
  });
});
