/**
 * Data factories for Story 1.1 — Project Initialization & Repository Structure
 *
 * These factories produce test data representing environment configuration
 * and request payloads used in acceptance tests for infrastructure validation.
 */

/**
 * Creates a CORS preflight request descriptor for test use.
 */
export const createCorsPreflightRequest = (
  overrides: Partial<{
    origin: string;
    method: string;
    requestedHeaders: string;
  }> = {},
) => ({
  origin: 'http://localhost:5173',
  method: 'GET',
  requestedHeaders: 'Content-Type',
  ...overrides,
});

/**
 * Creates an expected CORS response shape for assertion.
 */
export const createExpectedCorsResponse = (
  overrides: Partial<{
    allowOrigin: string;
    allowMethods: string;
  }> = {},
) => ({
  allowOrigin: 'http://localhost:5173',
  allowMethods: '*',
  ...overrides,
});
