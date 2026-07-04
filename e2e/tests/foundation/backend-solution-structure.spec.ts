/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Static/File-Structure Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * These tests complement backend-initialization.api.spec.ts by verifying the
 * Clean Architecture solution structure statically (no running server required),
 * which directly asserts the "referenced correctly in SiesaAgents.sln" and
 * "project references" parts of AC2 and AC5 that a runtime HTTP probe cannot
 * prove on its own.
 *
 * Acceptance Criteria covered:
 *   AC2 — The four Clean Architecture projects (API, Application, Domain,
 *          Infrastructure) are referenced correctly in SiesaAgents.sln.
 *   AC5 — dotnet build SiesaAgents.sln succeeds because all project references
 *          form a valid Clean Architecture dependency graph
 *          (API -> Application -> Domain; API -> Infrastructure -> Domain).
 */

import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

const BACKEND_ROOT = path.resolve(__dirname, '../../../backend');
const SLN_PATH = path.join(BACKEND_ROOT, 'SiesaAgents.sln');

const PROJECTS = {
  api: {
    name: 'SiesaAgents.API',
    csproj: path.join(BACKEND_ROOT, 'src/SiesaAgents.API/SiesaAgents.API.csproj'),
  },
  application: {
    name: 'SiesaAgents.Application',
    csproj: path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    ),
  },
  domain: {
    name: 'SiesaAgents.Domain',
    csproj: path.join(BACKEND_ROOT, 'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj'),
  },
  infrastructure: {
    name: 'SiesaAgents.Infrastructure',
    csproj: path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    ),
  },
};

async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2: The four Clean Architecture projects are referenced correctly in
//      SiesaAgents.sln
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — SiesaAgents.sln references all four Clean Architecture projects', () => {
  for (const [key, project] of Object.entries(PROJECTS)) {
    test(`should list ${project.name} as a project entry in SiesaAgents.sln`, async () => {
      // GIVEN: The backend solution has been created with `dotnet new sln -n SiesaAgents`
      // WHEN: SiesaAgents.sln is read from the backend root
      const slnContent = await readFileIfExists(SLN_PATH);

      // THEN: The solution file exists and contains a Project(...) entry for this project
      expect(slnContent).not.toBeNull();
      expect(slnContent ?? '').toContain(`"${project.name}"`);
    });
  }

  test('should list the SiesaAgents.UnitTests project in SiesaAgents.sln', async () => {
    // GIVEN: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests` has run
    // WHEN: SiesaAgents.sln is read from the backend root
    const slnContent = await readFileIfExists(SLN_PATH);

    // THEN: The unit test project is registered in the solution
    expect(slnContent).not.toBeNull();
    expect(slnContent ?? '').toContain('"SiesaAgents.UnitTests"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: dotnet build SiesaAgents.sln succeeds — verified via a valid Clean
//      Architecture project-reference graph (API -> Application -> Domain;
//      API -> Infrastructure -> Domain)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Clean Architecture project references form a valid dependency graph', () => {
  test('should have SiesaAgents.API reference SiesaAgents.Application', async () => {
    // GIVEN: The API project has been created and referenced to Application
    // WHEN: SiesaAgents.API.csproj is read
    const csproj = await readFileIfExists(PROJECTS.api.csproj);

    // THEN: A ProjectReference to SiesaAgents.Application.csproj is present
    expect(csproj).not.toBeNull();
    expect(csproj ?? '').toMatch(/SiesaAgents\.Application\.csproj/);
  });

  test('should have SiesaAgents.API reference SiesaAgents.Infrastructure', async () => {
    // GIVEN: The API project has been created and referenced to Infrastructure
    // WHEN: SiesaAgents.API.csproj is read
    const csproj = await readFileIfExists(PROJECTS.api.csproj);

    // THEN: A ProjectReference to SiesaAgents.Infrastructure.csproj is present
    expect(csproj).not.toBeNull();
    expect(csproj ?? '').toMatch(/SiesaAgents\.Infrastructure\.csproj/);
  });

  test('should have SiesaAgents.Application reference SiesaAgents.Domain', async () => {
    // GIVEN: The Application layer has been created and referenced to Domain
    // WHEN: SiesaAgents.Application.csproj is read
    const csproj = await readFileIfExists(PROJECTS.application.csproj);

    // THEN: A ProjectReference to SiesaAgents.Domain.csproj is present
    expect(csproj).not.toBeNull();
    expect(csproj ?? '').toMatch(/SiesaAgents\.Domain\.csproj/);
  });

  test('should have SiesaAgents.Infrastructure reference SiesaAgents.Domain', async () => {
    // GIVEN: The Infrastructure layer has been created and referenced to Domain
    // WHEN: SiesaAgents.Infrastructure.csproj is read
    const csproj = await readFileIfExists(PROJECTS.infrastructure.csproj);

    // THEN: A ProjectReference to SiesaAgents.Domain.csproj is present
    expect(csproj).not.toBeNull();
    expect(csproj ?? '').toMatch(/SiesaAgents\.Domain\.csproj/);
  });

  test('should NOT have SiesaAgents.Domain reference any other project (dependency inversion)', async () => {
    // GIVEN: Domain is the innermost Clean Architecture layer with zero outward dependencies
    // WHEN: SiesaAgents.Domain.csproj is read
    const csproj = await readFileIfExists(PROJECTS.domain.csproj);

    // THEN: No <ProjectReference> element exists in the Domain project file
    expect(csproj).not.toBeNull();
    expect(csproj ?? '').not.toMatch(/<ProjectReference/);
  });
});
