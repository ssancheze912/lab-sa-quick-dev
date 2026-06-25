/**
 * Environment Factory - Story 1.1: Project Initialization
 *
 * Provides factory functions for test environment configuration objects.
 * Used by initialization tests to generate test data for infrastructure validation.
 */

export interface BackendConfig {
  baseUrl: string;
  port: number;
  scalarPath: string;
  allowedOrigin: string;
}

export interface FrontendConfig {
  baseUrl: string;
  port: number;
  apiUrl: string;
}

export interface CorsPreflightRequest {
  origin: string;
  method: string;
  headers: string;
}

/**
 * Creates a backend configuration object for test use.
 * Reflects the expected state after successful initialization (AC2).
 */
export const createBackendConfig = (overrides: Partial<BackendConfig> = {}): BackendConfig => ({
  baseUrl: 'http://localhost:5000',
  port: 5000,
  scalarPath: '/scalar',
  allowedOrigin: 'http://localhost:5173',
  ...overrides,
});

/**
 * Creates a frontend configuration object for test use.
 * Reflects the expected state after successful initialization (AC1).
 */
export const createFrontendConfig = (overrides: Partial<FrontendConfig> = {}): FrontendConfig => ({
  baseUrl: 'http://localhost:5173',
  port: 5173,
  apiUrl: 'http://localhost:5000',
  ...overrides,
});

/**
 * Creates a CORS preflight request configuration for AC3 tests.
 */
export const createCorsPreflightRequest = (
  overrides: Partial<CorsPreflightRequest> = {}
): CorsPreflightRequest => ({
  origin: 'http://localhost:5173',
  method: 'GET',
  headers: 'Content-Type',
  ...overrides,
});

/**
 * List of expected Clean Architecture project names in SiesaAgents.sln (AC2).
 */
export const EXPECTED_CLEAN_ARCH_PROJECTS = [
  'SiesaAgents.API',
  'SiesaAgents.Application',
  'SiesaAgents.Domain',
  'SiesaAgents.Infrastructure',
] as const;

export type CleanArchProject = (typeof EXPECTED_CLEAN_ARCH_PROJECTS)[number];
