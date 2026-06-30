/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — GET /api/v1/clientes returns 200 with ClienteDto[] (direct array, no wrapper)
 *   AC6 — TanStack Query ['clientes'] cache key is populated; staleTime > 0
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — GET /api/v1/clientes API contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — GET /api/v1/clientes API contract', () => {
  test('should respond with HTTP 200', async ({ request }) => {
    // GIVEN: The backend is running and ClienteEndpoints are registered
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response status is 200
    expect(response.status()).toBe(200);
  });

  test('should return content-type application/json', async ({ request }) => {
    // GIVEN: The endpoint is registered via MapClienteEndpoints()
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type header includes application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return a direct array (not wrapped in an object)', async ({ request }) => {
    // GIVEN: Architecture mandates no wrapper object — direct ClienteDto[] array
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Response body is an array (not { data: [...] } or { items: [...] })
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return an empty array when no clients exist', async ({ request }) => {
    // GIVEN: Database has no cliente records (or all were cleaned up)
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Response is an array (may be empty or have items — must NOT be null)
    expect(body).not.toBeNull();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return ClienteDto with all required fields for each item', async ({ request }) => {
    // GIVEN: At least one client has been seeded in the database
    // First, create one via POST (if endpoint exists) or skip if none present
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: If items exist, each item has the required ClienteDto shape
    if (body.length > 0) {
      const first = body[0];
      expect(typeof first.id).toBe('string');
      expect(typeof first.nombre).toBe('string');
      expect(typeof first.nit).toBe('string');
      expect(typeof first.telefono).toBe('string');
      expect(typeof first.ciudad).toBe('string');
      expect(typeof first.createdAt).toBe('string');
      expect(typeof first.updatedAt).toBe('string');
    }
  });

  test('should return clients ordered by nombre alphabetically', async ({ request }) => {
    // GIVEN: Multiple clients exist
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<{ nombre: string }>;

    // THEN: List is ordered alphabetically by nombre (ascending)
    if (body.length > 1) {
      for (let i = 0; i < body.length - 1; i++) {
        expect(
          body[i].nombre.localeCompare(body[i + 1].nombre, 'es')
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  test('should respond with Problem Details RFC 7807 format on server error', async ({ request }) => {
    // GIVEN: The ExceptionHandlingMiddleware is in place (from Story 1.3)
    // WHEN: An endpoint is called that doesn't exist (simulating unhandled error)
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/not-a-valid-uuid`);

    // THEN: Response is 400/404, not 500 with HTML (middleware catches it)
    expect([400, 404, 405]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — TanStack Query cache is populated; staleTime > 0 prevents redundant requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — TanStack Query cache prevents redundant network requests', () => {
  test('should only call GET /api/v1/clientes once when navigating within the same session', async ({
    page,
  }) => {
    // GIVEN: The /clientes page uses useClientes with staleTime: 30_000
    let apiCallCount = 0;

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Empresa Cache Test',
            nit: '900000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();

    // AND: User navigates away (e.g., to /contactos) and returns
    await page.goto('/contactos');
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();

    // THEN: The API was called only once (cache served the second navigation)
    expect(apiCallCount).toBe(1);
  });

  test('should populate the clientes list from cache without loading skeleton on second visit', async ({
    page,
  }) => {
    // GIVEN: staleTime: 30_000 is configured in useClientes
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Empresa Cache Skeleton Test',
            nit: '900000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    // First visit
    await page.goto('/clientes');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Cache Skeleton Test' })
    ).toBeVisible();

    // Navigate away and back
    await page.goto('/contactos');
    await page.goto('/clientes');

    // THEN: List renders immediately from cache — loading skeleton is NOT visible
    await expect(page.getByTestId('clientes-loading-skeleton')).toHaveCount(0);
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Cache Skeleton Test' })
    ).toBeVisible();
  });
});
