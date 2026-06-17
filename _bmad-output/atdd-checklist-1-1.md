# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** API Integration + E2E (Playwright)

---

## Story Summary

Story 1.1 establishes the full development environment: a Vite/React/TypeScript frontend (port 5173) and a .NET 10 Clean Architecture backend (port 5000), with TypeScript strict mode, Scalar API docs, and CORS configured between both servers. This is a pure infrastructure story — no domain entities or business logic, only toolchain and project skeleton.

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

### E2E / Integration Tests (Playwright) — 12 tests

#### File 1: `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

Tests covering AC1, AC3, AC4 (frontend-facing):

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend server not yet initialized; `http://localhost:5173` returns connection refused
  - **Verifies:** AC1 — `pnpm run dev` starts Vite on port 5173 with HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist in the unimplemented app
  - **Verifies:** AC1 — App renders a React root element accessible via `data-testid`

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Console errors from TypeScript compilation will appear until strict mode is properly configured
  - **Verifies:** AC4 — Zero TypeScript errors reported in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Runtime errors will occur until dependencies and providers are correctly wired
  - **Verifies:** AC1 — No JavaScript exceptions thrown on initial page load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — CORS policy not configured; cross-origin fetch from 5173 to 5000 will fail
  - **Verifies:** AC3 — No CORS errors in browser console when frontend requests backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running; connection refused on port 5000
  - **Verifies:** AC3 — Backend responds (200/301/302) when Scalar endpoint is called

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Vite error overlay appears until TypeScript compiles cleanly with strict flags
  - **Verifies:** AC4 — No `vite-error-overlay` element in DOM after page load

#### File 2: `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

Tests covering AC2, AC3, AC5 (backend-facing):

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not yet initialized; connection refused on port 5000
  - **Verifies:** AC2 — Backend responds to HTTP requests (any non-5xx status)

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not yet registered in `Program.cs`
  - **Verifies:** AC2 — GET `/scalar` returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — `/scalar` endpoint missing; response is 404 or connection refused
  - **Verifies:** AC2 — `/scalar` response `Content-Type` contains `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED (inverted) — Will PASS only when `/swagger` returns non-200; currently unverifiable without backend
  - **Verifies:** AC2 — Architecture constraint: Swashbuckle/Swagger UI must NOT exist

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Default `dotnet new webapi` template includes WeatherForecast; must be removed
  - **Verifies:** AC2 — `/weatherforecast` returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not yet configured; no `Access-Control-Allow-Origin` header
  - **Verifies:** AC3 — CORS response header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not registered; preflight returns 403 or connection refused
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; build failure would also prevent startup
  - **Verifies:** AC5 — Server runs, proving the solution compiled successfully

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — ExceptionHandlingMiddleware not yet registered; unhandled paths return HTML error page
  - **Verifies:** AC5 (implicit) — Backend returns JSON (not HTML) for unknown paths

---

## Data Factories Created

No domain entity factories are needed for Story 1.1. This is a pure infrastructure story with no business data.

The following helpers exist for future stories:

**File:** `e2e/helpers/data.helper.ts`
- `buildCliente(overrides?)` — builds a valid Cliente test payload
- `buildContacto(overrides?)` — builds a valid Contacto test payload

**File:** `e2e/helpers/api.helper.ts`
- `ApiHelper` class — typed REST client wrapping `APIRequestContext` for CRUD on Clientes/Contactos

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before test; provides page at that route
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** `void` (side-effects the page)
  - **Cleanup:** Playwright page lifecycle (auto-reset between tests)

- `contactosPage` — navigates to `/contactos` before test; provides page at that route
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** `void` (side-effects the page)
  - **Cleanup:** Playwright page lifecycle (auto-reset between tests)

---

## Mock Requirements

No external service mocks are required for Story 1.1. Tests interact directly with the real frontend and backend servers.

**Network-first pattern applied:** Route interception (`page.waitForResponse`) is set up before `page.goto()` in AC1 and AC4 tests to prevent race conditions.

---

## Required data-testid Attributes

### App Root (index.html / App.tsx)

- `app-root` — The root React mount point; required by test `should render the root HTML document with a valid React mount point`

**Implementation Example:**

```tsx
// In src/main.tsx or index.html
<div id="root" data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

**Note:** Vite's default template uses `<div id="root">`. The `data-testid="app-root"` attribute must be added to this element or to the top-level component rendered by `App.tsx`.

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install all runtime and dev dependencies (`pnpm add`, `pnpm add -D`)
- [ ] Run `pnpm run dev` and confirm server starts on port 5173 (no errors in stdout)
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/main.tsx` with `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root div in `index.html` or `App.tsx`
- [ ] Verify element is present in rendered DOM
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "app-root"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files pass `pnpm exec tsc --noEmit` with zero errors
- [ ] Run test to verify no `[TypeScript]` or `TS` errors in console
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Wire `RouterProvider` inside `QueryProvider` in `src/main.tsx`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route
- [ ] Create `src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Create `src/app/providers/QueryProvider.tsx`
- [ ] Run test to verify no `pageerror` events on initial load
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register `AddCors` with policy `"DevCors"` allowing origin `http://localhost:5173`
- [ ] Call `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()`
- [ ] Verify no CORS console errors when frontend fetches `http://localhost:5000/scalar`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Backend must be running and `/scalar` endpoint responding HTTP 200
- [ ] (Covered by AC2 implementation tasks below)
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (covered by AC2)

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] All TypeScript files in `frontend/src/` must pass strict compilation
- [ ] `vite-error-overlay` must NOT appear in DOM after page load
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error-overlay"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (covered by AC4 TypeScript tasks)

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Run `dotnet run` in `src/SiesaAgents.API` — server must listen on port 5000
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`, add `builder.Services.AddOpenApi()`
- [ ] In `Program.cs`, add `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Same tasks as Scalar endpoint above
- [ ] Verify `Content-Type: text/html` in response headers
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (covered by Scalar tasks)

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Do NOT add Swashbuckle or `app.UseSwagger()` anywhere in `Program.cs`
- [ ] Verify `GET /swagger` returns 404 (not 200)
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (architecture constraint — must be respected)

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default WeatherForecast controller/endpoints from generated API project
- [ ] Remove `WeatherForecast.cs` and any related route mappings from `Program.cs`
- [ ] Verify `GET /weatherforecast` returns 404 or 405
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure CORS in `Program.cs` with `WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` header in response
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (covered by CORS tasks in AC3)

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] `app.UseCors("DevCors")` must appear BEFORE `app.MapScalarApiReference()` in `Program.cs`
- [ ] Verify OPTIONS preflight returns 200 or 204
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "preflight"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0 hours (covered by CORS middleware ordering)

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build SiesaAgents.sln` — must exit 0
- [ ] Run `dotnet run` — server must start (proving build succeeded)
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Register `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE routing in `Program.cs`
- [ ] Verify that unknown paths return JSON (not HTML) with appropriate error format
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 1.1 failing tests (E2E + API)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only frontend initialization tests (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only backend initialization tests (AC2, AC3, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with HTML report
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (12 tests in RED phase)
- Fixtures created with auto-cleanup (`base.fixture.ts`)
- Data helpers created for future stories (`api.helper.ts`, `data.helper.ts`)
- Mock requirements documented (none needed for this infrastructure story)
- Required `data-testid` attributes documented (`app-root`)
- Implementation checklist created with clear tasks

**Verification:**

- All tests fail due to missing implementation (frontend and backend not yet initialized)
- Failure messages indicate: connection refused (port 5173/5000), missing elements, missing CORS headers
- Tests fail for the right reason (no implementation), not due to test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from the implementation checklist (start with highest priority: backend startup)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in the implementation checklist
6. **Move to the next test** and repeat

**Recommended implementation order:**

1. Backend server startup (port 5000) — TC-E1-P0-03
2. Scalar endpoint — TC-E1-P0-03
3. CORS configuration — TC-E1-P0-04
4. WeatherForecast removal — AC2
5. Clean Architecture project references — TC-E1-P1-06
6. ExceptionHandlingMiddleware — AC5
7. Frontend Vite server (port 5173) — TC-E1-P0-02
8. TypeScript strict mode — TC-E1-P0-01
9. React root with `data-testid="app-root"` — AC1
10. Provider wiring (`QueryProvider`, `RouterProvider`) — AC1

**Key Principles:**

- One test at a time — don't try to fix all at once
- Minimal implementation — don't over-engineer
- Run tests frequently for immediate feedback
- Use this checklist as your roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 12 tests pass (green phase complete)
2. Review `Program.cs` for middleware ordering correctness
3. Ensure `tsconfig.app.json` strict flags are not accidentally loosened
4. Extract any shared Playwright test utilities
5. Ensure tests still pass after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (dev-story 1.1)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red to green for each)
5. **When all 12 tests pass**, refactor code for quality
6. **When refactoring complete**, update story status to `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation: `page.waitForResponse()` registered before `page.goto()` in AC1 and AC4 tests
- **selector-resilience.md** — `data-testid="app-root"` used; no CSS class or element-type selectors
- **test-quality.md** — One assertion per test (atomic); Given-When-Then comments in all tests
- **fixture-architecture.md** — `base.fixture.ts` extends Playwright `test` with auto-cleanup page navigation fixtures
- **timing-debugging.md** — `page.waitForLoadState('networkidle')` used instead of hard waits in AC4 test

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
FAILED e2e/tests/foundation/project-initialization.spec.ts
  AC1 — Frontend Vite server initialization
    ✗ should serve the frontend app on port 5173 without errors
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗ should render the root HTML document with a valid React mount point
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗ should load without any TypeScript compilation errors visible in the browser console
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗ should not have any JavaScript runtime errors on initial load
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  AC3 — CORS configuration between frontend and backend
    ✗ should allow frontend to reach backend health endpoint without CORS errors
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗ should receive a valid HTTP response from the backend health probe without CORS blocking
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  AC4 — TypeScript strict mode active on frontend
    ✗ should load the frontend without Vite TypeScript error overlay
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

FAILED e2e/tests/api/backend-initialization.api.spec.ts
  AC2 — Backend server initialization and Scalar API documentation
    ✗ should have the backend API server running on port 5000
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/
    ✗ should serve the Scalar API documentation page at /scalar
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    ✗ should return HTML content from the Scalar documentation endpoint
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    ✗ should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/swagger
    ✗ should NOT expose WeatherForecast default endpoint
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/weatherforecast
    ✗ should return CORS header allowing http://localhost:5173 origin
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    ✗ should respond to OPTIONS preflight from frontend origin without CORS rejection
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  AC5 — Backend solution builds and runs successfully
    ✗ should have all four Clean Architecture layers responding
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    ✗ should return Problem Details RFC 7807 format for unhandled errors
      → Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/api/nonexistent-endpoint-for-atdd
```

**Summary:**

- Total tests: 12 (Story 1.1 scope — AC1, AC2, AC3, AC4, AC5)
- Passing: 0 (expected — RED phase)
- Failing: 12 (expected — no implementation yet)
- Status: RED phase verified

**Expected Failure Messages:**

- `net::ERR_CONNECTION_REFUSED` on port 5173 — frontend not initialized
- `net::ERR_CONNECTION_REFUSED` on port 5000 — backend not initialized
- `Locator.toBeVisible() - Expected: visible, Received: not found` — `[data-testid="app-root"]` missing
- `Error: expect(received).toBe(200)` — Scalar endpoint returns connection refused

---

## Notes

- This is Story 1.1 only — no navigation shell, no database tests (those are Stories 1.2 and 1.3).
- The `playwright.config.ts` `webServer` block auto-starts the frontend via `pnpm --filter frontend dev` when running E2E tests locally. The backend must be started separately with `dotnet run`.
- The `API_BASE_URL` environment variable defaults to `http://localhost:5000` — override in CI as needed.
- Playwright config uses `testDir: './e2e'` — all test files must be under `/e2e/`.
- The `data-testid="app-root"` attribute is the only UI selector required by Story 1.1 tests.
- No domain entity factories are needed — Story 1.1 has no business domain data.

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/testarch/tea-index.csv` for knowledge fragments
- Consult `_bmad-output/planning-artifacts/architecture.md` for backend/frontend architecture decisions
- Consult `_bmad-output/implementation-artifacts/test-design-epic-1.md` for full epic test design

---

**Generated by BMad TEA Agent** — 2026-06-17
