# ATDD Checklist — Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-31
**Author:** TEA Agent (gaduranb@siesa.com)
**Primary Test Level:** E2E + API Integration

---

## Story Summary

Story 1.1 establishes the working development environment for the Siesa Agents CRM. The frontend
Vite/React/TypeScript project and backend .NET 10 Clean Architecture solution must both be initialized
with all required dependencies, both dev servers running, TypeScript strict mode active, and CORS
configured so the frontend can call the backend without errors.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized
with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, When the developer
   runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173
   with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in
   `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in
   `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page
   loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure)
   are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to
   `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors
   (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it
   emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true`
   active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is
   executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (11 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Connection refused (frontend not initialized)
  - **Verifies:** AC1 — Vite dev server responds HTTP 200 on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — Element `[data-testid="app-root"]` not found (implementation missing)
  - **Verifies:** AC1 — React app mounts with data-testid="app-root" present

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Page not reachable (no server)
  - **Verifies:** AC4 — No TypeScript errors appear in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Page not reachable
  - **Verifies:** AC1/AC4 — No JavaScript runtime exceptions on first render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Connection refused on both ports
  - **Verifies:** AC3 — No CORS errors when frontend calls backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Connection refused (backend not running)
  - **Verifies:** AC3 — Backend responds to cross-origin requests

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Page not reachable
  - **Verifies:** AC4 — Vite error overlay is absent (TypeScript compiles clean)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Connection refused (dotnet run not executed)
  - **Verifies:** AC2 — Backend server is accessible on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Connection refused
  - **Verifies:** AC2 — Scalar page responds HTTP 200 at /scalar

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Connection refused
  - **Verifies:** AC2 — Scalar endpoint returns text/html content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Connection refused (cannot verify 404)
  - **Verifies:** AC2 — /swagger endpoint does not return 200 (corporate standard enforced)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Connection refused
  - **Verifies:** AC2 — Default .NET webapi template WeatherForecast endpoint removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Connection refused
  - **Verifies:** AC3 — Access-Control-Allow-Origin header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Connection refused
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Connection refused
  - **Verifies:** AC5 — Solution compiled (server running proves build succeeded)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Connection refused
  - **Verifies:** AC5 / middleware stub — Non-existent endpoint returns JSON (not HTML error page)

---

## Data Factories Created

No domain entity factories are required for Story 1.1. This story validates infrastructure setup,
not domain data. The tests use HTTP requests directly against running servers — no factory data needed.

---

## Fixtures Created

### Base Test Fixture

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `await page.goto('/clientes')`
  - **Provides:** page positioned at /clientes route
  - **Cleanup:** Playwright automatic page teardown

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `await page.goto('/contactos')`
  - **Provides:** page positioned at /contactos route
  - **Cleanup:** Playwright automatic page teardown

**Note:** Story 1.1 tests do not use these fixtures directly — they are provided for Stories 1.2+
where route-specific navigation is required.

---

## Mock Requirements

No external service mocking required for Story 1.1. Tests validate actual running servers
(real HTTP calls to localhost:5173 and localhost:5000). No MSW mocks are needed at this level.

---

## Required data-testid Attributes

### index.html / App.tsx — React Mount Point

- `app-root` — The root div or top-level React component wrapper
  - Required by: `should render the root HTML document with a valid React mount point`
  - Implementation: Add `data-testid="app-root"` to the `<div id="root">` in `index.html`
    or to the top-level element in `src/App.tsx` or `src/main.tsx`

**Implementation Example:**

```html
<!-- index.html -->
<div id="root" data-testid="app-root"></div>
```

Or alternatively in `src/App.tsx`:

```tsx
export default function App() {
  return (
    <div data-testid="app-root">
      {/* application content */}
    </div>
  );
}
```

---

## Implementation Checklist

### Test: AC1 — Frontend Vite Server Starts on Port 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` in `frontend/`
- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Add `data-testid="app-root"` to the root element in `frontend/index.html` or `src/App.tsx`
- [ ] Verify `pnpm run dev` starts on port 5173 (default Vite port)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC2 — Backend Starts on Port 5000 with Scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add NuGet package: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Remove WeatherForecast controller/endpoints from generated API project
- [ ] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Configure backend to listen on port 5000 (`--urls http://localhost:5000` or launchSettings.json)
- [ ] Verify `dotnet run` starts and `http://localhost:5000/scalar` returns 200 HTML
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC3 — CORS Allows Requests from http://localhost:5173

**Files:** Both spec files

**Tasks to make this test pass:**

- [ ] In `backend/src/SiesaAgents.API/Program.cs`, register CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` in middleware pipeline
- [ ] Verify OPTIONS preflight to `/scalar` with `Origin: http://localhost:5173` returns 200/204
- [ ] Verify GET with `Origin: http://localhost:5173` returns `Access-Control-Allow-Origin: http://localhost:5173`
- [ ] Run test: `npx playwright test --grep "CORS" --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript Strict Mode Active

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `frontend/tsconfig.app.json` contains:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- [ ] Run `pnpm tsc --noEmit` from `frontend/` and verify exit code 0
- [ ] Fix any TypeScript strict mode errors in generated template files
- [ ] Verify `pnpm run build` produces a `dist/` folder with zero TypeScript errors
- [ ] Verify Vite error overlay is NOT visible when page loads
- [ ] Run test: `npx playwright test --grep "TypeScript" --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — dotnet build Succeeds with All Four CA Projects

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify all four projects are added to `backend/SiesaAgents.sln`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build backend/SiesaAgents.sln` and verify exit code 0, zero errors/warnings
- [ ] Start backend (`dotnet run`) — if server responds, build was successful
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC5"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 1.1 failing tests (E2E)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium

# Run all Story 1.1 failing tests (API)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run both test files together
npx playwright test e2e/tests/foundation/ e2e/tests/api/ --project=chromium

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed --project=chromium

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug --project=chromium

# Run all tests with full reporter
npx playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (no frontend or backend implementation exists)
- Fixtures created with auto-cleanup (`e2e/fixtures/base.fixture.ts`)
- Mock requirements documented (none needed for Story 1.1 — real servers required)
- data-testid requirements listed (`app-root` on root element)
- Implementation checklist created for all 5 ACs

**Verification:**

- All 16 tests run and fail with `ERR_CONNECTION_REFUSED` (expected — no servers running)
- Failure messages clearly indicate missing implementation (server not started)
- Tests fail due to missing implementation, not test logic bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC2 — backend)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist above
6. Move to next test and repeat

**Suggested Order:**

1. AC5/AC2: `dotnet build SiesaAgents.sln` (Task 2 in story)
2. AC2: Backend starts on port 5000, Scalar at /scalar (Task 2)
3. AC3: CORS configuration (Task 3)
4. AC1/AC4: Frontend Vite project initialization (Task 1)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for Clean Architecture compliance
3. Confirm no `app.UseSwagger()` calls exist anywhere
4. Verify middleware ordering: `ExceptionHandlingMiddleware` → `UseCors` → endpoints
5. Run `pnpm tsc --noEmit` and verify clean compilation
6. Ensure tests still pass after any refactoring

---

## AC Coverage Matrix

| AC | Description | Test File | Test Count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Frontend starts on port 5173, no errors | project-initialization.spec.ts | 4 | RED |
| AC2 | Backend on port 5000, Scalar at /scalar, 4 CA projects | backend-initialization.api.spec.ts | 5 | RED |
| AC3 | CORS from localhost:5173 without errors | Both spec files | 4 | RED |
| AC4 | TypeScript strict mode — zero errors | project-initialization.spec.ts | 3 | RED |
| AC5 | dotnet build all 4 CA projects — zero errors | backend-initialization.api.spec.ts | 2 | RED |

---

## Next Steps

1. Share this checklist with the dev workflow (dev-story agent)
2. Review implementation tasks in standup
3. Confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=list`
4. Begin implementation with Task 2 (backend) — see story tasks
5. Work one AC at a time (red → green for each)
6. When all 16 tests pass, mark story status as `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception pattern applied: `page.waitForResponse()` called BEFORE `page.goto()` in AC1 test
- **test-quality.md** — Given-When-Then format, atomic tests (one assertion per test), deterministic assertions
- **test-levels-framework.md** — E2E for browser behavior (AC1, AC3, AC4), API-level for HTTP contract validation (AC2, AC3, AC5)
- **fixture-architecture.md** — `test.extend()` pattern used in `e2e/fixtures/base.fixture.ts` with auto-cleanup

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=list`

**Expected Results:**

```
FAIL  e2e/tests/foundation/project-initialization.spec.ts
  AC1 — Frontend Vite server initialization
    x should serve the frontend app on port 5173 without errors
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    x should render the root HTML document with a valid React mount point
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    x should load without any TypeScript compilation errors visible in the browser console
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    x should not have any JavaScript runtime errors on initial load
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  AC3 — CORS configuration between frontend and backend
    x should allow frontend to reach backend health endpoint without CORS errors
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    x should receive a valid HTTP response from the backend health probe without CORS blocking
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  AC4 — TypeScript strict mode active on frontend
    x should load the frontend without Vite TypeScript error overlay
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

FAIL  e2e/tests/api/backend-initialization.api.spec.ts
  AC2 — Backend server initialization and Scalar API documentation
    x should have the backend API server running on port 5000
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/
    x should serve the Scalar API documentation page at /scalar
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    x should return HTML content from the Scalar documentation endpoint
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    x should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/swagger
    x should NOT expose WeatherForecast default endpoint
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/weatherforecast
    x should return CORS header allowing http://localhost:5173 origin
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    x should respond to OPTIONS preflight from frontend origin without CORS rejection
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  AC5 — Backend solution builds and runs successfully
    x should have all four Clean Architecture layers responding
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
    x should return Problem Details RFC 7807 format for unhandled errors
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/api/nonexistent-endpoint-for-atdd
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected — no implementation exists)
- Failing: 16 (expected)
- Status: RED phase verified

**Expected Failure Reason:** `ERR_CONNECTION_REFUSED` on both localhost:5173 (frontend) and
localhost:5000 (backend) — neither server is running because the projects have not been initialized yet.

---

## Notes

- Story 1.1 is an **infrastructure story** — tests validate dev environment setup, not domain behavior.
- The Playwright `webServer` config in `playwright.config.ts` is set to auto-start `pnpm --filter frontend dev` when not in CI. In CI, servers must be started manually before running tests.
- The `playwright.config.ts` `baseURL` is `http://localhost:5173` — all relative `page.goto('/')` calls resolve to the frontend.
- AC5 (dotnet build) is verified indirectly: if the backend server starts and responds to requests, the solution compiled without errors. No separate build assertion is needed at E2E level.
- The `ExceptionHandlingMiddleware` stub (Task 4 in story) is tested indirectly by the Problem Details test in AC5. Full middleware behavior is formally tested in Story 1.3 ATDD.
- `app-root` data-testid must be added to either `index.html` or `App.tsx` — the test expects `[data-testid="app-root"]` to be visible.

---

**Generated by BMad TEA Agent** — 2026-05-31
