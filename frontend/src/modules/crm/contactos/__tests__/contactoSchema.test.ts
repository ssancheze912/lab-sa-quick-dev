/**
 * ATDD unit tests — Story 3.1: contactoSchema (Zod) validation (RED phase)
 *
 * Tests fail until contactoSchema is implemented at:
 *   frontend/src/modules/crm/contactos/application/contactoSchema.ts
 *
 * Test IDs:
 *   TC-E3-3-1-UNIT-1 (P2) — contactoSchema rejects empty nombre
 *   TC-E3-3-1-UNIT-2 (P2) — contactoSchema rejects empty cargo
 *   TC-E3-3-1-UNIT-3 (P2) — contactoSchema rejects empty telefono
 *   TC-E3-3-1-UNIT-4 (P2) — contactoSchema rejects empty email
 *   (bonus) — contactoSchema accepts a valid payload
 */

import { describe, it, expect } from 'vitest';
// contactoSchema does NOT exist yet — import will fail (RED phase)
import { contactoSchema } from '../application/contactoSchema';

describe('contactoSchema (Zod validation)', () => {
  const validPayload = {
    nombre: 'María López',
    cargo: 'Gerente Comercial',
    telefono: '3001234567',
    email: 'maria.lopez@empresa.co',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-UNIT-1 — rejects empty nombre
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E3-3-1-UNIT-1: should reject a payload with empty nombre', () => {
    // GIVEN: A form payload where nombre is an empty string
    const payload = { ...validPayload, nombre: '' };

    // WHEN: The schema parses the payload
    const result = contactoSchema.safeParse(payload);

    // THEN: Parsing fails with a validation error on the nombre field
    expect(result.success).toBe(false);
    if (!result.success) {
      const nombreErrors = result.error.issues.filter((i) => i.path.includes('nombre'));
      expect(nombreErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-UNIT-2 — rejects empty cargo
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E3-3-1-UNIT-2: should reject a payload with empty cargo', () => {
    // GIVEN: A form payload where cargo is an empty string
    const payload = { ...validPayload, cargo: '' };

    // WHEN: The schema parses the payload
    const result = contactoSchema.safeParse(payload);

    // THEN: Parsing fails with a validation error on the cargo field
    expect(result.success).toBe(false);
    if (!result.success) {
      const cargoErrors = result.error.issues.filter((i) => i.path.includes('cargo'));
      expect(cargoErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-UNIT-3 — rejects empty telefono
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E3-3-1-UNIT-3: should reject a payload with empty telefono', () => {
    // GIVEN: A form payload where telefono is an empty string
    const payload = { ...validPayload, telefono: '' };

    // WHEN: The schema parses the payload
    const result = contactoSchema.safeParse(payload);

    // THEN: Parsing fails with a validation error on the telefono field
    expect(result.success).toBe(false);
    if (!result.success) {
      const telefonoErrors = result.error.issues.filter((i) => i.path.includes('telefono'));
      expect(telefonoErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-UNIT-4 — rejects empty email
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E3-3-1-UNIT-4: should reject a payload with empty email', () => {
    // GIVEN: A form payload where email is an empty string
    const payload = { ...validPayload, email: '' };

    // WHEN: The schema parses the payload
    const result = contactoSchema.safeParse(payload);

    // THEN: Parsing fails with a validation error on the email field
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.issues.filter((i) => i.path.includes('email'));
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Bonus — accepts a valid full payload
  // ─────────────────────────────────────────────────────────────────────────

  it('should accept a valid payload with all required fields filled', () => {
    // GIVEN: A complete valid payload
    const payload = { ...validPayload };

    // WHEN: The schema parses the payload
    const result = contactoSchema.safeParse(payload);

    // THEN: Parsing succeeds
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('María López');
      expect(result.data.cargo).toBe('Gerente Comercial');
      expect(result.data.email).toBe('maria.lopez@empresa.co');
    }
  });
});
