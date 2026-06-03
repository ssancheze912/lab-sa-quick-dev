# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-03
**Author:** SiesaTeam
**Primary Test Level:** API (E2E + API combined)

---

## Story Summary

Story 1.1 establishes the complete technical scaffold: a Vite/React/TypeScript frontend and a .NET 10 Clean Architecture backend, both initialized with all required dependencies and running concurrently in local development. CORS is configured to allow cross-origin requests between the two servers, and TypeScript strict mode is enforced.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean dev machine, When the developer runs `pnpm run dev`, Then the Vite server starts on port 5173 with no errors and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend not yet initialized; connection refused on localhost:5173
  - **Verifies:** AC1 — Vite dev server starts on port 5173 with HTTP 200

- **Test:** `AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist (implementation pending)
  - **Verifies:** AC1 — React root element is rendered with `data-testid="app-root"`

- **Test:** `AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend not yet initialized; test cannot connect
  - **Verifies:** AC4 — TypeScript strict mode produces zero console errors

- **Test:** `AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend not yet initialized
  - **Verifies:** AC1 — No JavaScript runtime exceptions on first render

- **Test:** `AC3 — CORS configuration between frontend and backend > should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Both servers not running; no CORS header returned
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches backend

- **Test:** `AC3 — CORS configuration between frontend and backend > should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running; connection refused on localhost:5000
  - **Verifies:** AC3 — Backend responds to requests from frontend origin

- **Test:** `AC4 — TypeScript strict mode active on frontend > should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not yet initialized; no page to load
  - **Verifies:** AC4 — Vite error overlay is absent (no TypeScript compile errors)

### API Tests (8 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should have the backend API server running on port 5000`
  - **Status:** RED — Backend not yet initialized; connection refused on localhost:5000
  - **Verifies:** AC2 — Backend server starts and responds on port 5000

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `/scalar` endpoint does not exist until `app.MapScalarApiReference()` is registered
  - **Verifies:** AC2 — Scalar docs load at `/scalar` (HTTP 200)

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; no `text/html` content type available
  - **Verifies:** AC2 — Response from `/scalar` is HTML (not JSON or error page)

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; cannot verify absence of `/swagger`
  - **Verifies:** AC2 compliance — `/swagger` must NOT return HTTP 200 (corporate standard)

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default template endpoint must be removed
  - **Verifies:** AC2 — WeatherForecast template endpoint is removed (404 or 405)

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; `Access-Control-Allow-Origin` header absent
  - **Verifies:** AC3 — CORS `Access-Control-Allow-Origin: http://localhost:5173` header present

- **Test:** `AC2 — Backend server initialization and Scalar API documentation > should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; preflight returns connection error
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `AC5 — Backend solution builds and runs successfully > should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not yet compiled and running
  - **Verifies:** AC5 — All four CA projects referenced and compiled (server running = build passed)

- **Test:** `AC5 — Backend solution builds and runs successfully > should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; no Problem Details response possible
  - **Verifies:** AC5 / middleware — Non-existent endpoints return JSON (not HTML error page)

---

## Data Factories Created

No domain entity factories are required for Story 1.1. This story creates infrastructure only — no user-facing data entities exist yet.

---

## Fixtures Created

### Foundation Fixtures

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before test body
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Resolved page at the clientes route
  - **Cleanup:** None (navigation state resets between tests)

- `contactosPage` — Navigates to `/contactos` before test body
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Resolved page at the contactos route
  - **Cleanup:** None

---

## Mock Requirements

No external service mocks are required for Story 1.1. All tests validate actual running servers (Vite on 5173 and .NET on 5000) rather than mocked responses. The acceptance criteria require genuine server startup and CORS negotiation.

---

## Required data-testid Attributes

### Root Application Entry Point (`src/main.tsx` or `index.html`)

- `app-root` — Root container element for the React application

**Implementation Example:**

```tsx
// In index.html or App.tsx root wrapper:
<div id="root" data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: should serve the frontend app on port 5173 without errors

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install dependencies: `cd frontend && pnpm install`
- [ ] Verify `pnpm run dev` starts and `http://localhost:5173` returns HTTP 200
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "serve the frontend app"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should render the root HTML document with a valid React mount point

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In the root component or `index.html`, add `data-testid="app-root"` to the root container
- [ ] Verify element is visible in browser at `http://localhost:5173/`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "render the root HTML"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should load without any TypeScript compilation errors visible in the browser console

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all generated template files pass TypeScript strict mode (`pnpm exec tsc --noEmit`)
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should not have any JavaScript runtime errors on initial load

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route
- [ ] Ensure no unhandled promise rejections or undefined references on startup
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "JavaScript runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should allow frontend to reach backend health endpoint without CORS errors

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy: `policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Apply `app.UseCors("DevCors")` before endpoint mappings
- [ ] Verify no CORS errors in browser dev tools console when frontend fetches backend
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should have the backend API server running on port 5000

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Configure Kestrel/launchSettings to listen on port 5000
- [ ] Run `dotnet run` and verify `http://localhost:5000/` responds
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "running on port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: should serve the Scalar API documentation page at /scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`, add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] NEVER add `app.UseSwagger()` or Swashbuckle
- [ ] Verify `GET http://localhost:5000/scalar` returns HTTP 200 with HTML
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation page"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should return HTML content from the Scalar documentation endpoint

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Same as Scalar registration task above — HTML content-type is automatically set by Scalar middleware
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "return HTML content"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.0 hours (covered by Scalar task)

---

### Test: should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseSwagger()` and any Swashbuckle package reference are absent from `Program.cs`
- [ ] Confirm `GET /swagger` returns 404 (not 200)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should NOT expose WeatherForecast default endpoint

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default `WeatherForecastController` or `app.MapGet("/weatherforecast", ...)` from the generated API project
- [ ] Remove `WeatherForecast.cs` record from the project
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should return CORS header allowing http://localhost:5173 origin

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify CORS policy `WithOrigins("http://localhost:5173")` is registered in `Program.cs`
- [ ] Send request with `Origin: http://localhost:5173` and assert `Access-Control-Allow-Origin` header present
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header allowing"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours (covered by CORS task)

---

### Test: should respond to OPTIONS preflight from frontend origin without CORS rejection

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseCors("DevCors")` is placed BEFORE any endpoint mappings in `Program.cs`
- [ ] Verify OPTIONS preflight returns 200 or 204 (not 403)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours (covered by CORS task)

---

### Test: should have all four Clean Architecture layers responding

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build SiesaAgents.sln` — exit code must be 0
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture layers"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: should return Problem Details RFC 7807 format for unhandled errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` per the pattern in story Dev Notes
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify non-existent endpoints return JSON (not HTML) with 404 status
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details RFC 7807"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (frontend + CORS)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (backend initialization)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/ --headed

# Debug specific test
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run tests with HTML report
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (no implementation exists yet)
- Network-first intercept pattern applied in CORS tests
- data-testid requirement `app-root` documented
- Mock requirements documented (none for this story)
- Implementation checklist created

**Verification:**

- All 15 tests fail with connection refused or element not found errors
- Failure messages clearly indicate missing implementation (not test bugs)
- Tests are deterministic — same failure on every run

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest priority)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (dependency-aware):**

1. Initialize frontend project → makes AC1 tests green
2. Add `data-testid="app-root"` → makes root render test green
3. Configure TypeScript strict → makes AC4 tests green
4. Initialize backend solution → makes AC2 tests green
5. Register Scalar + remove WeatherForecast → makes Scalar/Swagger tests green
6. Configure CORS policy → makes AC3 tests green
7. Add ExceptionHandlingMiddleware → makes problem details test green

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 15 tests pass (green phase complete)
2. Review `Program.cs` middleware ordering for correctness
3. Validate `tsconfig.app.json` values against project requirements
4. Ensure `appsettings.Development.json` contains correct placeholder connection strings
5. Ensure tests still pass after any refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using implementation checklist as guide (dependency order above)
4. Work one test at a time (red → green for each)
5. Share progress in daily standup
6. When all tests pass, refactor code for quality
7. When refactoring complete, update story status to 'done' in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- `fixture-architecture.md` — Test fixture patterns with setup/teardown and auto-cleanup
- `network-first.md` — Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- `test-quality.md` — Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- `selector-resilience.md` — `data-testid` selectors over CSS selectors (no fragile selectors used)
- `timing-debugging.md` — `waitForResponse` and `waitForLoadState` used instead of hard waits

---

## Test Execution Evidence

### Expected RED Phase Failures

**E2E tests (`project-initialization.spec.ts`):**

```
Error: connect ECONNREFUSED 127.0.0.1:5173
  → Frontend Vite server not started (pnpm run dev not run)
```

**API tests (`backend-initialization.api.spec.ts`):**

```
Error: connect ECONNREFUSED 127.0.0.1:5000
  → Backend .NET server not started (dotnet run not executed)
```

**Summary:**

- Total tests: 15 (7 E2E + 8 API)
- Passing: 0 (expected in RED phase)
- Failing: 15 (expected)
- Status: RED phase verified

---

## Notes

- Story 1.1 is purely infrastructure — no domain entities, no database migrations, no business routes beyond `__root.tsx`
- The `data-testid="app-root"` requirement is the only UI-specific testid for this story
- Both test files exist at `e2e/tests/foundation/` and `e2e/tests/api/` and are ready for RED phase execution
- The `ExceptionHandlingMiddleware` tested here is a stub (Story 1.3 will add full integration test with thrown exceptions)
- Company standard: `pnpm` only — never `npm` or `yarn` for the frontend

---

**Generated by BMad TEA Agent** - 2026-06-03
