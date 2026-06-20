/**
 * Environment Factory - Story 1.1: Project Initialization
 * Provides test data and configuration helpers for environment validation tests.
 *
 * Note: This story has no domain entities — factories produce configuration
 * objects and request payloads used to validate infrastructure behavior.
 */

export const FRONTEND_URL = 'http://localhost:5173';
export const BACKEND_URL = 'http://localhost:5000';

/**
 * Creates a standard CORS preflight request options object targeting the backend.
 * Used to validate that the CORS policy is correctly configured.
 */
export function createCorsPreflightOptions(
  method: string = 'GET',
  headers: string = 'Content-Type',
) {
  return {
    method: 'OPTIONS' as const,
    headers: {
      Origin: FRONTEND_URL,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': headers,
    },
  };
}

/**
 * Creates request headers that simulate a cross-origin request from the frontend.
 * Used to validate CORS allow-origin response headers.
 */
export function createFrontendOriginHeaders(
  extraHeaders: Record<string, string> = {},
) {
  return {
    Origin: FRONTEND_URL,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

/**
 * Expected backend API contracts for Story 1.1.
 * These define the minimum HTTP contracts the initialized solution must satisfy.
 */
export const BACKEND_CONTRACTS = {
  scalarEndpoint: `${BACKEND_URL}/scalar`,
  openApiSpec: `${BACKEND_URL}/openapi/v1.json`,
  /** Swagger must NOT exist — Swashbuckle is not permitted per architecture */
  forbiddenSwaggerEndpoint: `${BACKEND_URL}/swagger`,
} as const;
