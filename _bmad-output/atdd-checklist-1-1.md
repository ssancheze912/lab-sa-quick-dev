# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

Initializes the full monorepo skeleton: a Vite React-TS frontend (strict TypeScript) and a .NET 10 Clean Architecture backend, with both dev servers running, CORS configured, and the Scalar API documentation page accessible.

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

---

## Acceptance Criteria

1. `pnpm run dev` starts the Vite server on port 5173 with no errors; app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. `dotnet run` in `src/SiesaAgents.API` starts the backend on port 5000; the Scalar API docs page loads at `/scalar`; the four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.
3. CORS allows requests from `http://localhost:5173` to `http://localhost:5000` without errors (no CORS-related console errors).
4. The TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. `dotnet build SiesaAgents.sln` compiles all four projects successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend app does not exist yet; `http://localhost:5173/` returns connection refused
  - **Verifies:** AC1 — Vite dev server starts and serves HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element is not present in unimplemented app
  - **Verifies:** AC1 — React root is mounted and exposes testable anchor

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — no frontend project; console cannot be inspected
  - **Verifies:** AC4 — TypeScript strict mode produces zero compile errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — no frontend project; page errors cannot be verified
  - **Verifies:** AC1 — Application bootstraps cleanly with no runtime exceptions

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — neither server running; CORS policy not configured
  - **Verifies:** AC3 — Browser-initiated cross-origin fetch produces no CORS console errors

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend server not running; request returns connection refused
  - **Verifies:** AC3 — `/scalar` endpoint reachable from frontend origin (HTTP 200/301/302)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — no frontend project; `vite-error-overlay` check cannot pass
  - **Verifies:** AC4 — Vite does not display compilation error overlay

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — backend not initialized; connection refused on port 5000
  - **Verifies:** AC2 — .NET 10 backend starts and responds to HTTP requests

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `Scalar.AspNetCore` not installed; `/scalar` returns 404
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is wired in `Program.cs`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — `/scalar` not available; no HTML content-type returned
  - **Verifies:** AC2 — Scalar serves a valid HTML documentation page

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not running; test cannot confirm Swagger absence
  - **Verifies:** AC2 — Architecture rule: Swashbuckle is forbidden; `/swagger` must return non-200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — backend not running; cannot confirm default endpoint removal
  - **Verifies:** AC2 — Default .NET template WeatherForecast controller is removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not configured; `Access-Control-Allow-Origin` header absent
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` (or `*`) is present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not applied; OPTIONS returns 404 or 405
  - **Verifies:** AC3 — Preflight passes (HTTP 200 or 204)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — solution not built; server cannot start
  - **Verifies:** AC5 — All four projects compile and load via dependency injection

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not registered; 404 returns HTML or no JSON
  - **Verifies:** AC5 — Unhandled paths return JSON (problem+json), not HTML error pages

---

## Data Factories Created

No domain entity factories required for this story. Story 1.1 tests infrastructure availability and configuration — no domain data is created, mutated, or deleted.

The existing `e2e/helpers/data.helper.ts` (providing `buildCliente` / `buildContacto`) is a future-story artifact and is not used in Story 1.1 tests.

---

## Fixtures Created

No new fixtures required for this story. Tests use the default Playwright `test` and `request` fixtures directly, since the scenarios verify server availability and static configuration rather than stateful application flows.

**Existing fixture:** `e2e/fixtures/base.fixture.ts` — provides `clientesPage` / `contactosPage` navigation fixtures; not used in Story 1.1 tests.

---

## Mock Requirements

Story 1.1 tests verify REAL server initialization — mocking defeats the purpose. Both servers must be running for these tests to reach GREEN.

**Backend server** (`http://localhost:5000`):
- Must be started via `dotnet run` in `src/SiesaAgents.API` before running API tests
- No mock: tests validate actual server startup, CORS headers, and Scalar endpoint

**Frontend server** (`http://localhost:5173`):
- Must be started via `pnpm run dev` (or `pnpm --filter frontend dev` from repo root)
- Playwright `webServer` config in `playwright.config.ts` auto-starts the frontend: `pnpm --filter frontend dev`
- No mock: tests validate real Vite compilation and React mount

**External services:** None required for Story 1.1.

---

## Required data-testid Attributes

### `index.html` / `src/main.tsx` or `src/App.tsx`

- `app-root` — The root React mount container. Must be added to the `<div id="root">` element or the outermost element rendered by `App.tsx`.

**Implementation Example:**

```tsx
// In index.html:
<div id="root" data-testid="app-root"></div>

// OR in App.tsx outermost element:
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install all runtime dependencies listed in story tasks
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Verify `pnpm run dev` starts on port 5173 without errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "should serve the frontend app"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to root element in `index.html` or `App.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "should render the root HTML"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files compile cleanly (no `any` types, no implicit nulls)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete `src/main.tsx` — `RouterProvider` inside `QueryProvider` with no missing imports
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route shell
- [ ] Ensure no runtime errors thrown during React bootstrapping
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "JavaScript runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy `"DevCors"` in `Program.cs` (Task 3)
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()`
- [ ] Read allowed origin from `appsettings.Development.json` `AllowedOrigins` array
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure backend is running on port 5000 (see AC2 tasks)
- [ ] CORS policy allows `http://localhost:5173` (see CORS task above)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "valid HTTP response from the backend"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by AC2 + CORS tasks)

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] All TypeScript source files must pass strict-mode compilation (see AC4 tasks)
- [ ] `vite-error-overlay` must NOT be injected by Vite
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "Vite TypeScript error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by AC4 tasks)

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create .NET solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add project to solution and configure `Program.cs` minimal structure
- [ ] Start backend: `dotnet run` in `src/SiesaAgents.API`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "backend API server running"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Install `Scalar.AspNetCore`: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` to `Program.cs`
- [ ] Add `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Verify Scalar loads at `http://localhost:5000/scalar`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation page"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Scalar endpoint must respond with `Content-Type: text/html` (automatic when `MapScalarApiReference()` is called)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "HTML content from the Scalar"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by Scalar task above)

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Do NOT install `Swashbuckle.AspNetCore` — use only `Scalar.AspNetCore`
- [ ] Do NOT call `app.UseSwagger()` or `app.UseSwaggerUI()` in `Program.cs`
- [ ] Verify `/swagger` returns 404 (not 200)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger/OpenAPI UI"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (architecture rule compliance)

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default `WeatherForecastController.cs` (or `WeatherForecast` minimal route) from generated API project
- [ ] Remove `WeatherForecast.cs` model if present
- [ ] Verify `/weatherforecast` returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS policy `"DevCors"` configured with `.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] `app.UseCors("DevCors")` placed BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` in response headers
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS middleware handles OPTIONS preflight (automatic when `UseCors()` is applied before routing)
- [ ] Verify OPTIONS to `/scalar` with `Origin: http://localhost:5173` returns 200 or 204
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by CORS middleware task)

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add all projects to `SiesaAgents.sln`: `dotnet sln add ...`
- [ ] Run `dotnet build SiesaAgents.sln` — verify zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture layers"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (see story Dev Notes for exact pattern)
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE routing
- [ ] Verify 404 responses return JSON (`Content-Type: application/json` or `application/problem+json`), not HTML
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details RFC 7807"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for this story (E2E + API)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E (frontend) tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API (backend) tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (16 tests total)
- Data factories not required for infrastructure story
- No fixtures needed beyond default Playwright context
- `data-testid="app-root"` documented for DEV team
- Implementation checklist maps each test to specific implementation task

**Verification:**

- All tests fail due to missing servers (connection refused) or missing elements (`data-testid="app-root"`)
- Failure messages are clear: `net::ERR_CONNECTION_REFUSED` / `Locator not found`
- No test bugs — failures are caused exclusively by missing implementation

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with backend AC2 — without backend, CORS tests cannot pass)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended Order:**

1. Backend solution structure (AC2, AC5) — Tasks 1–2 in story
2. CORS configuration (AC3) — Task 3 in story
3. ExceptionHandlingMiddleware (AC5 partial) — Task 4 in story
4. `appsettings.Development.json` — Task 5 in story
5. Frontend initialization (AC1, AC4) — Task 1 in story

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 16 tests pass
2. Review `Program.cs` for any scaffolding leftovers
3. Extract CORS origins to `appsettings.Development.json` (already planned in Task 5)
4. Ensure `tsconfig.app.json` is clean and not overriding `strict` in any `include` subtree
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation following the recommended order above
4. Work one test at a time (red → green for each)
5. When all 16 tests pass, move to REFACTOR phase
6. When refactoring is complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1/AC3 tests
- **selector-resilience.md** — `data-testid="app-root"` required rather than CSS selectors (`#root`, `.App`)
- **test-quality.md** — One assertion per test (atomic); explicit waits only (`waitForResponse`, `waitForLoadState`); no `page.waitForTimeout()`
- **fixture-architecture.md** — No fixtures needed for infrastructure-only story; default Playwright context reused
- **data-factories.md** — No domain data factories needed; story tests server configuration only
- **test-levels-framework.md** — E2E for browser/frontend validation (AC1, AC3, AC4); API-level for backend-only assertions (AC2, AC3, AC5)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
Running 16 tests using 1 worker

  ✗  [chromium] › foundation/project-initialization.spec.ts:23:3 … (10s)
     Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

  ✗  [chromium] › foundation/project-initialization.spec.ts:39:3 … (10s)
     Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

  ✗  [chromium] › foundation/project-initialization.spec.ts:49:3 … (10s)
     Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

  ... (all 16 tests fail)

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase — all failures due to missing implementation (servers not started, project not initialized)

**Expected Failure Messages:**

- E2E tests: `net::ERR_CONNECTION_REFUSED` (frontend server not running)
- API tests (AC2, AC5): `net::ERR_CONNECTION_REFUSED` on port 5000 (backend server not running)
- API tests (AC3): `Expected: true — Received: false` for CORS header check

---

## Notes

- Story 1.1 tests infrastructure availability and static configuration — no domain data is created
- Backend webServer is NOT configured in `playwright.config.ts`; the backend must be started manually before running API tests
- The `pnpm --filter frontend dev` command in `playwright.config.ts` `webServer` block will auto-start the frontend for E2E tests
- AC5 (dotnet build) is verified at runtime: if the server is running, the solution compiled successfully
- `data-testid="app-root"` is the ONLY new attribute needed in this story

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-24
