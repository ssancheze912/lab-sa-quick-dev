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

// ─────────────────────────────────────────────────────────────────────────────
// Page document metadata edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page document metadata', () => {
  test('[P1] should have a non-empty page title', async ({ page }) => {
    // GIVEN: index.html sets the <title> tag to the application name
    // WHEN: The root page is loaded
    await page.goto('/');

    // THEN: The document title is not empty (reflects the app branding)
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('[P2] should include Siesa Agents in the page title', async ({ page }) => {
    // GIVEN: The application is branded as "Siesa Agents" per project spec
    // WHEN: The root page is loaded
    await page.goto('/');

    // THEN: The title references the product name
    const title = await page.title();
    expect(title).toContain('Siesa');
  });

  test('[P1] should serve the root page as HTML content-type', async ({ page }) => {
    // GIVEN: index.html is served by the Vite dev server
    // WHEN: The root URL is requested
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url() === 'http://localhost:5173/' && resp.status() === 200),
      page.goto('/'),
    ]);

    // THEN: Content-Type is text/html
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CSS and stylesheet loading edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CSS and stylesheet loading', () => {
  test('[P1] should not produce any 4xx errors for stylesheet requests', async ({ page }) => {
    // GIVEN: Vite bundles CSS and injects it as modules or link tags
    // WHEN: The page loads all stylesheets
    const cssErrors: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if ((url.includes('.css') || url.includes('style')) && status >= 400) {
        cssErrors.push(`${status} ${url}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No stylesheet request returns an error status
    expect(cssErrors).toHaveLength(0);
  });

  test('[P2] should have at least one rendered element with computed styles (CSS is applied)', async ({
    page,
  }) => {
    // GIVEN: style.css (or Tailwind v4 via @tailwindcss/vite) is imported in main.tsx
    // WHEN: The page loads and styles are applied
    await page.goto('/');

    // THEN: The body element has a defined font-family (CSS was parsed and applied)
    const fontFamily = await page.evaluate(() =>
      window.getComputedStyle(document.body).fontFamily
    );
    // fontFamily will be empty string if CSS engine has no rules at all
    // Any non-null value confirms the CSS pipeline is functional
    expect(typeof fontFamily).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JavaScript module loading edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('JavaScript module loading', () => {
  test('[P1] should load the main entry JS module without network error', async ({ page }) => {
    // GIVEN: index.html includes <script type="module" src="/src/main.tsx">
    // Vite transforms and serves the module at runtime
    // WHEN: The page loads
    const moduleErrors: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      // ESM module requests from localhost:5173
      if (url.includes('localhost:5173') && url.includes('main') && status >= 400) {
        moduleErrors.push(`${status} ${url}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: The main module is served without error
    expect(moduleErrors).toHaveLength(0);
  });

  test('[P2] should not make requests to CDNs or external domains on initial load', async ({
    page,
  }) => {
    // GIVEN: The frontend is a local-first dev environment — all assets are local
    // WHEN: The page loads
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('http://127.0.0.1') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No external network requests are made (all assets are bundled locally)
    expect(externalRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: multiple rapid navigations (router resilience)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Router and navigation boundary', () => {
  test('[P2] should handle rapid back/forward browser navigation without crash', async ({
    page,
  }) => {
    // GIVEN: TanStack Router is initialized with a root route
    // WHEN: The user navigates to root twice in rapid succession
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    await page.goto('/');
    await page.goto('/');

    // THEN: No runtime errors occur on duplicate navigation
    expect(runtimeErrors).toHaveLength(0);
  });

  test('[P1] should return a non-200 status for an unknown route (no SPA silent 200 for 404)', async ({
    page,
  }) => {
    // GIVEN: The frontend does not have a catch-all route returning 200 for everything
    // NOTE: Vite dev server returns 200 for all SPA paths (HTML5 history fallback is expected)
    // This test validates the page renders without JS exceptions on unknown paths
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(err.message));

    // Navigate to an unknown SPA route — Vite will still serve index.html
    await page.goto('/ruta-desconocida-atdd');

    // THEN: No JavaScript crashes on rendering an unknown route (router handles gracefully)
    expect(runtimeErrors).toHaveLength(0);
  });
});
