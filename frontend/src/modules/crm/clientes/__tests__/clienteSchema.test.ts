/**
 * ATDD unit tests — Story 2.1: clienteSchema (Zod) validation (RED phase)
 *
 * Tests fail until clienteSchema is implemented at:
 *   frontend/src/modules/crm/clientes/application/clienteSchema.ts
 *
 * Test IDs:
 *   TC-E2-2-1-UNIT-5 (P2) — clienteSchema rejects empty NIT
 *   TC-E2-2-1-UNIT-6 (P2) — clienteSchema rejects empty Nombre
 *   TC-E2-2-1-UNIT-7 (P2) — clienteSchema accepts valid NIT format "900123456-1"
 */

import { describe, it, expect } from 'vitest';
// clienteSchema does NOT exist yet — import will fail (RED phase)
import { clienteSchema } from '../application/clienteSchema';

describe('clienteSchema (Zod validation)', () => {
  const validPayload = {
    nombre: 'Acme S.A.',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-5 — rejects empty NIT
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-5: should reject a payload with empty NIT', () => {
    // GIVEN: A form payload where nit is an empty string
    const payload = { ...validPayload, nit: '' };

    // WHEN: The schema parses the payload
    const result = clienteSchema.safeParse(payload);

    // THEN: Parsing fails with a validation error on the nit field
    expect(result.success).toBe(false);
    if (!result.success) {
      const nitErrors = result.error.issues.filter((i) => i.path.includes('nit'));
      expect(nitErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-6 — rejects empty Nombre
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-6: should reject a payload with empty Nombre', () => {
    // GIVEN: A form payload where nombre is an empty string
    const payload = { ...validPayload, nombre: '' };

    // WHEN: The schema parses the payload
    const result = clienteSchema.safeParse(payload);

    // THEN: Parsing fails with a validation error on the nombre field
    expect(result.success).toBe(false);
    if (!result.success) {
      const nombreErrors = result.error.issues.filter((i) => i.path.includes('nombre'));
      expect(nombreErrors.length).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-7 — accepts valid NIT format "900123456-1"
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-7: should accept a valid NIT format "900123456-1"', () => {
    // GIVEN: A complete valid payload with NIT "900123456-1"
    const payload = { ...validPayload, nit: '900123456-1' };

    // WHEN: The schema parses the payload
    const result = clienteSchema.safeParse(payload);

    // THEN: Parsing succeeds
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nit).toBe('900123456-1');
    }
  });
});
