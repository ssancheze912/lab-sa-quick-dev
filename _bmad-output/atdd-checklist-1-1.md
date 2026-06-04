# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-04
**Author:** SiesaTeam
**Primary Test Level:** API (Integration) + E2E

---

## Story Summary

This story initializes the full-stack project skeleton: a Vite react-ts frontend and a .NET 10 Clean Architecture backend. The developer must be able to run both servers locally with TypeScript strict mode active, Scalar API documentation available, and CORS correctly configured between the two origins.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Vite server not yet initialized; HTTP 200 not guaranteed before `pnpm run dev` setup
  - **Verifies:** AC1 — Frontend serves root at port 5173 with HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` does not exist until implementation adds it to `index.html` or `App.tsx`
  - **Verifies:** AC1 — React root element is present and visible

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — TypeScript strict mode not yet configured; potential TS errors surface in browser console
  - **Verifies:** AC4 — No `[TypeScript]` or `TS` error strings appear in console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Page will error until `RouterProvider` and `QueryProvider` are wired in `main.tsx`
  - **Verifies:** AC1 / AC4 — No `pageerror` events thrown on initial load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — CORS policy not yet registered; browser-context fetch to `http://localhost:5000` will be blocked
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend server not yet running
  - **Verifies:** AC3 — Backend responds with 200, 301, or 302 (not blocked)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — TypeScript strict flags not yet in `tsconfig.app.json`; Vite error overlay may appear
  - **Verifies:** AC4 — `vite-error-overlay` custom element has count 0

---

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not yet initialized; connection refused
  - **Verifies:** AC2 — Server responds with status < 500 at `http://localhost:5000/`

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not yet called in `Program.cs`
  - **Verifies:** AC2 — GET `/scalar` returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Scalar not configured; content-type will not be `text/html`
  - **Verifies:** AC2 — `content-type` header includes `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Default webapi template may include Swagger; must be removed
  - **Verifies:** AC2 — GET `/swagger` does NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Default `dotnet new webapi` includes WeatherForecast which must be removed
  - **Verifies:** AC2 — GET `/weatherforecast` returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — `AddCors` / `UseCors("DevCors")` not yet configured in `Program.cs`
  - **Verifies:** AC3 — `access-control-allow-origin` header equals `http://localhost:5173` or `*`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend solution not yet built; server not running
  - **Verifies:** AC5 — Server is up, implying `dotnet build SiesaAgents.sln` succeeded

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet created or registered
  - **Verifies:** AC5 — Unhandled 404 returns `content-type: application/json` (not HTML)

---

### Component Tests

Not applicable for this story. Story 1.1 establishes the project skeleton with no UI components beyond the root mount point. Component-level ATDD will begin in Story 1.2 (Frontend Navigation Shell).

---

## Data Factories Created

Story 1.1 tests infrastructure setup, not domain data. No data factories are required for these tests.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` factories for future stories. These factories are already in place and do not need modification.

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures. Story 1.1 tests do not use page-level fixtures — they test raw server responses and browser behavior on the root URL.

No additional fixtures are required for Story 1.1.

---

## Mock Requirements

Story 1.1 tests validate real server behavior (no mocks). Both servers must be running:

### Frontend Dev Server
- **Command:** `pnpm --filter frontend dev`
- **URL:** `http://localhost:5173`
- **Notes:** Playwright `webServer` block in `playwright.config.ts` handles startup automatically

### Backend API Server
- **Command:** `dotnet run` inside `src/SiesaAgents.API`
- **URL:** `http://localhost:5000`
- **Notes:** Must be started manually before running API tests. Tests use `process.env.API_BASE_URL ?? 'http://localhost:5000'`

---

## Required data-testid Attributes

### Root Application (index.html or App.tsx)

- `app-root` — The top-level React mount container. Must be added to the `<div id="root">` in `index.html` or the root `<div>` in `App.tsx`.

**Implementation Example:**

```tsx
// Option A: index.html
<div id="root" data-testid="app-root"></div>

// Option B: App.tsx root element
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

**Note:** No other `data-testid` attributes are required for Story 1.1. All further attributes are defined starting in Story 1.2.

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Verify `pnpm run dev` starts without errors and is accessible at `http://localhost:5173`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "port 5173"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root `<div>` in `frontend/index.html` or `frontend/src/App.tsx`
- [ ] Create `frontend/src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `frontend/src/routes/__root.tsx` as TanStack Router root route placeholder
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "React mount point"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors surfaced by the compiler after enabling strict mode
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Create `frontend/src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Install dependencies: `pnpm add @tanstack/react-router @tanstack/react-query`
- [ ] Wire `RouterProvider` inside `QueryProvider` in `main.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, add `builder.Services.AddCors(...)` with policy `"DevCors"` allowing origin `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and all endpoint mappings
- [ ] Verify no CORS errors in browser console when fetching `http://localhost:5000/scalar`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Start backend with `dotnet run` from `src/SiesaAgents.API`
- [ ] Verify `http://localhost:5000/scalar` returns 200, 301, or 302
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "health probe"`
- [ ] Test passes (green phase)

**Estimated Effort:** Covered by AC2 tasks

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files are TypeScript-valid under strict mode (zero `any` types)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] Test passes (green phase)

**Estimated Effort:** Covered by AC4 tasks

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add Scalar.AspNetCore: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure minimal `Program.cs` (no WeatherForecast, no Swashbuckle)
- [ ] Run `dotnet run` and verify server starts on port 5000
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `builder.Services.AddOpenApi()` to `Program.cs`
- [ ] Add `app.MapScalarApiReference()` to `Program.cs`
- [ ] Verify `http://localhost:5000/scalar` returns HTTP 200 with `text/html` content
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure Swashbuckle is NOT installed in `SiesaAgents.API.csproj`
- [ ] Ensure `app.UseSwagger()` is NOT called anywhere in `Program.cs`
- [ ] Verify `http://localhost:5000/swagger` returns non-200 (404 expected)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove `WeatherForecastController.cs` (or the inline minimal API endpoints) from generated project
- [ ] Remove `WeatherForecast.cs` model file if it exists
- [ ] Verify `http://localhost:5000/weatherforecast` returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy `"DevCors"` with `WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Call `app.UseCors("DevCors")` before `app.MapScalarApiReference()`
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json` with `http://localhost:5173`
- [ ] Verify `access-control-allow-origin` response header is present when `Origin: http://localhost:5173` is sent
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `app.UseCors()` is registered BEFORE `app.MapScalarApiReference()` and routing
- [ ] Test OPTIONS preflight returns 200 or 204
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] Test passes (green phase)

**Estimated Effort:** Covered by CORS tasks

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to `SiesaAgents.sln`
- [ ] Wire project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build SiesaAgents.sln` — verify zero errors
- [ ] Run `dotnet run` — verify server starts
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (catch-all returning `ProblemDetails` with status 500)
- [ ] Register with `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing
- [ ] Verify GET `/api/nonexistent-endpoint-for-atdd` returns status 404 with `content-type: application/json` (not HTML)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.75 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests (E2E + API)
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts

# Run only frontend E2E tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only backend API tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run a single test by name
npx playwright test --grep "should serve the Scalar API documentation page"

# Run with HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 16 tests written and failing (E2E + API)
- Test files placed in `e2e/tests/foundation/` and `e2e/tests/api/`
- Supporting fixtures (`e2e/fixtures/base.fixture.ts`) and helpers (`e2e/helpers/`) in place
- Mock requirements documented (real servers required — no mocks for infrastructure tests)
- Required `data-testid` attributes listed (`app-root`)
- Implementation checklist created with clear per-test task lists

**Verification:**

- All tests fail because neither the frontend nor backend project directories exist yet
- Failure mode: `ERR_CONNECTION_REFUSED` for backend tests; missing `data-testid` or navigation errors for frontend tests
- No test fails due to a bug in the test itself — all failures are "missing implementation"

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist above (recommended order: backend first, then frontend)
2. Read the test to understand the expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to the next test

**Recommended implementation order:**

1. Backend server on port 5000 (AC2 baseline)
2. Scalar API docs at `/scalar` (AC2)
3. Remove WeatherForecast and Swagger (AC2)
4. CORS configuration (AC3)
5. Clean Architecture solution structure (AC5)
6. ExceptionHandlingMiddleware (AC5 / Story 1.3 prep)
7. Frontend Vite project (AC1)
8. TypeScript strict mode (AC4)
9. React root mount with `data-testid="app-root"` (AC1)
10. `main.tsx` wiring `RouterProvider` + `QueryProvider` (AC1)

**Key Principles:**

- One test at a time — do not try to fix all simultaneously
- Minimal implementation — do not over-engineer for this story
- Run tests frequently for immediate feedback

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for readability and adherence to architecture standards
3. Ensure all TypeScript files pass strict mode with no suppression comments
4. Verify folder structure matches the layout in `Dev Notes` of the story file
5. Ensure tests still pass after any refactoring

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Review this checklist in standup or planning
3. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
4. Begin implementation using the implementation checklist above as guide
5. Work one test at a time (red → green for each)
6. Share progress in daily standup
7. When all tests pass, refactor code for quality
8. When refactoring complete, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()` (applied in `e2e/fixtures/base.fixture.ts`)
- **data-factories.md** — Factory patterns for random test data (applied in `e2e/helpers/data.helper.ts`; Story 1.1 tests do not require factories)
- **network-first.md** — Route interception before navigation (applied in AC1 tests that use `page.waitForResponse()` before `page.goto()`)
- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic waits — all applied throughout both test files
- **test-levels-framework.md** — E2E selected for frontend browser behavior (AC1, AC3, AC4); API tests selected for backend contract validation (AC2, AC5)
- **selector-resilience.md** — `data-testid="app-root"` as the only UI selector for this story; no fragile CSS selectors used

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
  16 failed

  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:27:3
    AC2 — Backend server initialization and Scalar API documentation
    › should have the backend API server running on port 5000
    Error: connect ECONNREFUSED 127.0.0.1:5000

  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:23:3
    AC1 — Frontend Vite server initialization
    › should serve the frontend app on port 5173 without errors
    Error: No webServer is running / ERR_CONNECTION_REFUSED

  ... (all 16 tests fail for similar infrastructure-missing reasons)
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase — all failures are due to missing implementation, not test bugs

**Expected Failure Messages:**

- Backend API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000` — server not started
- Frontend E2E tests (after frontend exists): `Error: waiting for locator('[data-testid="app-root"]')` — element not yet added
- TypeScript overlay test: `vite-error-overlay` count assertion fails if strict mode not configured
- CORS tests: `access-control-allow-origin` header missing from response

---

## Notes

- Story 1.1 is a pure infrastructure story — there are NO domain entities, database interactions, or user-facing features to test with component or unit tests.
- The backend API test suite does NOT require the frontend to be running (uses Playwright `request` context directly).
- The frontend E2E tests require the backend to be running only for the CORS validation tests (AC3); all other frontend tests are independent.
- The `webServer` block in `playwright.config.ts` auto-starts the frontend (`pnpm --filter frontend dev`). The backend must be started manually or via a separate `webServer` entry before running the full suite.
- The `API_BASE_URL` environment variable can be set to override the default `http://localhost:5000` for CI/CD pipelines.

---

**Generated by BMad TEA Agent** — 2026-06-04
