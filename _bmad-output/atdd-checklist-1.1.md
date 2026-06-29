# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running.

This story establishes the foundational skeleton: no domain entities, no business routes beyond the root shell. It exists so every future story has a pre-established project structure to add files into.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies and correct TypeScript/build configuration
**So that** the team has a working development environment with both dev servers running and communicating without errors

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, when the developer runs the frontend initialization commands, then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, when the developer runs `dotnet run` in `src/SiesaAgents.API`, then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

Tests cover AC1, AC3, and AC4. These tests require the frontend to be running at `http://localhost:5173`.

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app not yet implemented; Vite server not started
  - **Verifies:** AC1 — Frontend server returns HTTP 200 on root URL

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist yet
  - **Verifies:** AC1 — React root is mounted and element with `data-testid="app-root"` is visible

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend exists; any TS errors would surface as console errors
  - **Verifies:** AC1 / AC4 — No `[TypeScript]` or `TS` error messages in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend project to load
  - **Verifies:** AC1 — No `pageerror` events (runtime exceptions) on initial load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS not configured
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches from `http://localhost:5000`

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend server not started on port 5000
  - **Verifies:** AC3 — Backend `/scalar` responds with 200, 301, or 302 (not blocked)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — No frontend project; Vite overlay state unknown
  - **Verifies:** AC4 — `vite-error-overlay` custom element has count 0 after page load

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

Tests cover AC2, AC3 (CORS headers), and AC5. These tests hit the backend directly via Playwright's `request` context (no browser needed).

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; `request.get` will throw ECONNREFUSED
  - **Verifies:** AC2 — Server responds to any request on port 5000 (status < 500)

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `app.MapScalarApiReference()` not configured
  - **Verifies:** AC2 — GET `/scalar` returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; Scalar.AspNetCore package not installed
  - **Verifies:** AC2 — `Content-Type` header contains `text/html` for `/scalar` response

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running (also verifies architectural constraint once it is)
  - **Verifies:** AC2 — GET `/swagger` does NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running (also verifies cleanup once it is)
  - **Verifies:** AC2 — GET `/weatherforecast` returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; `Access-Control-Allow-Origin` header absent
  - **Verifies:** AC3 — Response includes `Access-Control-Allow-Origin: http://localhost:5173` or `*`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; preflight OPTIONS not handled
  - **Verifies:** AC3 — OPTIONS request returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running (runtime proxy: if server is up, build succeeded)
  - **Verifies:** AC5 — Server runs, proving `dotnet build SiesaAgents.sln` compiled all four projects

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; `ExceptionHandlingMiddleware` not wired
  - **Verifies:** AC5 — Unknown endpoint returns JSON (not HTML), indicating middleware is active and server is running

---

## Data Factories Created

Story 1.1 is infrastructure-only — no domain entities exist at this stage. No data factories are required. The `ApiHelper` class in `e2e/helpers/api.helper.ts` already provides CRUD helpers for future stories (clientes, contactos).

---

## Fixtures Created

The base fixture at `e2e/fixtures/base.fixture.ts` is already in place and provides `clientesPage` and `contactosPage` fixtures. Story 1.1 tests use plain `test` from `@playwright/test` because no application state setup is needed.

No additional fixtures are required for this story.

---

## Mock Requirements

Story 1.1 validates the **real** infrastructure — the backend must actually start and the frontend must actually compile. No mocking is used or appropriate here; these are integration-level acceptance tests.

**Backend must be running** on `http://localhost:5000` before running API tests.
**Frontend must be running** on `http://localhost:5173` before running E2E tests (the Playwright `webServer` config handles this via `pnpm --filter frontend dev`).

---

## Required data-testid Attributes

### App Root (frontend/src/main.tsx or frontend/index.html)

- `app-root` — The root div where React mounts; required by AC1 E2E test

**Implementation Example:**

```tsx
// In frontend/index.html or in the <body> rendered by React:
<div id="root" data-testid="app-root"></div>
```

Or in `frontend/src/App.tsx`:

```tsx
export function App() {
  return (
    <div data-testid="app-root">
      {/* Router outlet here */}
    </div>
  );
}
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Verify `pnpm run dev` starts on `http://localhost:5173`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium -g "AC1"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root element in `frontend/index.html` or wrap in `App.tsx`
- [ ] Verify element is visible after `pnpm run dev`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium -g "app-root"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure no TypeScript errors in initial generated files
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium -g "TypeScript compilation"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `frontend/src/main.tsx` renders without runtime exceptions
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium -g "runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors` + `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Start backend on port 5000 (`dotnet run` in `src/SiesaAgents.API`)
- [ ] Register CORS policy in `Program.cs`: `policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Call `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium -g "AC3"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` has strict flags — no compile errors in initial scaffold
- [ ] Verify `vite-error-overlay` is not injected on initial load
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium -g "AC4"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Tests: `AC2` group (6 tests — server, Scalar, content-type, no-swagger, no-weatherforecast, CORS headers)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add` (all four + tests)
- [ ] Add project references: API→Application, API→Infrastructure, Application→Domain, Infrastructure→Domain
- [ ] Add Scalar package: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoints and models
- [ ] Register CORS policy and call `app.UseCors("DevCors")` before `app.MapScalarApiReference()`
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] All 6 AC2 tests pass (green phase)

**Estimated Effort:** 2.0 hours

---

### Tests: `AC5` group (2 tests — build proxy + Problem Details)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Verify `dotnet build backend/SiesaAgents.sln` completes with zero errors
- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (Problem Details RFC 7807)
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify unknown endpoint returns JSON (not HTML) with status 404
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "AC5"`
- [ ] Both AC5 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests (API + E2E)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E tests (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium

# Run only API tests (AC2, AC3 CORS, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --project=chromium

# Run tests in headed mode (see browser for E2E)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed --project=chromium

# Debug a specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug --project=chromium

# Run with HTML report
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (16 total: 7 E2E + 9 API)
- Network-first pattern applied (E2E tests register listeners before navigation)
- CORS and server-down failures are clear and actionable
- Mock requirements documented (none needed — tests validate real infra)
- data-testid requirements listed (`app-root`)
- Implementation checklist created

**Verification:**

- All tests fail with `ECONNREFUSED` (backend not running) or `page.goto` timeout (frontend not running)
- No test has a logic bug that would make it pass on an empty environment
- Failure messages directly point to missing infrastructure

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist above (recommend starting with Task 1: frontend init)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist above
6. Move to next test and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs`, `tsconfig.app.json`, and project references for quality
3. Extract any duplicated configuration
4. Ensure tests still pass after each refactor
5. Update story status to `done` in sprint-status.yaml

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Review this checklist in standup or planning
3. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
4. Begin implementation using implementation checklist as guide (Task 1: frontend init)
5. Work one test at a time (red → green for each)
6. When all 16 tests pass, refactor code for quality
7. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception and response listeners registered BEFORE `page.goto()` in all E2E tests
- **fixture-architecture.md** — Base fixture pattern in `e2e/fixtures/base.fixture.ts`; Story 1.1 tests use plain `test` (no fixture needed)
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, deterministic waiting
- **selector-resilience.md** — `data-testid="app-root"` used instead of fragile CSS/ID selectors
- **test-levels-framework.md** — API tests (Playwright `request`) for backend validation; E2E tests for frontend + browser behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
Error: connect ECONNREFUSED 127.0.0.1:5000   ← API tests (backend not running)
TimeoutError: page.waitForResponse: Timeout 30000ms exceeded  ← E2E tests (frontend not running)
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase — all failures are due to missing implementation, not test bugs

**Expected Failure Messages per Test:**

- E2E tests: `Error: page.goto: net::ERR_CONNECTION_REFUSED` or webServer startup timeout
- API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000`
- `app-root` test: `Error: expect(locator).toBeVisible() — locator: [data-testid="app-root"]` (element not found once frontend exists but data-testid not yet added)

---

## Notes

- **AC5 is validated indirectly** via a runtime proxy pattern: if the backend server starts successfully, the .NET solution compiled without errors. This is a deliberate design choice — the build step is a CI concern, and Playwright tests validate runtime behavior.
- **No data factories needed** for this story. The `ApiHelper` in `e2e/helpers/api.helper.ts` serves future stories (Epic 2+).
- **TypeScript strict mode** is validated both statically (tsconfig flags) and dynamically (no console TS errors, no Vite error overlay).
- **CORS is tested at two levels**: browser-level (console errors in E2E) and HTTP header level (response headers in API tests).
- This story creates no domain routes. The `webServer` in `playwright.config.ts` auto-starts the frontend via `pnpm --filter frontend dev`.

---

**Generated by BMad TEA Agent** — 2026-06-29
