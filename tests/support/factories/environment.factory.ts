/**
 * Environment Factory — Story 1.1
 *
 * Provides typed configuration objects for infrastructure-level tests.
 * No domain entities exist yet in this story — this factory provides
 * environment endpoint descriptors used across initialization tests.
 */

export interface ServerConfig {
  url: string;
  name: string;
  expectedPort: number;
}

export const createFrontendServerConfig = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
  url: 'http://localhost:5173',
  name: 'Vite Dev Server (React + TS)',
  expectedPort: 5173,
  ...overrides,
});

export const createBackendServerConfig = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
  url: 'http://localhost:5000',
  name: '.NET 10 Minimal API',
  expectedPort: 5000,
  ...overrides,
});

export const createCorsRequestHeaders = (origin: string = 'http://localhost:5173') => ({
  Origin: origin,
  'Access-Control-Request-Method': 'POST',
  'Access-Control-Request-Headers': 'Content-Type',
});
