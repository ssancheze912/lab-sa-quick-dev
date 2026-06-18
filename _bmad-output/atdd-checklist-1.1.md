# ATDD Checklist — Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-18
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

Story 1.1 establishes the full development environment for the Siesa Agents CRM: a Vite react-ts frontend and a .NET 10 Clean Architecture backend initialized with all required dependencies, both servers running concurrently, and CORS correctly configured between them.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **AC2** — `dotnet run` in `src/SiesaAgents.API` starts the backend on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — CORS allows requests from `http://localhost:5173` to `http://localhost:5000` without errors (no CORS-related console errors).
4. **AC4** — TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — `dotnet build SiesaAgents.sln` compiles all four projects with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Fails until Vite dev server is running at http://localhost:5173
  - **Verifies:** AC1 — Frontend server starts and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — Fails until `[data-testid="app-root"]` is present in the rendered HTML
  - **Verifies:** AC1 — React root element is mounted correctly

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Fails until TypeScript strict mode compiles without errors
  - **Verifies:** AC4 — No TS errors in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Fails until all runtime dependencies are correctly wired
  - **Verifies:** AC1 — No runtime JavaScript exceptions on initial load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Fails until both servers are running and CORS is configured
  - **Verifies:** AC3 — No CORS console errors when frontend reaches backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Fails until backend is running and CORS headers are present
  - **Verifies:** AC3 — Backend responds 200/301/302 to cross-origin requests

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Fails until TypeScript strict mode compiles without overlay errors
  - **Verifies:** AC4 — No `<vite-error-overlay>` visible after page load

### API Tests (7 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Fails until .NET backend is running on port 5000
  - **Verifies:** AC2 — Backend responds (not connection refused)

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Fails until `app.MapScalarApiReference()` is registered in Program.cs
  - **Verifies:** AC2 — Scalar loads at /scalar with HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Fails until Scalar.AspNetCore is installed and configured
  - **Verifies:** AC2 — /scalar returns `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Passes only when Swashbuckle is NOT installed (architecture constraint)
  - **Verifies:** AC2 — Architecture constraint: Scalar ONLY, no /swagger endpoint

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Fails until default WeatherForecast endpoint is removed
  - **Verifies:** AC2 — Default .NET webapi template endpoints are cleaned up

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Fails until CORS policy is configured in Program.cs
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Fails until CORS middleware is applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Fails until `dotnet build SiesaAgents.sln` succeeds with all four projects
  - **Verifies:** AC5 — Build success inferred from running server

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Fails until ExceptionHandlingMiddleware is registered
  - **Verifies:** AC5 — Middleware is wired; non-existent routes return JSON (not HTML)

---

## Data Factories Created

No domain-level data factories are required for Story 1.1. This story tests infrastructure initialization only (server startup, CORS, TypeScript compilation). The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for domain stories (Epics 2–4).

---

## Fixtures Created

No story-specific fixtures required beyond the base fixture.

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures available:**
- `clientesPage` — Navigates to `/clientes` before test (used by Stories 1.2+)
- `contactosPage` — Navigates to `/contactos` before test (used by Stories 1.2+)

**Setup:** Navigation to the respective route
**Cleanup:** Playwright auto-cleanup (browser context isolation)

---

## Mock Requirements

Story 1.1 tests real server behavior — no mocking is applied. Both the frontend Vite dev server and the .NET backend must be running.

The `playwright.config.ts` `webServer` block starts the frontend automatically via `pnpm --filter frontend dev`. The backend must be started manually with `dotnet run` in `backend/src/SiesaAgents.API` or via a separate `webServer` entry.

---

## Required data-testid Attributes

### Frontend Root Application

- `app-root` — Root React mount container. Must be added to `src/main.tsx` or `index.html`:

```tsx
// index.html
<div id="root" data-testid="app-root"></div>
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**
- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Verify `pnpm run dev` starts without errors on port 5173
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**
- [ ] Add `data-testid="app-root"` to the `#root` div in `frontend/index.html`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**
- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all TypeScript files pass strict compilation (`pnpm tsc --noEmit`)
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**
- [ ] Wire `src/main.tsx` with `RouterProvider` inside `QueryProvider`
- [ ] Create `src/routes/__root.tsx` as root route placeholder
- [ ] Create `src/app/providers/QueryProvider.tsx`
- [ ] Create `src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Create .NET 10 solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Configure `Program.cs` with minimal builder structure
- [ ] Run `dotnet run` in `backend/src/SiesaAgents.API`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Add `Scalar.AspNetCore` NuGet package: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()` to `Program.cs`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Remove default `WeatherForecast` record and endpoint from generated API project
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin` + OPTIONS preflight

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Add CORS policy in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()`
- [ ] Verify `AllowedOrigins` array in `appsettings.Development.json` contains `http://localhost:5173`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**
- [ ] Both frontend and backend servers must be running simultaneously
- [ ] CORS policy "DevCors" must be configured (see CORS tasks above)
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning `ProblemDetails` on unhandled exceptions
- [ ] Register `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE `app.UseCors()` in `Program.cs`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.75 hours

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Create UnitTests project: `dotnet new xunit -n SiesaAgents.UnitTests -o backend/tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution: `dotnet sln add src/... tests/...`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build backend/SiesaAgents.sln` and verify zero errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E tests (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API tests (AC2, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/ --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with reporter
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (16 tests across 2 files)
- Fixtures available with auto-cleanup (base.fixture.ts)
- Data factories available for domain tests (data.helper.ts)
- Mock requirements documented (none required — real servers)
- data-testid requirements listed (`app-root`)
- Implementation checklist created

**Verification:**

- All tests fail due to missing implementation (no frontend/backend yet)
- Failure messages point to connection refused or element not found
- Tests fail for the right reason — not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC1 — frontend init)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:**
1. AC1: Frontend Vite initialization (Task 1 in story)
2. AC4: TypeScript strict mode (part of Task 1)
3. AC2: Backend .NET initialization (Task 2 in story)
4. AC5: Four Clean Architecture layers + build (Task 2 in story)
5. AC3: CORS configuration (Task 3 in story)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

After all 16 tests pass:
1. Verify code quality meets team standards (no `any` types, strict mode clean)
2. Extract duplications (shared configuration, common patterns)
3. Run tests after each refactor to maintain green status
4. Update `1-1-project-initialization-repository-structure.md` status to `done`

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception applied: `page.waitForResponse()` registered BEFORE `page.goto()`
- **test-quality.md** — Atomic tests: one assertion per test, Given-When-Then comments throughout
- **selector-resilience.md** — `data-testid` selectors used (`app-root`); no CSS class selectors
- **fixture-architecture.md** — Base fixture with auto-cleanup used for navigation fixtures
- **test-levels-framework.md** — E2E for browser-level verification (AC1, AC3, AC4); API tests for backend contracts (AC2, AC5)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`

**Expected Results:**

```
Running 16 tests using 1 worker

  FAIL  e2e/tests/foundation/project-initialization.spec.ts
    AC1 — Frontend Vite server initialization
      ✗ should serve the frontend app on port 5173 without errors
        → Error: connect ECONNREFUSED 127.0.0.1:5173
      ✗ should render the root HTML document with a valid React mount point
        → Error: connect ECONNREFUSED 127.0.0.1:5173
      ✗ should load without any TypeScript compilation errors visible in the browser console
        → Error: connect ECONNREFUSED 127.0.0.1:5173
      ✗ should not have any JavaScript runtime errors on initial load
        → Error: connect ECONNREFUSED 127.0.0.1:5173
    AC3 — CORS configuration between frontend and backend
      ✗ should allow frontend to reach backend health endpoint without CORS errors
        → Error: connect ECONNREFUSED 127.0.0.1:5173
      ✗ should receive a valid HTTP response from the backend health probe without CORS blocking
        → Error: connect ECONNREFUSED 127.0.0.1:5000
    AC4 — TypeScript strict mode active on frontend
      ✗ should load the frontend without Vite TypeScript error overlay
        → Error: connect ECONNREFUSED 127.0.0.1:5173

  FAIL  e2e/tests/api/backend-initialization.api.spec.ts
    AC2 — Backend server initialization and Scalar API documentation
      ✗ should have the backend API server running on port 5000
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should serve the Scalar API documentation page at /scalar
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should return HTML content from the Scalar documentation endpoint
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should NOT expose WeatherForecast default endpoint
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should return CORS header allowing http://localhost:5173 origin
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should respond to OPTIONS preflight from frontend origin without CORS rejection
        → Error: connect ECONNREFUSED 127.0.0.1:5000
    AC5 — Backend solution builds and runs successfully
      ✗ should have all four Clean Architecture layers responding
        → Error: connect ECONNREFUSED 127.0.0.1:5000
      ✗ should return Problem Details RFC 7807 format for unhandled errors
        → Error: connect ECONNREFUSED 127.0.0.1:5000

16 failed, 0 passed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected — implementation does not exist yet)
- Failing: 16 (expected — RED phase confirmed)
- Status: RED phase verified

**Expected Failure Messages:**

- Tests targeting port 5173: `connect ECONNREFUSED 127.0.0.1:5173` (frontend not running)
- Tests targeting port 5000: `connect ECONNREFUSED 127.0.0.1:5000` (backend not running)
- `should render the root HTML document with a valid React mount point`: `Locator expected to be visible` (data-testid="app-root" missing)

---

## Notes

- Story 1.1 is purely infrastructure — no domain entities, no database migrations, no routes beyond `__root.tsx`
- All test files are already created and in RED state. Dev agent can begin implementation immediately.
- The backend cannot be auto-started by `playwright.config.ts` `webServer` (it's .NET, not Node). The backend must be started manually or via a separate CI step before running API tests.
- `tea_use_playwright_utils: false` and `tea_use_mcp_enhancements: false` confirmed in `_bmad/bmm/config.yaml` — pure Playwright patterns used, no additional utilities.

---

**Generated by BMad TEA Agent** - 2026-06-18
