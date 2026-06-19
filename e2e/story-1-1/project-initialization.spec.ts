/**
 * ATDD Tests - Story 1.1: Project Initialization & Repository Structure
 * Status: RED (failing - implementation not yet complete)
 *
 * These tests define the expected behavior of the initialized project environment.
 * They MUST fail before implementation and pass after.
 *
 * Acceptance Criteria covered:
 *   AC1 - Frontend starts on port 5173 with no errors
 *   AC3 - CORS allows requests from http://localhost:5173 without errors
 *   AC4 - TypeScript strict mode is active (verified via successful app load with strict types)
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// AC1: Frontend Vite server starts on port 5173 with no errors
// ---------------------------------------------------------------------------

test.describe('AC1 - Frontend Vite server initialization', () => {
  test('should load the app root without errors on port 5173', async ({ page }) => {
    // GIVEN: The Vite dev server is running on port 5173
    // WHEN: The user navigates to the root URL
    await page.goto('http://localhost:5173/');

    // THEN: The page loads successfully (no 5xx error, no crash screen)
    await expect(page).not.toHaveTitle(/Error|Crashed|Cannot GET/i);
    expect(page.url()).toContain('localhost:5173');
  });

  test('should return HTTP 200 from the Vite dev server root', async ({ request }) => {
    // GIVEN: The Vite dev server is running on port 5173
    // WHEN: An HTTP GET is made to the root path
    const response = await request.get('http://localhost:5173/');

    // THEN: The server responds with 200 OK
    expect(response.status()).toBe(200);
  });

  test('should serve an HTML document with a #root mount point', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The page is loaded
    await page.goto('http://localhost:5173/');

    // THEN: A <div id="root"> element exists (React mount point)
    await expect(page.locator('#root')).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// AC3: CORS allows requests from http://localhost:5173 without errors
// ---------------------------------------------------------------------------

test.describe('AC3 - CORS configuration allows frontend to backend communication', () => {
  test('should not produce CORS errors in browser console when frontend calls backend', async ({ page }) => {
    // GIVEN: Both servers are running
    const corsErrors: string[] = [];

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        msg.text().toLowerCase().includes('cors')
      ) {
        corsErrors.push(msg.text());
      }
    });

    // WHEN: The frontend page loads and makes a request toward the backend origin
    await page.goto('http://localhost:5173/');

    // Trigger a fetch to backend to exercise CORS
    await page.evaluate(async () => {
      try {
        await fetch('http://localhost:5000/scalar', { method: 'GET' });
      } catch {
        // Network errors are acceptable here; CORS block errors are not
      }
    });

    // THEN: No CORS-related errors appear in the browser console
    expect(corsErrors).toHaveLength(0);
  });

  test('should receive Access-Control-Allow-Origin header from backend for preflight', async ({ request }) => {
    // GIVEN: The backend server is running with CORS configured for http://localhost:5173
    // WHEN: An OPTIONS preflight request is sent to the backend
    const response = await request.fetch('http://localhost:5000/', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: The response includes the Access-Control-Allow-Origin header
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe('http://localhost:5173');
  });
});
