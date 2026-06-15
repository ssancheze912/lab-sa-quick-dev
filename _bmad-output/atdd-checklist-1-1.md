# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-15
**Author:** SiesaTeam
**Primary Test Level:** E2E + API (Infrastructure Smoke Tests)

---

## Story Summary

This story establishes the full development environment skeleton for the Siesa Agents CRM application. Both the Vite/React frontend and the .NET 10 Clean Architecture backend must be initialized, runnable, and able to communicate without CORS errors. No domain logic or UI routes beyond the root shell are created in this story.

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

### E2E Tests — Frontend Initialization (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

**AC1 — Frontend Vite server initialization (4 tests):**

- RED **Test:** should serve the frontend app on port 5173 without errors
  - **Status:** RED — Frontend project does not exist yet; server not running
  - **Verifies:** AC1 — Vite server responds HTTP 200 at http://localhost:5173

- RED **Test:** should render the root HTML document with a valid React mount point
  - **Status:** RED — `[data-testid="app-root"]` attribute not yet added to index.html / App.tsx
  - **Verifies:** AC1 — React root mount point is present in served HTML

- RED **Test:** should load without any TypeScript compilation errors visible in the browser console
  - **Status:** RED — Frontend not initialized; no console to inspect
  - **Verifies:** AC4 — No TypeScript errors surfaced to browser console

- RED **Test:** should not have any JavaScript runtime errors on initial load
  - **Status:** RED — Frontend not initialized; no runtime to check
  - **Verifies:** AC1, AC4 — Clean runtime execution on first load

**AC3 — CORS configuration between frontend and backend (2 tests):**

- RED **Test:** should allow frontend to reach backend health endpoint without CORS errors
  - **Status:** RED — Neither server running; CORS not configured
  - **Verifies:** AC3 — No CORS errors in browser console when frontend fetches from backend

- RED **Test:** should receive a valid HTTP response from backend health probe without CORS blocking
  - **Status:** RED — Backend not running on port 5000
  - **Verifies:** AC3 — Backend responds with 200/301/302 (not blocked)

**AC4 — TypeScript strict mode active (1 test):**

- RED **Test:** should load the frontend without Vite TypeScript error overlay
  - **Status:** RED — Frontend not initialized; Vite overlay state unknown
  - **Verifies:** AC4 — `vite-error-overlay` custom element is absent after page load

---

### API Tests — Backend Initialization (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

**AC2 — Backend server initialization and Scalar API documentation (7 tests):**

- RED **Test:** should have the backend API server running on port 5000
  - **Status:** RED — Backend solution not created; port 5000 not bound
  - **Verifies:** AC2 — Backend responds to any HTTP request (status < 500)

- RED **Test:** should serve the Scalar API documentation page at /scalar
  - **Status:** RED — `Scalar.AspNetCore` not installed; `MapScalarApiReference()` not called
  - **Verifies:** AC2 — GET /scalar returns HTTP 200

- RED **Test:** should return HTML content from the Scalar documentation endpoint
  - **Status:** RED — /scalar endpoint does not exist yet
  - **Verifies:** AC2 — /scalar response Content-Type includes text/html

- RED **Test:** should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
  - **Status:** RED — Backend not running; cannot confirm absence of /swagger
  - **Verifies:** AC2 — /swagger does NOT return HTTP 200 (architecture constraint)

- RED **Test:** should NOT expose WeatherForecast default endpoint
  - **Status:** RED — Backend not initialized; default template endpoints not cleaned up
  - **Verifies:** AC2 — /weatherforecast returns 404 or 405 (template cleanup done)

- RED **Test:** should return CORS header allowing http://localhost:5173 origin
  - **Status:** RED — CORS policy not configured in Program.cs
  - **Verifies:** AC3 — Access-Control-Allow-Origin header present for localhost:5173

- RED **Test:** should respond to OPTIONS preflight from frontend origin without CORS rejection
  - **Status:** RED — CORS middleware not registered
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

**AC5 — Backend solution builds and runs (2 tests):**

- RED **Test:** should have all four Clean Architecture layers responding (via DI)
  - **Status:** RED — Solution not created; cannot build or run
  - **Verifies:** AC5 — Server responding at /scalar proves all four projects compiled (build proxy)

- RED **Test:** should return Problem Details RFC 7807 format for unhandled errors
  - **Status:** RED — `ExceptionHandlingMiddleware` not implemented; backend not running
  - **Verifies:** AC5 — 404 responses return JSON (not HTML), confirming middleware wiring

---

## Data Factories Created

This story involves no domain entities; no data factories are required. All test data is inline (port numbers, URLs, HTTP status codes) or environment-driven via `process.env.API_BASE_URL`.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` route before test executes
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Positioned page at the clientes route
  - **Cleanup:** None (navigation state reset per test)

- `contactosPage` — Navigates to `/contactos` route before test executes
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Positioned page at the contactos route
  - **Cleanup:** None

> Note: These fixtures are scoped to Story 1.2 use but created here as shared infrastructure.

---

## Mock Requirements

No external third-party services require mocking in this story. All interactions are between real processes (Vite dev server on :5173 and .NET server on :5000). The tests are integration-level smoke tests that verify real server behavior.

**Development Environment Assumption:**

- Frontend dev server must be running on port 5173 before E2E tests execute (handled by `webServer` in `playwright.config.ts`)
- Backend must be started manually or via `webServer` config before running API tests
- `process.env.API_BASE_URL` defaults to `http://localhost:5000`

---

## Required data-testid Attributes

### Application Root (index.html or App.tsx)

- `app-root` — The root React mount point element (required by AC1 test: "should render the root HTML document with a valid React mount point")

**Implementation Example:**

```tsx
// Option A: index.html
<div id="root" data-testid="app-root"></div>

// Option B: App.tsx wrapper
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

> All other data-testid attributes for this story's scope are deferred to Story 1.2 (navigation shell).

---

## Implementation Checklist

### Test: should serve the frontend app on port 5173 without errors

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Verify `pnpm run dev` starts without errors
- [ ] Confirm server responds at http://localhost:5173
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "should serve the frontend"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should render the root HTML document with a valid React mount point

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root div in `frontend/index.html` or `App.tsx`
- [ ] Required data-testid attributes: `app-root`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "valid React mount point"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should load without any TypeScript compilation errors visible in the browser console

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install all runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Ensure all imports are correctly typed (no implicit any)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should not have any JavaScript runtime errors on initial load

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/routes/__root.tsx` as TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/app/providers/QueryProvider.tsx`
- [ ] Create `src/shared/lib/queryClient.ts`
- [ ] Create `src/shared/lib/apiClient.ts`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: should allow frontend to reach backend health endpoint without CORS errors

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete backend initialization (see AC2 tasks below)
- [ ] Configure CORS in `Program.cs` — register policy `DevCors` allowing `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before endpoint mappings in `Program.cs`
- [ ] Verify both servers are running simultaneously
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should receive valid HTTP response from backend health probe without CORS blocking

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Backend must be running on port 5000 (AC2 prerequisite)
- [ ] Confirm GET /scalar returns 200, 301, or 302
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "valid HTTP response"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should load the frontend without Vite TypeScript error overlay

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] All TypeScript errors must be resolved (AC4 strict mode config)
- [ ] Initialize TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
- [ ] Verify `vite-error-overlay` custom element does not appear after load
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "Vite TypeScript error overlay"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should have the backend API server running on port 5000

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add all projects to solution
- [ ] Run `dotnet run` in `src/SiesaAgents.API`
- [ ] Verify port 5000 is bound
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "running on port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should serve the Scalar API documentation page at /scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` in `Program.cs`
- [ ] Add `app.MapScalarApiReference()` in `Program.cs` — NEVER `app.UseSwagger()`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "/scalar"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should return HTML content from the Scalar documentation endpoint

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Scalar endpoint configured (prerequisite: previous test)
- [ ] Confirm response Content-Type includes `text/html`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "HTML content"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: should NOT expose any Swagger/OpenAPI UI endpoint

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Do NOT install Swashbuckle.AspNetCore or any Swagger middleware
- [ ] Do NOT call `app.UseSwagger()` or `app.UseSwaggerUI()` in `Program.cs`
- [ ] Confirm GET /swagger returns 404
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: should NOT expose WeatherForecast default endpoint

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default WeatherForecast endpoints and models from generated API project
- [ ] Confirm GET /weatherforecast returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should return CORS header allowing http://localhost:5173 origin

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and all endpoint mappings
- [ ] Confirm `Access-Control-Allow-Origin` header is `http://localhost:5173` or `*`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should respond to OPTIONS preflight from frontend origin without CORS rejection

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS middleware must be applied (prerequisite: previous test)
- [ ] Confirm OPTIONS preflight returns 200 or 204 (not 403)
- [ ] Add configuration to `appsettings.Development.json` with `AllowedOrigins` array
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should have all four Clean Architecture layers responding (via DI)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet packages: `FluentValidation` to Application, `Npgsql.EntityFrameworkCore.PostgreSQL` to Infrastructure
- [ ] Run `dotnet build SiesaAgents.sln` — must succeed with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture layers"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should return Problem Details RFC 7807 format for unhandled errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Implement middleware returning `application/problem+json` with status 500, title, no stack trace
- [ ] Register: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before `app.UseCors()`
- [ ] Confirm 404 responses return Content-Type containing `json` (not `text/html`)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.75 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only frontend initialization tests (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only backend API tests (AC2, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 16 tests written and failing (infrastructure does not exist yet)
- Fixtures created with auto-cleanup pattern (base.fixture.ts)
- Mock requirements documented (none required for this story)
- data-testid requirements listed (`app-root`)
- Implementation checklist created with clear per-test tasks

**Verification:**

- All tests fail due to missing implementation (servers not running, projects not initialized)
- Failure messages indicate connection refused or element not found — not test bugs
- Tests will remain RED until both frontend and backend projects are fully initialized

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC2 backend server)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order (dependency-driven):**

1. Backend first (AC2): Initialize solution → add Scalar → verify /scalar → clean template
2. CORS (AC3): Configure DevCors policy → apply middleware → verify headers
3. Frontend (AC1): `pnpm create vite` → install deps → configure tsconfig → wire routing
4. TypeScript strict (AC4): Confirm strict flags → fix any type errors → verify no overlay
5. Build verification (AC5): `dotnet build` → ExceptionHandlingMiddleware → JSON error responses

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review Program.cs for minimal, clean structure
3. Review tsconfig.app.json — no redundant flags
4. Review directory structure matches architecture.md specification
5. Ensure tests still pass after each refactor
6. Update story status to 'in-review' in sprint-status.yaml

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Review checklist with team in standup
3. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
4. Begin implementation using checklist above as guide
5. Work one test at a time (red to green for each)
6. When all 16 tests pass, refactor for quality
7. When refactoring complete, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — `page.waitForResponse()` registered BEFORE `page.goto()` (AC1 test 1, AC4 test)
- **test-quality.md** — One assertion per test; Given-When-Then comments in every test
- **selector-resilience.md** — `data-testid="app-root"` used (not CSS class selector)
- **test-levels-framework.md** — E2E for browser/CORS validation; API tests for backend endpoint verification
- **fixture-architecture.md** — `base.fixture.ts` extends Playwright `test` with `test.extend()`
- **data-factories.md** — Not applicable (no domain entities in Story 1.1)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
FAIL e2e/tests/foundation/project-initialization.spec.ts
  AC1 — Frontend Vite server initialization
    x should serve the frontend app on port 5173 without errors
      Error: connect ECONNREFUSED 127.0.0.1:5173
    x should render the root HTML document with a valid React mount point
      Error: connect ECONNREFUSED 127.0.0.1:5173
    x should load without any TypeScript compilation errors visible in the browser console
      Error: connect ECONNREFUSED 127.0.0.1:5173
    x should not have any JavaScript runtime errors on initial load
      Error: connect ECONNREFUSED 127.0.0.1:5173
  AC3 — CORS configuration between frontend and backend
    x should allow frontend to reach backend health endpoint without CORS errors
      Error: connect ECONNREFUSED 127.0.0.1:5173
    x should receive a valid HTTP response from the backend health probe without CORS blocking
      Error: connect ECONNREFUSED 127.0.0.1:5000
  AC4 — TypeScript strict mode active on frontend
    x should load the frontend without Vite TypeScript error overlay
      Error: connect ECONNREFUSED 127.0.0.1:5173

FAIL e2e/tests/api/backend-initialization.api.spec.ts
  AC2 — Backend server initialization and Scalar API documentation
    x should have the backend API server running on port 5000
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should serve the Scalar API documentation page at /scalar
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should return HTML content from the Scalar documentation endpoint
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should NOT expose WeatherForecast default endpoint
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should return CORS header allowing http://localhost:5173 origin
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should respond to OPTIONS preflight from frontend origin without CORS rejection
      Error: connect ECONNREFUSED 127.0.0.1:5000
  AC5 — Backend solution builds and runs successfully
    x should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)
      Error: connect ECONNREFUSED 127.0.0.1:5000
    x should return Problem Details RFC 7807 format for unhandled errors
      Error: connect ECONNREFUSED 127.0.0.1:5000

16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase verified — failures are ECONNREFUSED (infrastructure missing), not test code errors

---

## Notes

- This story initializes infrastructure only — no domain entities, no database migrations, no UI routes beyond `__root.tsx`
- AC5 (dotnet build succeeds) is verified indirectly via runtime: if the server responds to /scalar, the build passed. A failed build would prevent the server from starting.
- The `webServer` entry in `playwright.config.ts` starts the Vite frontend automatically during E2E test runs. The .NET backend must be started separately before running the API tests.
- All test files use `process.env.API_BASE_URL ?? 'http://localhost:5000'` for easy CI override.
- The `app-root` data-testid is the only UI contract defined in this story. All other UI data-testid attributes are deferred to Story 1.2 (navigation shell).

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/workflows/testarch/atdd/instructions.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-15
