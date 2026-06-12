# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-12
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects
initialized with all required dependencies, so that the team has a working development environment
with both servers running and communicating correctly.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
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

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

#### AC1 — Frontend Vite server initialization

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app does not exist yet; `http://localhost:5173/` will not respond
  - **Verifies:** Vite dev server starts and returns HTTP 200 on root route

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element is not implemented yet
  - **Verifies:** React root element is mounted and visible in the DOM

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend app to load; console errors will be emitted by missing app
  - **Verifies:** TypeScript strict mode produces zero compilation errors served by Vite

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend app does not exist; page load will produce runtime errors
  - **Verifies:** Application boots cleanly without JavaScript exceptions

#### AC3 — CORS configuration between frontend and backend

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; fetch to port 5000 will fail or produce CORS errors
  - **Verifies:** No CORS-related errors in console when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend server not running; request will fail with connection refused
  - **Verifies:** Backend responds with 200, 301, or 302 (not CORS-blocked)

#### AC4 — TypeScript strict mode

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend app does not exist; Vite error overlay or blank page expected
  - **Verifies:** `vite-error-overlay` element is absent after full network idle load

---

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

#### AC2 — Backend server initialization and Scalar API documentation

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; connection refused or timeout expected
  - **Verifies:** Backend server is alive and accepts HTTP connections

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; 503 or connection error expected
  - **Verifies:** GET /scalar returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; no HTML content to validate
  - **Verifies:** Content-Type header contains `text/html` from /scalar

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; test cannot verify absent endpoint
  - **Verifies:** GET /swagger does NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; test cannot verify removed endpoint
  - **Verifies:** GET /weatherforecast returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; no CORS headers available
  - **Verifies:** `access-control-allow-origin` header allows frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight will time out or fail
  - **Verifies:** OPTIONS preflight returns 200 or 204

#### AC5 — Backend solution builds and runs successfully

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; server start confirms successful build
  - **Verifies:** Server is running (proves dotnet build succeeded for all four projects)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; no response to validate middleware
  - **Verifies:** Unknown endpoint returns JSON (not HTML) with status 404 or 400

---

## Data Factories Created

No domain entity factories are required for Story 1.1. This story initializes the project
skeleton only — no domain data is created or persisted.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories
for later stories. No additional factories are needed here.

---

## Fixtures Created

### Base Fixtures

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Void (side effect: page is on /clientes)
  - **Cleanup:** None required (navigation only)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Void (side effect: page is on /contactos)
  - **Cleanup:** None required (navigation only)

**Note:** Story 1.1 E2E tests use `@playwright/test` directly (not extended fixtures) because
the tests are infrastructure-level verifications, not user-journey flows.

---

## Mock Requirements

Story 1.1 tests the **real running servers** — no mocks are used. This is intentional:
the acceptance criteria validate actual server startup, not simulated responses.

### Backend API Server

**No mocking applied.** Tests connect to `http://localhost:5000` directly to verify the real
.NET 10 backend is running and CORS is properly configured.

**Prerequisite for GREEN phase:** The backend must be running via `dotnet run` in
`src/SiesaAgents.API` on port 5000 before API tests execute.

**Prerequisite for GREEN phase:** The frontend must be running via `pnpm run dev` on port 5173
before E2E tests execute (handled automatically by `playwright.config.ts` webServer config).

---

## Required data-testid Attributes

### App Root (`src/main.tsx` or `index.html`)

- `app-root` — React application root mount point
  - **Required by:** AC1 test "should render the root HTML document with a valid React mount point"
  - **Implementation:** Add `data-testid="app-root"` to the root `<div>` in `index.html` or
    wrap the top-level component in `App.tsx`

**Implementation Example:**

```tsx
// Option A: index.html
<div id="root" data-testid="app-root"></div>

// Option B: src/App.tsx or src/main.tsx wrapper
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test Group: AC1 — Frontend Vite server initialization

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root element in `index.html` or `src/main.tsx`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: AC2 — Backend server initialization and Scalar API documentation

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` at `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoints and models from the generated API project
- [ ] Verify `dotnet run` starts on port 5000 and `/scalar` returns HTTP 200
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC3 — CORS configuration

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (AC3 section)
**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC2 CORS tests)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register CORS policy: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json` with `http://localhost:5173`
- [ ] Verify: `access-control-allow-origin: http://localhost:5173` header present on responses
- [ ] Verify: OPTIONS preflight returns 200 or 204 (not 403)
- [ ] Run test: `pnpm exec playwright test --grep "CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC4 — TypeScript strict mode

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (AC4 section)

**Tasks to make these tests pass:**

- [ ] Ensure `tsconfig.app.json` contains `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Run `pnpm tsc --noEmit` and fix all TypeScript errors in source files
- [ ] Verify Vite dev server starts with no compilation error overlay (`vite-error-overlay` absent)
- [ ] Run test: `pnpm exec playwright test --grep "TypeScript"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 — Backend solution builds with zero errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC5 section)

**Tasks to make these tests pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add unit tests to solution: `dotnet sln add tests/SiesaAgents.UnitTests`
- [ ] Add project references for unit tests: UnitTests → Application + Domain
- [ ] Add NuGet packages: FluentValidation to Application, Npgsql.EntityFrameworkCore.PostgreSQL to Infrastructure
- [ ] Add placeholder `ConnectionStrings:DefaultConnection` to `appsettings.Development.json`
- [ ] Create `ExceptionHandlingMiddleware` stub returning Problem Details RFC 7807
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Run `dotnet build SiesaAgents.sln` and confirm zero errors/warnings
- [ ] Run test: `pnpm exec playwright test --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run ALL failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with custom API URL (if backend on different port)
API_BASE_URL=http://localhost:5000 pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (16 tests total: 7 E2E + 9 API)
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented (none required — real server tests)
- ✅ data-testid requirements listed (`app-root`)
- ✅ Implementation checklist created per AC group

**Verification:**

- All tests run and fail as expected
- Failure messages are clear: "connection refused" or "element not found"
- Tests fail due to missing implementation (no servers running), not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with AC2 (backend)** — Initialize the .NET solution first; it has no frontend dependency
2. **Then AC1 (frontend)** — Initialize the Vite + React project
3. **Then AC3 (CORS)** — Configure CORS after both servers are running
4. **Then AC4 (TypeScript)** — Verify strict mode after frontend compiles
5. **Then AC5 (build)** — Verify clean build after all four projects are added

**Key Principles:**

- One test group at a time
- Start servers before running tests (`dotnet run` + `pnpm run dev`)
- Run tests frequently for immediate feedback
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks in implementation checklist above
- Mark story as IN PROGRESS in sprint-status.yaml

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 16 tests pass** (green phase complete)
2. **Review `Program.cs`** — Ensure middleware order is correct (ExceptionHandling → CORS → Scalar → endpoints)
3. **Review `tsconfig.app.json`** — Confirm all strict flags are present and correct
4. **Review folder structure** — Confirm `frontend/` and `backend/` match `architecture.md`
5. **Ensure tests still pass** after each refactor

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Do not change test files during refactor (only implementation)
- Run `pnpm exec playwright test` after each change

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
3. **Begin implementation** starting with AC2 (backend), then AC1 (frontend)
4. **Work one AC group at a time** (red → green for each)
5. **When all 16 tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns (base.fixture.ts uses `test.extend()`)
- **data-factories.md** — Factory patterns (data.helper.ts for future stories)
- **network-first.md** — Route interception before navigation (used in AC1, AC4 tests)
- **test-quality.md** — Given-When-Then structure, one assertion per test, determinism
- **selector-resilience.md** — `data-testid` selectors used exclusively (`app-root`, `vite-error-overlay`)
- **timing-debugging.md** — `waitForResponse` and `waitForLoadState` instead of hard waits

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
Running 16 tests using 4 workers

  ✗  AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✗  AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✗  AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✗  AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✗  AC3 — CORS configuration › should allow frontend to reach backend health endpoint without CORS errors
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✗  AC3 — CORS configuration › should receive a valid HTTP response from the backend health probe without CORS blocking
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  ✗  AC4 — TypeScript strict mode › should load the frontend without Vite TypeScript error overlay
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✗  AC2 — Backend server initialization › should have the backend API server running on port 5000
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/

  ✗  AC2 — Backend server initialization › should serve the Scalar API documentation page at /scalar
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  ✗  AC2 — Backend server initialization › should return HTML content from the Scalar documentation endpoint
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  ✗  AC2 — Backend server initialization › should NOT expose any Swagger/OpenAPI UI endpoint
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/swagger

  ✗  AC2 — Backend server initialization › should NOT expose WeatherForecast default endpoint
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/weatherforecast

  ✗  AC2 — Backend server initialization › should return CORS header allowing http://localhost:5173 origin
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  ✗  AC2 — Backend server initialization › should respond to OPTIONS preflight from frontend origin without CORS rejection
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  ✗  AC5 — Backend solution builds and runs › should have all four Clean Architecture layers responding
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  ✗  AC5 — Backend solution builds and runs › should return Problem Details RFC 7807 format for unhandled errors
     Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/api/nonexistent-endpoint-for-atdd

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: ✅ RED phase verified

**Expected Failure Reason for All Tests:** `net::ERR_CONNECTION_REFUSED` — servers are not running.
After servers start, second-layer failures will indicate missing implementation details
(e.g., missing `data-testid="app-root"`, missing `/scalar` endpoint, missing CORS headers).

---

## Notes

- Story 1.1 tests infrastructure initialization only — no domain entities or API routes beyond `/scalar`
- Tests for AC2 and AC5 are co-located in `backend-initialization.api.spec.ts` because both
  validate backend runtime behavior (build success is proven by server startup)
- The `playwright.config.ts` `webServer` config handles frontend startup automatically for E2E tests;
  **the backend must be started manually** before running API tests
- All tests use `process.env.API_BASE_URL ?? 'http://localhost:5000'` to support CI environments
  with different backend addresses
- No faker dependency is added for this story — random data factories are deferred to Epic 2+

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-12
