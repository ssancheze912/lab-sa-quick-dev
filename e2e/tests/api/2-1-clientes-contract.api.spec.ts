/**
 * API contract tests — Story 2.1 AC #7 (GET /api/v1/clientes response shape)
 * and AC #8 (migration created the `clientes` table, so the endpoint responds
 * 200 with a JSON array).
 *
 * These are HTTP-level tests using Playwright's request context — no browser.
 * Assertions:
 *   - Status 200
 *   - Content-Type application/json
 *   - Body is a JSON array (not enveloped)
 *   - Each element uses camelCase (id, nombre, nit, telefono, ciudad,
 *     createdAt, updatedAt)
 *   - Order is by createdAt DESC (server-side default sort)
 *
 * Test IDs: 2.1-API-001..004. Priority tags inline on each `test`.
 *
 * NOTE: Tests that require seeded data will `test.skip` explicitly when the
 * DB is empty rather than silently passing via a conditional-flow — this
 * keeps the pass/fail signal deterministic per test-quality.md rules.
 */
import { test, expect } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'

test.describe('Story 2.1 — API contract for GET /api/v1/clientes', () => {
  test('[P0][2.1-API-001] AC #7 — responds 200 OK with Content-Type application/json', async ({ request }) => {
    // WHEN
    const res = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    // THEN
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type'] ?? '').toContain('application/json')
  })

  test('[P0][2.1-API-002] AC #7 — body is a JSON array (not wrapped in envelope)', async ({ request }) => {
    // WHEN
    const res = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await res.json()
    // THEN
    expect(Array.isArray(body)).toBe(true)
  })

  test('[P0][2.1-API-003] AC #7 — when the DB has clients, each element has the exact camelCase shape', async ({ request }) => {
    // WHEN
    const res = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body = await res.json()

    // Skip explicitly (not silently) when the DB is empty so pass/fail is
    // deterministic. See test-quality.md — "avoid conditional flow that
    // can silently pass with no assertions".
    test.skip(body.length === 0, 'DB has no clientes — shape assertions require seeded data')

    const first = body[0]
    // Required camelCase keys — Zod-lite manual assertion
    const expectedKeys = [
      'id',
      'nombre',
      'nit',
      'telefono',
      'ciudad',
      'createdAt',
      'updatedAt',
    ]
    for (const k of expectedKeys) {
      expect(first).toHaveProperty(k)
    }
    // Types
    expect(typeof first.id).toBe('string')
    expect(typeof first.nombre).toBe('string')
    expect(typeof first.nit).toBe('string')
    expect(typeof first.telefono).toBe('string')
    expect(typeof first.ciudad).toBe('string')
    expect(typeof first.createdAt).toBe('string')
    expect(typeof first.updatedAt).toBe('string')
    // Anti-shape: no snake_case leakage
    expect(first).not.toHaveProperty('created_at')
    expect(first).not.toHaveProperty('updated_at')
  })

  test('[P1][2.1-API-004] AC #7 — when the DB has ≥2 clients, results are ordered by createdAt DESC', async ({ request }) => {
    // WHEN
    const res = await request.get(`${API_BASE_URL}/api/v1/clientes`)
    const body: Array<{ createdAt: string }> = await res.json()

    // Skip explicitly when fewer than 2 rows — the ordering assertion is
    // meaningless with 0 or 1 row and would silently pass without one.
    test.skip(body.length < 2, 'DB has fewer than 2 clientes — ordering assertion requires ≥2 rows')

    const timestamps = body.map((c) => new Date(c.createdAt).getTime())
    const sorted = [...timestamps].sort((a, b) => b - a)
    expect(timestamps).toEqual(sorted)
  })
})
