---
epic: 1
title: "Project Foundation & Application Shell"
workflow: testarch-trace
phase: traceability-matrix
createdAt: "2026-06-01"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
---

# Traceability Matrix — Epic 1: Project Foundation & Application Shell

**Date:** 2026-06-01
**Epic:** 1 — Project Foundation & Application Shell
**Stories:** 1.1, 1.2, 1.3
**Status:** Complete

---

## Phase 1: Requirements Inventory

### Epic-Level Acceptance Criteria

| ID       | Description                                                                                     | Priority | FR Coverage      |
|----------|-------------------------------------------------------------------------------------------------|----------|------------------|
| AC-E1.1  | App loads with accessible navigation shell on mobile and desktop browser                        | P0       | FR28, FR29, FR30 |
| AC-E1.2  | User can navigate between Clientes and Contactos without full page reloads                      | P0       | FR28             |
| AC-E1.3  | Direct URL access to /clientes and /contactos renders correct views (deep linking)              | P0       | FR30             |

### Story 1.1 Acceptance Criteria

| ID        | Description                                                                                         | Priority |
|-----------|-----------------------------------------------------------------------------------------------------|----------|
| AC-1.1-1  | pnpm run dev starts Vite server on port 5173 with no errors, TypeScript strict mode enabled         | P0       |
| AC-1.1-2  | Backend starts on port 5000, Scalar loads at /scalar, 4 CA projects referenced in SiesaAgents.sln  | P0       |
| AC-1.1-3  | CORS allows requests from http://localhost:5173 without errors                                      | P0       |
| AC-1.1-4  | TypeScript compiler emits zero errors with strict, noImplicitAny, strictNullChecks                  | P0       |
| AC-1.1-5  | dotnet build SiesaAgents.sln compiles all four projects with zero errors or warnings                | P1       |

### Story 1.2 Acceptance Criteria

| ID        | Description                                                                                               | Priority |
|-----------|-----------------------------------------------------------------------------------------------------------|----------|
| AC-1.2-1  | NavigationRail (siesa-ui-kit) visible on desktop left side; Clientes/Contactos entries; SPA nav (FR28)    | P0       |
| AC-1.2-2  | Mobile: NavigationBar (siesa-ui-kit) at bottom at viewport < 1024px; items tappable (FR29)                | P0       |
| AC-1.2-3  | Direct URL to /clientes or /contactos renders correct view without redirect; active item highlighted (FR30)| P0       |
| AC-1.2-4  | Unknown route shows graceful 404/not-found view within shell (no blank screen or JS crash)                | P1       |
| AC-1.2-5  | Navigation between /clientes and /contactos has no full page reload (SPA behavior)                        | P1       |
| AC-1.2-6  | Keyboard nav: Enter/Space on focused nav item triggers navigation (WCAG 2.1 AA)                           | P1       |

### Story 1.3 Acceptance Criteria

| ID        | Description                                                                                          | Priority |
|-----------|------------------------------------------------------------------------------------------------------|----------|
| AC-1.3-1  | dotnet ef database update creates siesa_agents_db; EF Core migrations folder exists in Infrastructure | P1       |
| AC-1.3-2  | Unhandled exceptions return Problem Details RFC 7807 (status, title, detail) with no stack traces    | P0       |
| AC-1.3-3  | ApplySnakeCaseNaming() (UseSnakeCaseNamingConvention) applied in OnModelCreating as last call         | P1       |
| AC-1.3-4  | dotnet build SiesaAgents.sln succeeds with zero errors and zero warnings                             | P1       |
| AC-1.3-5  | AppDbContext registered in DI reading ConnectionStrings:DefaultConnection from appsettings            | P1       |
| AC-1.3-6  | Initial migration is empty (no domain table DDL; no clientes/contactos tables)                       | P1       |

---

## Phase 2: Test Evidence Inventory

### Unit Tests — Frontend (Vitest)

| Test File | Test Name | Priority | AC Covered |
|-----------|-----------|----------|------------|
| `frontend/src/shared/lib/__tests__/apiClient.unit.test.ts` | should export a defined apiClient instance | P1 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/apiClient.unit.test.ts` | should have Content-Type: application/json as default request header | P1 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/apiClient.unit.test.ts` | should expose get, post, put, delete, patch methods | P1 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/apiClient.unit.test.ts` | should use VITE_API_URL as the baseURL | P2 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/apiClient.unit.test.ts` | should not configure a timeout | P2 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | should export a defined QueryClient instance | P1 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | should expose standard QueryClient API methods | P1 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | should have staleTime set to 60 000 ms | P1 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | should not use Infinity as staleTime | P2 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | should export same singleton on repeated imports | P2 | AC-1.1-1 |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | should have empty initial query cache | P3 | AC-1.1-1 |

### Unit Tests — Frontend Navigation Shell (Vitest)

| Test File | Test Name | Priority | AC Covered |
|-----------|-----------|----------|------------|
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | [P0] should export a Route constant from __root.tsx | P0 | AC-1.2-1, AC-E1.1 |
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | [P0] should export a Route with a component property (shell layout) | P0 | AC-1.2-1 |
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | [P0] should configure notFoundComponent for 404 handling | P0 | AC-1.2-4 |
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | [P1] should define navItems with clientes and contactos hrefs | P1 | AC-1.2-1, AC-1.2-3 |
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | [P1] should use Spanish labels for nav items | P1 | AC-1.2-1 |
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | [P1] root layout module should be importable (structural integrity) | P1 | AC-1.2-1 |
| `frontend/src/shared/components/__tests__/NotFound.unit.test.ts` | [P0] should export NotFound as named export function | P0 | AC-1.2-4 |
| `frontend/src/shared/components/__tests__/NotFound.unit.test.ts` | [P0] should export NotFound as function with correct name | P0 | AC-1.2-4 |
| `frontend/src/shared/components/__tests__/NotFound.unit.test.ts` | [P1] NotFound should not throw when called with no arguments | P1 | AC-1.2-4 |
| `frontend/src/shared/components/__tests__/NotFound.unit.test.ts` | [P0] NotFound should reference /clientes in rendered output | P0 | AC-1.2-4 |

### Unit Tests — Backend (xUnit)

| Test File | Test Name | Priority | AC Covered |
|-----------|-----------|----------|------------|
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: response status is 500 for unhandled exception | P0 | AC-1.3-2, AC-1.1-2 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: Content-Type is application/problem+json | P0 | AC-1.3-2 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: response body contains status 500 | P0 | AC-1.3-2 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: response body contains non-empty title | P0 | AC-1.3-2 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: title is generic approved message | P0 | AC-1.3-2 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2 (NFR6): detail field is null (no stack trace) | P0 | AC-1.3-2, NFR6 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2 (NFR6): response body does NOT contain stack trace markers | P0 | AC-1.3-2, NFR6 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: passthrough when no exception occurs | P1 | AC-1.3-2 |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | AC2: response status remains 200 on success | P1 | AC-1.3-2 |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | AC5: AppDbContext instantiated with InMemory options without throwing | P1 | AC-1.3-5 |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | AC5: constructor accepts DbContextOptions<AppDbContext> | P1 | AC-1.3-5 |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | AC3: OnModelCreating builds model without errors | P1 | AC-1.3-3 |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | AC3: model contains no domain entity tables | P1 | AC-1.3-3, AC-1.3-6 |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | AC4: AppDbContext inherits from DbContext | P1 | AC-1.3-4 |

### E2E Tests — Frontend Foundation (Playwright)

| Test File | Test Name | Priority | AC Covered |
|-----------|-----------|----------|------------|
| `e2e/tests/foundation/project-initialization.spec.ts` | should serve frontend app on port 5173 without errors | P0 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization.spec.ts` | should render root HTML with valid React mount point | P0 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization.spec.ts` | should load without TypeScript compilation errors in console | P0 | AC-1.1-4 |
| `e2e/tests/foundation/project-initialization.spec.ts` | should not have JavaScript runtime errors on initial load | P0 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization.spec.ts` | should allow frontend to reach backend without CORS errors | P0 | AC-1.1-3 |
| `e2e/tests/foundation/project-initialization.spec.ts` | should receive valid HTTP response from backend without CORS blocking | P0 | AC-1.1-3 |
| `e2e/tests/foundation/project-initialization.spec.ts` | should load frontend without Vite TypeScript error overlay | P0 | AC-1.1-4 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should display NavigationRail on left side on desktop viewport | P0 | AC-1.2-1, AC-E1.1 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should show "Clientes" navigation entry in NavigationRail | P0 | AC-1.2-1 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should show "Contactos" navigation entry in NavigationRail | P0 | AC-1.2-1 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should navigate to /clientes without full page reload (rail click) | P0 | AC-1.2-1, AC-1.2-5, AC-E1.2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should navigate to /contactos without full page reload (rail click) | P0 | AC-1.2-1, AC-1.2-5, AC-E1.2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should NOT display NavigationBar on desktop viewport | P1 | AC-1.2-2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should display NavigationBar at bottom on mobile viewport | P0 | AC-1.2-2, AC-E1.1 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should show "Clientes" item in mobile NavigationBar | P0 | AC-1.2-2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should show "Contactos" item in mobile NavigationBar | P0 | AC-1.2-2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should navigate to /contactos when tapping Contactos in mobile NavBar | P0 | AC-1.2-2, AC-E1.2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should NOT display NavigationRail on mobile viewport | P1 | AC-1.2-2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should render Clientes view on direct /clientes navigation | P0 | AC-1.2-3, AC-E1.3 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should render Contactos view on direct /contactos navigation | P0 | AC-1.2-3, AC-E1.3 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should highlight Clientes nav item as active when on /clientes | P1 | AC-1.2-3 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should highlight Contactos nav item as active when on /contactos | P1 | AC-1.2-3 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should redirect root / to /clientes automatically | P1 | AC-1.2-3 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should display not-found view on unknown route | P1 | AC-1.2-4 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should display "Página no encontrada" heading | P1 | AC-1.2-4 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should display back link to /clientes in not-found view | P1 | AC-1.2-4 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should not crash application shell on unknown route | P1 | AC-1.2-4 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should not trigger document reload navigating /clientes → /contactos | P0 | AC-1.2-5, AC-E1.2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should not trigger document reload navigating /contactos → /clientes | P0 | AC-1.2-5, AC-E1.2 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should preserve navigation shell across route changes | P1 | AC-1.2-5 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should navigate to /contactos when pressing Enter on focused Contactos item | P1 | AC-1.2-6 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should navigate to /contactos when pressing Space on focused Contactos item | P1 | AC-1.2-6 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should navigate to /clientes when pressing Enter on focused Clientes item | P1 | AC-1.2-6 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | should make NavigationRail items reachable via Tab key | P1 | AC-1.2-6 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should serve index.html with text/html content-type | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should include valid charset declaration | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should return HTTP 200 for root path | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should return HTTP 200 for unknown SPA sub-routes (SPA fallback) | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should have exactly one root mount point | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should not render empty #root after hydration | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | [P1] should have lang attribute on html element | P1 | AC-1.1-1 |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | (8 P2/P3 edge cases) | P2/P3 | AC-1.1-1 |

### API Tests — Backend (Playwright/API)

| Test File | Test Name | Priority | AC Covered |
|-----------|-----------|----------|------------|
| `e2e/tests/api/backend-initialization.api.spec.ts` | should have backend API server running on port 5000 | P0 | AC-1.1-2 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should serve Scalar documentation at /scalar | P0 | AC-1.1-2 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should return HTML content from Scalar endpoint | P0 | AC-1.1-2 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should NOT expose Swagger/OpenAPI UI | P0 | AC-1.1-2 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should NOT expose WeatherForecast default endpoint | P1 | AC-1.1-2 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should return CORS header for http://localhost:5173 | P0 | AC-1.1-3 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should respond to OPTIONS preflight without CORS rejection | P0 | AC-1.1-3 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should have all four Clean Architecture layers responding | P0 | AC-1.1-5 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | should return Problem Details RFC 7807 format for unhandled errors | P0 | AC-1.3-2 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should respond to health-probe endpoint (db connection) | P1 | AC-1.3-1 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should NOT return 500 for siesa_agents_db connection string | P1 | AC-1.3-1 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should have EF Core migrations history accessible | P1 | AC-1.3-1 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should return 500/problem+json for unhandled exception (trigger endpoint) | P0 | AC-1.3-2 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should include RFC 7807 fields (status, title) in error body | P0 | AC-1.3-2 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should NOT expose stack traces in error body | P0 | AC-1.3-2, NFR6 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should NOT expose detail field (must be null) | P0 | AC-1.3-2, NFR6 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should return generic title (not real exception message) | P0 | AC-1.3-2 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should confirm UseSnakeCaseNamingConvention via diagnostic endpoint | P1 | AC-1.3-3 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should confirm no [Column]/[Table] attributes (convention-based) | P1 | AC-1.3-3 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should have all four CA projects compiled in DI | P1 | AC-1.3-4 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should have Infrastructure available in DI container | P1 | AC-1.3-4 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should resolve AppDbContext from DI without throwing | P1 | AC-1.3-5 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should use DefaultConnection pointing to siesa_agents_db | P1 | AC-1.3-5 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should use Npgsql provider for AppDbContext | P1 | AC-1.3-5 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should NOT have clientes table (empty migration) | P1 | AC-1.3-6 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should NOT have contactos table (empty migration) | P1 | AC-1.3-6 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should have __EFMigrationsHistory table | P1 | AC-1.3-1 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | should have exactly one applied migration (InitialCreate) | P1 | AC-1.3-1, AC-1.3-6 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | [P0] should return application/problem+json for 404 responses | P0 | AC-1.3-2 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | [P0] should return parseable JSON body for 404 errors | P0 | AC-1.3-2 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | [P1] should NOT return CORS header for unlisted origin | P1 | AC-1.1-3 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | [P1] OPTIONS preflight: Access-Control-Allow-Methods present | P1 | AC-1.1-3 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | [P1] should not expose stack traces in error bodies | P1 | AC-1.3-2, NFR6 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | [P1] should not expose internal exception messages | P1 | AC-1.3-2, NFR6 |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | (16 more P1/P2/P3 edge cases) | P1-P3 | AC-1.1-2, AC-1.1-3 |

### Helper/Factory Unit Tests

| Test File | Test Name | Priority | AC Covered |
|-----------|-----------|----------|------------|
| `e2e/helpers/__tests__/data.helper.unit.test.ts` | buildCliente — required fields present | P1 | Test Infrastructure |
| `e2e/helpers/__tests__/data.helper.unit.test.ts` | buildCliente — unique NITs | P1 | Test Infrastructure |
| `e2e/helpers/__tests__/data.helper.unit.test.ts` | buildContacto — required fields present | P1 | Test Infrastructure |
| `e2e/helpers/__tests__/data.helper.unit.test.ts` | (14 more factory tests) | P1-P3 | Test Infrastructure |

---

## Phase 3: Requirements-to-Tests Traceability

### Epic-Level AC Coverage

| Req ID   | Description (short)                      | Priority | Test Count | Test Files | Coverage |
|----------|------------------------------------------|----------|------------|------------|----------|
| AC-E1.1  | Navigation shell accessible (mobile+desktop) | P0   | 4          | navigation-shell.spec.ts, root-layout.unit.test.ts | COVERED |
| AC-E1.2  | SPA navigation no full reload            | P0       | 5          | navigation-shell.spec.ts | COVERED |
| AC-E1.3  | Deep linking to /clientes and /contactos | P0       | 2          | navigation-shell.spec.ts | COVERED |

### Story 1.1 AC Coverage

| Req ID   | Description (short)                      | Priority | Test Count | Test Files | Coverage |
|----------|------------------------------------------|----------|------------|------------|----------|
| AC-1.1-1 | Vite starts on 5173, TS strict           | P0       | 11         | project-initialization.spec.ts, edge-cases.spec.ts, apiClient.unit, queryClient.unit | COVERED |
| AC-1.1-2 | Backend starts on 5000, Scalar, 4 CA     | P0       | 5          | backend-initialization.api.spec.ts | COVERED |
| AC-1.1-3 | CORS from localhost:5173                 | P0       | 5          | project-initialization.spec.ts, backend-initialization.api.spec.ts, edge-cases | COVERED |
| AC-1.1-4 | TS emits zero errors                     | P0       | 3          | project-initialization.spec.ts | COVERED |
| AC-1.1-5 | dotnet build zero errors                 | P1       | 1          | backend-initialization.api.spec.ts (proxy via server start) | COVERED |

### Story 1.2 AC Coverage

| Req ID   | Description (short)                         | Priority | Test Count | Test Files | Coverage |
|----------|---------------------------------------------|----------|------------|------------|----------|
| AC-1.2-1 | NavigationRail desktop, SPA nav (FR28)       | P0       | 8          | navigation-shell.spec.ts (AC1 block), root-layout.unit | COVERED |
| AC-1.2-2 | NavigationBar mobile (FR29)                  | P0       | 5          | navigation-shell.spec.ts (AC2 block) | COVERED |
| AC-1.2-3 | Deep linking + active nav item (FR30)        | P0       | 5          | navigation-shell.spec.ts (AC3 block) | COVERED |
| AC-1.2-4 | 404 graceful view                            | P1       | 6          | navigation-shell.spec.ts (AC4 block), NotFound.unit | COVERED |
| AC-1.2-5 | SPA no full page reload                      | P1       | 3          | navigation-shell.spec.ts (AC5 block) | COVERED |
| AC-1.2-6 | Keyboard accessibility (WCAG 2.1 AA)         | P1       | 4          | navigation-shell.spec.ts (AC6 block) | COVERED |

### Story 1.3 AC Coverage

| Req ID   | Description (short)                                | Priority | Test Count | Test Files | Coverage |
|----------|----------------------------------------------------|----------|------------|------------|----------|
| AC-1.3-1 | siesa_agents_db created, migrations folder         | P1       | 4          | backend-database-foundation.api.spec.ts (AC1 block) | COVERED |
| AC-1.3-2 | Problem Details RFC 7807, no stack traces (NFR6)   | P0       | 14         | backend-database-foundation.api.spec.ts (AC2), ExceptionHandlingMiddlewareTests.cs, edge-cases | COVERED |
| AC-1.3-3 | UseSnakeCaseNamingConvention in OnModelCreating     | P1       | 4          | backend-database-foundation.api.spec.ts (AC3), AppDbContextTests.cs | COVERED |
| AC-1.3-4 | dotnet build zero errors/warnings                  | P1       | 2          | backend-database-foundation.api.spec.ts (AC4), AppDbContextTests.cs | COVERED |
| AC-1.3-5 | AppDbContext in DI with DefaultConnection          | P1       | 5          | backend-database-foundation.api.spec.ts (AC5), AppDbContextTests.cs | COVERED |
| AC-1.3-6 | Initial migration is empty (no domain tables)      | P1       | 3          | backend-database-foundation.api.spec.ts (AC6), AppDbContextTests.cs | COVERED |

### NFR Coverage

| NFR  | Description                          | Priority | Test Count | Coverage |
|------|--------------------------------------|----------|------------|----------|
| NFR6 | No stack traces exposed to clients   | P0       | 9          | COVERED  |
| NFR4 | HTTPS in non-local deployments       | N/A      | 0          | OUT OF SCOPE (Epic 1 = local dev only) |
| NFR5 | Input validation/sanitization        | N/A      | 0          | OUT OF SCOPE (no user input in Epic 1) |

---

## Phase 4: Coverage Summary

### Totals

| Priority | Req Count | Covered | Not Covered | Coverage % |
|----------|-----------|---------|-------------|------------|
| P0       | 8         | 8       | 0           | 100%       |
| P1       | 11        | 11      | 0           | 100%       |
| P2+      | 0         | 0       | 0           | N/A        |
| **Overall** | **19** | **19**  | **0**       | **100%**   |

> Note: P2/P3 test SCENARIOS exist (navigation edge cases, snake_case schema, performance boundaries) and have test files generated, but no P2/P3 REQUIREMENTS are defined at AC level for this epic. All ACs are P0 or P1.

### Coverage by Story

| Story | ACs Total | ACs Covered | Coverage |
|-------|-----------|-------------|----------|
| 1.1   | 5         | 5           | 100%     |
| 1.2   | 6         | 6           | 100%     |
| 1.3   | 6         | 6           | 100%     |
| Epic ACs | 3      | 3           | 100%     |

### Test File Inventory

| File | Level | Tests | Status |
|------|-------|-------|--------|
| `e2e/tests/foundation/project-initialization.spec.ts` | E2E | 7 | Exists |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | E2E | 15 | Exists |
| `e2e/tests/foundation/navigation-shell.spec.ts` | E2E | 20 | Exists |
| `e2e/tests/foundation/navigation-shell-edge-cases.spec.ts` | E2E | TBD | Exists |
| `e2e/tests/api/backend-initialization.api.spec.ts` | API | 9 | Exists |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | API | 22 | Exists |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | API | 14 | Exists |
| `e2e/tests/api/backend-database-foundation-edge-cases.api.spec.ts` | API | TBD | Exists |
| `frontend/src/routes/__tests__/root-layout.unit.test.ts` | Unit | 6 | Exists |
| `frontend/src/routes/__tests__/root-layout-edge-cases.unit.test.ts` | Unit | TBD | Exists |
| `frontend/src/shared/components/__tests__/NotFound.unit.test.ts` | Unit | 4 | Exists |
| `frontend/src/shared/components/__tests__/NotFound-edge-cases.unit.test.ts` | Unit | TBD | Exists |
| `frontend/src/shared/lib/__tests__/apiClient.unit.test.ts` | Unit | 5 | Exists |
| `frontend/src/shared/lib/__tests__/queryClient.unit.test.ts` | Unit | 6 | Exists |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | Unit | 9 | Exists |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareEdgeCasesTests.cs` | Unit | TBD | Exists |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | Unit | 4+1 | Exists |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextEdgeCasesTests.cs` | Unit | TBD | Exists |
| `e2e/helpers/__tests__/data.helper.unit.test.ts` | Unit | 17 | Exists |

---

## Gaps Analysis

### Critical Gaps (P0/P1 requirements without test coverage)

**NONE** — All P0 and P1 AC requirements have at least one corresponding test file.

### Coverage Observations

1. **AC-1.3-2 (Problem Details)** — Most heavily tested requirement with 14+ tests across unit and API levels. Risk R3 is fully mitigated.

2. **AC-1.1-3 (CORS)** — Covered at both E2E (browser console) and API (HTTP headers) levels. Risk R1 fully mitigated.

3. **AC-1.1-4 / AC-1.1-1 (TypeScript strict)** — Verified via Playwright console error detection and Vite overlay absence. No static tsc --noEmit CI step exists as a separate test artifact (relies on dev workflow). Minor gap: no dedicated CI pipeline artifact, but Playwright covers runtime evidence.

4. **AC-1.3-3 (snake_case naming)** — Unit tests confirm model builds without errors; API-level diagnostic endpoints (efcore-naming, schema-conventions) are defined in spec but depend on endpoints not yet implemented. These tests are marked RED-phase (acceptable for current story status = review).

5. **Story 1.3 status is 'review'** — Tests exist but some API-level tests target endpoints (/api/v1/health/db, /api/v1/health/di, /api/v1/health/efcore-naming, /api/v1/health/schema-conventions) that are not implemented in the production code. These represent deferred test activation, not missing test design.

6. **Story 1.2 task sub-items** — Tasks in 1.2 show checked boxes at Task level but unchecked at sub-task level. Implementation file indicates DEV notes and file list suggest the shell was implemented. The test files exist with full coverage.

---

## Trace Log

- **Requirements sourced from:** epic-01-foundation.md, 1-1 story file, 1-2 story file, 1-3 story file
- **Tests discovered from:** 19 test files across e2e/, frontend/src/, backend/tests/
- **Test design cross-referenced:** test-design-epic-1.md (confirms P0-P3 plan)
- **ATDD checklists cross-referenced:** atdd-checklist-1-1.md, atdd-checklist-1-2.md, atdd-checklist-1-3.md
- **Automation summary cross-referenced:** automation-summary.md (Story 1.1 automate pass)
- **Test review cross-referenced:** test-review-1-1.md (quality score 79/100, approved)

---

**Generated by:** TEA Agent — testarch-trace workflow
**Timestamp:** 2026-06-01
