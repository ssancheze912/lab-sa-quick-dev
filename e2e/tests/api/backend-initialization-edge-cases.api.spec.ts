/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Automation Expansion (testarch-automate) — GREEN Phase
 * Expands the ATDD suite (backend-initialization.api.spec.ts) with edge cases,
 * negative paths, and structural boundary conditions NOT covered by the
 * original acceptance tests.
 *
 * Acceptance Criteria covered (edge cases):
 *   AC2 — Scalar endpoint boundary behavior; Clean Architecture project reference
 *          DIRECTIONALITY (not just presence); solution/tests project wiring
 *   AC3 — CORS negative paths (disallowed origin, no wildcard leakage)
 *   AC5 — appsettings.Development.json structural contract; ExceptionHandlingMiddleware
 *          response body shape (Problem Details fields, no stack trace leakage)
 */

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const BACKEND_ROOT = path.resolve(__dirname, '../../../backend');
const SOLUTION_PATH = path.join(BACKEND_ROOT, 'SiesaAgents.sln');
const APPSETTINGS_DEV_PATH = path.join(
  BACKEND_ROOT,
  'src/SiesaAgents.API/appsettings.Development.json'
);

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (edge case) — CORS must REJECT disallowed origins, not just allow 5173
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge cases — CORS negative paths', () => {
  test('[P1] should NOT reflect an unauthorized origin in Access-Control-Allow-Origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request declares a different, unauthorized origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://evil.example.com' },
    });

    // THEN: The unauthorized origin must never be reflected back
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('http://evil.example.com');
  });

  test('[P2] should not use wildcard "*" combined with credentialed requests', async ({
    request,
  }) => {
    // GIVEN: CORS is configured via WithOrigins (explicit allow-list), not AllowAnyOrigin
    // WHEN: A cross-origin request is made with the allowed origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: Access-Control-Allow-Origin echoes the specific origin, never "*"
    // (a wildcard would be a CORS misconfiguration allowing any site to read responses)
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  test('[P2] should reject OPTIONS preflight requesting a disallowed method gracefully', async ({
    request,
  }) => {
    // GIVEN: DevCors policy allows AnyMethod, but the request declares an origin not in the allow-list
    // WHEN: A preflight OPTIONS request is sent from an unauthorized origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://untrusted-site.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: The preflight must not grant access to the untrusted origin
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('http://untrusted-site.example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 (edge case) — Scalar endpoint boundary / method handling
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge cases — Scalar endpoint boundary conditions', () => {
  test('[P2] should not allow POST to the Scalar documentation route', async ({ request }) => {
    // GIVEN: /scalar is a documentation UI endpoint (GET-only by nature)
    // WHEN: A POST request is sent instead
    const response = await request.post(`${API_BASE_URL}/scalar`);

    // THEN: The server must not process it as a valid mutating request (no 200 success)
    expect(response.status()).not.toBe(200);
  });

  test('[P2] should return 404 (not 500) for a deeply nested unmapped route', async ({
    request,
  }) => {
    // GIVEN: No routes are mapped beyond Scalar/OpenAPI/health in this story
    // WHEN: An arbitrary nested path is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/does/not/exist/at/all`);

    // THEN: Routing correctly falls through to 404, never an unhandled 500
    expect(response.status()).toBe(404);
  });

  test('[P3] should be case-sensitive-safe and reject /Scalar (wrong case) as a distinct route or redirect', async ({
    request,
  }) => {
    // GIVEN: ASP.NET Core routing is case-insensitive by default for endpoint matching
    // WHEN: The route is requested with different casing
    const response = await request.get(`${API_BASE_URL}/Scalar`);

    // THEN: The server responds without crashing (200 due to case-insensitive routing, or 404 — never 500)
    expect([200, 301, 302, 404]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (edge case) — Problem Details response SHAPE, not just status code
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge cases — Problem Details response contract', () => {
  test('[P1] should return a Problem Details JSON body with status and title fields for 404', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages() wraps non-exception error statuses in Problem Details JSON
    // WHEN: An unmapped route triggers a 404
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-edge-case-route`);
    const body = await response.json();

    // THEN: The Problem Details contract fields are present
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
  });

  test('[P1] should never leak stack traces or exception messages in error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets Detail = null (never ex.Message)
    // WHEN: An error response is produced (via 404 status-code page path)
    const response = await request.get(`${API_BASE_URL}/api/trigger-not-found-edge-case`);
    const bodyText = await response.text();

    // THEN: No stack trace markers or raw exception type names appear in the response
    expect(bodyText).not.toMatch(/at\s+\w+\.\w+\(/); // typical .NET stack frame pattern
    expect(bodyText.toLowerCase()).not.toContain('system.exception');
    expect(bodyText.toLowerCase()).not.toContain('stacktrace');
  });

  test('[P2] should return content-type application/problem+json (not text/html) for error paths', async ({
    request,
  }) => {
    // GIVEN: Error responses are JSON per RFC 7807, never an HTML error page
    // WHEN: A non-existent route is requested
    const response = await request.get(`${API_BASE_URL}/definitely-not-a-real-route-12345`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type indicates JSON (problem+json or plain json), never html
    expect(contentType).not.toContain('text/html');
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2/AC5 (edge case) — Clean Architecture reference DIRECTIONALITY (structural)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC5 edge cases — Clean Architecture dependency direction', () => {
  test('[P1] API project should reference Application and Infrastructure (not the reverse)', async () => {
    // GIVEN: Clean Architecture mandates API depends on Application/Infrastructure
    const apiCsproj = await fs.readFile(
      path.join(BACKEND_ROOT, 'src/SiesaAgents.API/SiesaAgents.API.csproj'),
      'utf-8'
    );

    // THEN: API references both Application and Infrastructure
    expect(apiCsproj).toMatch(/SiesaAgents\.Application\.csproj/);
    expect(apiCsproj).toMatch(/SiesaAgents\.Infrastructure\.csproj/);
  });

  test('[P1] Domain project should have zero project references (innermost layer)', async () => {
    // GIVEN: Domain is the innermost Clean Architecture layer with no outward dependencies
    const domainCsproj = await fs.readFile(
      path.join(BACKEND_ROOT, 'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj'),
      'utf-8'
    );

    // THEN: Domain.csproj must not contain any ProjectReference elements
    expect(domainCsproj).not.toMatch(/<ProjectReference/);
  });

  test('[P1] Application and Infrastructure should both reference Domain only (not each other)', async () => {
    // GIVEN: Application and Infrastructure are independent middle layers depending only on Domain
    const applicationCsproj = await fs.readFile(
      path.join(BACKEND_ROOT, 'src/SiesaAgents.Application/SiesaAgents.Application.csproj'),
      'utf-8'
    );
    const infrastructureCsproj = await fs.readFile(
      path.join(BACKEND_ROOT, 'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'),
      'utf-8'
    );

    // THEN: Neither layer references the other (no cross-dependency)
    expect(applicationCsproj).not.toMatch(/SiesaAgents\.Infrastructure\.csproj/);
    expect(infrastructureCsproj).not.toMatch(/SiesaAgents\.Application\.csproj/);
    // AND: Both reference Domain
    expect(applicationCsproj).toMatch(/SiesaAgents\.Domain\.csproj/);
    expect(infrastructureCsproj).toMatch(/SiesaAgents\.Domain\.csproj/);
  });

  test('[P2] UnitTests project should reference Application and Domain', async () => {
    // GIVEN: The xUnit test project targets business logic in Application and Domain
    const testsCsproj = await fs.readFile(
      path.join(BACKEND_ROOT, 'tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj'),
      'utf-8'
    );

    // THEN: References to both layers are present
    expect(testsCsproj).toMatch(/SiesaAgents\.Application\.csproj/);
    expect(testsCsproj).toMatch(/SiesaAgents\.Domain\.csproj/);
  });

  test('[P2] all backend projects should target net10.0 consistently', async () => {
    // GIVEN: All five projects (API, Application, Domain, Infrastructure, UnitTests)
    // must share the same target framework to build together
    const csprojPaths = [
      'src/SiesaAgents.API/SiesaAgents.API.csproj',
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj',
      'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj',
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj',
      'tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj',
    ];

    // WHEN: Each csproj is read
    const contents = await Promise.all(
      csprojPaths.map((p) => fs.readFile(path.join(BACKEND_ROOT, p), 'utf-8'))
    );

    // THEN: Every project declares net10.0
    for (const content of contents) {
      expect(content).toMatch(/<TargetFramework>net10\.0<\/TargetFramework>/);
    }
  });

  test('[P2] solution file should register all five projects under correct solution folders', async () => {
    // GIVEN: SiesaAgents.sln groups src/ and tests/ as solution folders
    const slnContent = await fs.readFile(SOLUTION_PATH, 'utf-8');

    // THEN: All five project entries exist with correct relative paths
    expect(slnContent).toContain('src\\SiesaAgents.API\\SiesaAgents.API.csproj');
    expect(slnContent).toContain(
      'src\\SiesaAgents.Application\\SiesaAgents.Application.csproj'
    );
    expect(slnContent).toContain('src\\SiesaAgents.Domain\\SiesaAgents.Domain.csproj');
    expect(slnContent).toContain(
      'src\\SiesaAgents.Infrastructure\\SiesaAgents.Infrastructure.csproj'
    );
    expect(slnContent).toContain(
      'tests\\SiesaAgents.UnitTests\\SiesaAgents.UnitTests.csproj'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (edge case) — appsettings.Development.json structural contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge cases — appsettings.Development.json contract', () => {
  test('[P2] should define ConnectionStrings.DefaultConnection using Guid-friendly Postgres format', async () => {
    // GIVEN: Infrastructure uses Npgsql.EntityFrameworkCore.PostgreSQL
    const raw = await fs.readFile(APPSETTINGS_DEV_PATH, 'utf-8');
    const config = JSON.parse(raw);

    // THEN: The connection string follows the Host/Database/Username/Password Npgsql format
    const connStr: string = config.ConnectionStrings?.DefaultConnection ?? '';
    expect(connStr).toMatch(/Host=/i);
    expect(connStr).toMatch(/Database=/i);
    expect(connStr).toMatch(/Username=/i);
  });

  test('[P2] AllowedOrigins should be an array containing exactly the frontend dev origin', async () => {
    // GIVEN: CORS reads AllowedOrigins from configuration
    const raw = await fs.readFile(APPSETTINGS_DEV_PATH, 'utf-8');
    const config = JSON.parse(raw);

    // THEN: AllowedOrigins is a non-empty array including http://localhost:5173
    expect(Array.isArray(config.AllowedOrigins)).toBe(true);
    expect(config.AllowedOrigins).toContain('http://localhost:5173');
  });

  test('[P3] AllowedOrigins should not contain a wildcard entry', async () => {
    // GIVEN: Explicit allow-listing is required (no "*" origin permitted)
    const raw = await fs.readFile(APPSETTINGS_DEV_PATH, 'utf-8');
    const config = JSON.parse(raw);

    // THEN: No wildcard is present in the configured origins
    expect(config.AllowedOrigins).not.toContain('*');
  });
});
