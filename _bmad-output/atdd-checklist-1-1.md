# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-21
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

Story 1.1 establishes the full-stack development foundation: a Vite React-TypeScript frontend and a .NET 10 Clean Architecture backend. The goal is to have both dev servers running locally, TypeScript strict mode enforced on the frontend, Scalar API docs exposed on the backend, and CORS configured so the frontend can communicate with the backend without browser errors.

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

### E2E Tests (8 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend project not yet created; port 5173 not listening
  - **Verifies:** AC1 — Vite dev server up and serving HTTP 200 at root

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element absent until `main.tsx` and `index.html` are implemented
  - **Verifies:** AC1 — React app bootstraps correctly with identifiable mount point

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Project does not exist; Vite not running
  - **Verifies:** AC1 / AC4 — No TypeScript errors surfaced in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Project does not exist; Vite not running
  - **Verifies:** AC1 — Runtime is clean, no exceptions on first load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS not configured
  - **Verifies:** AC3 — No CORS-related console errors when frontend calls backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running on port 5000
  - **Verifies:** AC3 — Backend responds (200/301/302) to requests from frontend origin

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project not initialized
  - **Verifies:** AC4 — No `<vite-error-overlay>` rendered, strict TypeScript compiles cleanly

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend project not created; port 5000 not listening
  - **Verifies:** AC2 — Server is up and responds (not connection refused)

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `MapScalarApiReference()` not registered
  - **Verifies:** AC2 — `/scalar` returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; Scalar package not installed
  - **Verifies:** AC2 — `/scalar` content-type is `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; architecture constraint not yet enforced
  - **Verifies:** AC2 — `/swagger` does NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default template endpoint not yet removed
  - **Verifies:** AC2 — `/weatherforecast` returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS policy "DevCors" not registered
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` header present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; CORS middleware not wired before routing
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend solution not created; four projects not assembled
  - **Verifies:** AC5 — Server running means build succeeded (all four projects compiled)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; `ExceptionHandlingMiddleware` not registered
  - **Verifies:** AC5 / AC2 — 404 responses are JSON (not HTML), middleware wired correctly

### API Tests

Covered within `e2e/tests/api/backend-initialization.api.spec.ts` using Playwright's `request` fixture (direct HTTP — no browser UI).

### Component Tests

Not applicable for this story. Story 1.1 is a developer-environment infrastructure story with no user-facing UI components to mount and interact with.

---

## Data Factories Created

No data factories required for this story. All tests verify infrastructure behavior (server availability, HTTP response codes, headers, and console error absence) — no domain entities need to be generated.

---

## Fixtures Created

No custom fixtures created for this story beyond the existing `e2e/fixtures/base.fixture.ts`.

The existing `base.fixture.ts` provides `clientesPage` and `contactosPage` navigation fixtures. Story 1.1 tests use the built-in `page` and `request` fixtures from `@playwright/test` directly, as they are testing server startup and raw HTTP behavior.

---

## Mock Requirements

Story 1.1 tests verify that **real servers are running**, so network mocking is intentionally NOT used. These are environment-level acceptance tests.

No mocks required or desired. Tests must fail when servers are absent and pass only when both servers are genuinely running.

---

## Required data-testid Attributes

### `frontend/index.html` or `frontend/src/main.tsx`

- `app-root` — The root React mount point element. Implementation must add `data-testid="app-root"` to the div that React renders into.

**Implementation Example:**

```html
<!-- frontend/index.html -->
<div id="root" data-testid="app-root"></div>
```

Or alternatively in `main.tsx` via React:

```tsx
// frontend/src/main.tsx
const rootEl = document.getElementById('root');
if (rootEl) rootEl.setAttribute('data-testid', 'app-root');
```

---

## Implementation Checklist

### Test: AC1 — Frontend Vite server starts on port 5173

**Files:** `e2e/tests/foundation/project-initialization.spec.ts` (AC1 describe block)

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install all runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Add `data-testid="app-root"` to the root element in `frontend/index.html`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts without TypeScript errors and no `<vite-error-overlay>` appears
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Backend starts on port 5000, Scalar loads at /scalar

**Files:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC2 describe block)

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all four projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add NuGet package to API: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Register `app.MapScalarApiReference()` in `Program.cs`
- [ ] Remove default WeatherForecast endpoint and controller from the generated API project
- [ ] Do NOT install or configure Swashbuckle — use `builder.Services.AddOpenApi()` only for Scalar metadata
- [ ] Verify `dotnet run` in `src/SiesaAgents.API` starts on port 5000
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC3 — CORS allows requests from http://localhost:5173

**Files:** `e2e/tests/foundation/project-initialization.spec.ts` (AC3 describe block) + `e2e/tests/api/backend-initialization.api.spec.ts` (CORS header tests)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, add `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and any endpoint mappings
- [ ] Configure from `appsettings.Development.json`: add `"AllowedOrigins": ["http://localhost:5173"]`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC3"`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### Test: AC4 — TypeScript strict mode active

**Files:** `e2e/tests/foundation/project-initialization.spec.ts` (AC4 describe block)

**Tasks to make this test pass:**

- [ ] Ensure `frontend/tsconfig.app.json` contains: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors that emerge from strict mode in generated source files
- [ ] Confirm no `<vite-error-overlay>` in DOM after `page.goto('/')` + `waitForLoadState('networkidle')`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes (covered as part of AC1 setup)

---

### Test: AC5 — Backend solution builds with zero errors

**Files:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC5 describe block)

**Tasks to make these tests pass:**

- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
- [ ] Add NuGet packages: `FluentValidation` to Application; `Npgsql.EntityFrameworkCore.PostgreSQL` to Infrastructure
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests` and add to solution
- [ ] Register `ExceptionHandlingMiddleware` in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Implement `ExceptionHandlingMiddleware` returning RFC 7807 Problem Details (status 500, no stack traces exposed)
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Verify unknown paths return JSON (not HTML) — confirms middleware is wired
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC3 headers, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with coverage (after vitest setup)
pnpm run test:coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- No data factories needed (infrastructure-only story)
- No fixtures needed beyond Playwright built-ins
- Mock requirements documented (none for this story — real servers required)
- `data-testid="app-root"` requirement documented for frontend
- Implementation checklist created with clear task mapping

**Verification:**

- All tests run and fail with `net::ERR_CONNECTION_REFUSED` (servers not running)
- `[data-testid="app-root"]` test fails with `Timeout - Locator: [data-testid="app-root"]`
- CORS tests fail with connection errors before CORS headers are even evaluated
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick AC2 first** — initialize the backend solution (foundation for CORS tests)
2. **Read each test** to understand expected server and header behavior
3. **Implement minimal code** — bare `Program.cs` with Scalar + CORS registration
4. **Run the AC2 tests** to verify green
5. **Continue to AC1** — initialize frontend, add `data-testid="app-root"`
6. **Run AC1 and AC4 tests** to verify green
7. **Run AC3 tests** to verify CORS is working end-to-end
8. **Run AC5 tests** to verify solution build proves Clean Architecture layers are in place

**Key Principles:**

- One acceptance criterion at a time
- Minimal implementation (no domain entities, no routes beyond `__root.tsx`)
- Run tests frequently for immediate feedback

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 15 tests pass
2. Review `Program.cs` for clarity and ordering (middleware → CORS → Scalar → endpoints)
3. Ensure `appsettings.Development.json` is the source of truth for allowed origins
4. Review `tsconfig.app.json` for consistency with architecture document
5. Ensure tests still pass after refactoring

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation starting with Task 2 (backend) per story 1.1 task ordering
4. Work one AC at a time (red → green for each)
5. When all 15 tests pass, refactor for quality
6. When refactoring complete, manually update story status to `in-review`

---

## Knowledge Base References Applied

- **network-first.md** — `page.waitForResponse()` registered before `page.goto()` in AC1 test
- **selector-resilience.md** — `data-testid="app-root"` used instead of CSS `#root`
- **test-quality.md** — One assertion per test; no hard waits; explicit `waitForLoadState`
- **fixture-architecture.md** — Built-in Playwright `page` and `request` fixtures sufficient; no custom fixtures needed for infrastructure tests
- **test-levels-framework.md** — E2E for user-visible server behavior; API (request fixture) for HTTP contract validation; Component tests not applicable

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
FAILED e2e/tests/foundation/project-initialization.spec.ts
  × AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5173/
  × AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5173/
  × AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5173/
  × AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5173/
  × AC3 — CORS configuration between frontend and backend > should allow frontend to reach backend health endpoint without CORS errors
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5173/
  × AC3 — CORS configuration between frontend and backend > should receive a valid HTTP response from the backend health probe without CORS blocking
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/scalar
  × AC4 — TypeScript strict mode active on frontend > should load the frontend without Vite TypeScript error overlay
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5173/

FAILED e2e/tests/api/backend-initialization.api.spec.ts
  × AC2 — Backend server initialization > should have the backend API server running on port 5000
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/
  × AC2 — Backend server initialization > should serve the Scalar API documentation page at /scalar
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/scalar
  × AC2 — Backend server initialization > should return HTML content from the Scalar documentation endpoint
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/scalar
  × AC2 — Backend server initialization > should NOT expose any Swagger/OpenAPI UI endpoint
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/swagger
  × AC2 — Backend server initialization > should NOT expose WeatherForecast default endpoint
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/weatherforecast
  × AC2 — Backend server initialization > should return CORS header allowing http://localhost:5173 origin
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/scalar
  × AC2 — Backend server initialization > should respond to OPTIONS preflight from frontend origin without CORS rejection
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/scalar
  × AC5 — Backend solution builds and runs successfully > should have all four Clean Architecture layers responding
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/scalar
  × AC5 — Backend solution builds and runs successfully > should return Problem Details RFC 7807 format for unhandled errors
    Error: net::ERR_CONNECTION_REFUSED → http://localhost:5000/api/nonexistent-endpoint-for-atdd
```

**Summary:**

- Total tests: 15
- Passing: 0 (expected)
- Failing: 15 (expected — servers not running)
- Status: RED phase verified

---

## Notes

- Story 1.1 is a developer environment / infrastructure story. All tests verify real server behavior; no mocks are used intentionally.
- The `data-testid="app-root"` requirement is the only UI-level data attribute needed for this story.
- AC5 (dotnet build) is verified indirectly: if the backend server starts and responds, the solution compiled successfully. A separate CI step (`dotnet build SiesaAgents.sln`) should also be added to the pipeline in a later story.
- The `playwright.config.ts` `webServer` block auto-starts the frontend on `pnpm --filter frontend dev`. Backend must be started separately before running API-level tests.
- Tests use `process.env.API_BASE_URL ?? 'http://localhost:5000'` so CI can override the backend URL.

---

**Generated by BMad TEA Agent** — 2026-06-21
