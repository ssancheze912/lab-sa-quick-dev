/**
 * Test fixtures for Story 1.1 — Project Initialization & Repository Structure
 *
 * Provides composable fixtures for environment-level acceptance tests
 * covering frontend/backend initialization and CORS configuration.
 */

import { test as base, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

type EnvironmentFixtures = {
  /** Navigates to the frontend and waits for the initial load */
  frontendPage: { url: string; status: number };
  /** Verifies the backend is reachable and collects metadata */
  backendHealth: { scalarStatus: number; baseUrl: string };
};

export const test = base.extend<EnvironmentFixtures>({
  frontendPage: async ({ page }, use) => {
    // SETUP: Navigate to frontend, capturing the root response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url() === `${FRONTEND_URL}/` && resp.status() === 200,
    );

    await page.goto(FRONTEND_URL);
    const response = await responsePromise;

    await use({
      url: FRONTEND_URL,
      status: response.status(),
    });

    // CLEANUP: No persistent state to clean up for infrastructure tests
  },

  backendHealth: async ({ request }, use) => {
    // SETUP: Verify backend /scalar is reachable before running dependent tests
    const response = await request.get(`${BACKEND_URL}/scalar`, { failOnStatusCode: false });

    await use({
      scalarStatus: response.status(),
      baseUrl: BACKEND_URL,
    });

    // CLEANUP: No state created
  },
});

export { expect };
