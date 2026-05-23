# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-21
**Author:** TEA Agent (gaduranb@siesa.com)
**Primary Test Level:** API / E2E + File-System Structural

---

## Story Summary

Story 1.1 establishes the full development skeleton for Siesa Agents CRM. No domain logic
exists at this stage — the goal is to have both the Vite/React/TypeScript frontend and the
.NET 10 Clean Architecture backend initialized, configured, and running together with CORS enabled.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean dev machine, When `pnpm run dev` is executed in `frontend/`, Then the Vite server starts on port 5173 with no errors and TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When `dotnet run` executes in `src/SiesaAgents.API`, Then the backend starts on port 5000, Scalar loads at `/scalar`, and all four CA projects are referenced in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` with no console errors.

4. **AC4** — Given the frontend project is initialized, When `tsc --noEmit` runs, Then it exits with code 0 and zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` executes, Then all four projects compile with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E / Browser Tests — 8 tests

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend server not running (frontend/ not yet initialized)
  - **Verifies:** AC1 — Vite dev server responds HTTP 200 on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist yet
  - **Verifies:** AC1 — React root mount point present

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — frontend not running
  - **Verifies:** AC4 — No TypeScript errors in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — frontend not running
  - **Verifies:** AC1 — Clean runtime, no JS exceptions

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — both servers not running
  - **Verifies:** AC3 — No CORS console errors when frontend calls backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend not running
  - **Verifies:** AC3 — Backend responds (not CORS-blocked)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — frontend not running
  - **Verifies:** AC4 — No Vite TypeScript error overlay visible

**Total: 7 tests in project-initialization.spec.ts**

---

### API Tests — 8 tests

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — backend server not running
  - **Verifies:** AC2 — Backend responds on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — backend not running, Scalar not configured
  - **Verifies:** AC2 — Scalar loads at `/scalar`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — Scalar returns text/html content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not running (will also validate corporate standard)
  - **Verifies:** AC2 + corporate standard — No Swagger endpoint

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — Default template endpoint removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — backend not running
  - **Verifies:** AC3 — Access-Control-Allow-Origin header present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — backend not running
  - **Verifies:** AC3 — OPTIONS preflight returns 200/204

- **Test:** `should have all four Clean Architecture layers responding`
  - **Status:** RED — backend not running
  - **Verifies:** AC5 — Solution compiled (server running proves build success)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — Problem Details middleware wired

**Total: 9 tests in backend-initialization.api.spec.ts**

---

### Structural / File-System Tests — 21 tests

**File:** `e2e/tests/foundation/frontend-configuration.spec.ts`

- **Test:** `should have a frontend directory at the project root`
  - **Status:** RED — `frontend/` directory does not exist
  - **Verifies:** AC1 — Frontend project initialized at correct path

- **Test:** `should have a tsconfig.app.json file in the frontend directory`
  - **Status:** RED — `frontend/` does not exist
  - **Verifies:** AC4 — tsconfig.app.json present

- **Test:** `should have strict:true enabled in tsconfig.app.json`
  - **Status:** RED — file does not exist
  - **Verifies:** AC4 — strict flag set to true

- **Test:** `should have noImplicitAny:true in tsconfig.app.json`
  - **Status:** RED — file does not exist
  - **Verifies:** AC4 — noImplicitAny active

- **Test:** `should have strictNullChecks:true in tsconfig.app.json`
  - **Status:** RED — file does not exist
  - **Verifies:** AC4 — strictNullChecks active

- **Test:** `should have package.json in frontend directory`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC1 — Frontend initialized

- **Test:** `should use pnpm as package manager (pnpm-lock.yaml must exist)`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC1 + company standard — pnpm used, not npm or yarn

- **Test:** `should have vite.config.ts with @tailwindcss/vite plugin configured`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1 — TailwindCSS v4 via @tailwindcss/vite

- **Test:** `should have vite.config.ts with @tanstack/router-plugin/vite configured`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1 — TanStack Router plugin in Vite config

- **Test:** `should have .env.development with VITE_API_URL set to http://localhost:5000`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1/AC3 — Axios base URL configured correctly

- **Test:** `should have src/shared/lib/apiClient.ts with correct Axios configuration`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1 — Axios client uses VITE_API_URL

- **Test:** `should have src/shared/lib/queryClient.ts with QueryClient singleton`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1 — TanStack Query client configured

- **Test:** `should have src/routes/__root.tsx as the TanStack Router root route`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1 — Router root route present

- **Test:** `should have src/app/providers/QueryProvider.tsx wrapping QueryClientProvider`
  - **Status:** RED — file does not exist
  - **Verifies:** AC1 — QueryProvider wraps app

**Total: 14 tests in frontend-configuration.spec.ts**

---

**File:** `e2e/tests/foundation/backend-structure.spec.ts`

- **Test:** `should have a backend directory at the project root`
  - **Status:** RED — `backend/` directory does not exist
  - **Verifies:** AC2 — Backend initialized at correct path

- **Test:** `should have SiesaAgents.sln at backend root`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC2 — Solution file exists

- **Test:** `should have SiesaAgents.API project in src/`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC2/AC5 — API project present

- **Test:** `should have SiesaAgents.Application project in src/`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC2/AC5 — Application layer present

- **Test:** `should have SiesaAgents.Domain project in src/`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC2/AC5 — Domain layer present

- **Test:** `should have SiesaAgents.Infrastructure project in src/`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC2/AC5 — Infrastructure layer present

- **Test:** `should have SiesaAgents.UnitTests project in tests/`
  - **Status:** RED — directory does not exist
  - **Verifies:** AC5 — Unit test project scaffolded

- **Test:** `should reference all four project layers in SiesaAgents.sln`
  - **Status:** RED — solution file does not exist
  - **Verifies:** AC2 — All four layers referenced in .sln

- **Test:** `should have Program.cs in SiesaAgents.API using Scalar (not Swagger)`
  - **Status:** RED — file does not exist
  - **Verifies:** AC2 + corporate standard — Scalar, not Swagger

- **Test:** `should have ExceptionHandlingMiddleware in SiesaAgents.API/Middleware/`
  - **Status:** RED — file does not exist
  - **Verifies:** AC2 — Middleware file present

- **Test:** `should have ExceptionHandlingMiddleware registered before endpoint mapping in Program.cs`
  - **Status:** RED — file does not exist
  - **Verifies:** AC2 — Correct middleware order

- **Test:** `should have CORS policy configured with http://localhost:5173 as allowed origin in Program.cs`
  - **Status:** RED — file does not exist
  - **Verifies:** AC3 — CORS origin explicitly configured

- **Test:** `should have appsettings.Development.json with ConnectionStrings and AllowedOrigins`
  - **Status:** RED — file does not exist
  - **Verifies:** AC2 — Dev settings present

**Total: 13 tests in backend-structure.spec.ts**

---

## Data Factories Created

Not applicable for Story 1.1 — no domain entities exist at this stage.
The story creates infrastructure only (project skeleton, config files, no data models).

---

## Fixtures Created

Existing shared fixture reused:

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before test (used by Story 1.2+)
- `contactosPage` — navigates to `/contactos` before test (used by Story 1.2+)

No new fixtures required for Story 1.1 (no UI pages to navigate).

---

## Mock Requirements

No mocking required for Story 1.1. All tests interact with:
- The real Vite dev server (localhost:5173)
- The real .NET backend (localhost:5000)
- The real file system (structural validation tests)

---

## Required data-testid Attributes

### App Root (index.html / main.tsx / App.tsx)

- `app-root` — The top-level React root element; required by `project-initialization.spec.ts`

**Implementation Example:**
```tsx
// src/main.tsx or public/index.html
<div id="root" data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Tests: frontend-configuration.spec.ts (14 tests — AC1 + AC4)

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Run `pnpm install` inside `frontend/` (creates pnpm-lock.yaml)
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `frontend/vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `frontend/.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `frontend/src/shared/lib/apiClient.ts` with `axios.create({ baseURL: import.meta.env.VITE_API_URL })`
- [ ] Create `frontend/src/shared/lib/queryClient.ts` exporting singleton `QueryClient` with `staleTime: 1000 * 60`
- [ ] Create `frontend/src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `frontend/src/routes/__root.tsx` as root route layout placeholder
- [ ] Create `frontend/src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to root element in `index.html` or `main.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/frontend-configuration.spec.ts`
- [ ] All 14 tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Tests: backend-structure.spec.ts (13 tests — AC2 + AC5)

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents -o backend`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o backend/tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution file
- [ ] Add NuGet package: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `backend/src/SiesaAgents.API/Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoints from generated API project
- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` with Problem Details pattern
- [ ] Register `UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE `MapScalarApiReference()` in `Program.cs`
- [ ] Add CORS policy `AddCors` with `WithOrigins("http://localhost:5173")` in `Program.cs`
- [ ] Call `app.UseCors("DevCors")` before endpoint mappings in `Program.cs`
- [ ] Create `backend/src/SiesaAgents.API/appsettings.Development.json` with `ConnectionStrings.DefaultConnection` and `AllowedOrigins` array
- [ ] Run test: `npx playwright test e2e/tests/foundation/backend-structure.spec.ts`
- [ ] All 13 tests pass (green phase)

**Estimated Effort:** 3.0 hours

---

### Tests: backend-initialization.api.spec.ts (9 tests — AC2 + AC3 + AC5)

**Tasks to make these tests pass:**

- [ ] Start backend: `cd backend && dotnet run --project src/SiesaAgents.API`
- [ ] Verify backend starts on port 5000 (`http://localhost:5000`)
- [ ] Confirm `GET /scalar` returns HTTP 200 with `text/html` content type
- [ ] Confirm `GET /swagger` returns 404 (not 200)
- [ ] Confirm `GET /weatherforecast` returns 404 or 405
- [ ] Confirm `GET /scalar` with `Origin: http://localhost:5173` returns `Access-Control-Allow-Origin` header
- [ ] Confirm `OPTIONS /scalar` with Origin header returns 200 or 204
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] All 9 tests pass (green phase)

**Estimated Effort:** 1.0 hour

---

### Tests: project-initialization.spec.ts (7 tests — AC1 + AC3 + AC4)

**Tasks to make these tests pass:**

- [ ] Start frontend: `cd frontend && pnpm run dev` (port 5173)
- [ ] Verify `GET http://localhost:5173/` returns HTTP 200
- [ ] Add `data-testid="app-root"` to root element
- [ ] Verify no TypeScript errors in browser console on load
- [ ] Verify Vite TypeScript error overlay is absent
- [ ] Verify no JavaScript runtime errors on initial page load
- [ ] With both servers running, verify frontend can call backend without CORS errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] All 7 tests pass (green phase)

**Estimated Effort:** 0.5 hours (after implementation complete)

---

## Running Tests

```bash
# Run ALL Story 1.1 tests
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts

# Run structural tests only (no servers required)
npx playwright test e2e/tests/foundation/frontend-configuration.spec.ts e2e/tests/foundation/backend-structure.spec.ts

# Run server-dependent tests (requires both servers running)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Debug specific test
npx playwright test e2e/tests/foundation/frontend-configuration.spec.ts --debug

# Run with HTML report
npx playwright test e2e/tests/foundation/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 43 tests written and failing
- No implementation exists (`frontend/` and `backend/` directories absent)
- Failures are due to missing implementation, not test defects
- data-testid requirements documented

### GREEN Phase (DEV Team — Next Steps)

1. Pick one failing test from the implementation checklist above (start with highest-priority structural tests)
2. Read the test to understand exactly what implementation is required
3. Write the minimal code to make that test pass
4. Run the specific test file to verify it is now green
5. Check off the task in this checklist
6. Move to the next test and repeat

**Recommended order:**
1. backend-structure.spec.ts (no servers needed — fast feedback)
2. frontend-configuration.spec.ts (no servers needed — fast feedback)
3. backend-initialization.api.spec.ts (requires running backend)
4. project-initialization.spec.ts (requires both servers running)

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 43 tests pass
2. Review `Program.cs` for readability
3. Extract CORS origins to `appsettings.Development.json` (read from config in Program.cs)
4. Verify tsconfig paths are optimized
5. Run full test suite again after each refactor step

---

## Next Steps

1. Share this checklist with the dev workflow
2. Run RED phase verification: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using the checklist above as a roadmap
4. Work one test group at a time (structural first, then server-dependent)
5. When all 43 tests pass, run full suite and mark story as done in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first pattern** — Route intercept (`page.waitForResponse`) registered BEFORE `page.goto()` in all E2E tests
- **Given-When-Then format** — Applied to all 43 tests via inline comments
- **data-testid selectors** — `[data-testid="app-root"]` used exclusively in browser selectors
- **No hard waits** — `waitForLoadState('networkidle')` and `waitForResponse` used exclusively
- **test-levels framework** — Structural/file-system tests mapped to a validation layer separate from runtime E2E
- **test-quality principles** — One assertion per test, deterministic, no shared state

---

## Test Execution Evidence

**Expected initial run (RED phase):**

```
Running 43 tests using 4 workers

  e2e/tests/foundation/frontend-configuration.spec.ts
    ✗ should have a frontend directory at the project root
      Error: expect(received).toBe(true) — frontend/ does not exist

  e2e/tests/foundation/backend-structure.spec.ts
    ✗ should have a backend directory at the project root
      Error: expect(received).toBe(true) — backend/ does not exist

  e2e/tests/api/backend-initialization.api.spec.ts
    ✗ should have the backend API server running on port 5000
      Error: connect ECONNREFUSED 127.0.0.1:5000

  e2e/tests/foundation/project-initialization.spec.ts
    ✗ should serve the frontend app on port 5173 without errors
      Error: connect ECONNREFUSED 127.0.0.1:5173

  ...

  43 failed
  0 passed
```

- Total tests: 43
- Passing: 0 (expected)
- Failing: 43 (expected)
- Status: RED phase confirmed

---

**Generated by BMad TEA Agent** — 2026-05-21
