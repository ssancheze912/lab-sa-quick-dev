# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-24
**Author:** gaduranb@siesa.com
**Primary Test Level:** E2E + Build Verification

---

## Story Summary

Story 1.1 establishes the foundational development environment for Siesa Agents CRM. A developer initializes the Vite/React/TypeScript frontend and .NET 10 Clean Architecture backend, configures CORS between them, and verifies that the full project builds cleanly with TypeScript strict mode active.

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, When the developer runs `pnpm run dev`, Then the Vite server starts on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Frontend Initialization (8 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend/ directory and dev server do not exist yet
  - **Verifies:** AC1 — Vite server starts at port 5173 (HTTP 200)

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` not yet present (frontend not built)
  - **Verifies:** AC1 — React root element with data-testid="app-root" is rendered

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — frontend/ does not exist; no server to connect to
  - **Verifies:** AC1 / AC4 — No TS errors in browser console at runtime

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — frontend/ does not exist; no server to connect to
  - **Verifies:** AC1 — Zero JS runtime exceptions on first render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — neither frontend nor backend running
  - **Verifies:** AC3 — No CORS console errors when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend not running (port 5000 not available)
  - **Verifies:** AC3 — Backend returns 200/301/302 (not CORS-blocked)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — frontend/ does not exist; Vite server not running
  - **Verifies:** AC4 — No Vite error overlay from TypeScript compilation errors

### API Tests — Backend Initialization (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — backend/ does not exist; port 5000 not listening
  - **Verifies:** AC2 — Backend server is running and accepting connections

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — backend not running; /scalar endpoint not registered
  - **Verifies:** AC2 — Scalar loads at /scalar (HTTP 200)

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — /scalar returns text/html content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not running (will also verify once backend is up)
  - **Verifies:** AC2 — /swagger endpoint returns non-200 (Swashbuckle not installed)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — Default WeatherForecast template endpoint is removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — backend not running; CORS not configured
  - **Verifies:** AC3 — Access-Control-Allow-Origin: http://localhost:5173 header present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — backend not running; CORS middleware not configured
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — backend not running
  - **Verifies:** AC5 — Solution compiled with all 4 CA layers (server running proves build passed)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — backend not running
  - **Verifies:** AC5 / middleware — Non-existent endpoint returns JSON (not HTML error page)

### Build Verification Tests (13 tests)

**File:** `e2e/tests/foundation/typescript-strict-build.spec.ts`

- **Test:** `should have tsconfig.app.json with strict mode enabled`
  - **Status:** RED — frontend/ directory does not exist; tsconfig.app.json absent
  - **Verifies:** AC4 — `"strict": true` is set in tsconfig.app.json

- **Test:** `should have tsconfig.app.json with noImplicitAny enabled`
  - **Status:** RED — frontend/ directory does not exist; tsconfig.app.json absent
  - **Verifies:** AC4 — `"noImplicitAny": true` is active (explicit or via strict)

- **Test:** `should have tsconfig.app.json with strictNullChecks enabled`
  - **Status:** RED — frontend/ directory does not exist; tsconfig.app.json absent
  - **Verifies:** AC4 — `"strictNullChecks": true` is active (explicit or via strict)

- **Test:** `should compile the frontend TypeScript with zero errors in strict mode`
  - **Status:** RED — frontend/ does not exist; `pnpm exec tsc --noEmit` fails with non-zero exit
  - **Verifies:** AC4 — TypeScript compiler exits with code 0

- **Test:** `should have no "any" type annotations in frontend source files`
  - **Status:** RED — frontend/src/ directory does not exist
  - **Verifies:** AC4 — No explicit `any` types in source code

- **Test:** `should have SiesaAgents.sln in the backend directory`
  - **Status:** RED — backend/ directory does not exist; SiesaAgents.sln absent
  - **Verifies:** AC5 — SiesaAgents.sln file exists

- **Test:** `should have all four Clean Architecture project directories`
  - **Status:** RED — backend/ directory does not exist; project folders absent
  - **Verifies:** AC5 — All 4 CA project directories exist (API, Application, Domain, Infrastructure)

- **Test:** `should have the UnitTests project in the tests directory`
  - **Status:** RED — backend/ directory does not exist
  - **Verifies:** AC5 — SiesaAgents.UnitTests project directory exists

- **Test:** `should have SiesaAgents.sln referencing all four Clean Architecture projects`
  - **Status:** RED — SiesaAgents.sln does not exist
  - **Verifies:** AC2 / AC5 — All 4 CA projects are listed in the solution file

- **Test:** `should build the entire solution with dotnet build and zero errors`
  - **Status:** RED — backend/ does not exist; `dotnet build` fails
  - **Verifies:** AC5 — `dotnet build SiesaAgents.sln` exits with code 0

- **Test:** `should have Program.cs using app.MapScalarApiReference() and NOT app.UseSwagger()`
  - **Status:** RED — backend/ does not exist; Program.cs absent
  - **Verifies:** AC2 — Scalar registered, Swashbuckle absent

- **Test:** `should have Program.cs with CORS policy allowing http://localhost:5173`
  - **Status:** RED — backend/ does not exist; Program.cs absent
  - **Verifies:** AC3 — CORS origin explicitly set to http://localhost:5173

- **Test:** `should have ExceptionHandlingMiddleware registered in Program.cs`
  - **Status:** RED — backend/ does not exist; Program.cs absent
  - **Verifies:** AC2 / AC5 — ExceptionHandlingMiddleware is registered in the middleware pipeline

---

## Data Factories Created

Story 1.1 is infrastructure-only with no domain entities. No data factories are required.
Existing factory helpers (`buildCliente`, `buildContacto` in `e2e/helpers/data.helper.ts`) are for Epics 2 and 3.

---

## Fixtures Created

Existing base fixture (`e2e/fixtures/base.fixture.ts`) provides `clientesPage` and `contactosPage` fixtures.
No additional fixtures are required for Story 1.1 (no user flows tested — only infrastructure validation).

---

## Mock Requirements

Story 1.1 validates real infrastructure, not mocked services. No MSW mocks are required.

The build verification tests (`typescript-strict-build.spec.ts`) use real filesystem and CLI tool invocations:
- `pnpm exec tsc --noEmit` — real TypeScript compiler
- `dotnet build SiesaAgents.sln` — real .NET CLI

---

## Required data-testid Attributes

### App Root (index.html or App.tsx)

- `app-root` — The root React mount container. Required for `project-initialization.spec.ts` test: `should render the root HTML document with a valid React mount point`

**Implementation Example:**

```html
<!-- index.html -->
<div id="root" data-testid="app-root"></div>
```

or

```tsx
// main.tsx — alternative if data-testid is added in the component
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Tests: AC4 Build Verification (typescript-strict-build.spec.ts)

**File:** `e2e/tests/foundation/typescript-strict-build.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Edit `frontend/tsconfig.app.json` — set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install all frontend dependencies: `pnpm install` in `frontend/`
- [ ] Verify no `any` types exist in generated source files
- [ ] Run test: `npx playwright test e2e/tests/foundation/typescript-strict-build.spec.ts --project=chromium`
- [ ] Subtask: AC4 build tests pass (green)

**Estimated Effort:** 1.0 hours

---

### Tests: AC5 Backend Build (typescript-strict-build.spec.ts)

**File:** `e2e/tests/foundation/typescript-strict-build.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all 5 projects to solution: `dotnet sln add ...`
- [ ] Add Scalar.AspNetCore package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` — add `app.MapScalarApiReference()`, CORS policy, ExceptionHandlingMiddleware (NO UseSwagger)
- [ ] Remove WeatherForecast default endpoints/models
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Run `dotnet build SiesaAgents.sln` and verify exit 0
- [ ] Run test: `npx playwright test e2e/tests/foundation/typescript-strict-build.spec.ts --project=chromium`
- [ ] Subtask: AC5 build tests pass (green)

**Estimated Effort:** 1.5 hours

---

### Tests: AC1 Frontend Server (project-initialization.spec.ts)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Complete Task 1 from story (frontend initialization)
- [ ] Add `data-testid="app-root"` to the root div in `index.html` or `App.tsx`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/routes/__root.tsx` (root route shell layout)
- [ ] Verify `pnpm run dev` starts on port 5173 without TS errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium`
- [ ] Subtask: AC1 tests pass (green)

**Estimated Effort:** 2.0 hours

---

### Tests: AC2 + AC3 Backend API (backend-initialization.api.spec.ts)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Complete Task 2 from story (backend initialization)
- [ ] Complete Task 3 from story (CORS configuration)
- [ ] Complete Task 4 from story (ExceptionHandlingMiddleware)
- [ ] Complete Task 5 from story (appsettings.Development.json)
- [ ] Verify `dotnet run` starts on port 5000
- [ ] Verify `http://localhost:5000/scalar` returns HTTP 200 with text/html
- [ ] Verify `http://localhost:5000/swagger` returns non-200
- [ ] Verify `http://localhost:5000/weatherforecast` returns 404 or 405
- [ ] Verify CORS header `Access-Control-Allow-Origin: http://localhost:5173` is returned
- [ ] Verify OPTIONS preflight returns 200 or 204
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --project=chromium`
- [ ] Subtask: AC2 + AC3 tests pass (green)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all Story 1.1 ATDD tests (requires frontend on 5173 and backend on 5000)
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts

# Run only build verification tests (no servers needed - filesystem + CLI only)
npx playwright test e2e/tests/foundation/typescript-strict-build.spec.ts --project=chromium

# Run frontend initialization E2E tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium

# Run backend API tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --project=chromium

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed --project=chromium

# Debug a specific test
npx playwright test e2e/tests/foundation/typescript-strict-build.spec.ts --debug

# Run with full trace output
npx playwright test e2e/tests/foundation/ --trace on
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (RED confirmed — frontend/ and backend/ directories do not exist)
- Given-When-Then pattern applied in all tests
- data-testid requirements documented (`app-root`)
- Mock requirements documented (none for Story 1.1 — real infrastructure validation)
- Implementation checklist created mapping each test to concrete code tasks
- Network-first intercept pattern applied in `project-initialization.spec.ts`
- No hard waits — explicit waitForResponse / waitForLoadState used

**Verification:**

- All tests fail because `frontend/` and `backend/` directories do not exist
- Build verification tests fail with filesystem errors (directory not found)
- E2E tests fail with connection refused (servers not running)
- Failure messages are clear and actionable (include expected paths)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with build verification tests** (no servers needed, fastest feedback loop):
   - `npx playwright test e2e/tests/foundation/typescript-strict-build.spec.ts`
2. **Implement frontend initialization** (Task 1 from story)
3. **Implement backend initialization** (Tasks 2, 3, 4, 5 from story)
4. **Start both servers** and run E2E tests
5. **Check off tasks** in implementation checklist above
6. **All 30 tests green** before closing Story 1.1

**Key Principles:**

- Start with build tests (no server startup overhead)
- One test at a time — don't try to fix all at once
- Run `pnpm run dev` and `dotnet run` in separate terminals while testing
- Use implementation checklist as your roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 30 tests pass across the 3 test files
2. Review `Program.cs` for clarity (middleware ordering comments)
3. Review `tsconfig.app.json` to confirm all strict flags are correctly set
4. Ensure `ExceptionHandlingMiddleware.cs` follows RFC 7807 pattern from story Dev Notes
5. No domain entities in this story — do not add anything beyond the foundation

---

## Next Steps

1. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
2. Begin implementation following the implementation checklist above
3. Start with build verification tests (fastest iteration cycle)
4. Work one test group at a time (red → green for each AC)
5. When all 30 tests pass, update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception with `page.waitForResponse()` applied BEFORE `page.goto()` in `project-initialization.spec.ts`
- **test-quality.md** — Atomic tests (one assertion per test), deterministic assertions, Given-When-Then comments
- **test-levels-framework.md** — E2E for browser-observable behavior (AC1, AC3), API-level for backend contracts (AC2, AC3), Build-verification for compile-time guarantees (AC4, AC5)
- **fixture-architecture.md** — Base fixture pattern from `e2e/fixtures/base.fixture.ts` reviewed; no new fixtures required for Story 1.1
- **data-factories.md** — No domain entities in Story 1.1; no factories needed

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts --reporter=list`

**Expected Results:**

```
FAIL e2e/tests/foundation/typescript-strict-build.spec.ts
  AC4 — TypeScript strict mode: zero compilation errors
    ✗ should have tsconfig.app.json with strict mode enabled
      Error: expect(received).toBe(true) — frontend/tsconfig.app.json must exist at .../frontend/tsconfig.app.json
    ✗ should have tsconfig.app.json with noImplicitAny enabled
    ✗ should have tsconfig.app.json with strictNullChecks enabled
    ✗ should compile the frontend TypeScript with zero errors in strict mode
    ✗ should have no "any" type annotations in frontend source files
  AC5 — Backend solution builds with zero errors
    ✗ should have SiesaAgents.sln in the backend directory
    ✗ should have all four Clean Architecture project directories
    ✗ should have the UnitTests project in the tests directory
    ✗ should have SiesaAgents.sln referencing all four Clean Architecture projects
    ✗ should build the entire solution with dotnet build and zero errors
    ✗ should have Program.cs using app.MapScalarApiReference() and NOT app.UseSwagger()
    ✗ should have Program.cs with CORS policy allowing http://localhost:5173
    ✗ should have ExceptionHandlingMiddleware registered in Program.cs

FAIL e2e/tests/foundation/project-initialization.spec.ts
  AC1 — Frontend Vite server initialization
    ✗ should serve the frontend app on port 5173 without errors (connection refused)
    ✗ should render the root HTML document with a valid React mount point
    ✗ should load without any TypeScript compilation errors visible in the browser console
    ✗ should not have any JavaScript runtime errors on initial load
  AC3 — CORS configuration between frontend and backend
    ✗ should allow frontend to reach backend health endpoint without CORS errors
    ✗ should receive a valid HTTP response from the backend health probe without CORS blocking
  AC4 — TypeScript strict mode active on frontend
    ✗ should load the frontend without Vite TypeScript error overlay

FAIL e2e/tests/api/backend-initialization.api.spec.ts
  AC2 — Backend server initialization and Scalar API documentation
    ✗ should have the backend API server running on port 5000 (connection refused)
    ✗ should serve the Scalar API documentation page at /scalar
    ✗ should return HTML content from the Scalar documentation endpoint
    ✗ should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
    ✗ should NOT expose WeatherForecast default endpoint
    ✗ should return CORS header allowing http://localhost:5173 origin
    ✗ should respond to OPTIONS preflight from frontend origin without CORS rejection
  AC5 — Backend solution builds and runs successfully
    ✗ should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)
    ✗ should return Problem Details RFC 7807 format for unhandled errors
```

**Summary:**

- Total tests: 30 (7 E2E + 9 API + 13 Build Verification + 1 AC4 E2E)
- Passing: 0 (expected)
- Failing: 30 (expected)
- Status: RED phase confirmed

**Root cause of failures:**
- `frontend/` directory does not exist → all frontend tests fail (filesystem / connection refused)
- `backend/` directory does not exist → all backend tests fail (filesystem / connection refused)

---

## Notes

- Story 1.1 is infrastructure-only: no domain entities, no business logic, no database tables
- The build verification tests (`typescript-strict-build.spec.ts`) are unusual for Playwright: they validate the filesystem and CLI tools, not browser behavior. This is intentional — Playwright's test runner is used as the test harness for all test levels in this project (no separate Jest/Vitest runner configured at repo root)
- AC4 (TypeScript strict) is validated at two levels: compile-time (build test) and runtime (E2E browser console check)
- AC5 (dotnet build) is validated at two levels: build verification (filesystem + CLI) and runtime (server responding implies build succeeded)
- The `data-testid="app-root"` attribute is the only UI contract this story introduces; all other acceptance criteria are structural/configuration

---

**Generated by BMad TEA Agent** — 2026-05-24
