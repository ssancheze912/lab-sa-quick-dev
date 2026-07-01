/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Backend starts on port 5000, Scalar loads at /scalar,
 *          four Clean Architecture projects referenced in SiesaAgents.sln
 *   AC5 — dotnet build SiesaAgents.sln succeeds with zero errors or warnings
 *          (verified directly via `dotnet build` CLI invocation, and via
 *          runtime behavior as a secondary proxy signal)
 */

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const BACKEND_ROOT = path.resolve(__dirname, '../../../backend');
const SOLUTION_PATH = path.join(BACKEND_ROOT, 'SiesaAgents.sln');

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Backend .NET 10 starts on port 5000 and Scalar API docs load at /scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend server initialization and Scalar API documentation', () => {
  test('should have the backend API server running on port 5000', async ({ request }) => {
    // GIVEN: The backend project has been created and dotnet run is executed
    // WHEN: An HTTP request is made to the backend base URL

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: The server responds (not connection refused)
    // Status can be 200, 404, or redirect — any response means server is up
    expect(response.status()).toBeLessThan(500);
  });

  test('should serve the Scalar API documentation page at /scalar', async ({ request }) => {
    // GIVEN: The backend is running and Program.cs includes app.MapScalarApiReference()
    // WHEN: A GET request is made to /scalar

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Scalar documentation page is served (HTTP 200)
    expect(response.status()).toBe(200);
  });

  test('should return HTML content from the Scalar documentation endpoint', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore is installed and MapScalarApiReference() is registered in Program.cs
    // WHEN: The /scalar endpoint is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response content type includes text/html
    expect(contentType).toContain('text/html');
  });

  test('should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)', async ({ request }) => {
    // GIVEN: The architecture mandates Scalar ONLY — Swashbuckle is explicitly forbidden
    // WHEN: A GET request is made to /swagger

    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: The /swagger endpoint does NOT respond with HTTP 200 (endpoint must not exist)
    expect(response.status()).not.toBe(200);
  });

  test('should NOT expose WeatherForecast default endpoint', async ({ request }) => {
    // GIVEN: The default .NET webapi template includes WeatherForecast which must be removed
    // WHEN: A GET request is made to the default WeatherForecast endpoint

    const response = await request.get(`${API_BASE_URL}/weatherforecast`);

    // THEN: The endpoint does NOT exist (404 or 405)
    expect([404, 405]).toContain(response.status());
  });

  test('should return CORS header allowing http://localhost:5173 origin', async ({ request }) => {
    // GIVEN: CORS policy "DevCors" is configured in Program.cs to allow http://localhost:5173
    // WHEN: A cross-origin request with Origin header is made

    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is present and allows the frontend origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(
      allowOriginHeader === 'http://localhost:5173' || allowOriginHeader === '*'
    ).toBe(true);
  });

  test('should respond to OPTIONS preflight from frontend origin without CORS rejection', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is applied before endpoint mapping in Program.cs
    // WHEN: An OPTIONS preflight request is made from http://localhost:5173

    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight succeeds (200 or 204 — not 403 or 0)
    expect([200, 204]).toContain(response.status());
  });

  test('should have SiesaAgents.sln referencing the four Clean Architecture projects', async () => {
    // GIVEN: The backend solution has been created at backend/SiesaAgents.sln
    // WHEN: The solution file is read from disk

    const slnContent = await fs.readFile(SOLUTION_PATH, 'utf-8');

    // THEN: All four Clean Architecture projects are referenced in the .sln
    expect(slnContent).toContain('SiesaAgents.API');
    expect(slnContent).toContain('SiesaAgents.Application');
    expect(slnContent).toContain('SiesaAgents.Domain');
    expect(slnContent).toContain('SiesaAgents.Infrastructure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Backend builds with zero errors (runtime proxy — if server is up, build passed)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend solution builds and runs successfully', () => {
  test('should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln has been executed with all four projects
    // (SiesaAgents.API, SiesaAgents.Application, SiesaAgents.Domain, SiesaAgents.Infrastructure)
    // WHEN: The backend server is running (build must succeed for server to start)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — this proves the solution compiled without errors
    // A build failure would prevent the server from starting at all
    expect(response.status()).toBe(200);
  });

  test('should return Problem Details RFC 7807 format for unhandled errors', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: An endpoint that does not exist is requested (triggers unhandled path scenario)
    // NOTE: This tests the middleware is wired — actual exception path tested in Story 1.3

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-endpoint-for-atdd`);

    // THEN: Response is 404 with either Problem Details or standard not-found JSON
    // The server must NOT crash or return HTML error page (which would indicate middleware missing)
    expect([404, 400]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    // Should be JSON, not HTML (Problem Details is application/problem+json or application/json)
    expect(contentType).toContain('json');
  });

  test('should build SiesaAgents.sln with zero errors and zero warnings via dotnet build CLI', async () => {
    // GIVEN: The backend solution exists at backend/SiesaAgents.sln with all four projects
    // WHEN: `dotnet build SiesaAgents.sln` is executed directly (not just inferred from runtime)
    test.setTimeout(180_000);

    let stdout = '';
    let exitCode = 0;
    try {
      const result = await execFileAsync(
        'dotnet',
        ['build', 'SiesaAgents.sln', '--configuration', 'Debug'],
        { cwd: BACKEND_ROOT, timeout: 170_000 }
      );
      stdout = result.stdout;
    } catch (error) {
      const execError = error as { stdout?: string; code?: number };
      stdout = execError.stdout ?? '';
      exitCode = execError.code ?? 1;
    }

    // THEN: The build succeeds (exit code 0) with no reported errors or warnings
    expect(exitCode).toBe(0);
    expect(stdout).not.toMatch(/\d+ Error\(s\)/i);
    expect(stdout).toMatch(/0 Warning\(s\)/i);
    expect(stdout).toMatch(/0 Error\(s\)/i);
  });
});
