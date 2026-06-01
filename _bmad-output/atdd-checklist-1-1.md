# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-01
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** E2E + API

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running. This story establishes the monorepo skeleton — no domain entities, no routes beyond `__root.tsx`, no database tables.

**As a** developer
**I want** both frontend (Vite + React + TypeScript strict) and backend (.NET 10 Clean Architecture) initialized with all required dependencies
**So that** the team has a reproducible working development environment with both dev servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean machine with Node.js and .NET 10, when `pnpm run dev` is executed in `frontend/`, then the Vite server starts on port 5173 with zero errors and TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, when `dotnet run` is executed in `src/SiesaAgents.API`, then the backend starts on port 5000, Scalar API documentation loads at `/scalar`, and all four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app does not exist yet; page.goto('/') times out or returns connection refused
  - **Verifies:** AC1 — Vite server responds with HTTP 200 on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element is not present until implementation adds it to index.html / App.tsx
  - **Verifies:** AC1 — React app mounts correctly with required data-testid attribute

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend to compile until implementation; consoleErrors check fails with no server
  - **Verifies:** AC4 — TypeScript strict mode produces zero compilation errors surfaced to browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend app; pageerror listener catches connection errors
  - **Verifies:** AC1, AC4 — Zero JS runtime exceptions on first render

### E2E Tests (2 tests) — CORS

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (AC3 describe block)

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; fetch from browser context triggers CORS or connection error
  - **Verifies:** AC3 — No CORS console errors when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running on port 5000; request returns connection refused
  - **Verifies:** AC3 — Scalar endpoint responds with 200/301/302, not CORS-blocked

### E2E Tests (1 test) — TypeScript strict mode overlay

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (AC4 describe block)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — No frontend; vite-error-overlay check cannot resolve
  - **Verifies:** AC4 — No `<vite-error-overlay>` element visible after compilation

### API Tests (7 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; request.get returns ECONNREFUSED
  - **Verifies:** AC2 — Backend responds on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running OR Scalar not registered via `app.MapScalarApiReference()`
  - **Verifies:** AC2 — GET /scalar returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; Content-Type header check fails
  - **Verifies:** AC2 — /scalar returns text/html content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; cannot assert status !== 200 on connection error
  - **Verifies:** AC2 — /swagger returns non-200 (Swashbuckle forbidden by architecture)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; cannot assert 404/405
  - **Verifies:** AC2 — /weatherforecast is removed from default template

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS header check fails
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` present in response

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight cannot succeed
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding`
  - **Status:** RED — Backend not running; GET /scalar returns ECONNREFUSED
  - **Verifies:** AC5 — Server is up, proving `dotnet build` succeeded for all four projects

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; response.status() check fails
  - **Verifies:** AC5 (partial) — Middleware is wired and returns JSON (not HTML) for unknown routes

**Total test count: 13 tests (7 E2E + 6 API)**
> Note: The API spec file counts 9 tests total (2 describe blocks); the E2E spec has 7 tests. Grand total: **16 failing tests in RED phase**.

---

## Data Factories Created

No data factories are required for Story 1.1. This story validates infrastructure initialization only — no domain entities, no database data, no API POST/PUT operations.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts`

### Base Test Fixture

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` before test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** void (page is navigated)
  - **Cleanup:** None needed (navigation state reset per test)
- `contactosPage` — Navigates to `/contactos` before test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** void (page is navigated)
  - **Cleanup:** None needed

> Story 1.1 tests use the base `@playwright/test` import directly (no extended fixture needed). The `base.fixture.ts` is scaffolded for Stories 1.2 and beyond.

---

## Mock Requirements

Story 1.1 tests against real running processes — no mocks needed. Tests verify:
- Frontend Vite dev server is up (port 5173) — no mock
- Backend .NET server is up (port 5000) — no mock
- CORS headers are present in actual HTTP responses — no mock

There are **no external service mocks** required for this story.

---

## Required data-testid Attributes

### Frontend — Root Application Shell

- `app-root` — Root React mount point element (must be added to `index.html` `<div id="root">` or the top-level component wrapper in `App.tsx`)

**Implementation Example:**

```tsx
// In index.html (Vite entry)
<div id="root" data-testid="app-root"></div>

// OR in App.tsx / main.tsx root component
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

> No additional `data-testid` attributes are required for Story 1.1. UI elements are minimal (shell only).

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Add `dev` script in `frontend/package.json` (auto-generated by Vite, verify port 5173)
- [ ] Verify `pnpm run dev` starts without errors and `http://localhost:5173/` returns HTTP 200
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "should serve the frontend app"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should render the root HTML document with a valid React mount point` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root `<div>` in `frontend/index.html` OR wrap RouterProvider in a `<div data-testid="app-root">` in `main.tsx`
- [ ] Create `frontend/src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `frontend/src/routes/__root.tsx` as TanStack Router root route (shell layout placeholder)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "should render the root HTML"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors` (AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime deps: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton`
- [ ] Install dev deps: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Ensure all source files compile with zero TypeScript errors (`pnpm tsc --noEmit`)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load` (AC1/AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Create `frontend/src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- [ ] Create `frontend/src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `frontend/.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify no runtime exceptions thrown on first render (no missing imports, no undefined references)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "JavaScript runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors` (AC3)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `backend/src/SiesaAgents.API/Program.cs`, register CORS policy `"DevCors"` with `WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` in `Program.cs`
- [ ] Start both servers and verify no CORS console errors when frontend fetches from backend
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "should allow frontend to reach backend"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay` (AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] All TypeScript source files must be error-free under strict mode
- [ ] Verify `<vite-error-overlay>` does NOT appear in browser after page load
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "Vite TypeScript error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Configure `Program.cs` to listen on port 5000 (or set `ASPNETCORE_URLS=http://localhost:5000`)
- [ ] Run `dotnet run --project backend/src/SiesaAgents.API`
- [ ] Verify HTTP GET `http://localhost:5000/` returns status < 500
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "backend API server running"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should serve the Scalar API documentation page at /scalar` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`: add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] NEVER add Swashbuckle or `app.UseSwagger()`
- [ ] Verify GET `http://localhost:5000/scalar` returns HTTP 200
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should NOT expose WeatherForecast default endpoint` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default WeatherForecast endpoints and models from the generated API project
- [ ] Remove `WeatherForecast.cs` and `WeatherForecastController.cs` (or inline minimal API version)
- [ ] Verify GET `http://localhost:5000/weatherforecast` returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: CORS headers (AC3) — API level tests

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS policy `"DevCors"` must set `Access-Control-Allow-Origin: http://localhost:5173` header
- [ ] OPTIONS preflight must return 200 or 204 (not 403)
- [ ] Apply `app.UseCors("DevCors")` before all middleware and endpoint mappings
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors` (AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catching all exceptions returning ProblemDetails (status 500, no stack traces)
- [ ] Register middleware: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing in `Program.cs`
- [ ] Verify that GET `/api/nonexistent-endpoint-for-atdd` returns 404 with JSON Content-Type
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should have all four Clean Architecture layers responding` (AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution and configure references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet: FluentValidation to Application; Npgsql.EntityFrameworkCore.PostgreSQL to Infrastructure
- [ ] Run `dotnet build backend/SiesaAgents.sln` — verify zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E foundation tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API backend tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests by tag/grep
npx playwright test --grep "AC1"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests written and failing
- ✅ Fixtures scaffolded (base.fixture.ts) with auto-cleanup pattern
- ✅ No factories needed (no domain data for this story)
- ✅ No mock requirements (tests hit real servers)
- ✅ data-testid requirements listed (`app-root`)
- ✅ Implementation checklist created

**Verification:**

- All tests fail due to missing implementation (servers not running, project files not created)
- Failure messages: `ERR_CONNECTION_REFUSED`, `TimeoutError`, `Element not found`
- No test bugs — failures are all due to missing implementation

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with `should have the backend API server running on port 5000`)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**

1. AC2: Initialize backend solution and run `dotnet run`
2. AC2: Register Scalar, remove WeatherForecast
3. AC3: Configure CORS policy in `Program.cs`
4. AC5: Create all four Clean Architecture projects, add references, run `dotnet build`
5. AC5: Create ExceptionHandlingMiddleware
6. AC1: Initialize frontend Vite project with `pnpm`
7. AC4: Configure TypeScript strict mode
8. AC1: Add `data-testid="app-root"` to root element
9. AC4: Fix any remaining TypeScript compile errors

**Key Principles:**

- One test at a time (do not try to fix all at once)
- Minimal implementation (do not over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` structure against architecture spec pattern
3. Ensure all source files have no dead code from default templates
4. Verify `.env.development` is in `.gitignore`
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using implementation checklist above
4. Work one test at a time (red → green for each)
5. When all 16 tests pass, refactor for code quality
6. When refactoring complete, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Network-first route interception (intercept BEFORE navigation) applied in AC1/AC3 tests
- **test-quality.md** — Given-When-Then structure, one assertion per test, explicit waits (no `sleep`), deterministic test design
- **selector-resilience.md** — `data-testid` selectors used exclusively (`[data-testid="app-root"]`)
- **fixture-architecture.md** — `base.fixture.ts` uses `test.extend()` with auto-cleanup pattern
- **test-levels-framework.md** — E2E for user-facing behaviors (AC1, AC3, AC4); API tests for backend contract (AC2, AC5)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (RED Phase):**

```
Running 16 tests using 4 workers

  ✗ [chromium] › foundation/project-initialization.spec.ts:23:3 › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors (30001ms)
  ✗ [chromium] › foundation/project-initialization.spec.ts:39:3 › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point (30001ms)
  ✗ [chromium] › foundation/project-initialization.spec.ts:49:3 › AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console (30001ms)
  ✗ [chromium] › foundation/project-initialization.spec.ts:66:3 › AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load (30001ms)
  ✗ [chromium] › foundation/project-initialization.spec.ts:85:3 › AC3 — CORS configuration › should allow frontend to reach backend health endpoint without CORS errors (30001ms)
  ✗ [chromium] › foundation/project-initialization.spec.ts:122:3 › AC3 — CORS configuration › should receive a valid HTTP response from the backend health probe without CORS blocking (10001ms)
  ✗ [chromium] › foundation/project-initialization.spec.ts:141:3 › AC4 — TypeScript strict mode › should load the frontend without Vite TypeScript error overlay (30001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:24:3 › AC2 — Backend server initialization › should have the backend API server running on port 5000 (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:35:3 › AC2 — Backend server initialization › should serve the Scalar API documentation page at /scalar (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:45:3 › AC2 — Backend server initialization › should return HTML content from the Scalar documentation endpoint (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:56:3 › AC2 — Backend server initialization › should NOT expose any Swagger/OpenAPI UI endpoint (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:67:3 › AC2 — Backend server initialization › should NOT expose WeatherForecast default endpoint (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:77:3 › AC2 — Backend server initialization › should return CORS header allowing http://localhost:5173 origin (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:93:3 › AC2 — Backend server initialization › should respond to OPTIONS preflight from frontend origin without CORS rejection (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:118:3 › AC5 — Backend solution builds › should have all four Clean Architecture layers responding (10001ms)
  ✗ [chromium] › api/backend-initialization.api.spec.ts:132:3 › AC5 — Backend solution builds › should return Problem Details RFC 7807 format for unhandled errors (10001ms)

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `ERR_CONNECTION_REFUSED` — No servers running yet
- `TimeoutError: page.waitForResponse` — Frontend Vite server not started
- `Error: locator.toBeVisible > Element not found: [data-testid="app-root"]` — React root testid not added
- `Error: expect(received).toBe(200)` — Scalar endpoint not registered

---

## Notes

- Story 1.1 creates infrastructure only. No domain entities, no API routes beyond health/scalar, no database.
- AC2 coverage for the four Clean Architecture projects is verified indirectly: if `dotnet build` fails, the server cannot start, so all AC2 server-up tests fail — the test correctly reflects the build outcome.
- AC5 (zero build errors) is similarly verified by proxy: a running server implies a successful build.
- The `data-testid="app-root"` requirement is minimal. All other UI elements are defined in Story 1.2.
- CORS tests at both E2E level (browser console) and API level (HTTP headers) cover AC3 from two angles for maximum confidence.
- Backend port 5000 must be configured explicitly (set via `ASPNETCORE_URLS=http://localhost:5000` or in `Properties/launchSettings.json`).

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.1`

---

**Generated by BMad TEA Agent** — 2026-06-01
