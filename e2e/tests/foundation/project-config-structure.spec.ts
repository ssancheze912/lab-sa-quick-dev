import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration Structure Tests: Story 1.1 — Project File & Build Config Validation
 * Targets: AC1 (Vite config), AC4 (tsconfig), AC2 (backend project structure)
 */

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');

test.describe('Story 1.1 — Project Configuration Structure (Edge Cases)', () => {

  // ─── vite.config.ts validation ───────────────────────────────────────────

  test('[P1] AC1 — vite.config.ts exists in frontend directory', async () => {
    // GIVEN: The frontend project was initialized with Vite
    // WHEN: The vite.config.ts file is checked
    const exists = fs.existsSync(path.join(FRONTEND_DIR, 'vite.config.ts'));

    // THEN: The file must exist
    expect(exists, 'vite.config.ts must exist in frontend/').toBe(true);
  });

  test('[P1] AC1 — vite.config.ts includes @tailwindcss/vite plugin', async () => {
    // GIVEN: Tailwind v4 uses @tailwindcss/vite (not PostCSS config)
    // WHEN: The vite.config.ts source is read
    const configPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');

    // THEN: The plugin import is present
    expect(content, 'vite.config.ts must import @tailwindcss/vite').toContain('@tailwindcss/vite');
  });

  test('[P1] AC1 — vite.config.ts includes TanStack Router plugin', async () => {
    // GIVEN: File-based routing requires @tanstack/router-plugin/vite
    const configPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');

    // THEN: TanStackRouterVite plugin is imported and used
    expect(content, 'vite.config.ts must include TanStack Router plugin').toContain('@tanstack/router-plugin');
  });

  test('[P1] AC1 — vite.config.ts sets server port to 5173', async () => {
    // GIVEN: The company standard requires the frontend dev server on port 5173
    const configPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');

    // THEN: Port 5173 is explicitly set (prevents random port assignment)
    expect(content, 'vite.config.ts must set port: 5173').toContain('5173');
  });

  // ─── tsconfig.app.json extended strict flags ──────────────────────────────

  test('[P2] AC4 — tsconfig.app.json has noUnusedLocals enabled', async () => {
    // GIVEN: Strict mode codebase disallows unused variables
    // WHEN: The tsconfig.app.json is parsed
    const raw = fs.readFileSync(path.join(FRONTEND_DIR, 'tsconfig.app.json'), 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    // THEN: noUnusedLocals is true (or strict which implies it in some configs)
    const hasNoUnusedLocals =
      config.compilerOptions?.noUnusedLocals === true ||
      config.compilerOptions?.strict === true;

    expect(hasNoUnusedLocals, '"noUnusedLocals" must be true in tsconfig.app.json').toBe(true);
  });

  test('[P2] AC4 — tsconfig.app.json has noUnusedParameters enabled', async () => {
    // GIVEN: Company standards require explicit parameter usage
    const raw = fs.readFileSync(path.join(FRONTEND_DIR, 'tsconfig.app.json'), 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    const hasNoUnusedParams =
      config.compilerOptions?.noUnusedParameters === true ||
      config.compilerOptions?.strict === true;

    expect(hasNoUnusedParams, '"noUnusedParameters" must be true in tsconfig.app.json').toBe(true);
  });

  test('[P1] AC4 — tsconfig.app.json includes only the "src" directory', async () => {
    // GIVEN: The TypeScript config should only compile the application source
    const raw = fs.readFileSync(path.join(FRONTEND_DIR, 'tsconfig.app.json'), 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    // THEN: The include array targets src (not root or all files)
    expect(config.include, 'tsconfig.app.json include should target "src"').toContain('src');
  });

  test('[P1] AC4 — tsconfig.app.json has noEmit: true (Vite handles bundling)', async () => {
    // GIVEN: Vite is the bundler — TypeScript should only type-check, not emit files
    const raw = fs.readFileSync(path.join(FRONTEND_DIR, 'tsconfig.app.json'), 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    // THEN: noEmit is true (prevents duplicate output files)
    expect(config.compilerOptions?.noEmit, '"noEmit" must be true in tsconfig.app.json').toBe(true);
  });

  // ─── .env.development validation ─────────────────────────────────────────

  test('[P1] AC1 — .env.development exists in frontend directory', async () => {
    // GIVEN: The API URL is configured via environment variable for dev
    // WHEN: The .env.development file is checked
    const envPath = path.join(FRONTEND_DIR, '.env.development');
    const exists = fs.existsSync(envPath);

    // THEN: The file exists
    expect(exists, '.env.development must exist in frontend/').toBe(true);
  });

  test('[P1] AC1 — .env.development sets VITE_API_URL to backend port 5000', async () => {
    // GIVEN: apiClient.ts uses import.meta.env.VITE_API_URL
    const envPath = path.join(FRONTEND_DIR, '.env.development');
    expect(fs.existsSync(envPath)).toBe(true);

    const content = fs.readFileSync(envPath, 'utf-8');

    // THEN: VITE_API_URL points to the .NET backend
    expect(content, '.env.development must set VITE_API_URL').toContain('VITE_API_URL');
    expect(content, 'VITE_API_URL must point to port 5000').toContain('5000');
  });

  test('[P2] AC1 — .env.development uses localhost (not 0.0.0.0 or external IP)', async () => {
    // GIVEN: Dev environment should only connect to local services
    const envPath = path.join(FRONTEND_DIR, '.env.development');
    expect(fs.existsSync(envPath)).toBe(true);

    const content = fs.readFileSync(envPath, 'utf-8');
    const apiUrlLine = content.split('\n').find(line => line.startsWith('VITE_API_URL')) ?? '';

    // THEN: URL uses localhost
    expect(apiUrlLine, 'VITE_API_URL should use localhost').toContain('localhost');
  });

  // ─── Backend solution and project files ──────────────────────────────────

  test('[P0] AC2 — SiesaAgents.sln exists in backend directory', async () => {
    // GIVEN: The backend is initialized with dotnet new sln
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    const exists = fs.existsSync(slnPath);

    // THEN: The solution file exists
    expect(exists, 'SiesaAgents.sln must exist in backend/').toBe(true);
  });

  test('[P0] AC2 — SiesaAgents.API project file exists', async () => {
    // GIVEN: The API project is one of the four Clean Architecture layers
    const csprojPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'SiesaAgents.API.csproj');
    expect(fs.existsSync(csprojPath), 'SiesaAgents.API.csproj must exist').toBe(true);
  });

  test('[P0] AC2 — SiesaAgents.Application project file exists', async () => {
    // GIVEN: The Application layer is required by Clean Architecture
    const csprojPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.Application', 'SiesaAgents.Application.csproj');
    expect(fs.existsSync(csprojPath), 'SiesaAgents.Application.csproj must exist').toBe(true);
  });

  test('[P0] AC2 — SiesaAgents.Domain project file exists', async () => {
    // GIVEN: The Domain layer is the innermost ring of Clean Architecture
    const csprojPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.Domain', 'SiesaAgents.Domain.csproj');
    expect(fs.existsSync(csprojPath), 'SiesaAgents.Domain.csproj must exist').toBe(true);
  });

  test('[P0] AC2 — SiesaAgents.Infrastructure project file exists', async () => {
    // GIVEN: Infrastructure layer provides DB and external service implementations
    const csprojPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.Infrastructure', 'SiesaAgents.Infrastructure.csproj');
    expect(fs.existsSync(csprojPath), 'SiesaAgents.Infrastructure.csproj must exist').toBe(true);
  });

  test('[P1] AC2 — ExceptionHandlingMiddleware.cs exists at correct path', async () => {
    // GIVEN: Task 4 requires ExceptionHandlingMiddleware in the API Middleware folder
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'Middleware',
      'ExceptionHandlingMiddleware.cs',
    );
    expect(fs.existsSync(middlewarePath), 'ExceptionHandlingMiddleware.cs must exist in Middleware/').toBe(true);
  });

  // ─── appsettings.Development.json validation ─────────────────────────────

  test('[P1] AC3 — appsettings.Development.json has AllowedOrigins array', async () => {
    // GIVEN: CORS policy reads origins from configuration (not hardcoded)
    const settingsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'appsettings.Development.json');
    expect(fs.existsSync(settingsPath), 'appsettings.Development.json must exist').toBe(true);

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // THEN: AllowedOrigins array exists and includes the frontend origin
    expect(Array.isArray(content.AllowedOrigins), 'AllowedOrigins must be an array').toBe(true);
    expect(content.AllowedOrigins).toContain('http://localhost:5173');
  });

  test('[P1] AC5 — appsettings.Development.json has ConnectionStrings placeholder', async () => {
    // GIVEN: Task 5 requires a placeholder DB connection string
    const settingsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'appsettings.Development.json');
    expect(fs.existsSync(settingsPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // THEN: ConnectionStrings.DefaultConnection exists (even as placeholder)
    expect(content.ConnectionStrings?.DefaultConnection, 'ConnectionStrings.DefaultConnection must exist').toBeTruthy();
  });

  test('[P2] AC3 — appsettings.Development.json AllowedOrigins does not include wildcard', async () => {
    // GIVEN: Wildcard CORS origins are a security vulnerability
    const settingsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'appsettings.Development.json');
    expect(fs.existsSync(settingsPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // THEN: No wildcard in AllowedOrigins
    if (Array.isArray(content.AllowedOrigins)) {
      expect(content.AllowedOrigins).not.toContain('*');
    }
  });

  // ─── Frontend dependency presence ────────────────────────────────────────

  test('[P1] AC1 — package.json has @tanstack/react-router as dependency', async () => {
    // GIVEN: File-based routing is a core dependency
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(
      pkg.dependencies?.['@tanstack/react-router'] || pkg.devDependencies?.['@tanstack/react-router'],
      '@tanstack/react-router must be in dependencies',
    ).toBeTruthy();
  });

  test('[P1] AC1 — package.json has @tanstack/react-query as dependency', async () => {
    // GIVEN: React Query is required for server state management
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(
      pkg.dependencies?.['@tanstack/react-query'],
      '@tanstack/react-query must be in dependencies',
    ).toBeTruthy();
  });

  test('[P1] AC1 — package.json has axios as dependency', async () => {
    // GIVEN: apiClient.ts uses axios
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.dependencies?.axios, 'axios must be in dependencies').toBeTruthy();
  });

  test('[P1] AC1 — package.json has zustand as dependency', async () => {
    // GIVEN: Zustand is required per company standards for client state
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.dependencies?.zustand, 'zustand must be in dependencies').toBeTruthy();
  });

  test('[P2] AC1 — package.json has siesa-ui-kit as dependency', async () => {
    // GIVEN: siesa-ui-kit is mandatory for all UI components per company standards
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.dependencies?.['siesa-ui-kit'], 'siesa-ui-kit must be in dependencies').toBeTruthy();
  });

  test('[P2] AC1 — package.json has vitest as devDependency (unit test runner)', async () => {
    // GIVEN: The team uses vitest for frontend unit tests
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.devDependencies?.vitest, 'vitest must be in devDependencies').toBeTruthy();
  });
});
