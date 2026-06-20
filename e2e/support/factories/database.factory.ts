/**
 * Database Foundation Factory - Story 1.3: Backend Database Foundation
 *
 * Provides request payload builders and constants used to validate
 * infrastructure behavior for the EF Core / PostgreSQL data layer.
 *
 * Note: Story 1.3 has no domain entities — factories produce request
 * payloads used to verify that domain endpoints do NOT exist yet
 * (empty InitialCreate migration, no ClienteEntity or ContactoEntity).
 */

export const BACKEND_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * API endpoint constants for Story 1.3 validation.
 * These are the endpoints that must NOT exist in Story 1.3 scope
 * (they appear in Epic 2 and Epic 3 respectively).
 */
export const DB_FOUNDATION_CONTRACTS = {
  /** Must return 404 in Story 1.3 — defined in Epic 2 Story 2.1 */
  clientesEndpoint: `${BACKEND_URL}/api/v1/clientes`,
  /** Must return 404 in Story 1.3 — defined in Epic 3 Story 3.1 */
  contactosEndpoint: `${BACKEND_URL}/api/v1/contactos`,
  /** Test-only endpoint that intentionally throws to trigger ExceptionHandlingMiddleware */
  testThrowEndpoint: `${BACKEND_URL}/api/test/throw`,
  /** Scalar docs endpoint — used as proxy to verify successful compilation */
  scalarEndpoint: `${BACKEND_URL}/scalar`,
} as const;

/**
 * Creates a minimal cliente request payload.
 * Used in AC5 tests to verify POST /api/v1/clientes returns 404 (not registered).
 */
export function createClientePayload(overrides: Partial<{
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
}> = {}) {
  return {
    nombre: 'ATDD Test Cliente S.A.S.',
    nit: '900123456-7',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    ...overrides,
  };
}

/**
 * Creates a minimal contacto request payload.
 * Used in AC5 tests to verify POST /api/v1/contactos returns 404 (not registered).
 */
export function createContactoPayload(overrides: Partial<{
  nombre: string;
  email: string;
  cargo: string;
  telefono: string;
  clienteId: string | null;
}> = {}) {
  return {
    nombre: 'ATDD Contacto Test',
    email: 'atdd-contacto@test.siesa.com',
    cargo: 'Tester',
    telefono: '3009876543',
    clienteId: null,
    ...overrides,
  };
}

/**
 * Expected Problem Details RFC 7807 shape for 500 errors (AC2, NFR6).
 * Use this to validate response body structure from ExceptionHandlingMiddleware.
 */
export const EXPECTED_PROBLEM_DETAILS_500 = {
  status: 500,
  title: 'An unexpected error occurred.',
  detail: null,
} as const;
