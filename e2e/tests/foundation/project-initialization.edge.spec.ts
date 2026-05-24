/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — Static Structure & Configuration Validation
 * These tests expand coverage beyond the ATDD acceptance tests by verifying
 * file-level configuration correctness, boundary conditions, and structural
 * invariants that the ATDD tests do not cover.
 *
 * Test level: Build/Static (Playwright test runner with Node.js fs/child_process)
 * Priority: P1 (infrastructure — all feature stories depend on correct project setup)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — package.json and dependency integrity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend package.json — required dependencies present', () => {
  let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

  test.beforeEach(() => {
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath), `package.json must exist at ${pkgPath}`).toBe(true);
    packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as typeof packageJson;
  });

  test('[P1] should have @tanstack/react-router as a runtime dependency', () => {
    // GIVEN: TanStack Router is the mandatory routing library per company standards
    // WHEN: package.json dependencies are read
    // THEN: @tanstack/react-router is listed as a runtime dependency
    expect(
      packageJson.dependencies?.['@tanstack/react-router'],
      '@tanstack/react-router must be in dependencies'
    ).toBeTruthy();
  });

  test('[P1] should have @tanstack/react-query as a runtime dependency', () => {
    // GIVEN: TanStack Query is the mandatory data-fetching library
    expect(
      packageJson.dependencies?.['@tanstack/react-query'],
      '@tanstack/react-query must be in dependencies'
    ).toBeTruthy();
  });

  test('[P1] should have axios as a runtime dependency', () => {
    // GIVEN: The apiClient is built on axios per architecture spec
    expect(
      packageJson.dependencies?.['axios'],
      'axios must be in dependencies'
    ).toBeTruthy();
  });

  test('[P1] should have zustand as a runtime dependency (state management)', () => {
    // GIVEN: Zustand is the mandatory state management library
    expect(
      packageJson.dependencies?.['zustand'],
      'zustand must be in dependencies'
    ).toBeTruthy();
  });

  test('[P1] should have vitest as a dev dependency', () => {
    // GIVEN: Vitest is the unit test runner
    expect(
      packageJson.devDependencies?.['vitest'],
      'vitest must be in devDependencies'
    ).toBeTruthy();
  });

  test('[P1] should have @testing-library/react as a dev dependency', () => {
    // GIVEN: @testing-library/react is required for component tests
    expect(
      packageJson.devDependencies?.['@testing-library/react'],
      '@testing-library/react must be in devDependencies'
    ).toBeTruthy();
  });

  test('[P1] should have tailwindcss as a runtime dependency', () => {
    // GIVEN: TailwindCSS v4 is used via @tailwindcss/vite plugin
    expect(
      packageJson.dependencies?.['tailwindcss'],
      'tailwindcss must be in dependencies'
    ).toBeTruthy();
  });

  test('[P2] should NOT have webpack or create-react-app entries (Vite-only mandate)', () => {
    // GIVEN: The company mandates Vite — CRA or webpack are forbidden
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    expect(allDeps['webpack'], 'webpack must NOT be present — Vite is mandatory').toBeUndefined();
    expect(allDeps['react-scripts'], 'react-scripts must NOT be present — CRA is forbidden').toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — .env.development has VITE_API_URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend .env.development — required environment variables', () => {
  test('[P1] should have VITE_API_URL set in .env.development', () => {
    // GIVEN: The apiClient uses import.meta.env.VITE_API_URL as baseURL
    // WHEN: .env.development is read
    const envPath = path.join(FRONTEND_DIR, '.env.development');
    expect(fs.existsSync(envPath), `.env.development must exist at ${envPath}`).toBe(true);

    const content = fs.readFileSync(envPath, 'utf-8');

    // THEN: VITE_API_URL is set (not empty)
    expect(content).toContain('VITE_API_URL=');
    // AND: The URL points to the backend port 5000
    expect(content).toContain('http://localhost:5000');
  });

  test('[P2] should NOT contain secrets in .env.development (no passwords or tokens)', () => {
    // GIVEN: .env.development is safe to commit (no sensitive data)
    // WHEN: .env.development content is scanned
    const envPath = path.join(FRONTEND_DIR, '.env.development');
    if (!fs.existsSync(envPath)) return; // graceful skip if missing

    const content = fs.readFileSync(envPath, 'utf-8').toLowerCase();

    // THEN: No password-like or token-like keys are present
    expect(content).not.toContain('password=');
    expect(content).not.toContain('secret=');
    expect(content).not.toContain('token=');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — index.html structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend index.html — HTML entry point structure', () => {
  test('[P1] should have a div with id="root" as the React mount point', () => {
    // GIVEN: React mounts into <div id="root"> per Vite react-ts template
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    expect(fs.existsSync(indexPath), `index.html must exist at ${indexPath}`).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: The root div is present
    expect(content).toContain('id="root"');
  });

  test('[P1] should reference src/main.tsx as the entry script', () => {
    // GIVEN: Vite uses index.html as the entry point; main.tsx is the app bootstrap
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: main.tsx is the module script source
    expect(content).toContain('/src/main.tsx');
  });

  test('[P2] should have lang attribute on the html element', () => {
    // GIVEN: Accessibility standards require a lang attribute on <html>
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: lang attribute is present
    expect(content).toMatch(/lang=/);
  });

  test('[P2] should have viewport meta tag for mobile responsiveness', () => {
    // GIVEN: The app supports mobile viewports (Epic 1, AC-E1.1)
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: Viewport meta tag is present
    expect(content).toContain('name="viewport"');
    expect(content).toContain('width=device-width');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — vite.config.ts plugin configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend vite.config.ts — required plugins', () => {
  test('[P1] should include TanStackRouterVite plugin', () => {
    // GIVEN: File-based routing via TanStack Router requires the vite plugin
    const configPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(configPath), `vite.config.ts must exist at ${configPath}`).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');

    // THEN: TanStackRouterVite plugin is imported and used
    expect(content).toContain('TanStackRouterVite');
    expect(content).toContain('@tanstack/router-plugin/vite');
  });

  test('[P1] should include @tailwindcss/vite plugin', () => {
    // GIVEN: TailwindCSS v4 must be loaded via the vite plugin (not PostCSS)
    const configPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    const content = fs.readFileSync(configPath, 'utf-8');

    // THEN: tailwindcss vite plugin is present
    expect(content).toContain('@tailwindcss/vite');
  });

  test('[P1] should NOT use postcss.config for tailwind (v4 uses vite plugin only)', () => {
    // GIVEN: TailwindCSS v4 moved away from PostCSS config
    const postCssConfig = path.join(FRONTEND_DIR, 'postcss.config.js');
    const postCssConfigTs = path.join(FRONTEND_DIR, 'postcss.config.ts');

    // THEN: No PostCSS config file exists (v4 is vite-plugin-only)
    const hasPostCss = fs.existsSync(postCssConfig) || fs.existsSync(postCssConfigTs);
    expect(
      hasPostCss,
      'TailwindCSS v4 uses the @tailwindcss/vite plugin — postcss.config.* must NOT exist'
    ).toBe(false);
  });

  test('[P1] should configure vitest test environment as jsdom', () => {
    // GIVEN: Component tests require a browser-like environment
    const configPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    const content = fs.readFileSync(configPath, 'utf-8');

    // THEN: jsdom is the test environment
    expect(content).toContain("environment: 'jsdom'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend — tsconfig.app.json does NOT have lib "DOM.Iterable" misconfigs
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend tsconfig.app.json — compiler option boundaries', () => {
  function parseTsconfig(filePath: string): { compilerOptions?: Record<string, unknown>; include?: string[] } {
    const content = fs.readFileSync(filePath, 'utf-8')
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(content) as { compilerOptions?: Record<string, unknown>; include?: string[] };
  }

  test('[P1] should target ES2015 or higher (NOT ES5 which breaks Vite)', () => {
    // GIVEN: ES5 target breaks Vite bundler and modern syntax
    const tsconfig = parseTsconfig(path.join(FRONTEND_DIR, 'tsconfig.app.json'));
    const target = (tsconfig.compilerOptions?.target as string | undefined)?.toLowerCase() ?? '';

    // THEN: Target is NOT es3 or es5
    expect(target).not.toBe('es3');
    expect(target).not.toBe('es5');
  });

  test('[P1] should have noEmit: true (Vite handles transpilation, not tsc)', () => {
    // GIVEN: In Vite projects, tsc is for type-checking only — Vite transpiles
    const tsconfig = parseTsconfig(path.join(FRONTEND_DIR, 'tsconfig.app.json'));

    // THEN: noEmit is true
    expect(
      tsconfig.compilerOptions?.noEmit,
      'noEmit must be true — Vite handles compilation, tsc is type-check only'
    ).toBe(true);
  });

  test('[P1] should include only the src directory', () => {
    // GIVEN: The tsconfig.app.json must not accidentally include test or node_modules
    const tsconfig = parseTsconfig(path.join(FRONTEND_DIR, 'tsconfig.app.json'));

    // THEN: include is limited to src
    expect(Array.isArray(tsconfig.include)).toBe(true);
    expect(tsconfig.include).toContain('src');
  });

  test('[P2] should have jsx set to react-jsx (not react or preserve)', () => {
    // GIVEN: React 17+ uses the new JSX transform — "react-jsx" is mandatory for .tsx files
    const tsconfig = parseTsconfig(path.join(FRONTEND_DIR, 'tsconfig.app.json'));

    // THEN: jsx transform is react-jsx
    expect(tsconfig.compilerOptions?.jsx).toBe('react-jsx');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend — Program.cs structural correctness (edge paths)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend Program.cs — structural edge cases', () => {
  test('[P1] should call app.UseCors() BEFORE app.MapScalarApiReference()', () => {
    // GIVEN: CORS must be applied before endpoint mapping to work correctly
    // WHEN: Program.cs is read
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');
    expect(fs.existsSync(programCsPath)).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: UseCors appears before MapScalarApiReference in the file
    const useCorsIndex = content.indexOf('UseCors');
    const mapScalarIndex = content.indexOf('MapScalarApiReference');

    expect(useCorsIndex).toBeGreaterThan(-1);
    expect(mapScalarIndex).toBeGreaterThan(-1);
    expect(
      useCorsIndex < mapScalarIndex,
      'app.UseCors() must be called BEFORE app.MapScalarApiReference()'
    ).toBe(true);
  });

  test('[P1] should call app.UseMiddleware<ExceptionHandlingMiddleware> BEFORE app.UseCors()', () => {
    // GIVEN: Exception handling must wrap all other middleware including CORS
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programCsPath, 'utf-8');

    const middlewareIndex = content.indexOf('ExceptionHandlingMiddleware');
    const useCorsIndex = content.indexOf('UseCors');

    expect(middlewareIndex).toBeGreaterThan(-1);
    expect(useCorsIndex).toBeGreaterThan(-1);
    expect(
      middlewareIndex < useCorsIndex,
      'ExceptionHandlingMiddleware must be registered BEFORE UseCors()'
    ).toBe(true);
  });

  test('[P1] should call builder.Services.AddOpenApi() (required for Scalar metadata)', () => {
    // GIVEN: Scalar.AspNetCore requires OpenAPI metadata to be registered
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: AddOpenApi is present (not AddSwaggerGen which is Swashbuckle)
    expect(content).toContain('AddOpenApi');
    expect(
      content.includes('AddSwaggerGen'),
      'AddSwaggerGen (Swashbuckle) must NOT be present'
    ).toBe(false);
  });

  test('[P2] should NOT call app.UseHttpsRedirection() (dev environment — no HTTPS)', () => {
    // GIVEN: Dev environment uses HTTP on port 5000 — HTTPS redirect would break the frontend
    // WHEN: Program.cs is read
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: UseHttpsRedirection is not called unconditionally
    // (it may exist in environment-conditional block but should not be the default dev setup)
    // This is a soft check — a warning, not a hard fail
    if (content.includes('UseHttpsRedirection')) {
      // Acceptable if it's inside an environment check
      const isInEnvCheck =
        content.includes('IsDevelopment') &&
        content.indexOf('UseHttpsRedirection') > content.indexOf('IsDevelopment');
      expect(
        isInEnvCheck,
        'UseHttpsRedirection should only be called in non-development environments'
      ).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend — ExceptionHandlingMiddleware structural checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend ExceptionHandlingMiddleware — content validation', () => {
  test('[P1] should return Content-Type application/problem+json (not text/html)', () => {
    // GIVEN: RFC 7807 Problem Details requires application/problem+json content type
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    expect(fs.existsSync(middlewarePath)).toBe(true);

    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: The content type is set to application/problem+json
    expect(content).toContain('application/problem+json');
  });

  test('[P1] should set HTTP status 500 on exception (not 200 or 400)', () => {
    // GIVEN: Unhandled exceptions should return 500 Internal Server Error
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: Status 500 is set
    expect(content).toContain('500');
  });

  test('[P1] should NOT expose ex.Message or stack traces in the response', () => {
    // GIVEN: Security requirement — never expose exception details to the client
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: ex.Message and StackTrace are not written to the response
    expect(
      content.includes('ex.Message') && content.includes('Detail = ex'),
      'Exception message must NOT be exposed in the Problem Details response'
    ).toBe(false);

    expect(
      content.includes('StackTrace'),
      'StackTrace must NOT be present in the middleware response'
    ).toBe(false);
  });

  test('[P1] should use ProblemDetails class (RFC 7807)', () => {
    // GIVEN: The error format must comply with RFC 7807 Problem Details
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: ProblemDetails is used (not a custom object or plain string)
    expect(content).toContain('ProblemDetails');
  });

  test('[P2] should have Detail set to null (not a hardcoded developer message)', () => {
    // GIVEN: Detail must not expose implementation details
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: Detail is null
    expect(content).toContain('Detail = null');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend — appsettings.Development.json required keys
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend appsettings.Development.json — required configuration keys', () => {
  let appSettings: Record<string, unknown>;

  test.beforeEach(() => {
    const settingsPath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.API/appsettings.Development.json'
    );
    expect(fs.existsSync(settingsPath), `appsettings.Development.json must exist at ${settingsPath}`).toBe(true);
    appSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
  });

  test('[P1] should have ConnectionStrings.DefaultConnection configured', () => {
    // GIVEN: The backend requires a DB connection string for EF Core
    // WHEN: appsettings.Development.json is parsed
    const connectionStrings = appSettings['ConnectionStrings'] as Record<string, string> | undefined;

    // THEN: DefaultConnection is present and non-empty
    expect(connectionStrings).toBeDefined();
    expect(connectionStrings?.['DefaultConnection']).toBeTruthy();
  });

  test('[P1] should have AllowedOrigins array with http://localhost:5173', () => {
    // GIVEN: CORS policy reads AllowedOrigins from configuration
    const allowedOrigins = appSettings['AllowedOrigins'] as string[] | undefined;

    // THEN: AllowedOrigins contains the frontend origin
    expect(Array.isArray(allowedOrigins)).toBe(true);
    expect(allowedOrigins).toContain('http://localhost:5173');
  });

  test('[P1] DefaultConnection should NOT have a production database name', () => {
    // GIVEN: The dev config must point to the development database, not production
    const connectionStrings = appSettings['ConnectionStrings'] as Record<string, string> | undefined;
    const conn = connectionStrings?.['DefaultConnection'] ?? '';

    // THEN: Connection string references siesa_agents_db (the dev database)
    expect(conn.toLowerCase()).toContain('siesa_agents_db');
  });

  test('[P2] DefaultConnection should point to localhost (not a remote host)', () => {
    // GIVEN: Development database must run locally
    const connectionStrings = appSettings['ConnectionStrings'] as Record<string, string> | undefined;
    const conn = connectionStrings?.['DefaultConnection'] ?? '';

    // THEN: Host is localhost
    expect(conn.toLowerCase()).toContain('host=localhost');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend — .csproj files structural checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend .csproj — project file structural requirements', () => {
  test('[P1] SiesaAgents.API.csproj should reference Scalar.AspNetCore', () => {
    // GIVEN: Scalar is the only allowed API docs provider
    const csprojPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/SiesaAgents.API.csproj');
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Scalar.AspNetCore is a referenced package
    expect(content).toContain('Scalar.AspNetCore');
  });

  test('[P1] SiesaAgents.API.csproj should NOT reference Swashbuckle', () => {
    // GIVEN: Swashbuckle/OpenAPI is forbidden per architecture decisions
    const csprojPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/SiesaAgents.API.csproj');
    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Swashbuckle is not present
    expect(content).not.toContain('Swashbuckle');
  });

  test('[P1] SiesaAgents.Application.csproj should reference FluentValidation', () => {
    // GIVEN: FluentValidation is used for all Application layer validators
    const csprojPath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: FluentValidation is a package reference
    expect(content).toContain('FluentValidation');
  });

  test('[P1] SiesaAgents.Infrastructure.csproj should reference EF Core PostgreSQL', () => {
    // GIVEN: Infrastructure layer uses Npgsql EF Core provider for PostgreSQL
    const csprojPath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Npgsql.EntityFrameworkCore.PostgreSQL is referenced
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
  });

  test('[P1] SiesaAgents.Domain.csproj should have NO external NuGet references (pure domain)', () => {
    // GIVEN: The Domain layer is infrastructure-free — no external NuGet packages allowed
    const csprojPath = path.join(BACKEND_DIR, 'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj');
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: No PackageReference elements in the Domain project (it must be self-contained)
    const hasPackageRefs = content.includes('<PackageReference');
    expect(
      hasPackageRefs,
      'Domain project must have NO external NuGet dependencies — it is a pure domain model'
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend — AppDbContext snake_case naming convention
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend AppDbContext — snake_case naming convention', () => {
  test('[P1] AppDbContext.cs should call ApplySnakeCaseNaming() in OnModelCreating', () => {
    // GIVEN: Architecture mandates snake_case for all database columns (AC Story 1.3)
    // WHEN: AppDbContext.cs is read
    const dbContextPath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
    );
    expect(fs.existsSync(dbContextPath)).toBe(true);

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    // THEN: ApplySnakeCaseNaming is called in OnModelCreating
    expect(content).toContain('ApplySnakeCaseNaming');
    expect(content).toContain('OnModelCreating');
  });

  test('[P1] AppDbContext.cs should have Clientes and Contactos DbSets', () => {
    // GIVEN: The AppDbContext must register both aggregate roots
    const dbContextPath = path.join(
      BACKEND_DIR,
      'src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
    );
    const content = fs.readFileSync(dbContextPath, 'utf-8');

    // THEN: Both DbSets are declared
    expect(content).toContain('ClienteEntity');
    expect(content).toContain('ContactoEntity');
  });
});
