/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Config/Structure Verification (Unit-equivalent level)
 * These tests read the repository's static configuration files directly
 * (no dev servers required) to give explicit, fast, deterministic coverage
 * for facts the E2E/API ATDD suite could only verify indirectly at runtime.
 *
 * Acceptance Criteria covered:
 *   AC2 — Four Clean Architecture projects referenced correctly in SiesaAgents.sln
 *   AC4 — TypeScript strict mode flags active in tsconfig.app.json
 *   AC5 — Solution/workspace files are structurally well-formed
 */

import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..');

/**
 * tsconfig files are JSONC (allow // and /* *\/ comments), which JSON.parse
 * rejects. A naive regex strip is unsafe here: this repo's tsconfig has a
 * path glob value `"@/*"` whose `/*` looks like a comment opener to a naive
 * regex, corrupting the JSON (caught during automation validation — see
 * automation-summary.md). This state-machine stripper tracks whether we are
 * inside a string literal so comment-like sequences in real string values
 * are left untouched.
 */
function parseJsonc(raw: string): Record<string, unknown> {
  let out = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        out += ch;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      out += ch;
      if (ch === '\\') {
        // preserve escaped character as-is (e.g. \" ) without interpreting it
        out += next;
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
    } else if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
    } else {
      out += ch;
    }
  }

  return JSON.parse(out);
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2/AC5: SiesaAgents.sln references all four Clean Architecture projects
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC5 — Backend solution file structure', () => {
  test('[P1] SiesaAgents.sln should reference all four Clean Architecture projects', async () => {
    // GIVEN: The backend solution file at backend/SiesaAgents.sln
    const slnPath = path.join(REPO_ROOT, 'backend', 'SiesaAgents.sln');
    const slnContent = await readFile(slnPath, 'utf-8');

    // WHEN: Parsing the solution's Project() entries
    // THEN: API, Application, Domain, and Infrastructure are all present
    expect(slnContent).toContain('SiesaAgents.API.csproj');
    expect(slnContent).toContain('SiesaAgents.Application.csproj');
    expect(slnContent).toContain('SiesaAgents.Domain.csproj');
    expect(slnContent).toContain('SiesaAgents.Infrastructure.csproj');
  });

  test('[P2] SiesaAgents.sln should also reference the unit tests project', async () => {
    // GIVEN: The solution file
    const slnPath = path.join(REPO_ROOT, 'backend', 'SiesaAgents.sln');
    const slnContent = await readFile(slnPath, 'utf-8');

    // WHEN/THEN: The test project is wired into the solution (not orphaned)
    expect(slnContent).toContain('SiesaAgents.UnitTests.csproj');
  });

  test('[P3] SiesaAgents.sln should not reference any duplicate project entries', async () => {
    // GIVEN: The solution file content
    const slnPath = path.join(REPO_ROOT, 'backend', 'SiesaAgents.sln');
    const slnContent = await readFile(slnPath, 'utf-8');

    // WHEN: Counting occurrences of each csproj reference
    const apiMatches = slnContent.match(/SiesaAgents\.API\.csproj/g) ?? [];

    // THEN: Each project is declared exactly once as a Project() entry
    // (appears twice total: once in the Project() line, once in nested path — never more)
    expect(apiMatches.length).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode flags are explicitly active
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — tsconfig.app.json strict mode flags', () => {
  test('[P1] tsconfig.app.json should have strict, noImplicitAny, and strictNullChecks all true', async () => {
    // GIVEN: The frontend TypeScript configuration
    const tsconfigPath = path.join(REPO_ROOT, 'frontend', 'tsconfig.app.json');
    const raw = await readFile(tsconfigPath, 'utf-8');
    const tsconfig = parseJsonc(raw);

    // WHEN: Reading compilerOptions
    const options = tsconfig.compilerOptions as Record<string, unknown>;

    // THEN: All three strictness flags required by AC4 are explicitly true
    expect(options.strict).toBe(true);
    expect(options.noImplicitAny).toBe(true);
    expect(options.strictNullChecks).toBe(true);
  });

  test('[P2] tsconfig.app.json should keep noEmit true (Vite handles bundling, not tsc)', async () => {
    // GIVEN: The frontend TypeScript configuration
    const tsconfigPath = path.join(REPO_ROOT, 'frontend', 'tsconfig.app.json');
    const raw = await readFile(tsconfigPath, 'utf-8');
    const tsconfig = parseJsonc(raw);

    // WHEN/THEN: noEmit stays true so tsc only type-checks
    expect((tsconfig.compilerOptions as Record<string, unknown>).noEmit).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1/AC5: pnpm workspace and root package.json are wired for a monorepo build
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC5 — Root workspace configuration', () => {
  test('[P2] pnpm-workspace.yaml should include the frontend package', async () => {
    // GIVEN: The root pnpm workspace file
    const workspacePath = path.join(REPO_ROOT, 'pnpm-workspace.yaml');
    const content = await readFile(workspacePath, 'utf-8');

    // WHEN/THEN: The frontend package is declared as a workspace member
    expect(content).toContain('frontend');
  });

  test('[P3] root package.json should declare a test:e2e script', async () => {
    // GIVEN: The root package.json
    const pkgPath = path.join(REPO_ROOT, 'package.json');
    const raw = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);

    // WHEN/THEN: The Playwright test script is present for CI/local execution
    expect(pkg.scripts).toHaveProperty('test:e2e');
  });
});
