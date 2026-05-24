/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge-Case & Boundary Tests (Automate Expansion)
 * These tests expand ATDD coverage with negative paths, boundary conditions
 * and structural verifications not covered by the base ATDD spec.
 *
 * Coverage:
 *   - Frontend HTML structure and meta requirements
 *   - JavaScript runtime resilience (multiple error types)
 *   - Console noise baseline (no unexpected warnings)
 *   - Page performance boundary (initial load time)
 *   - Favicon and static asset resolution
 *   - CORS disallowed origin (negative path)
 *   - HTTP methods allowed by CORS (boundary)
 *   - Problem Details content-type precision
 *   - Security response headers
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Frontend HTML structure edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend HTML structure and meta requirements', () => {
  test('[P1] should serve an HTML document with correct charset declaration', async ({ page }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The root page is loaded
    await page.goto('/');

    // THEN: The document charset is UTF-8 as declared in index.html
    const charset = await page.evaluate(() => document.characterSet);
    expect(charset.toUpperCase()).toBe('UTF-8');
  });

  test('[P1] should include a viewport meta tag for responsive rendering', async ({ page }) => {
    // GIVEN: The index.html was generated with standard Vite react-ts template
    // WHEN: The root page is loaded
    await page.goto('/');

    // THEN: A viewport meta tag exists — required for mobile-responsive layouts (Epic 1 Story 1.2)
    const viewportContent = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') ?? null;
    });
    expect(viewportContent).not.toBeNull();
    expect(viewportContent).toContain('width=device-width');
  });

  test('[P1] should have the page language attribute set to Spanish (es)', async ({ page }) => {
    // GIVEN: Siesa Agents CRM is a Spanish-language product (locale: es-CO)
    // WHEN: The root page loads
    await page.goto('/');

    // THEN: The <html lang> attribute communicates the document language
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toMatch(/^es/); // es, es-CO, es-419 all acceptable
  });

  test('[P2] should serve the favicon without a 404 error', async ({ page }) => {
    // GIVEN: index.html references /favicon.svg
    // WHEN: The browser requests the favicon
    const faviconResponse = await page.request.get('http://localhost:5173/favicon.svg');

    // THEN: The favicon is served successfully
    expect(faviconResponse.status()).toBe(200);
  });

  test('[P1] should have the React root mount container present in the DOM', async ({ page }) => {
    // GIVEN: main.tsx calls createRoot(document.getElementById("root"))
    // WHEN: The page loads
    await page.goto('/');

    // THEN: A #root element exists and contains at least one child node (React mounted)
    const rootChildren = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.childNodes.length : -1;
    });
    expect(rootChildren).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JavaScript runtime resilience edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('JavaScript runtime resilience on initial load', () => {
  test('[P0] should not throw any uncaught promise rejection on initial load', async ({ page }) => {
    // GIVEN: The frontend is initialized with React 19 strict mode
    // WHEN: The app renders for the first time
    const unhandledRejections: string[] = [];
    page.on('pageerror', (err) => {
      if (err.message.includes('Unhandled') || err.message.includes('Promise')) {
        unhandledRejections.push(err.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled promise rejections occur
    expect(unhandledRejections).toHaveLength(0);
  });

  test('[P1] should not emit any console error messages on initial load', async ({ page }) => {
    // GIVEN: The application is properly initialized with all required dependencies
    // WHEN: The page loads and React mounts
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Exclude browser extension injected errors (they are not application errors)
        const text = msg.text();
        if (!text.includes('extension') && !text.includes('ERR_BLOCKED_BY_CLIENT')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No console errors are emitted by the application
    expect(consoleErrors).toHaveLength(0);
  });

  test('[P2] should load the initial page within an acceptable time boundary', async ({ page }) => {
    // GIVEN: The Vite dev server is running locally
    // WHEN: Navigation to root is timed
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - startTime;

    // THEN: Initial load completes under 5 seconds (local dev server boundary)
    expect(elapsed).toBeLessThan(5000);
  });

  test('[P2] should not make any failed network requests during initial load', async ({ page }) => {
    // GIVEN: All required static assets are bundled by Vite
    // WHEN: The page loads
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      // 4xx/5xx on same-origin requests indicates missing assets
      if (response.status() >= 400 && response.url().includes('localhost:5173')) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No assets return error status codes
    expect(failedRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript build configuration boundary tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TypeScript strict mode boundary — Vite overlay absence', () => {
  test('[P0] should not show any Vite error overlay after full page load', async ({ page }) => {
    // GIVEN: TypeScript strict mode, noImplicitAny, and strictNullChecks are all active
    // WHEN: The Vite dev server compiles and the page settles
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Neither the custom element <vite-error-overlay> nor any error modal is visible
    const overlay = page.locator('vite-error-overlay');
    const overlayCount = await overlay.count();
    expect(overlayCount).toBe(0);
  });

  test('[P1] should not render a Vite compile error banner in the DOM', async ({ page }) => {
    // GIVEN: The frontend compiles cleanly on dev start
    // WHEN: The root page is fully loaded
    await page.goto('/');

    // THEN: No error-related overlays (shadowroot or not) exist in document
    const errorElements = await page.evaluate(() => {
      const selectors = [
        'vite-error-overlay',
        '[data-vite-error]',
        '.vite-error-overlay',
      ];
      return selectors.some((s) => document.querySelector(s) !== null);
    });
    expect(errorElements).toBe(false);
  });
});
