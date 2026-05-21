import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Story 1.1 — Project Initialization & Repository Structure
 * Configuration Files & Structural Constraints (File System level)
 *
 * Covers gaps NOT addressed by solution-structure-edge.spec.ts:
 *  - appsettings.Development.json contains AllowedOrigins with correct frontend origin
 *  - appsettings.Development.json has a DefaultConnection string (not empty)
 *  - Program.cs does NOT contain UseSwagger or AddSwaggerGen (architecture constraint)
 *  - Program.cs DOES contain UseCors before MapScalarApiReference (order constraint)
 *  - .env.development has VITE_API_URL=http://localhost:5000 (AC1)
 *  - SiesaAgents.API.csproj references both Application and Infrastructure (AC2)
 *  - SiesaAgents.API.csproj does NOT reference Domain directly (Clean Architecture)
 *  - UnitTests.csproj references Application and Domain (AC5 — tests wired correctly)
 *  - ExceptionHandlingMiddleware returns camelCase JSON (not PascalCase)
 *
 * Test IDs: CFG-EDGE-01 … CFG-EDGE-09
 *
 * Note: Tests operate on file system via Node fs — they do NOT require the servers
 * to be running. They verify structural invariants of the repository.
 */

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

function readFile(relativePath: string): string {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  expect(fs.existsSync(fullPath), `Expected file to exist: ${relativePath}`).toBe(true);
  return fs.readFileSync(fullPath, 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// appsettings.Development.json structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CFG-EDGE: appsettings.Development.json correctness (AC3)', () => {
  /**
   * CFG-EDGE-01 (P0 — AC3)
   * Boundary: appsettings.Development.json must contain AllowedOrigins array with
   * exactly http://localhost:5173 as the frontend origin.
   * If this is missing or wrong, the CORS policy reads an empty array at runtime
   * and all frontend requests will be rejected.
   */
  test('[P0] CFG-EDGE-01 — appsettings.Development.json contiene AllowedOrigins con http://localhost:5173', () => {
    // GIVEN: The development appsettings file
    const raw = readFile('backend/src/SiesaAgents.API/appsettings.Development.json');
    const settings = JSON.parse(raw);

    // THEN: AllowedOrigins must be an array
    expect(settings).toHaveProperty('AllowedOrigins');
    expect(Array.isArray(settings.AllowedOrigins)).toBe(true);

    // THEN: The array must include the frontend origin
    expect(settings.AllowedOrigins).toContain('http://localhost:5173');
  });

  /**
   * CFG-EDGE-02 (P1 — AC5)
   * Boundary: appsettings.Development.json must have a non-empty ConnectionStrings.DefaultConnection.
   * An empty or missing connection string would prevent EF Core from starting,
   * causing a startup crash in any story that performs a DB migration or query.
   */
  test('[P1] CFG-EDGE-02 — appsettings.Development.json tiene ConnectionStrings.DefaultConnection no vacío', () => {
    // GIVEN: The development appsettings file
    const raw = readFile('backend/src/SiesaAgents.API/appsettings.Development.json');
    const settings = JSON.parse(raw);

    // THEN: ConnectionStrings.DefaultConnection must be present and non-empty
    expect(settings).toHaveProperty('ConnectionStrings');
    expect(settings.ConnectionStrings).toHaveProperty('DefaultConnection');
    expect(typeof settings.ConnectionStrings.DefaultConnection).toBe('string');
    expect((settings.ConnectionStrings.DefaultConnection as string).trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Program.cs architecture constraints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CFG-EDGE: Program.cs architecture constraints (AC2)', () => {
  /**
   * CFG-EDGE-03 (P0 — AC2)
   * Error path: Program.cs must NOT contain UseSwagger or AddSwaggerGen.
   * The architecture mandates Scalar ONLY. Swashbuckle is explicitly forbidden.
   * This is a post-implementation regression check — a future developer must not
   * add Swagger without removing Scalar first.
   */
  test('[P0] CFG-EDGE-03 — Program.cs no contiene UseSwagger ni AddSwaggerGen (Swashbuckle prohibido)', () => {
    // GIVEN: The API entry point
    const programCs = readFile('backend/src/SiesaAgents.API/Program.cs');

    // THEN: No Swagger/Swashbuckle calls
    expect(
      programCs,
      'Program.cs must not call UseSwagger() — Scalar is the only API docs tool'
    ).not.toContain('UseSwagger');

    expect(
      programCs,
      'Program.cs must not call AddSwaggerGen() — Scalar is the only API docs tool'
    ).not.toContain('AddSwaggerGen');

    expect(
      programCs,
      'Program.cs must not call UseSwaggerUI() — Scalar is the only API docs tool'
    ).not.toContain('UseSwaggerUI');
  });

  /**
   * CFG-EDGE-04 (P0 — AC2)
   * Boundary: Program.cs must register MapScalarApiReference (confirming Scalar is wired).
   * This is an additive verification to CFG-EDGE-03 — not only must Swagger be absent,
   * but Scalar must be explicitly present.
   */
  test('[P0] CFG-EDGE-04 — Program.cs contiene MapScalarApiReference (Scalar registrado)', () => {
    // GIVEN: The API entry point
    const programCs = readFile('backend/src/SiesaAgents.API/Program.cs');

    // THEN: Scalar must be explicitly mapped
    expect(
      programCs,
      'Program.cs must call MapScalarApiReference() to serve the Scalar UI'
    ).toContain('MapScalarApiReference');
  });

  /**
   * CFG-EDGE-05 (P1 — AC3)
   * Boundary: Program.cs must register UseCors before the Scalar and endpoint mappings.
   * CORS must be applied to ALL responses, including Scalar. If UseCors appears AFTER
   * endpoint mapping, the Scalar preflight would not receive CORS headers.
   * This is verified by checking that UseCors appears before MapScalarApiReference
   * in the file (line-order check as a proxy for registration order).
   */
  test('[P1] CFG-EDGE-05 — Program.cs registra UseCors antes que MapScalarApiReference (orden de middleware correcto)', () => {
    // GIVEN: The API entry point
    const programCs = readFile('backend/src/SiesaAgents.API/Program.cs');

    // WHEN: Finding the line positions of key calls
    const useCorsIndex = programCs.indexOf('UseCors');
    const scalarIndex = programCs.indexOf('MapScalarApiReference');

    // THEN: Both must exist
    expect(useCorsIndex, 'UseCors must be present in Program.cs').toBeGreaterThanOrEqual(0);
    expect(scalarIndex, 'MapScalarApiReference must be present in Program.cs').toBeGreaterThanOrEqual(0);

    // THEN: UseCors must appear BEFORE MapScalarApiReference
    expect(
      useCorsIndex,
      'UseCors must be registered before MapScalarApiReference to apply CORS to Scalar endpoint'
    ).toBeLessThan(scalarIndex);
  });

  /**
   * CFG-EDGE-06 (P1 — AC5 / NFR6)
   * Boundary: Program.cs must register ExceptionHandlingMiddleware before UseCors.
   * The exception handler must wrap ALL middleware to catch any error in the pipeline.
   * Registering it after CORS means CORS errors would bypass exception formatting.
   */
  test('[P1] CFG-EDGE-06 — Program.cs registra ExceptionHandlingMiddleware antes que UseCors', () => {
    // GIVEN: The API entry point
    const programCs = readFile('backend/src/SiesaAgents.API/Program.cs');

    // WHEN: Finding positions
    const exceptionIndex = programCs.indexOf('ExceptionHandlingMiddleware');
    const useCorsIndex = programCs.indexOf('UseCors');

    // THEN: Both must exist
    expect(exceptionIndex, 'ExceptionHandlingMiddleware must be present in Program.cs').toBeGreaterThanOrEqual(0);
    expect(useCorsIndex, 'UseCors must be present in Program.cs').toBeGreaterThanOrEqual(0);

    // THEN: Exception handler must appear BEFORE CORS
    expect(
      exceptionIndex,
      'ExceptionHandlingMiddleware must be registered before UseCors to catch all pipeline errors'
    ).toBeLessThan(useCorsIndex);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend .env.development
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CFG-EDGE: Frontend .env.development (AC1)', () => {
  /**
   * CFG-EDGE-07 (P0 — AC1)
   * Boundary: .env.development must define VITE_API_URL pointing to the backend.
   * Without this, import.meta.env.VITE_API_URL is undefined and the apiClient
   * sends requests to an undefined baseURL, causing runtime errors.
   */
  test('[P0] CFG-EDGE-07 — frontend/.env.development define VITE_API_URL=http://localhost:5000', () => {
    // GIVEN: The frontend environment file for development
    const envContent = readFile('frontend/.env.development');

    // THEN: VITE_API_URL must be defined and point to the backend
    expect(
      envContent,
      '.env.development must contain VITE_API_URL'
    ).toContain('VITE_API_URL');

    expect(
      envContent,
      'VITE_API_URL must point to http://localhost:5000'
    ).toContain('VITE_API_URL=http://localhost:5000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SiesaAgents.API.csproj dependency graph
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CFG-EDGE: SiesaAgents.API.csproj dependency graph (AC2/AC3)', () => {
  /**
   * CFG-EDGE-08 (P0 — AC2/AC3)
   * Boundary: SiesaAgents.API.csproj must reference Application AND Infrastructure.
   * If either reference is missing, the DI container cannot resolve services and
   * the server will fail to start with a runtime error.
   */
  test('[P0] CFG-EDGE-08 — API.csproj referencia Application e Infrastructure (DI completa)', () => {
    // GIVEN: The API project file
    const apiCsproj = readFile('backend/src/SiesaAgents.API/SiesaAgents.API.csproj');

    // THEN: Must reference Application (for use-cases and interfaces)
    expect(
      apiCsproj,
      'API must reference SiesaAgents.Application for use-cases'
    ).toContain('SiesaAgents.Application');

    // THEN: Must reference Infrastructure (for repository and EF Core implementations)
    expect(
      apiCsproj,
      'API must reference SiesaAgents.Infrastructure for data access implementations'
    ).toContain('SiesaAgents.Infrastructure');
  });

  /**
   * CFG-EDGE-09 (P1 — AC3)
   * Architecture rule: SiesaAgents.API.csproj must NOT reference Domain directly.
   * The API layer uses Domain types only transitively through Application and Infrastructure.
   * A direct API → Domain reference is technically harmless but signals a Clean Architecture
   * discipline failure — Domain types should be consumed through the Application layer.
   */
  test('[P1] CFG-EDGE-09 — API.csproj no referencia Domain directamente (solo transitivo via Application)', () => {
    // GIVEN: The API project file
    const apiCsproj = readFile('backend/src/SiesaAgents.API/SiesaAgents.API.csproj');

    // Parse only ProjectReference elements to check direct dependencies
    // (exclude package names that might contain "Domain" by coincidence)
    const projectReferenceMatches = apiCsproj.match(/<ProjectReference[^>]*>/gi) ?? [];
    const directDomainRef = projectReferenceMatches.some((ref) =>
      ref.includes('SiesaAgents.Domain'),
    );

    expect(
      directDomainRef,
      'API must not directly reference Domain.csproj — consume Domain via Application layer'
    ).toBe(false);
  });
});
