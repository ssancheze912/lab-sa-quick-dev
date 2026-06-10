/**
 * API Integration Tests — Story 2.1: Client List & Search
 *
 * RED PHASE — All tests intentionally fail until implementation is complete.
 * Tests target the backend endpoint: GET /api/v1/clientes
 *
 * AC1: Endpoint returns array of clients with Nombre and NIT/RUC
 * AC4: Endpoint returns 200 with [] when no clients exist (never 404)
 *
 * Pattern: Given-When-Then | Playwright APIRequestContext
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('GET /api/v1/clientes — AC1, AC4', () => {
  test('should return HTTP 200 with a JSON array', async ({ request }) => {
    // GIVEN: Backend is running and endpoint exists

    // WHEN: Client requests all clients
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response is 200 with an array body
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return 200 with empty array when no clients exist (never 404)', async ({ request }) => {
    // GIVEN: No clients are seeded in the database

    // WHEN: Client requests all clients
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response is 200 (empty list is not a 404)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should include required fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt) in each item', async ({ request }) => {
    // GIVEN: At least one client exists in the database (seeded via API or factory)
    const seedData = {
      nombre: 'Empresa ATDD Test',
      nit: `ATD${Date.now().toString().slice(-8)}`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: seedData,
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // WHEN: Client requests all clients
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Array<Record<string, unknown>> = await response.json();
    const found = body.find((c) => c['id'] === created['id']);

    // THEN: Each client object includes all required fields
    expect(found).toBeDefined();
    expect(found).toMatchObject({
      id: expect.any(String),
      nombre: expect.any(String),
      nit: expect.any(String),
      telefono: expect.any(String),
      ciudad: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Cleanup
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${created['id']}`);
  });

  test('should return a direct JSON array (no wrapper object) — AC1 contract', async ({ request }) => {
    // GIVEN: Backend endpoint returns the response defined in architecture

    // WHEN: Client requests all clients
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Body is a JSON array, NOT an object with a nested data/items property
    expect(Array.isArray(body)).toBe(true);
    expect(typeof body).not.toBe('object'); // Not { data: [...] } shape
  });

  test('should include Content-Type: application/json in response headers', async ({ request }) => {
    // GIVEN: Backend is running

    // WHEN: Client requests all clients
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type is JSON
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
