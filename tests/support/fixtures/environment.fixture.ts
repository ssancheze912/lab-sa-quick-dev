/**
 * Environment Fixture - Story 1.1: Project Initialization
 *
 * Provides a typed env config fixture for tests that verify
 * the dev environment setup (ports, CORS origins, endpoints).
 * Auto-cleanup: no external state created, nothing to clean up.
 */

import { test as base } from '@playwright/test';
import { createEnvironmentConfig, type EnvironmentConfig } from '../factories/environment.factory';

type EnvironmentFixtures = {
  envConfig: EnvironmentConfig;
};

export const test = base.extend<EnvironmentFixtures>({
  envConfig: async ({}, use) => {
    // Setup: resolve dev environment config
    const config = createEnvironmentConfig();

    // Provide to test
    await use(config);

    // Cleanup: no external state created — nothing to clean up
  },
});

export { expect } from '@playwright/test';
