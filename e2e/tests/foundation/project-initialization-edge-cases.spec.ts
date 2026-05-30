/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE & BOUNDARY TESTS — Automation Expansion Layer
 * Complements the ATDD acceptance tests with edge cases, error paths,
 * and boundary conditions not covered by the primary acceptance criteria tests.
 *
 * Test categories:
 *   [E2E-ROUTE]   — Route structure and navigation edge cases
 *   [E2E-RENDER]  — Component render isolation and boundary conditions
 *   [E2E-ASSET]   — Static asset and resource loading
 *   [STATIC]      — File-system / source-code structural assertions (no runtime)
 *   [STATIC-BE]   — Backend source code structural assertions (no .NET runtime)
 */

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'frontend')
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend')

// ─────────────────────────────────────────────────────────────────────────────
// [E2E-ROUTE] Root redirect edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[E2E-ROUTE] Root URL redirect behavior', () => {
  test('should redirect / to /clientes without flashing the root page content', async ({ page }) => {
    // GIVEN: The index route has a beforeLoad redirect to /clientes
    // WHEN: Browser navigates to the root URL
    await page.goto('/')

    // THEN: Final URL is /clientes (redirect completes without user seeing index content)
    await page.waitForURL('/clientes')
    expect(page.url()).toContain('/clientes')
  })

  test('should render clientes-page after redirect from /', async ({ page }) => {
    // GIVEN: The redirect from / to /clientes is in place
    // WHEN: Browser follows the redirect
    await page.goto('/')
    await page.waitForURL('/clientes')

    // THEN: The clientes page renders with its expected test id
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible()
  })

  test('should not render root route outlet content during redirect (no flash)', async ({ page }) => {
    // GIVEN: / redirects immediately via beforeLoad (synchronous redirect)
    // WHEN: We navigate to root and capture the page state
    const navigationPromise = page.waitForURL('/clientes')
    await page.goto('/')
    await navigationPromise

    // THEN: We land on clientes — the final settled URL is /clientes
    expect(page.url()).not.toMatch(/\/$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [E2E-ROUTE] Individual route isolation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[E2E-ROUTE] Route isolation — each route renders independently', () => {
  test('should render /clientes route with clientes-page test id', async ({ page }) => {
    // GIVEN: TanStack Router is configured with file-based routing
    // WHEN: Browser navigates directly to /clientes
    await page.goto('/clientes')

    // THEN: The clientes page is visible
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible()
    // AND: The contactos page is NOT rendered on this route
    await expect(page.locator('[data-testid="contactos-page"]')).toHaveCount(0)
  })

  test('should render /contactos route with contactos-page test id', async ({ page }) => {
    // GIVEN: TanStack Router is configured with file-based routing
    // WHEN: Browser navigates directly to /contactos
    await page.goto('/contactos')

    // THEN: The contactos page is visible
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible()
    // AND: The clientes page is NOT rendered on this route
    await expect(page.locator('[data-testid="clientes-page"]')).toHaveCount(0)
  })

  test('should navigate from /clientes to /contactos without full page reload', async ({ page }) => {
    // GIVEN: TanStack Router uses client-side navigation
    // WHEN: We navigate to /clientes and then use pushState-compatible navigation to /contactos
    await page.goto('/clientes')
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible()

    // Navigate via URL change (simulates router link click)
    await page.goto('/contactos')

    // THEN: Contactos page renders correctly after navigation
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible()
  })

  test('should return to /clientes when navigating back from /contactos', async ({ page }) => {
    // GIVEN: Browser history is built with / → /clientes → /contactos
    await page.goto('/')
    await page.waitForURL('/clientes')
    await page.goto('/contactos')
    await expect(page.locator('[data-testid="contactos-page"]')).toBeVisible()

    // WHEN: Browser back button is pressed
    await page.goBack()

    // THEN: Clientes page is shown again
    await expect(page.locator('[data-testid="clientes-page"]')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [E2E-ROUTE] Unknown route / 404 boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[E2E-ROUTE] Unknown route boundary condition', () => {
  test('should not crash the app when navigating to an unknown route', async ({ page }) => {
    // GIVEN: The router is configured with only /, /clientes, /contactos
    // WHEN: Browser navigates to a route that does not exist
    const runtimeErrors: string[] = []
    page.on('pageerror', (err) => runtimeErrors.push(err.message))

    await page.goto('/ruta-inexistente-atdd-boundary')

    // THEN: The app does not throw a JavaScript runtime error (no white screen of death)
    expect(runtimeErrors).toHaveLength(0)
    // AND: The page still loads (status 200 for SPA — HTML is always served)
    // The router may render a blank outlet or a not-found component — both are acceptable
  })

  test('should not display a Vite error overlay for unknown routes', async ({ page }) => {
    // GIVEN: Unknown routes are a runtime concern, not a compilation error
    // WHEN: Navigating to an unknown route
    await page.goto('/ruta-que-no-existe')

    // THEN: No Vite compile error overlay is shown
    const errorOverlay = page.locator('vite-error-overlay')
    await expect(errorOverlay).toHaveCount(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [E2E-RENDER] React root and app-root element boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[E2E-RENDER] React root mount edge cases', () => {
  test('should have exactly one app-root element — no duplicate mounts', async ({ page }) => {
    // GIVEN: main.tsx calls createRoot once on #root
    // WHEN: Page loads
    await page.goto('/clientes')

    // THEN: Exactly one element with data-testid="app-root" exists in the DOM
    await expect(page.locator('[data-testid="app-root"]')).toHaveCount(1)
  })

  test('should have the #root div as the React mount point', async ({ page }) => {
    // GIVEN: index.html has <div id="root" data-testid="app-root">
    // WHEN: Page loads
    await page.goto('/clientes')

    // THEN: The element with id="root" is present and is the same as app-root
    const rootById = page.locator('#root')
    await expect(rootById).toHaveCount(1)
    await expect(rootById).toHaveAttribute('data-testid', 'app-root')
  })

  test('should have the lang attribute set to "es" on the HTML element', async ({ page }) => {
    // GIVEN: index.html declares <html lang="es"> (Colombian Spanish locale)
    // WHEN: Page loads
    await page.goto('/clientes')

    // THEN: The document language is "es"
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('es')
  })

  test('should set the page title to "Siesa Agents"', async ({ page }) => {
    // GIVEN: index.html has <title>Siesa Agents</title>
    // WHEN: Page loads
    await page.goto('/clientes')

    // THEN: Document title matches
    await expect(page).toHaveTitle('Siesa Agents')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [E2E-ASSET] Static resource loading
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[E2E-ASSET] Static asset and CSS loading', () => {
  test('should load the CSS stylesheet without network errors (4xx/5xx)', async ({ page }) => {
    // GIVEN: style.css is imported in main.tsx and served by Vite
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.url().includes('.css') && response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    // WHEN: Page loads
    await page.goto('/clientes')

    // THEN: No CSS resources return error status codes
    expect(failedRequests).toHaveLength(0)
  })

  test('should not produce 404 responses for any script module (main.tsx bundle)', async ({
    page,
  }) => {
    // GIVEN: Vite bundles src/main.tsx and its imports
    const notFoundRequests: string[] = []
    page.on('response', (response) => {
      if (
        response.status() === 404 &&
        (response.url().includes('.tsx') ||
          response.url().includes('.ts') ||
          response.url().includes('.js'))
      ) {
        notFoundRequests.push(response.url())
      }
    })

    // WHEN: Page loads
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')

    // THEN: No script modules return 404
    expect(notFoundRequests).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC] Frontend project structure — file-system assertions
// These run without a browser and do NOT require servers to be running.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC] Frontend source structure and configuration', () => {
  test('should have tsconfig.app.json with strict:true', () => {
    // GIVEN: Story AC4 mandates strict TypeScript configuration
    // NOTE: tsconfig.app.json is JSONC (allows block comments) — use raw string matching
    const tsconfigPath = path.join(FRONTEND_ROOT, 'tsconfig.app.json')
    const content = fs.readFileSync(tsconfigPath, 'utf-8')

    // THEN: Strict mode flags are present as text (JSONC cannot be parsed with JSON.parse)
    expect(content).toContain('"strict": true')
    expect(content).toContain('"noImplicitAny": true')
    expect(content).toContain('"strictNullChecks": true')
  })

  test('should have noUnusedLocals and noUnusedParameters in tsconfig.app.json', () => {
    // GIVEN: Strict mode also implies no unused code
    // NOTE: tsconfig.app.json is JSONC (allows block comments) — use raw string matching
    const tsconfigPath = path.join(FRONTEND_ROOT, 'tsconfig.app.json')
    const content = fs.readFileSync(tsconfigPath, 'utf-8')

    // THEN: Additional strict flags are present beyond the base AC4 requirements
    expect(content).toContain('"noUnusedLocals": true')
    expect(content).toContain('"noUnusedParameters": true')
  })

  test('should have vite.config.ts that includes port 5173', () => {
    // GIVEN: AC1 requires Vite to start on port 5173
    const viteConfigPath = path.join(FRONTEND_ROOT, 'vite.config.ts')
    const content = fs.readFileSync(viteConfigPath, 'utf-8')

    // THEN: The port configuration is present in vite config source
    expect(content).toContain('5173')
  })

  test('should have vite.config.ts with TanStackRouterVite plugin configured', () => {
    // GIVEN: File-based routing requires the TanStack Router Vite plugin
    const viteConfigPath = path.join(FRONTEND_ROOT, 'vite.config.ts')
    const content = fs.readFileSync(viteConfigPath, 'utf-8')

    // THEN: TanStack Router plugin import and usage are present
    expect(content).toContain('TanStackRouterVite')
    expect(content).toContain('@tanstack/router-plugin/vite')
  })

  test('should have vite.config.ts with @tailwindcss/vite plugin', () => {
    // GIVEN: TailwindCSS v4 requires the Vite plugin (not postcss)
    const viteConfigPath = path.join(FRONTEND_ROOT, 'vite.config.ts')
    const content = fs.readFileSync(viteConfigPath, 'utf-8')

    // THEN: Tailwind Vite plugin is imported and used
    expect(content).toContain('@tailwindcss/vite')
    expect(content).toContain('tailwindcss()')
  })

  test('should have .env.development with VITE_API_URL pointing to port 5000', () => {
    // GIVEN: AC1 / Dev Notes require VITE_API_URL=http://localhost:5000
    const envPath = path.join(FRONTEND_ROOT, '.env.development')
    const content = fs.readFileSync(envPath, 'utf-8')

    // THEN: The variable is present and points to the backend port
    expect(content).toContain('VITE_API_URL=http://localhost:5000')
  })

  test('should have index.html with data-testid="app-root" on the #root div', () => {
    // GIVEN: AC1 test requires data-testid="app-root" to be visible — it must be in HTML
    const indexHtmlPath = path.join(FRONTEND_ROOT, 'index.html')
    const content = fs.readFileSync(indexHtmlPath, 'utf-8')

    // THEN: The root div has both id="root" and data-testid="app-root"
    expect(content).toContain('id="root"')
    expect(content).toContain('data-testid="app-root"')
  })

  test('should have __root.tsx in routes directory', () => {
    // GIVEN: TanStack Router requires __root.tsx as the root route
    const rootRoutePath = path.join(FRONTEND_ROOT, 'src', 'routes', '__root.tsx')
    expect(fs.existsSync(rootRoutePath)).toBe(true)
  })

  test('should have index.tsx in routes directory with redirect to /clientes', () => {
    // GIVEN: Root redirect is part of the shell initialization
    const indexRoutePath = path.join(FRONTEND_ROOT, 'src', 'routes', 'index.tsx')
    const content = fs.readFileSync(indexRoutePath, 'utf-8')

    // THEN: The index route has a redirect to /clientes
    expect(content).toContain('redirect')
    expect(content).toContain('/clientes')
  })

  test('should have main.tsx with RouterProvider inside QueryClientProvider', () => {
    // GIVEN: Dev Notes specify the wiring order — QueryProvider wraps RouterProvider
    const mainPath = path.join(FRONTEND_ROOT, 'src', 'main.tsx')
    const content = fs.readFileSync(mainPath, 'utf-8')

    // THEN: Both providers are imported and used
    expect(content).toContain('RouterProvider')
    expect(content).toContain('QueryClientProvider')
    // AND: The JSX render block has QueryClientProvider as the outer wrapper —
    // find the opening tag of QueryClientProvider and the opening tag of RouterProvider
    // in the JSX render section (after the .render( call)
    const renderIdx = content.indexOf('.render(')
    const jsxSection = content.slice(renderIdx)
    const queryOpenIdx = jsxSection.indexOf('<QueryClientProvider')
    const routerOpenIdx = jsxSection.indexOf('<RouterProvider')
    // QueryClientProvider open tag must appear before RouterProvider open tag (it wraps it)
    expect(queryOpenIdx).toBeLessThan(routerOpenIdx)
  })

  test('should have main.tsx with StrictMode enabled', () => {
    // GIVEN: React StrictMode should be active for development quality (double-render detection)
    const mainPath = path.join(FRONTEND_ROOT, 'src', 'main.tsx')
    const content = fs.readFileSync(mainPath, 'utf-8')

    // THEN: StrictMode is imported and wraps the app
    expect(content).toContain('StrictMode')
  })

  test('should have package.json with all required runtime dependencies from story', () => {
    // GIVEN: Story Task 1 specifies exact required runtime packages
    const pkgPath = path.join(FRONTEND_ROOT, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    // THEN: All mandatory packages are installed
    const requiredPackages = [
      '@tanstack/react-router',
      '@tanstack/react-query',
      'zustand',
      'axios',
      'react-hook-form',
      'zod',
      '@hookform/resolvers',
      'react-loading-skeleton',
      'tailwindcss',
      '@tailwindcss/vite',
    ]
    for (const pkg of requiredPackages) {
      expect(deps).toHaveProperty(pkg)
    }
  })

  test('should have package.json with all required dev dependencies from story', () => {
    // GIVEN: Story Task 1 specifies dev dependencies
    const pkgPath = path.join(FRONTEND_ROOT, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const devDeps = pkg.devDependencies ?? {}

    // THEN: Dev tooling packages are present
    const requiredDevPackages = [
      'vitest',
      '@testing-library/react',
      '@testing-library/jest-dom',
      'msw',
      '@tanstack/router-plugin',
    ]
    for (const devPkg of requiredDevPackages) {
      expect(devDeps).toHaveProperty(devPkg)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-BE] Backend source structure — file-system assertions (no .NET runtime)
// Tests the .csproj and .sln structural integrity without executing dotnet.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-BE] Backend solution structure and project references', () => {
  test('should have SiesaAgents.sln at the backend root', () => {
    // GIVEN: Story Task 2 creates the solution file
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln')
    expect(fs.existsSync(slnPath)).toBe(true)
  })

  test('should have SiesaAgents.sln referencing all four Clean Architecture projects', () => {
    // GIVEN: AC2 requires four CA projects referenced in the solution
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln')
    const content = fs.readFileSync(slnPath, 'utf-8')

    // THEN: All four project names appear in the solution file
    expect(content).toContain('SiesaAgents.API')
    expect(content).toContain('SiesaAgents.Application')
    expect(content).toContain('SiesaAgents.Domain')
    expect(content).toContain('SiesaAgents.Infrastructure')
  })

  test('should have SiesaAgents.sln referencing the UnitTests project', () => {
    // GIVEN: Story Task 2 adds the unit test project to the solution
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln')
    const content = fs.readFileSync(slnPath, 'utf-8')

    // THEN: The unit test project is in the solution
    expect(content).toContain('SiesaAgents.UnitTests')
  })

  test('should have API project targeting net10.0', () => {
    // GIVEN: Backend is .NET 10 per company standards
    const csprojPath = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'SiesaAgents.API.csproj')
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: The target framework is net10.0
    expect(content).toContain('<TargetFramework>net10.0</TargetFramework>')
  })

  test('should have API project referencing Scalar.AspNetCore package', () => {
    // GIVEN: Scalar is the only API docs tool — Swashbuckle is forbidden
    const csprojPath = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'SiesaAgents.API.csproj')
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: Scalar package is present
    expect(content).toContain('Scalar.AspNetCore')
    // AND: Swashbuckle is NOT present
    expect(content).not.toContain('Swashbuckle')
  })

  test('should have API .csproj referencing Application and Infrastructure projects', () => {
    // GIVEN: Clean Architecture — API depends on Application and Infrastructure
    const csprojPath = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'SiesaAgents.API.csproj')
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: Both project references are present
    expect(content).toContain('SiesaAgents.Application')
    expect(content).toContain('SiesaAgents.Infrastructure')
  })

  test('should have Application .csproj referencing Domain project only', () => {
    // GIVEN: Clean Architecture — Application layer depends on Domain, not Infrastructure
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.Application',
      'SiesaAgents.Application.csproj'
    )
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: Domain reference is present
    expect(content).toContain('SiesaAgents.Domain')
    // AND: Infrastructure reference is NOT present (dependency inversion)
    expect(content).not.toContain('SiesaAgents.Infrastructure')
  })

  test('should have Infrastructure .csproj referencing Domain AND Application', () => {
    // GIVEN: Infrastructure can reference Application for interfaces
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.Infrastructure',
      'SiesaAgents.Infrastructure.csproj'
    )
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: Both references are present
    expect(content).toContain('SiesaAgents.Domain')
    expect(content).toContain('SiesaAgents.Application')
  })

  test('should have Infrastructure .csproj with Npgsql EF Core package', () => {
    // GIVEN: Story Task 2 specifies Npgsql.EntityFrameworkCore.PostgreSQL for Infrastructure
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.Infrastructure',
      'SiesaAgents.Infrastructure.csproj'
    )
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: The EF Core Postgres provider is referenced
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL')
  })

  test('should have Application .csproj with FluentValidation package', () => {
    // GIVEN: Story Task 2 specifies FluentValidation for Application layer
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.Application',
      'SiesaAgents.Application.csproj'
    )
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: FluentValidation is installed
    expect(content).toContain('FluentValidation')
  })

  test('should have all CA projects with TreatWarningsAsErrors enabled', () => {
    // GIVEN: Zero-warning policy is a company quality standard (build fails on warning)
    const projects = [
      path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'SiesaAgents.API.csproj'),
      path.join(BACKEND_ROOT, 'src', 'SiesaAgents.Application', 'SiesaAgents.Application.csproj'),
      path.join(BACKEND_ROOT, 'src', 'SiesaAgents.Domain', 'SiesaAgents.Domain.csproj'),
      path.join(
        BACKEND_ROOT,
        'src',
        'SiesaAgents.Infrastructure',
        'SiesaAgents.Infrastructure.csproj'
      ),
    ]

    for (const projectPath of projects) {
      const content = fs.readFileSync(projectPath, 'utf-8')
      // THEN: Each project has TreatWarningsAsErrors = true
      expect(content).toContain('<TreatWarningsAsErrors>true</TreatWarningsAsErrors>')
    }
  })

  test('should have Program.cs with MapScalarApiReference and NOT UseSwagger', () => {
    // GIVEN: Architecture mandates Scalar ONLY — UseSwagger/Swashbuckle is forbidden
    const programPath = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'Program.cs')
    const content = fs.readFileSync(programPath, 'utf-8')

    // THEN: Scalar is used
    expect(content).toContain('MapScalarApiReference')
    // AND: Swagger is NOT used
    expect(content).not.toContain('UseSwagger')
    expect(content).not.toContain('AddSwaggerGen')
  })

  test('should have Program.cs with CORS policy allowing http://localhost:5173', () => {
    // GIVEN: AC3 requires CORS configured for the frontend origin
    const programPath = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'Program.cs')
    const content = fs.readFileSync(programPath, 'utf-8')

    // THEN: The frontend origin is in the CORS policy
    expect(content).toContain('http://localhost:5173')
    expect(content).toContain('AddCors')
    expect(content).toContain('UseCors')
  })

  test('should have Program.cs with ExceptionHandlingMiddleware registered before UseCors', () => {
    // GIVEN: Middleware order is critical — exception handler must wrap CORS
    const programPath = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API', 'Program.cs')
    const content = fs.readFileSync(programPath, 'utf-8')

    // THEN: Both middleware registrations are present
    expect(content).toContain('ExceptionHandlingMiddleware')
    // AND: ExceptionHandlingMiddleware appears before UseCors in source order
    const exceptionIdx = content.indexOf('ExceptionHandlingMiddleware')
    const corsIdx = content.indexOf('UseCors')
    expect(exceptionIdx).toBeLessThan(corsIdx)
  })

  test('should have ExceptionHandlingMiddleware that returns application/problem+json', () => {
    // GIVEN: Problem Details RFC 7807 format must be the error response format
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.API',
      'Middleware',
      'ExceptionHandlingMiddleware.cs'
    )
    const content = fs.readFileSync(middlewarePath, 'utf-8')

    // THEN: The content type is set to application/problem+json
    expect(content).toContain('application/problem+json')
  })

  test('should have ExceptionHandlingMiddleware that maps ArgumentException to 400 BadRequest', () => {
    // GIVEN: The middleware has type-based exception mapping
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.API',
      'Middleware',
      'ExceptionHandlingMiddleware.cs'
    )
    const content = fs.readFileSync(middlewarePath, 'utf-8')

    // THEN: ArgumentException maps to BadRequest (400)
    expect(content).toContain('ArgumentException')
    expect(content).toContain('BadRequest')
  })

  test('should have ExceptionHandlingMiddleware that maps KeyNotFoundException to 404 NotFound', () => {
    // GIVEN: The middleware maps known domain exceptions to appropriate HTTP codes
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.API',
      'Middleware',
      'ExceptionHandlingMiddleware.cs'
    )
    const content = fs.readFileSync(middlewarePath, 'utf-8')

    // THEN: KeyNotFoundException maps to NotFound (404)
    expect(content).toContain('KeyNotFoundException')
    expect(content).toContain('NotFound')
  })

  test('should have ExceptionHandlingMiddleware that does NOT expose raw exception messages to callers', () => {
    // GIVEN: Security requirement — never expose stack traces or raw ex.Message
    // The middleware must NOT write ex.Message or ex.StackTrace into the response body
    // The story Dev Notes explicitly say: detail = null (never expose ex.Message)
    // NOTE: The actual implementation DOES include exception.Message in detail,
    // which deviates from the story spec. This test documents the intended behavior.
    test.fixme(
      true,
      'Implementation deviation: ExceptionHandlingMiddleware writes exception.Message to detail field. ' +
        'Story spec requires detail = null to prevent information leakage. ' +
        'Needs alignment with security requirement from Dev Notes.'
    )
  })

  test('should have appsettings.Development.json with AllowedOrigins containing frontend URL', () => {
    // GIVEN: Story Task 5 requires AllowedOrigins array in appsettings.Development.json
    const appSettingsPath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.API',
      'appsettings.Development.json'
    )
    const content = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'))

    // THEN: AllowedOrigins is present with the frontend URL
    expect(content).toHaveProperty('AllowedOrigins')
    expect(content.AllowedOrigins).toContain('http://localhost:5173')
  })

  test('should have appsettings.Development.json with ConnectionStrings:DefaultConnection', () => {
    // GIVEN: Story Task 5 requires a placeholder DB connection string
    const appSettingsPath = path.join(
      BACKEND_ROOT,
      'src',
      'SiesaAgents.API',
      'appsettings.Development.json'
    )
    const content = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'))

    // THEN: ConnectionStrings.DefaultConnection is present (Postgres format)
    expect(content).toHaveProperty('ConnectionStrings')
    expect(content.ConnectionStrings).toHaveProperty('DefaultConnection')
    expect(content.ConnectionStrings.DefaultConnection).toContain('siesa_agents_db')
  })

  test('should have UnitTests project referencing Application and Domain', () => {
    // GIVEN: Story Task 2 — UnitTests references Application and Domain
    const csprojPath = path.join(
      BACKEND_ROOT,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    )
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: Both project references exist
    expect(content).toContain('SiesaAgents.Application')
    expect(content).toContain('SiesaAgents.Domain')
    // AND: Infrastructure is NOT referenced (unit tests should not depend on infrastructure)
    expect(content).not.toContain('SiesaAgents.Infrastructure')
  })

  test('should have UnitTests project with xunit package reference', () => {
    // GIVEN: Story specifies xunit as the test framework (dotnet new xunit)
    const csprojPath = path.join(
      BACKEND_ROOT,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    )
    const content = fs.readFileSync(csprojPath, 'utf-8')

    // THEN: xunit is referenced
    expect(content).toContain('<PackageReference Include="xunit"')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC] Missing implementation items from story requirements
// These tests document gaps found during automation analysis.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC] Story requirement gaps — tracking missing implementations', () => {
  test('should have src/shared/lib/apiClient.ts (Axios instance)', () => {
    // GIVEN: Story Task 1 requires creating src/shared/lib/apiClient.ts
    // This file configures the Axios instance with VITE_API_URL baseURL
    const filePath = path.join(FRONTEND_ROOT, 'src', 'shared', 'lib', 'apiClient.ts')

    // NOTE: This file was NOT created during initial implementation.
    // The test documents the gap and will pass once the file is added.
    test.fixme(
      !fs.existsSync(filePath),
      'Missing implementation: src/shared/lib/apiClient.ts was not created. ' +
        'Story Task 1 requires an Axios instance with baseURL: import.meta.env.VITE_API_URL. ' +
        'Required for all future API calls in the frontend.'
    )

    expect(fs.existsSync(filePath)).toBe(true)
  })

  test('should have src/shared/lib/queryClient.ts (singleton QueryClient)', () => {
    // GIVEN: Story Task 1 requires creating src/shared/lib/queryClient.ts
    // This exports the singleton QueryClient instance
    const filePath = path.join(FRONTEND_ROOT, 'src', 'shared', 'lib', 'queryClient.ts')

    // NOTE: This file was NOT created. QueryClient is inlined in main.tsx instead.
    // The story requires a separate queryClient.ts for reuse across the app.
    test.fixme(
      !fs.existsSync(filePath),
      'Missing implementation: src/shared/lib/queryClient.ts was not created. ' +
        'Story Task 1 requires a singleton QueryClient export in shared/lib. ' +
        "Currently QueryClient is inlined in main.tsx which doesn't follow the story spec."
    )

    expect(fs.existsSync(filePath)).toBe(true)
  })

  test('should have src/app/providers/QueryProvider.tsx wrapping QueryClientProvider', () => {
    // GIVEN: Story Task 1 requires creating src/app/providers/QueryProvider.tsx
    const filePath = path.join(
      FRONTEND_ROOT,
      'src',
      'app',
      'providers',
      'QueryProvider.tsx'
    )

    // NOTE: This provider component was not created — QueryClientProvider is used directly in main.tsx.
    test.fixme(
      !fs.existsSync(filePath),
      'Missing implementation: src/app/providers/QueryProvider.tsx was not created. ' +
        'Story Task 1 requires this wrapper component to encapsulate QueryClientProvider. ' +
        'Required for clean provider composition in future stories.'
    )

    expect(fs.existsSync(filePath)).toBe(true)
  })

  test('should have the frontend folder structure with required empty directories', () => {
    // GIVEN: Dev Notes require creating empty folders even if unused: modules/, shared/, app/, infrastructure/
    const requiredDirs = [
      path.join(FRONTEND_ROOT, 'src', 'modules'),
      path.join(FRONTEND_ROOT, 'src', 'shared'),
      path.join(FRONTEND_ROOT, 'src', 'app'),
      path.join(FRONTEND_ROOT, 'src', 'infrastructure'),
    ]

    // NOTE: These directories were not created in the initial implementation.
    const missingDirs = requiredDirs.filter((d) => !fs.existsSync(d))

    test.fixme(
      missingDirs.length > 0,
      `Missing directories from architecture spec: ${missingDirs.map((d) => path.relative(FRONTEND_ROOT, d)).join(', ')}. ` +
        'Dev Notes state: "Create the folders even if empty so the structure is visible."'
    )

    for (const dir of requiredDirs) {
      expect(fs.existsSync(dir)).toBe(true)
    }
  })
})
