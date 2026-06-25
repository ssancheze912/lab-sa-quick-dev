/**
 * Infrastructure Fixtures - Story 1.1: Project Initialization
 *
 * Provides Playwright test fixtures that encapsulate environment state
 * for Story 1.1 acceptance tests.
 *
 * No cleanup needed (read-only infrastructure tests — no data mutation).
 */

import { test as base, APIRequestContext } from '@playwright/test';
import {
  createBackendConfig,
  createFrontendConfig,
  BackendConfig,
  FrontendConfig,
} from '../factories/environment.factory';

interface InfrastructureFixtures {
  /** Backend configuration under test (AC2, AC3, AC5) */
  backendConfig: BackendConfig;
  /** Frontend configuration under test (AC1, AC4) */
  frontendConfig: FrontendConfig;
  /** Pre-configured APIRequestContext pointing to backend */
  backendRequest: APIRequestContext;
}

export const test = base.extend<InfrastructureFixtures>({
  backendConfig: async ({}, use) => {
    // SETUP: Provide default backend config (no external calls, no data created)
    const config = createBackendConfig();

    // PROVIDE to test
    await use(config);

    // CLEANUP: Nothing to clean up (read-only fixture)
  },

  frontendConfig: async ({}, use) => {
    // SETUP: Provide default frontend config
    const config = createFrontendConfig();

    // PROVIDE to test
    await use(config);

    // CLEANUP: Nothing to clean up
  },

  backendRequest: async ({ playwright }, use) => {
    // SETUP: Create isolated APIRequestContext targeting the backend
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:5000',
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // PROVIDE to test
    await use(context);

    // CLEANUP: Dispose the request context
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
