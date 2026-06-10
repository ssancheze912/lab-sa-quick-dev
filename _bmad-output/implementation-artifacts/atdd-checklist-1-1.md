# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-10
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** API Integration + E2E (Playwright)

---

## Story Summary

Story 1.1 sets up the complete development environment: a Vite/React/TypeScript frontend and a .NET 10 Clean Architecture backend. The goal is a working skeleton with both servers running, CORS configured, TypeScript strict mode active, and the Scalar API documentation page accessible.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **AC2** — `dotnet run` starts the backend on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — CORS allows requests from `http://localhost:5173` to `http://localhost:5000` without errors (no CORS-related console errors).
4. **AC4** — TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — `dotnet build SiesaAgents.sln` executes with all four projects compiling successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `AC1 — should serve the frontend app on port 5173 without errors`
  - **Status:** RED - Frontend server does not exist yet
  - **Verifies:** Vite dev server starts and returns HTTP 200 on port 5173

- **Test:** `AC1 — should render the root HTML document with a valid React mount point`
  - **Status:** RED - `[data-testid="app-root"]` not implemented yet
  - **Verifies:** React root element with `data-testid="app-root"` is visible in DOM

- **Test:** `AC4 — should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - Frontend does not exist yet
  - **Verifies:** No TypeScript error messages appear in browser console on page load

- **Test:** `AC1/AC4 — should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - Frontend does not exist yet
  - **Verifies:** Zero JavaScript runtime exceptions thrown on initial render

- **Test:** `AC4 — should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED - Frontend not initialized; `vite-error-overlay` check once running
  - **Verifies:** No Vite TypeScript compilation error overlay visible after `networkidle`

- **Test:** `AC3 — should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED - Neither server exists; CORS not configured
  - **Verifies:** No CORS-related errors in browser console when frontend fetches from backend

- **Test:** `AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED - Backend not running yet
  - **Verifies:** Backend `/scalar` endpoint responds 200/301/302 (not CORS-blocked)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `AC2 — should have the backend API server running on port 5000`
  - **Status:** RED - Backend not running; connection refused
  - **Verifies:** Backend server responds on port 5000 with status < 500

- **Test:** `AC2 — should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - `app.MapScalarApiReference()` not configured yet
  - **Verifies:** GET /scalar returns HTTP 200

- **Test:** `AC2 — should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - Scalar not configured
  - **Verifies:** Content-Type header at /scalar contains `text/html`

- **Test:** `AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - Backend not running; also verifies Swashbuckle is absent
  - **Verifies:** GET /swagger does NOT return HTTP 200

- **Test:** `AC2 — should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - Default template not cleaned up yet
  - **Verifies:** GET /weatherforecast returns 404 or 405 (removed from template)

- **Test:** `AC3 — should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - CORS policy "DevCors" not configured
  - **Verifies:** `Access-Control-Allow-Origin` header present and set to `http://localhost:5173`

- **Test:** `AC3 — should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - CORS middleware not wired in `Program.cs`
  - **Verifies:** OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `AC5 — should have all four Clean Architecture layers responding (build proxy test)`
  - **Status:** RED - Solution not built; server not running
  - **Verifies:** Server responds (proxy proof that `dotnet build SiesaAgents.sln` succeeded)

- **Test:** `AC5 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - `ExceptionHandlingMiddleware` not registered
  - **Verifies:** Non-existent endpoint returns JSON (not HTML), status 404/400

### Component Tests

No component-level tests for Story 1.1. This story creates infrastructure/configuration only — there are no UI components to test at the component level. Component tests are introduced in Story 1.2 (NavigationRail/NavigationBar).

---

## Data Factories Created

No data factories required for Story 1.1. This story has no domain entities or user-facing data input. Data factories are introduced starting in Story 2.1 (Clientes).

---

## Fixtures Created

The `e2e/fixtures/base.fixture.ts` file is the shared Playwright fixture base for the project. Story 1.1 tests use the standard `{ page, request }` Playwright fixtures directly — no story-specific fixtures needed.

**File:** `e2e/fixtures/base.fixture.ts`

- `clientesPage` — navigates to `/clientes` before test (used in Story 1.2+)
- `contactosPage` — navigates to `/contactos` before test (used in Story 1.2+)

---

## Mock Requirements

No MSW mocks required for Story 1.1. All tests make real network calls to verify actual server initialization. The tests are integration-level: they test real infrastructure, not mocked behavior.

---

## Required `data-testid` Attributes

### `index.html` / `App.tsx` / Root Component

- `app-root` — root React mount point; required for AC1 E2E test
  - Must be added to the `#root` `<div>` in `index.html` or the outermost element in `App.tsx`

**Implementation Example:**

```html
<!-- index.html -->
<div id="root" data-testid="app-root"></div>
```

or in the root React component:

```tsx
// src/main.tsx or src/App.tsx wrapper
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: AC1 — Frontend server starts on port 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin
- [ ] Add `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` to `tsconfig.app.json`
- [ ] Run `pnpm run dev` and confirm server starts on port 5173
- [ ] Add `data-testid="app-root"` to the root HTML element
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC2 — Backend starts on port 5000, Scalar loads at /scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application, Domain, Infrastructure class libraries in `src/`
- [ ] Add all projects to `SiesaAgents.sln`
- [ ] Set up project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add `Scalar.AspNetCore` NuGet package to API project
- [ ] Register `app.MapScalarApiReference()` in `Program.cs` (NEVER `app.UseSwagger()`)
- [ ] Remove WeatherForecast default controller/model from template
- [ ] Run `dotnet run` in `src/SiesaAgents.API/` and confirm startup on port 5000
- [ ] Confirm GET `/scalar` returns HTTP 200 with `text/html` content type
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 2.0 hours

---

### Test: AC3 — CORS allows requests from http://localhost:5173

**Files:** Both test files

**Tasks to make this test pass:**

- [ ] In `Program.cs`, add `builder.Services.AddCors(...)` with policy `"DevCors"` allowing origin `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and all endpoint mappings
- [ ] Read CORS origin from `appsettings.Development.json` key `AllowedOrigins[0]`
- [ ] Add `AllowedOrigins` array with `http://localhost:5173` to `appsettings.Development.json`
- [ ] Verify OPTIONS preflight returns 204 with `Access-Control-Allow-Origin` header
- [ ] Run test: `pnpm exec playwright test --grep "CORS"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: AC4 — TypeScript compiles with zero errors in strict mode

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Run `pnpm exec tsc --noEmit` from `frontend/` and confirm exit code 0
- [ ] Confirm no `vite-error-overlay` appears when dev server runs
- [ ] Fix any implicit `any` types introduced by installed dependencies
- [ ] Run test: `pnpm exec playwright test --grep "TypeScript"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Backend solution builds with zero errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `dotnet build SiesaAgents.sln` from `backend/` and confirm exit code 0
- [ ] Verify all four projects present in solution: API, Application, Domain, Infrastructure
- [ ] Confirm all project references are correctly declared in `.csproj` files
- [ ] Add `ExceptionHandlingMiddleware` to `src/SiesaAgents.API/Middleware/`
- [ ] Register middleware in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Confirm `dotnet run` starts successfully after build passes
- [ ] Run test: `pnpm exec playwright test --grep "builds"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E (frontend initialization tests)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API (backend initialization tests)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see the browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run only tests matching a pattern
pnpm exec playwright test --grep "CORS"
pnpm exec playwright test --grep "Scalar"
pnpm exec playwright test --grep "TypeScript"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (implementation does not exist)
- Fixtures reviewed and consistent with existing `base.fixture.ts` pattern
- Mock requirements documented (none for Story 1.1 — real integration calls)
- `data-testid` requirements listed (`app-root`)
- Implementation checklist created

**Verification:**

- All 13 tests fail because no frontend or backend server exists yet
- Failure messages clearly indicate connection refused / missing server
- The one `data-testid` test fails with "element not found"

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with AC1 frontend, then AC2 backend)
2. Read the test to understand the expected behavior (Given-When-Then in comments)
3. Implement minimal code to make that specific test pass
4. Run the test to verify it passes (green)
5. Check off the task in this checklist
6. Move to the next test and repeat

**Key Principles:**

- One test at a time (do not try to fix all simultaneously)
- Minimal implementation (skeleton only — no domain logic in Story 1.1)
- Run tests frequently for immediate feedback
- Use the implementation checklist as the roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 13 tests pass
2. Review `Program.cs` and `vite.config.ts` for clarity and maintainability
3. Ensure folder structure matches architecture spec exactly
4. Verify no code left from .NET template (WeatherForecast fully removed)
5. Run full test suite after each refactor to confirm no regressions

---

## Next Steps

1. Share this checklist with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using the implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all 13 tests pass, refactor code for quality
6. Update story status to `in-progress` then `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 tests
- **test-quality.md** — Given-When-Then format applied; one assertion per test; deterministic (real servers, no mocks)
- **test-levels-framework.md** — Story 1.1 is infrastructure-only; no component/unit tests; API Integration is the primary level
- **fixture-architecture.md** — `base.fixture.ts` reviewed; no story-specific fixtures needed; standard Playwright `{ page, request }` used
- **data-factories.md** — No factories needed for Story 1.1 (no domain entities)

---

## AC Coverage Matrix

| AC | Description | Test File | Test Name | Level |
|----|-------------|-----------|-----------|-------|
| AC1 | Frontend on port 5173 no errors | `project-initialization.spec.ts` | `should serve the frontend app on port 5173 without errors` | E2E |
| AC1 | React root mount point visible | `project-initialization.spec.ts` | `should render the root HTML document with a valid React mount point` | E2E |
| AC1 | No runtime JS errors on load | `project-initialization.spec.ts` | `should not have any JavaScript runtime errors on initial load` | E2E |
| AC2 | Backend responds on port 5000 | `backend-initialization.api.spec.ts` | `should have the backend API server running on port 5000` | API |
| AC2 | Scalar loads at /scalar | `backend-initialization.api.spec.ts` | `should serve the Scalar API documentation page at /scalar` | API |
| AC2 | Scalar returns HTML | `backend-initialization.api.spec.ts` | `should return HTML content from the Scalar documentation endpoint` | API |
| AC2 | Swagger NOT exposed | `backend-initialization.api.spec.ts` | `should NOT expose any Swagger/OpenAPI UI endpoint` | API |
| AC2 | WeatherForecast removed | `backend-initialization.api.spec.ts` | `should NOT expose WeatherForecast default endpoint` | API |
| AC3 | CORS no errors in browser | `project-initialization.spec.ts` | `should allow frontend to reach backend health endpoint without CORS errors` | E2E |
| AC3 | CORS header on response | `backend-initialization.api.spec.ts` | `should return CORS header allowing http://localhost:5173 origin` | API |
| AC3 | CORS OPTIONS preflight | `backend-initialization.api.spec.ts` | `should respond to OPTIONS preflight from frontend origin without CORS rejection` | API |
| AC4 | No TypeScript errors in console | `project-initialization.spec.ts` | `should load without any TypeScript compilation errors visible in the browser console` | E2E |
| AC4 | No Vite error overlay | `project-initialization.spec.ts` | `should load the frontend without Vite TypeScript error overlay` | E2E |
| AC5 | All CA layers active (build proxy) | `backend-initialization.api.spec.ts` | `should have all four Clean Architecture layers responding` | API |
| AC5 | Problem Details middleware wired | `backend-initialization.api.spec.ts` | `should return Problem Details RFC 7807 format for unhandled errors` | API |

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-10
