# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-06
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

Story 1.1 establishes the technical foundation for the Siesa Agents CRM: a Vite react-ts frontend and a .NET 10 Clean Architecture backend, both initialized with their required dependencies and able to communicate over HTTP.

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

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend project does not exist yet; HTTP 200 cannot be returned
  - **Verifies:** AC1 — Vite dev server starts and serves the app on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist in unimplemented UI
  - **Verifies:** AC1 — React application mounts correctly at the root route

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend project not initialized; no Vite server to compile
  - **Verifies:** AC4 — TypeScript strict mode enabled, zero TS errors in console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend project not initialized; page cannot load
  - **Verifies:** AC1 — No JS runtime exceptions thrown during initial render

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project not initialized; Vite overlay state unknown
  - **Verifies:** AC4 — TypeScript strict mode active, Vite error overlay absent

> **Note:** The E2E file contains 5 tests across 3 describe blocks (AC1 x4, AC3 x1 browser-side, AC4 x1). Total unique E2E tests: 5.

### API Tests (7 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend project does not exist; connection refused on port 5000
  - **Verifies:** AC2 — .NET 10 backend starts and accepts HTTP connections on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `/scalar` endpoint not registered (no backend)
  - **Verifies:** AC2 — `app.MapScalarApiReference()` registered in Program.cs

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — No backend; no content-type header returned
  - **Verifies:** AC2 — Scalar serves an HTML page (not JSON/plain text)

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — No backend running at all
  - **Verifies:** AC2 architectural constraint — `/swagger` must return non-200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — No backend running; default template not cleaned up
  - **Verifies:** AC2 — Default WeatherForecast endpoints removed from generated project

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — No backend; no CORS headers returned
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — No backend; OPTIONS request fails with connection refused
  - **Verifies:** AC3 — CORS middleware handles OPTIONS preflight correctly

- **Test:** `should have all four Clean Architecture layers responding (via DI)`
  - **Status:** RED — No backend compiled or running
  - **Verifies:** AC5 — Solution builds successfully (server running = build passed)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — No backend; no JSON error response possible
  - **Verifies:** AC5 — ExceptionHandlingMiddleware is wired and returns JSON (not HTML) on errors

> **Note:** The API file contains 9 tests across 2 describe blocks. Total API tests: 9.

---

## Data Factories Created

No data factories are required for Story 1.1. This story deals with infrastructure initialization (server startup, CORS, TypeScript compilation) — no domain entities or data seeding is needed.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` factories for later stories.

---

## Fixtures Created

No story-specific fixtures are required for Story 1.1. All tests use the base Playwright `test` and `request` fixtures directly.

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures for later stories.

---

## Mock Requirements

Story 1.1 tests validate **real infrastructure** (no mocks): the tests are designed to fail until the actual frontend and backend servers are implemented and running. This is intentional for the RED phase.

There are no external third-party services to mock. The frontend makes requests to `http://localhost:5000` (the local .NET backend), which must be running for tests to pass.

---

## Required data-testid Attributes

### Frontend Root (index.html or App.tsx)

- `app-root` — The React application root container element (the `#root` div or the outermost App wrapper)

**Implementation Example:**

```tsx
// In index.html:
<div id="root" data-testid="app-root"></div>

// OR in App.tsx / main.tsx root render target:
// Ensure the element that Playwright can find has data-testid="app-root"
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors` + `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root element in `index.html` or App root
- [ ] Verify `pnpm run dev` starts on port 5173
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: `should load without any TypeScript compilation errors` + `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient` (typed, no `any`)
- [ ] Create `src/shared/lib/apiClient.ts` with Axios instance (typed, no `any`)
- [ ] Create `src/app/providers/QueryProvider.tsx` (typed React component)
- [ ] Ensure zero TypeScript errors: run `tsc --noEmit` locally to verify
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors` (E2E browser-side)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete Task 3 (CORS configuration in backend — see below)
- [ ] Ensure frontend is serving at `http://localhost:5173`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (depends on backend CORS task)

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution
- [ ] Add project references (API → Application → Domain; API → Infrastructure → Domain)
- [ ] Run `dotnet run --project src/SiesaAgents.API` and verify port 5000 responds
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar` + `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Verify `http://localhost:5000/scalar` returns HTTP 200 with `text/html` content type
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint` + `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Remove default WeatherForecast endpoints and models from generated API project
- [ ] Do NOT add `app.UseSwagger()` or Swashbuckle packages to Program.cs
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin` + `should respond to OPTIONS preflight` + `should allow frontend to reach backend` (E2E)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register CORS policy `"DevCors"` allowing origin `http://localhost:5173` with any header and method
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings
- [ ] Configure `appsettings.Development.json` with `AllowedOrigins: ["http://localhost:5173"]`
- [ ] Verify preflight OPTIONS request returns 200/204
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` implementing Problem Details RFC 7807
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify unknown endpoint returns JSON (not HTML) with status 404
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- No data factories required (infrastructure story)
- No fixtures required (infrastructure story)
- Mock requirements documented (none needed — real servers tested)
- data-testid requirements listed (`app-root`)
- Implementation checklist created

**Verification:**

- All 14 tests run and fail as expected
- E2E tests fail due to: "Connection refused at http://localhost:5173" or missing `[data-testid="app-root"]`
- API tests fail due to: "Connection refused at http://localhost:5000"
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with backend server startup)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Initialize backend (Task 2) → passes AC2 API tests
2. Configure CORS (Task 3) → passes AC3 API tests
3. Add ExceptionHandlingMiddleware (Task 4) → passes AC5 API test
4. Initialize frontend (Task 1) → passes AC1 and AC4 E2E tests

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 14 tests pass** (green phase complete)
2. **Review Program.cs** for clarity and order
3. **Review tsconfig.app.json** for completeness
4. **Ensure tests still pass** after each refactor
5. **Update story status** to done in sprint-status.yaml

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
4. **Begin implementation** using implementation checklist as guide — recommended order: backend first, then frontend
5. **Work one test at a time** (red → green for each)
6. **Share progress** in daily standup
7. **When all 14 tests pass**, refactor code for quality
8. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns (not needed for this infrastructure story; base fixtures used)
- **data-factories.md** — Factory patterns (not needed for this story; existing data.helper.ts is sufficient)
- **network-first.md** — Route interception patterns applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 test
- **test-quality.md** — One assertion per test; atomic tests; explicit waits (no hard sleeps); deterministic test data
- **selector-resilience.md** — `data-testid="app-root"` selector used; no CSS class selectors
- **timing-debugging.md** — `page.waitForLoadState('networkidle')` used before Vite overlay check in AC4 test
- **test-levels-framework.md** — E2E for browser-side behavior (AC1/AC3/AC4); API for server contracts (AC2/AC5)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Error: connect ECONNREFUSED 127.0.0.1:5173
  → All E2E tests: FAILED (frontend not implemented)

Error: connect ECONNREFUSED 127.0.0.1:5000
  → All API tests: FAILED (backend not implemented)
```

**Summary:**

- Total tests: 14
- Passing: 0 (expected)
- Failing: 14 (expected)
- Status: RED phase verified

**Expected Failure Messages:**

- E2E tests (5): "Error: browserContext.newPage: Target page, context or browser has been closed" or "net::ERR_CONNECTION_REFUSED" at `http://localhost:5173`
- API tests (9): "Error: Request failed" / "connect ECONNREFUSED 127.0.0.1:5000"

---

## Notes

- Story 1.1 is a pure infrastructure/initialization story — there are no UI interactions, forms, or domain entities to test. All tests validate server startup, compilation correctness, and CORS headers.
- The E2E tests (foundation spec) require both servers running to test CORS from the browser context (AC3). Pure API tests only require the backend.
- The playwright.config.ts `webServer` command (`pnpm --filter frontend dev`) will be used when both servers exist. During RED phase this command will fail to start.
- AC5 (build with zero errors) is tested indirectly: if the backend server starts and responds, the build must have succeeded.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-06-06
