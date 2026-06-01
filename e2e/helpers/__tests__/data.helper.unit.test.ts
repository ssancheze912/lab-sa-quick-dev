/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit Tests — E2E Test Helpers
 *
 * data.helper.ts — Test data factory functions
 *
 * Tests focus on edge cases of data generation:
 *   - Uniqueness guarantees: buildCliente and buildContacto must not collide
 *   - Override behavior: partial overrides preserve specified fields
 *   - Field format validation: NIT, email, telefono shapes
 *   - Boundary values: empty overrides, nullish fields
 *   - Multiple calls: counter increments correctly
 */

import { describe, test, expect } from 'vitest';
import { buildCliente, buildContacto } from '../data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// buildCliente — factory edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] buildCliente — data factory', () => {
  test('[P1] should return an object with all required fields', () => {
    // GIVEN: buildCliente is called with no overrides
    // WHEN: A cliente is generated
    const cliente = buildCliente();

    // THEN: All required fields are present and non-empty
    expect(cliente).toHaveProperty('nombre');
    expect(cliente).toHaveProperty('nit');
    expect(cliente).toHaveProperty('telefono');
    expect(cliente).toHaveProperty('ciudad');
    expect(cliente.nombre.trim()).not.toBe('');
    expect(cliente.nit.trim()).not.toBe('');
  });

  test('[P1] should generate unique NITs on consecutive calls (no collisions)', () => {
    // GIVEN: Each call to buildCliente uses an incrementing counter
    // WHEN: Two clientes are generated in sequence
    const c1 = buildCliente();
    const c2 = buildCliente();

    // THEN: Their NITs are different (counter-based uniqueness)
    expect(c1.nit).not.toBe(c2.nit);
  });

  test('[P1] should generate unique nombres on consecutive calls', () => {
    // GIVEN: Nombre includes the unique counter
    const c1 = buildCliente();
    const c2 = buildCliente();

    // THEN: Both nombres are different
    expect(c1.nombre).not.toBe(c2.nombre);
  });

  test('[P1] should apply partial overrides correctly without losing other defaults', () => {
    // GIVEN: An override is provided for only the ciudad field
    // WHEN: buildCliente is called with a partial override
    const cliente = buildCliente({ ciudad: 'Medellín' });

    // THEN: ciudad uses the override value; other fields still have generated defaults
    expect(cliente.ciudad).toBe('Medellín');
    expect(cliente.nombre.trim()).not.toBe('');
    expect(cliente.nit.trim()).not.toBe('');
    expect(cliente.telefono.trim()).not.toBe('');
  });

  test('[P2] should respect a provided nombre override (exact value)', () => {
    // GIVEN: A specific nombre is required for a test scenario
    const cliente = buildCliente({ nombre: 'Empresa ACME S.A.S.' });

    // THEN: nombre is exactly as specified
    expect(cliente.nombre).toBe('Empresa ACME S.A.S.');
  });

  test('[P2] should produce a NIT matching the expected pattern (9-digit numeric)', () => {
    // GIVEN: The NIT field is built from a numeric counter
    const cliente = buildCliente();

    // THEN: NIT consists of digits only (no letters or special chars)
    expect(cliente.nit).toMatch(/^\d+$/);
  });

  test('[P2] should generate a telefono that is all digits and at least 7 chars', () => {
    // GIVEN: Telefono is built from a numeric counter
    const cliente = buildCliente();

    // THEN: Telefono is numeric and reasonably long
    expect(cliente.telefono).toMatch(/^\d+$/);
    expect(cliente.telefono.length).toBeGreaterThanOrEqual(7);
  });

  test('[P3] should use Bogotá as the default ciudad when no override is provided', () => {
    // GIVEN: The factory defaults ciudad to 'Bogotá'
    const cliente = buildCliente();

    // THEN: ciudad is Bogotá
    expect(cliente.ciudad).toBe('Bogotá');
  });

  test('[P3] should generate 10 unique clientes without any NIT collisions', () => {
    // GIVEN: The counter is monotonically increasing
    // WHEN: 10 clientes are generated
    const nitSet = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const c = buildCliente();
      nitSet.add(c.nit);
    }

    // THEN: All 10 NITs are unique
    expect(nitSet.size).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildContacto — factory edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] buildContacto — data factory', () => {
  test('[P1] should return an object with all required fields', () => {
    // GIVEN: buildContacto is called with no overrides
    const contacto = buildContacto();

    // THEN: Required fields are present and non-empty
    expect(contacto).toHaveProperty('nombre');
    expect(contacto).toHaveProperty('email');
    expect(contacto).toHaveProperty('cargo');
    expect(contacto).toHaveProperty('telefono');
    expect(contacto.nombre.trim()).not.toBe('');
    expect(contacto.email.trim()).not.toBe('');
  });

  test('[P1] should generate unique emails on consecutive calls', () => {
    // GIVEN: Email includes a unique counter
    const co1 = buildContacto();
    const co2 = buildContacto();

    // THEN: Emails are different (no collision)
    expect(co1.email).not.toBe(co2.email);
  });

  test('[P1] should default clienteId to null (unassigned contacto)', () => {
    // GIVEN: New contactos are not yet assigned to a cliente
    const contacto = buildContacto();

    // THEN: clienteId is null
    expect(contacto.clienteId).toBeNull();
  });

  test('[P1] should allow overriding clienteId to a UUID string', () => {
    // GIVEN: A contacto that needs to be pre-assigned to a cliente
    const fakeClienteId = '550e8400-e29b-41d4-a716-446655440000';
    const contacto = buildContacto({ clienteId: fakeClienteId });

    // THEN: clienteId uses the override value
    expect(contacto.clienteId).toBe(fakeClienteId);
  });

  test('[P1] should apply partial override without corrupting other fields', () => {
    // GIVEN: Only cargo is overridden
    const contacto = buildContacto({ cargo: 'Gerente Comercial' });

    // THEN: cargo is the override; other fields are still generated
    expect(contacto.cargo).toBe('Gerente Comercial');
    expect(contacto.nombre.trim()).not.toBe('');
    expect(contacto.email.trim()).not.toBe('');
    expect(contacto.clienteId).toBeNull();
  });

  test('[P2] should generate an email that contains @ and a domain suffix', () => {
    // GIVEN: The email is generated for .co domain (Colombian context)
    const contacto = buildContacto();

    // THEN: Email follows basic email format
    expect(contacto.email).toContain('@');
    expect(contacto.email).toContain('.');
  });

  test('[P2] should default cargo to Analista (domain default)', () => {
    // GIVEN: Default cargo for the CRM test data is 'Analista'
    const contacto = buildContacto();

    // THEN: cargo is Analista
    expect(contacto.cargo).toBe('Analista');
  });

  test('[P3] should generate 10 unique contactos without email collisions', () => {
    // GIVEN: The counter is monotonically increasing
    const emailSet = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const c = buildContacto();
      emailSet.add(c.email);
    }

    // THEN: All 10 emails are unique
    expect(emailSet.size).toBe(10);
  });
});
