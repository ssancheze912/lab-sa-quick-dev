/**
 * Environment Factory - Story 1.1: Project Initialization
 *
 * Provides typed helpers for environment configuration used across
 * initialization tests. No faker needed here since values are fixed
 * environment addresses.
 */

export interface EnvironmentConfig {
  frontendUrl: string;
  frontendOrigin: string;
  backendUrl: string;
  scalarPath: string;
}

/**
 * Create a default dev environment config.
 * Supports overrides for custom port scenarios.
 */
export const createEnvironmentConfig = (
  overrides: Partial<EnvironmentConfig> = {}
): EnvironmentConfig => ({
  frontendUrl: 'http://localhost:5173',
  frontendOrigin: 'http://localhost:5173',
  backendUrl: 'http://localhost:5000',
  scalarPath: '/scalar',
  ...overrides,
});

/**
 * Build the full Scalar docs URL from config
 */
export const getScalarUrl = (config: EnvironmentConfig): string =>
  `${config.backendUrl}${config.scalarPath}`;
