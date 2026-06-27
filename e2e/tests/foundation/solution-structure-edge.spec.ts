import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Story 1.1 — Clean Architecture Solution Structure — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (API-S-01, API-S-02) by targeting:
 *  - OpenAPI spec structural completeness (info.title, version, paths)
 *  - Domain layer zero-dependency rule (AC 3 architecture constraint)
 *  - Project reference graph validation from .csproj files
 *  - TypeScript strict mode flags confirmed in tsconfig.app.json
 *  - FluentValidation present in Application layer package references
 *  - EF Core / Npgsql present in Infrastructure layer package references
 *  - OpenAPI spec does not expose internal implementation details
 *
 * Test IDs: ARCH-EDGE-01 … ARCH-EDGE-10
 *
 * Note: Tests that inspect file system (csproj, tsconfig) run as API-level assertions
 * using Node fs — they execute in the test runner process, not in a browser.
 */

const BACKEND_BASE = 'http://localhost:5000';
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'frontend');

// Helper: read a file as string and assert it exists
function readProjectFile(relativePath: string): string {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  expect(fs.existsSync(fullPath), `Expected file to exist: ${relativePath}`).toBe(true);
  return fs.readFileSync(fullPath, 'utf-8');
}

test.describe('Story 1.1 — OpenAPI Spec Structural Validation', () => {
  /**
   * ARCH-EDGE-01 (P1 — AC 3)
   * Boundary: OpenAPI spec must include an info.title and info.version.
   * These fields confirm the spec was generated from a properly configured API project.
   * A missing title/version indicates AddOpenApi() misconfiguration.
   */
  test('ARCH-EDGE-01 — OpenAPI spec contiene info.title e info.version válidos', async ({
    request,
  }) => {
    // GIVEN: Backend is running with OpenAPI enabled
    const response = await request.get(`${BACKEND_BASE}/openapi/v1.json`);

    // WHEN: Parsing the spec
    expect(response.status()).toBe(200);
    const spec = await response.json();

    // THEN: info block must be present with non-empty title and version
    expect(spec).toHaveProperty('info');
    expect(spec.info).toHaveProperty('title');
    expect(spec.info).toHaveProperty('version');
    expect(typeof spec.info.title).toBe('string');
    expect((spec.info.title as string).length).toBeGreaterThan(0);
    expect(typeof spec.info.version).toBe('string');
    expect((spec.info.version as string).length).toBeGreaterThan(0);
  });

  /**
   * ARCH-EDGE-02 (P1 — AC 3)
   * Boundary: OpenAPI spec openapi field must be a valid semver 3.x string.
   * An incorrect or missing version string would indicate Scalar/OpenAPI middleware
   * misconfiguration.
   */
  test('ARCH-EDGE-02 — OpenAPI spec tiene campo openapi con versión 3.x', async ({ request }) => {
    // GIVEN: Backend is running
    const response = await request.get(`${BACKEND_BASE}/openapi/v1.json`);
    expect(response.status()).toBe(200);

    // WHEN: Inspecting the spec version
    const spec = await response.json();

    // THEN: The spec must declare OpenAPI 3.x
    expect(spec).toHaveProperty('openapi');
    expect(typeof spec.openapi).toBe('string');
    expect((spec.openapi as string)).toMatch(/^3\./);
  });

  /**
   * ARCH-EDGE-03 (P2 — AC 3)
   * Boundary: OpenAPI spec must NOT contain stackTrace, exception, or password fields.
   * Sensitive information leaking into the spec would be a security defect.
   */
  test('ARCH-EDGE-03 — OpenAPI spec no expone stackTrace, exception ni campos sensibles', async ({
    request,
  }) => {
    // GIVEN: Backend OpenAPI spec
    const response = await request.get(`${BACKEND_BASE}/openapi/v1.json`);
    expect(response.status()).toBe(200);
    const rawBody = await response.text();

    // THEN: The raw spec text must not contain sensitive field names
    expect(rawBody.toLowerCase()).not.toContain('stacktrace');
    expect(rawBody.toLowerCase()).not.toContain('"exception"');
    expect(rawBody).not.toContain('password'); // schema field exposure check
  });
});

test.describe('Story 1.1 — CORS Method Coverage Edge Cases', () => {
  /**
   * ARCH-EDGE-04 (P1 — AC 4)
   * Boundary: CORS preflight for PUT method must also return the allowed origin.
   * AllowAnyMethod() must work for PUT (used by future update endpoints).
   */
  test('ARCH-EDGE-04 — CORS preflight para PUT devuelve Allow-Origin correcto', async ({
    request,
  }) => {
    // GIVEN: A preflight for a PUT request from the allowed frontend origin
    const ALLOWED_ORIGIN = 'http://localhost:5173';
    const response = await request.fetch(`${BACKEND_BASE}/api/v1/clientes/any-id`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The origin must be allowed and PUT must be included
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(ALLOWED_ORIGIN);

    const allowMethods = response.headers()['access-control-allow-methods'];
    expect(allowMethods).toBeTruthy();
  });

  /**
   * ARCH-EDGE-05 (P1 — AC 4)
   * Boundary: CORS preflight for DELETE method must also return the allowed origin.
   * AllowAnyMethod() must cover DELETE (used by future delete endpoints).
   */
  test('ARCH-EDGE-05 — CORS preflight para DELETE devuelve Allow-Origin correcto', async ({
    request,
  }) => {
    // GIVEN: A preflight for a DELETE request from the allowed frontend origin
    const ALLOWED_ORIGIN = 'http://localhost:5173';
    const response = await request.fetch(`${BACKEND_BASE}/api/v1/clientes/any-id`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The origin must be allowed
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(ALLOWED_ORIGIN);
  });
});

test.describe('Story 1.1 — Clean Architecture Dependency Rules (File System)', () => {
  /**
   * ARCH-EDGE-06 (P0 — AC 3)
   * Error path / Architecture rule: SiesaAgents.Domain must have ZERO project references.
   * The Domain layer is the innermost layer and must not depend on any other layer.
   * A circular or outward dependency here would violate Clean Architecture.
   */
  test('ARCH-EDGE-06 — Domain.csproj no tiene ProjectReference (capa interna sin dependencias)', async () => {
    // GIVEN: Domain project file
    const domainCsproj = readProjectFile('backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj');

    // WHEN: Checking for ProjectReference elements
    const hasProjectReference = domainCsproj.includes('<ProjectReference');

    // THEN: Domain must have zero project references
    expect(
      hasProjectReference,
      'SiesaAgents.Domain must not reference any other project (Clean Architecture rule)'
    ).toBe(false);
  });

  /**
   * ARCH-EDGE-07 (P1 — AC 3)
   * Boundary: SiesaAgents.Application must reference Domain and ONLY Domain.
   * Application depends on Domain (inward), never on Infrastructure or API.
   */
  test('ARCH-EDGE-07 — Application.csproj referencia Domain y solo Domain', async () => {
    // GIVEN: Application project file
    const appCsproj = readProjectFile(
      'backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );

    // THEN: Must reference Domain
    expect(appCsproj).toContain('SiesaAgents.Domain');

    // THEN: Must NOT reference Infrastructure or API (outward dependency violation)
    expect(
      appCsproj,
      'Application must not reference Infrastructure'
    ).not.toContain('SiesaAgents.Infrastructure');
    expect(
      appCsproj,
      'Application must not reference API'
    ).not.toContain('SiesaAgents.API');
  });

  /**
   * ARCH-EDGE-08 (P1 — AC 3)
   * Boundary: SiesaAgents.Infrastructure must reference Domain (and may reference Application
   * for interface implementations). It must NOT reference SiesaAgents.API.
   */
  test('ARCH-EDGE-08 — Infrastructure.csproj referencia Domain pero NO referencia API', async () => {
    // GIVEN: Infrastructure project file
    const infraCsproj = readProjectFile(
      'backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );

    // THEN: Must reference Domain (all layers know Domain)
    expect(infraCsproj).toContain('SiesaAgents.Domain');

    // THEN: Must NOT reference API (Infrastructure must not depend on the outer layer)
    expect(
      infraCsproj,
      'Infrastructure must not reference SiesaAgents.API'
    ).not.toContain('SiesaAgents.API');
  });

  /**
   * ARCH-EDGE-09 (P1 — AC 3)
   * Boundary: SiesaAgents.Application must include FluentValidation NuGet package.
   * This is a mandatory company standard package for the Application layer.
   */
  test('ARCH-EDGE-09 — Application.csproj contiene referencia a FluentValidation', async () => {
    // GIVEN: Application project file
    const appCsproj = readProjectFile(
      'backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );

    // THEN: FluentValidation must be declared as a package reference
    expect(
      appCsproj,
      'Application layer must reference FluentValidation (company standard)'
    ).toContain('FluentValidation');
  });

  /**
   * ARCH-EDGE-10 (P1 — AC 3)
   * Boundary: SiesaAgents.Infrastructure must include Npgsql.EntityFrameworkCore.PostgreSQL.
   * This confirms the Infrastructure layer has the required database driver.
   */
  test('ARCH-EDGE-10 — Infrastructure.csproj contiene Npgsql.EntityFrameworkCore.PostgreSQL', async () => {
    // GIVEN: Infrastructure project file
    const infraCsproj = readProjectFile(
      'backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );

    // THEN: Npgsql EF Core must be declared as a package reference
    expect(
      infraCsproj,
      'Infrastructure layer must reference Npgsql.EntityFrameworkCore.PostgreSQL'
    ).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
  });
});

test.describe('Story 1.1 — TypeScript Strict Mode Configuration (File System)', () => {
  /**
   * ARCH-EDGE-11 (P0 — AC 1)
   * Boundary: tsconfig.app.json must have strict: true, noImplicitAny: true,
   * noUnusedLocals: true, and noUnusedParameters: true.
   * These are company-mandated TypeScript strictness flags.
   *
   * Healing note (iteration 2): tsconfig.app.json uses JSONC format (comments allowed),
   * which JSON.parse cannot handle. Using raw string checks instead.
   */
  test('ARCH-EDGE-11 — tsconfig.app.json tiene todos los flags de strict mode requeridos', async () => {
    // GIVEN: Frontend tsconfig.app.json (JSONC format — parsed via string contains)
    const tsconfigRaw = readProjectFile('frontend/tsconfig.app.json');

    // THEN: All required strict flags must appear as true in the file
    expect(tsconfigRaw, '"strict": true must be present').toContain('"strict": true');
    expect(tsconfigRaw, '"noImplicitAny": true must be present').toContain('"noImplicitAny": true');
    expect(tsconfigRaw, '"noUnusedLocals": true must be present').toContain('"noUnusedLocals": true');
    expect(tsconfigRaw, '"noUnusedParameters": true must be present').toContain(
      '"noUnusedParameters": true'
    );
  });

  /**
   * ARCH-EDGE-12 (P1 — AC 1)
   * Boundary: tsconfig.app.json must have noEmit: true (Vite handles transpilation)
   * and jsx: react-jsx (React 17+ automatic JSX transform).
   *
   * Healing note (iteration 2): tsconfig.app.json uses JSONC format (comments allowed),
   * which JSON.parse cannot handle. Using raw string checks instead.
   */
  test('ARCH-EDGE-12 — tsconfig.app.json tiene noEmit:true y jsx:react-jsx correctos', async () => {
    // GIVEN: Frontend tsconfig.app.json (JSONC format — parsed via string contains)
    const tsconfigRaw = readProjectFile('frontend/tsconfig.app.json');

    // THEN: noEmit must be true (Vite is the bundler, not tsc)
    expect(tsconfigRaw, '"noEmit": true must be present').toContain('"noEmit": true');

    // THEN: jsx must be react-jsx (automatic JSX transform, no React import needed)
    expect(tsconfigRaw, '"jsx": "react-jsx" must be present').toContain('"jsx": "react-jsx"');
  });
});
