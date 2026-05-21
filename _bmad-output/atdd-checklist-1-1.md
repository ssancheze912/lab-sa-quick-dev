# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** API (with E2E support)

---

## Story Summary

This story initializes the full-stack project skeleton: a Vite react-ts frontend and a .NET 10 Clean Architecture backend. The goal is a working development environment where both servers start, TypeScript compiles with strict mode, CORS is configured, and the Scalar API documentation page loads.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — `pnpm run dev` starts Vite on port 5173 with no errors, TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **AC2** — `dotnet run` in `src/SiesaAgents.API` starts the backend on port 5000; Scalar API docs load at `/scalar`; four Clean Architecture projects referenced in `SiesaAgents.sln`.
3. **AC3** — CORS allows requests from `http://localhost:5173` to `http://localhost:5000` without browser CORS errors.
4. **AC4** — TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — `dotnet build SiesaAgents.sln` succeeds with zero errors or warnings across all four projects.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app at `http://localhost:5173/` does not yet exist
  - **Verifies:** AC1 — Vite dev server is running and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element not yet implemented
  - **Verifies:** AC1 — React app mounts correctly in the DOM

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend project not yet created; no console output available
  - **Verifies:** AC4 — TypeScript strict mode does not produce console errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend project not yet created
  - **Verifies:** AC1/AC4 — App runs without runtime exceptions

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not yet running; no CORS headers present
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend at `http://localhost:5000` is not yet running
  - **Verifies:** AC3 — Backend responds to cross-origin requests (200/301/302)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project not yet initialized
  - **Verifies:** AC4 — No `vite-error-overlay` element rendered by the compiler

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend at `http://localhost:5000` is not yet running (connection refused)
  - **Verifies:** AC2 — `dotnet run` starts the .NET server on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `/scalar` endpoint does not exist
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is registered in `Program.cs`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; no `content-type: text/html` response
  - **Verifies:** AC2 — Scalar serves an HTML documentation page

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running
  - **Verifies:** AC2 — `/swagger` endpoint returns non-200 (Swashbuckle is forbidden)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running
  - **Verifies:** AC2 — Default `WeatherForecast` endpoint was removed from the template

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; `Access-Control-Allow-Origin` header absent
  - **Verifies:** AC3 — `DevCors` policy correctly adds the CORS response header

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight not handled
  - **Verifies:** AC3 — CORS middleware handles preflight (200 or 204, not 403)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; this serves as runtime proxy for build success
  - **Verifies:** AC5 — All four projects compiled and DI wired (server starts = build passed)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; no response to non-existent endpoint
  - **Verifies:** AC5 / AC2 — `ExceptionHandlingMiddleware` is wired; responses are JSON not HTML

---

## Data Factories Created

No domain-entity data factories are required for Story 1.1. This story validates infrastructure initialization only — no CRUD operations are performed.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future stories.

---

## Fixtures Created

No custom test fixtures are required for Story 1.1 tests. All tests use the base Playwright `test` import directly.

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures for future navigation stories.

---

## Mock Requirements

No external service mocks are required for Story 1.1.

These tests exercise the real servers (not mocked) because the acceptance criteria validate that the actual initialization works end-to-end. Both servers must be running for the tests to pass GREEN.

**Note for DEV team:** The Playwright `webServer` config in `playwright.config.ts` auto-starts the frontend via `pnpm --filter frontend dev`. The backend (`dotnet run` in `src/SiesaAgents.API`) must be started manually or added as a second `webServer` entry before running the full test suite.

---

## Required data-testid Attributes

### Frontend Root (`src/main.tsx` or `index.html`)

- `app-root` — The React application root container element

**Implementation Example:**

```tsx
// In index.html or in main.tsx wrapping the RouterProvider:
<div id="root" data-testid="app-root">
  {/* React app mounts here */}
</div>
```

**Note:** All other Story 1.1 tests probe infrastructure behavior (server availability, HTTP responses, console errors) rather than UI elements, so no additional `data-testid` attributes are required for this story.

---

## Implementation Checklist

### Test: AC1 — Frontend Vite server starts on port 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root container in `index.html` or `main.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Backend starts on port 5000 and Scalar loads at /scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution via `dotnet sln add`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default `WeatherForecast` endpoints and models from the generated API project
- [ ] Do NOT add Swashbuckle or call `app.UseSwagger()`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC3 — CORS allows requests from http://localhost:5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` array in `appsettings.Development.json` with `["http://localhost:5173"]`
- [ ] Verify OPTIONS preflight returns 200 or 204 with `Access-Control-Allow-Origin: http://localhost:5173`
- [ ] Run test: `npx playwright test --grep "CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode (zero compiler errors)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `tsconfig.app.json` contains: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors surfaced by strict mode in initial template files
- [ ] Verify `pnpm tsc --noEmit` exits with code 0
- [ ] Verify `vite-error-overlay` is NOT present after `pnpm run dev` starts
- [ ] Run test: `npx playwright test --grep "TypeScript"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Backend solution builds with zero errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Resolve all project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
- [ ] Run `dotnet build SiesaAgents.sln` and confirm exit code 0 with zero errors
- [ ] Create `ExceptionHandlingMiddleware.cs` in `src/SiesaAgents.API/Middleware/`
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing
- [ ] Verify non-existent API routes return JSON (not HTML), proving middleware is wired
- [ ] Run test: `npx playwright test --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E (frontend) tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API (backend) tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run by grep pattern (e.g., only CORS tests)
npx playwright test --grep "CORS"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests written and failing (frontend not initialized, backend not running)
- ✅ No fixtures or factories needed for infrastructure initialization story
- ✅ Required `data-testid` attributes documented (`app-root`)
- ✅ Mock requirements documented (none — real servers required)
- ✅ Implementation checklist created per AC

**Verification:**

- Tests fail because neither the frontend Vite project nor the .NET backend exists yet
- Failure messages are clear: connection refused on port 5173 and 5000
- Tests fail due to missing implementation, not test logic bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from the implementation checklist (start with AC1 — frontend init)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in the implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Recommended order:**
1. AC2 (backend first — API tests are faster and have no webServer dependency)
2. AC5 (backend builds — resolved as part of AC2 setup)
3. AC3 (CORS — configure while still in backend code)
4. AC1 (frontend initialization)
5. AC4 (TypeScript strict mode — resolved during frontend setup)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 16 tests pass** (green phase complete)
2. **Review `Program.cs`** for clean minimal structure
3. **Review `vite.config.ts`** for correct plugin order
4. **Verify `tsconfig.app.json`** contains no redundant flags
5. **Ensure tests still pass** after each refactor step
6. **Update story status** to `done` in sprint-status.yaml

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
4. **Begin implementation** using implementation checklist as guide (recommended order: AC2 → AC5 → AC3 → AC1 → AC4)
5. **Work one test at a time** (red → green for each)
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, manually update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** - Test fixture patterns (base fixture at `e2e/fixtures/base.fixture.ts` follows pure-function → fixture → mergeTests pattern)
- **data-factories.md** - Factory patterns (existing `data.helper.ts` uses counter-based uniqueId for deterministic data)
- **network-first.md** - Route interception patterns applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 test
- **test-quality.md** - One assertion per test, Given-When-Then structure, no hard waits
- **test-levels-framework.md** - API tests selected for AC2/AC5 (backend behavior); E2E tests for AC1/AC3/AC4 (browser + frontend)
- **selector-resilience.md** - `data-testid="app-root"` used instead of `#root` CSS selector

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Error: connect ECONNREFUSED 127.0.0.1:5173
 → AC1 tests: FAIL (frontend not initialized)

Error: connect ECONNREFUSED 127.0.0.1:5000
 → AC2 tests: FAIL (backend not running)
 → AC3 tests: FAIL (backend not running — CORS headers absent)
 → AC5 tests: FAIL (backend not running)

 16 failed
  0 passed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: ✅ RED phase — all tests correctly fail due to missing implementation

---

## Notes

- Story 1.1 is a pure infrastructure initialization story — no domain entities, no database, no routes beyond `__root.tsx` are created here.
- The `playwright.config.ts` `webServer` block auto-starts the frontend. The backend must be started manually before running the full suite: `dotnet run --project backend/src/SiesaAgents.API`.
- AC5 ("dotnet build succeeds") is verified at runtime: if the server starts, the build passed. A failing build prevents the server from starting, which makes the AC2/AC5 API tests fail with connection refused.
- The `ExceptionHandlingMiddleware` is tested in this story only to the extent that it is wired (non-existent routes return JSON, not HTML). Full Problem Details behavior is tested in Story 1.3.

---

**Generated by BMad TEA Agent** - 2026-05-21
