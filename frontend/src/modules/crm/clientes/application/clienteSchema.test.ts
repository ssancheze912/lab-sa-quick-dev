/**
 * Story 2.4: Edit Client — Unit Tests for clienteFormSchema (Zod)
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level — Vitest)
 * These tests FAIL until the implementation is complete.
 *
 * Test IDs covered:
 *   TC-E2-P3-02 — clienteFormSchema validates all 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad)
 *
 * Tooling: Vitest 2+
 */

import { describe, it, expect } from 'vitest';
import { clienteFormSchema } from './clienteSchema';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P3-02 — Zod schema validates all 4 required fields
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P3-02 — clienteFormSchema validates all 4 required fields', () => {
  it('TC-E2-P3-02 — should fail validation when all 4 fields are empty (empty object)', () => {
    // GIVEN: An empty object (all 4 required fields missing)

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({});

    // THEN: Validation fails
    expect(result.success).toBe(false);
  });

  it('TC-E2-P3-02 — should report a validation error for "nombre" when it is missing', () => {
    // GIVEN: An object missing the "nombre" field

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({});

    // THEN: There is a validation error on the "nombre" field
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nombre).toBeDefined();
      expect(fieldErrors.nombre!.length).toBeGreaterThan(0);
    }
  });

  it('TC-E2-P3-02 — should report a validation error for "nitRuc" when it is missing', () => {
    // GIVEN: An object missing the "nitRuc" field

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({});

    // THEN: There is a validation error on the "nitRuc" field
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nitRuc).toBeDefined();
      expect(fieldErrors.nitRuc!.length).toBeGreaterThan(0);
    }
  });

  it('TC-E2-P3-02 — should report a validation error for "telefono" when it is missing', () => {
    // GIVEN: An object missing the "telefono" field

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({});

    // THEN: There is a validation error on the "telefono" field
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.telefono).toBeDefined();
      expect(fieldErrors.telefono!.length).toBeGreaterThan(0);
    }
  });

  it('TC-E2-P3-02 — should report a validation error for "ciudad" when it is missing', () => {
    // GIVEN: An object missing the "ciudad" field

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({});

    // THEN: There is a validation error on the "ciudad" field
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.ciudad).toBeDefined();
      expect(fieldErrors.ciudad!.length).toBeGreaterThan(0);
    }
  });

  it('TC-E2-P3-02 — should fail validation when "nombre" is an empty string', () => {
    // GIVEN: An object with nombre = "" (empty string — simulates clearing the field)

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: '',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    });

    // THEN: Validation fails on "nombre"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nombre).toBeDefined();
    }
  });

  it('TC-E2-P3-02 — should fail validation when "nitRuc" is an empty string', () => {
    // GIVEN: An object with nitRuc = ""

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    });

    // THEN: Validation fails on "nitRuc"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nitRuc).toBeDefined();
    }
  });

  it('TC-E2-P3-02 — should fail validation when "telefono" is an empty string', () => {
    // GIVEN: An object with telefono = ""

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: '',
      ciudad: 'Bogotá',
    });

    // THEN: Validation fails on "telefono"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.telefono).toBeDefined();
    }
  });

  it('TC-E2-P3-02 — should fail validation when "ciudad" is an empty string', () => {
    // GIVEN: An object with ciudad = ""

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: '',
    });

    // THEN: Validation fails on "ciudad"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.ciudad).toBeDefined();
    }
  });

  it('TC-E2-P3-02 — should pass validation when all 4 fields have valid non-empty values', () => {
    // GIVEN: A fully valid object with all 4 required fields

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Válida S.A.',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    });

    // THEN: Validation succeeds
    expect(result.success).toBe(true);
  });

  it('TC-E2-P3-02 — should return the parsed values when validation passes', () => {
    // GIVEN: A valid object

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Parsed S.A.',
      nitRuc: '900000002-2',
      telefono: '3000000002',
      ciudad: 'Medellín',
    });

    // THEN: Parsed data matches the input
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        nombre: 'Empresa Parsed S.A.',
        nitRuc: '900000002-2',
        telefono: '3000000002',
        ciudad: 'Medellín',
      });
    }
  });

  it('should fail validation when "nombre" exceeds maximum length of 200 characters', () => {
    // GIVEN: A nombre string longer than 200 characters

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'A'.repeat(201),
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    });

    // THEN: Validation fails on "nombre"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nombre).toBeDefined();
    }
  });

  it('should fail validation when "nitRuc" exceeds maximum length of 50 characters', () => {
    // GIVEN: A nitRuc string longer than 50 characters

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: 'N'.repeat(51),
      telefono: '3000000001',
      ciudad: 'Bogotá',
    });

    // THEN: Validation fails on "nitRuc"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.nitRuc).toBeDefined();
    }
  });

  it('should fail validation when "telefono" exceeds maximum length of 50 characters', () => {
    // GIVEN: A telefono string longer than 50 characters

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: '3'.repeat(51),
      ciudad: 'Bogotá',
    });

    // THEN: Validation fails on "telefono"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.telefono).toBeDefined();
    }
  });

  it('should fail validation when "ciudad" exceeds maximum length of 100 characters', () => {
    // GIVEN: A ciudad string longer than 100 characters

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'C'.repeat(101),
    });

    // THEN: Validation fails on "ciudad"
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.ciudad).toBeDefined();
    }
  });

  it('should produce Spanish error messages for empty required fields (MANDATORY)', () => {
    // GIVEN: All fields are empty strings

    // WHEN: Schema is parsed
    const result = clienteFormSchema.safeParse({
      nombre: '',
      nitRuc: '',
      telefono: '',
      ciudad: '',
    });

    // THEN: Error messages are in Spanish
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      // Check Spanish error messages per the mandatory Zod schema
      expect(fieldErrors.nombre?.[0]).toMatch(/nombre es requerido/i);
      expect(fieldErrors.nitRuc?.[0]).toMatch(/nit\/ruc es requerido/i);
      expect(fieldErrors.telefono?.[0]).toMatch(/teléfono es requerido/i);
      expect(fieldErrors.ciudad?.[0]).toMatch(/ciudad es requerida/i);
    }
  });
});
