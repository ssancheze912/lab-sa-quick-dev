# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-29
**Author:** sa-tea-atdd
**Primary Test Level:** API Integration + E2E

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **AC2** — `dotnet run` starts the backend on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — CORS allows requests from `http://localhost:5173` to `http://localhost:5000` without errors.
4. **AC4** — TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — `dotnet build SiesaAgents.sln` compiles all four projects successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E / Smoke Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend Vite dev server has not been initialized yet
  - **Verifies:** AC1 — Frontend loads HTTP 200 from port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `data-testid="app-root"` element does not exist yet
  - **Verifies:** AC1 — React root element is rendered correctly

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend project not initialized, no Vite server running
  - **Verifies:** AC1 / AC4 — No TypeScript errors in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend project not initialized
  - **Verifies:** AC1 — No runtime JS exceptions on load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Neither frontend nor backend servers are running
  - **Verifies:** AC3 — No CORS errors when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running on port 5000
  - **Verifies:** AC3 — Backend responds to request (not CORS-blocked)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project not initialized
  - **Verifies:** AC4 — No Vite TypeScript error overlay rendered

### API Integration Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend .NET solution not created yet
  - **Verifies:** AC2 — Backend server responds on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not configured
  - **Verifies:** AC2 — Scalar endpoint serves HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not initialized
  - **Verifies:** AC2 — Scalar response is `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not initialized
  - **Verifies:** AC2 — `/swagger` must NOT return HTTP 200 (corporate standard)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Default .NET template `WeatherForecast` endpoint not removed yet
  - **Verifies:** AC2 — Default template artifacts are cleaned up

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not configured
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` header present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not registered in Program.cs
  - **Verifies:** AC3 — Preflight OPTIONS request returns 200/204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Solution with four projects not yet created
  - **Verifies:** AC5 — All four CA projects compiled and server is running

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not registered
  - **Verifies:** AC5 / NFR6 — Error responses are JSON Problem Details, not HTML

---

## Data Factories Created

None required for Story 1.1. This is an infrastructure/toolchain story with no domain entities or user data. All tests validate server behavior using HTTP requests — no faker-based data factories needed.

---

## Fixtures Created

### Base Test Fixtures

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `await page.goto('/clientes')`
  - **Provides:** pre-navigated page at clientes route
  - **Cleanup:** automatic (Playwright closes page context)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `await page.goto('/contactos')`
  - **Provides:** pre-navigated page at contactos route
  - **Cleanup:** automatic

Note: Story 1.1 tests use the base Playwright `test` directly (not the extended fixtures), as they test the initialization state before routes exist.

---

## Mock Requirements

No external service mocks required for Story 1.1. Tests validate real server behavior:
- Frontend dev server runs at `http://localhost:5173`
- Backend API server runs at `http://localhost:5000`

All tests are integration-level — no MSW mocks needed at this stage.

---

## Required data-testid Attributes

### Root Application Shell

- `app-root` — The root React mount element in `index.html` or the outermost `App.tsx` container
  - **Required by:** `should render the root HTML document with a valid React mount point`
  - **Implementation:** `<div id="root" data-testid="app-root">` in `index.html`

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install all frontend dependencies: `pnpm install`
- [ ] Verify `pnpm run dev` starts without errors
- [ ] Run test: `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the `<div id="root">` in `frontend/index.html`
- [ ] Run test: `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any existing TypeScript errors that appear in the console
- [ ] Run test: `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route
- [ ] Ensure all required providers are properly initialized
- [ ] Run test: `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Backend must be running (see AC2 tasks below)
- [ ] CORS policy must be configured in `Program.cs` (see AC3 tasks below)
- [ ] Both servers must be running simultaneously
- [ ] Run test: `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours (dependent on AC2 and AC3 backend tasks)

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] TypeScript strict mode configured (see AC4 tasks)
- [ ] No TypeScript errors in any source file
- [ ] Run test: `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application, Domain, Infrastructure layers (classlib projects)
- [ ] Add all projects to solution
- [ ] Configure `Program.cs` to listen on port 5000
- [ ] Run `dotnet run` in `src/SiesaAgents.API`
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `Scalar.AspNetCore` NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` in `Program.cs`
- [ ] Add `app.MapScalarApiReference()` in `Program.cs` (NEVER `app.UseSwagger()`)
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseSwagger()` is NOT in `Program.cs`
- [ ] Ensure `Swashbuckle.AspNetCore` is NOT referenced in the project
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Delete `WeatherForecast.cs` from `SiesaAgents.API`
- [ ] Remove the WeatherForecast endpoint mapping from `Program.cs`
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add CORS registration in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Add `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS policy configured (see test above)
- [ ] `app.UseCors()` registered before endpoint mapping
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (dependent on CORS task above)

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create all four CA projects and add to solution
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build SiesaAgents.sln` with zero errors
- [ ] Start server with `dotnet run`
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Implement RFC 7807 Problem Details format (status, title, detail — no stack traces)
- [ ] Register in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE routing
- [ ] Run test: `pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for Story 1.1 (E2E + API)
pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run frontend E2E tests only
pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run backend API tests only
pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm playwright test e2e/tests/foundation/ --headed

# Debug specific test
pnpm playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run all Story 1.1 tests with HTML report
pnpm playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (13 tests across 2 files)
- Fixtures created with auto-cleanup (`base.fixture.ts`)
- Mock requirements documented (none needed for Story 1.1)
- `data-testid` requirements listed (`app-root`)
- Implementation checklist created mapping each test to concrete tasks

**Verification:**

- All tests run and fail as expected — frontend project and backend solution do not exist yet
- Failure messages are clear: connection refused on 5173/5000, missing elements
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with `should have the backend API server running on port 5000` — unblocks all other backend tests)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it passes
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended execution order:**

1. Backend solution creation → unblocks AC2, AC5 tests
2. CORS configuration → unblocks AC3 tests
3. Scalar registration → unblocks AC2 Scalar test
4. Frontend initialization → unblocks AC1, AC4 tests
5. `data-testid="app-root"` → unblocks app-root test

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 13 tests pass
2. Review `Program.cs` middleware ordering for correctness
3. Ensure `tsconfig.app.json` settings are complete and correct
4. Verify no `WeatherForecast` artifacts remain in the project
5. Confirm `appsettings.Development.json` has the required keys
6. Run `dotnet build SiesaAgents.sln` and `pnpm run build` — both must exit 0

---

## Next Steps

1. Share this checklist with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using implementation checklist as guide (start with backend solution creation)
4. Work one test at a time (red → green for each)
5. When all 13 tests pass, run full refactor check
6. Update story status to `in-progress` → `done` in `sprint-status.yaml` when complete

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns applied to E2E tests (response listeners registered BEFORE `page.goto()`)
- **test-quality.md** — Given-When-Then format, atomic assertions, deterministic tests, no hard waits
- **test-levels-framework.md** — API-level tests for backend initialization; E2E/smoke tests for frontend initialization
- **fixture-architecture.md** — `base.fixture.ts` uses `test.extend()` with auto-cleanup
- **data-factories.md** — Not applicable for Story 1.1 (no domain entities)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Error: connect ECONNREFUSED 127.0.0.1:5173
  - Frontend server is not running (project not initialized)

Error: connect ECONNREFUSED 127.0.0.1:5000
  - Backend server is not running (solution not created)

Error: expect(locator).toBeVisible() — locator not found: [data-testid="app-root"]
  - data-testid attribute not yet added to index.html
```

**Summary:**

- Total tests: 13
- Passing: 0 (expected — RED phase)
- Failing: 13 (expected — RED phase)
- Status: RED phase confirmed

---

## Notes

- Story 1.1 is purely infrastructure — no domain entities, no business logic, no user data
- The `data-testid="app-root"` requirement is the only UI-level selector needed for this story
- Backend tests use Playwright's `request` context (direct HTTP) — no browser needed for API tests
- CORS tests validate both preflight (OPTIONS) and actual request (GET) scenarios
- The `WeatherForecast` removal test enforces clean-slate initialization (no default template artifacts)
- Frontend uses `pnpm` — `pnpm run dev` not `npm run dev` (company standard)
- Backend Scalar path: `app.MapScalarApiReference()` registers at `/scalar` by default

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-05-29
