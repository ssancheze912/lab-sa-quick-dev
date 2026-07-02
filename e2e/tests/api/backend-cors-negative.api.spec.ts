/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * BMad-Integrated Automate Expansion — CORS Negative & Boundary Cases
 * Extends ATDD coverage in `backend-initialization.api.spec.ts` with the
 * negative side of the CORS policy — origins outside the allow-list must
 * NOT be echoed back, and preflights must cover non-GET verbs.
 *
 * Policy under test (from Program.cs):
 *   allowedOrigins ← configuration or ["http://localhost:5173"]
 *   .WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ALLOWED_ORIGIN = 'http://localhost:5173';
const DISALLOWED_ORIGIN = 'http://evil.example.com';

// ─────────────────────────────────────────────────────────────────────────────
// P0 — Disallowed origins must NOT receive the CORS allow header
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS policy — disallowed origin rejection (security boundary)', () => {
  test('[P0] should NOT echo Access-Control-Allow-Origin for an origin outside the allow-list', async ({ request }) => {
    // GIVEN: The CORS policy only whitelists http://localhost:5173
    // WHEN: A cross-origin request arrives from an unlisted origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: DISALLOWED_ORIGIN },
    });

    // THEN: The browser would block the response — the server MUST NOT echo the origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN);
    expect(allowOrigin).not.toBe('*');
  });

  test('[P0] should NOT succeed preflight (OPTIONS) from a disallowed origin', async ({ request }) => {
    // GIVEN: The disallowed origin performs a CORS preflight
    // WHEN: OPTIONS is sent with an unlisted Origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: DISALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: The response MUST NOT carry an Access-Control-Allow-Origin echoing evil.example.com
    // The server may return 204/200/403 depending on middleware order, but MUST NOT allow it.
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Requests without an Origin header should not surface CORS headers
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS policy — same-origin / no-Origin requests', () => {
  test('[P1] should not add Access-Control-Allow-Origin when the request has no Origin header', async ({ request }) => {
    // GIVEN: Non-browser HTTP clients omit the Origin header
    // WHEN: A request is made without an Origin header
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server does not need to (and generally does not) emit CORS headers
    // We assert it does NOT emit the wildcard "*" — which would be a policy leak.
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('*');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Preflight covers all HTTP verbs the SPA will need (AllowAnyMethod)
// ─────────────────────────────────────────────────────────────────────────────

const VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

test.describe('CORS policy — preflight allows any method for the trusted origin', () => {
  for (const verb of VERBS) {
    test(`[P1] should allow preflight for ${verb} from the frontend origin`, async ({ request }) => {
      // GIVEN: The policy calls .AllowAnyMethod() for the allowed origin
      // WHEN: The SPA preflights with a variety of verbs
      const response = await request.fetch(`${API_BASE_URL}/scalar`, {
        method: 'OPTIONS',
        headers: {
          Origin: ALLOWED_ORIGIN,
          'Access-Control-Request-Method': verb,
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      });

      // THEN: The preflight resolves successfully (no CORS rejection)
      expect([200, 204]).toContain(response.status());
      const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
      expect(allowOrigin === ALLOWED_ORIGIN || allowOrigin === '*').toBe(true);
    });
  }

  test('[P1] should advertise the requested headers on the preflight response', async ({ request }) => {
    // GIVEN: The policy calls .AllowAnyHeader()
    // WHEN: The SPA preflights with custom headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,X-Correlation-Id',
      },
    });

    // THEN: The response contains an Access-Control-Allow-Headers header (any value, non-empty)
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    expect(allowHeaders.length).toBeGreaterThan(0);
  });
});
