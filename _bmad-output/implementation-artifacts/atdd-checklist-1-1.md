# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-14
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** E2E + API Integration

---

## Story Summary

This story initializes the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects
with all required dependencies so the team has a working development environment with both servers running.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean dev machine with Node.js and .NET 10, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend server not yet initialized; HTTP connection refused on port 5173
  - **Verifies:** AC1 — Vite dev server responds with HTTP 200 on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist yet
  - **Verifies:** AC1 — React application mounts correctly with required `data-testid`

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — frontend not running; any TS errors would surface as console errors
  - **Verifies:** AC4 — TypeScript strict mode produces zero compilation errors visible in browser

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — frontend not running; no page to load
  - **Verifies:** AC1/AC4 — Application initializes without JS runtime exceptions

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — frontend not running; `vite-error-overlay` absence cannot be verified
  - **Verifies:** AC4 — `tsconfig.app.json` strict flags do not produce Vite compile error overlay

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — backend not started; connection refused on port 5000
  - **Verifies:** AC2 — .NET backend serves HTTP responses on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is registered and serves HTTP 200 at `/scalar`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — backend not running; `content-type` header unavailable
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` (confirms it is Scalar UI, not raw JSON)

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not running (will pass once backend starts with correct config)
  - **Verifies:** AC2 — Company standard enforced: `/swagger` must NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — backend not running
  - **Verifies:** AC2 — Default .NET webapi template endpoints removed (404 or 405 expected)

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — backend not running; `Access-Control-Allow-Origin` header unavailable
  - **Verifies:** AC3 — CORS policy "DevCors" allows `http://localhost:5173`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — backend not running
  - **Verifies:** AC3 — OPTIONS preflight returns 200/204, not 403

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — backend not running; Scalar endpoint unavailable
  - **Verifies:** AC5 — Solution compiled successfully (all four CA projects wired in solution)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — backend not running; response body/content-type unavailable
  - **Verifies:** AC2/AC5 — Error responses are JSON (not HTML), indicating middleware is active

### Component Tests (0 tests)

Not applicable for Story 1.1. This story has no UI components to test at the component level — it only initializes infrastructure (dev server, solution structure, CORS, TypeScript config). Component-level tests begin in Story 1.2.

---

## Data Factories Created

None required for Story 1.1. This story tests infrastructure setup with no domain entities or user-generated data.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before test body
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at `/clientes` route
  - **Cleanup:** Playwright auto-cleanup (page context disposed after test)

- `contactosPage` — Navigates to `/contactos` before test body
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at `/contactos` route
  - **Cleanup:** Playwright auto-cleanup

Note: Story 1.1 tests use the base `test` from `@playwright/test` directly — the `clientesPage`/`contactosPage` fixtures are scaffolded for Stories 1.2+.

---

## Mock Requirements

None. Story 1.1 tests verify actual infrastructure (running servers). No external service mocks required.

---

## Required data-testid Attributes

### `frontend/index.html` or `frontend/src/App.tsx` (root mount point)

- `app-root` — The root React application container. Required for `should render the root HTML document with a valid React mount point` to pass.

**Implementation example:**

```tsx
// Option A: in index.html
<div id="root" data-testid="app-root"></div>

// Option B: in App.tsx wrapper
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install dependencies: `cd frontend && pnpm install`
- [ ] Verify `pnpm run dev` starts on port 5173 with no terminal errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "serve the frontend app on port 5173"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `frontend/index.html`, add `data-testid="app-root"` to the `<div id="root">` element
- [ ] Confirm `src/main.tsx` mounts React into `#root`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "render the root HTML document"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all frontend source files compile without TypeScript errors
- [ ] Run `pnpm --filter frontend tsc --noEmit` to verify zero errors before testing
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete frontend initialization (all dependencies installed, `main.tsx` wired correctly)
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route
- [ ] Wire `RouterProvider` inside `QueryProvider` in `src/main.tsx`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "JavaScript runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] All TypeScript strict mode requirements satisfied (see AC4 tasks above)
- [ ] `vite.config.ts` configured with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "Vite TypeScript error overlay"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Verify `dotnet run` starts backend on port 5000
- [ ] Run test: `API_BASE_URL=http://localhost:5000 pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "backend API server running on port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hours

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`: add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation page at /scalar"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Scalar registration complete (see task above)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "HTML content from the Scalar"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.0 hours (covered by Scalar registration above)

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `app.UseSwagger()` is NOT called anywhere in `Program.cs`
- [ ] Confirm Swashbuckle.AspNetCore package is NOT installed in `SiesaAgents.API.csproj`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger/OpenAPI UI endpoint"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Delete `WeatherForecast.cs` model and its endpoint registration from `Program.cs`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header allowing"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS configuration complete (see task above)
- [ ] Verify middleware order: `UseMiddleware<ExceptionHandlingMiddleware>` → `UseCors` → endpoints
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.0 hours (covered by CORS task above)

---

### Test: `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create all four projects and add to solution:
  - `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
  - `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
  - `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] `dotnet sln add` all four projects + tests project
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build SiesaAgents.sln` and verify exit code 0
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture layers"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` following the pattern in Dev Notes
- [ ] Register middleware in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify 404 responses return `application/json` or `application/problem+json` content-type
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details RFC 7807"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL Story 1.1 failing tests
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E (frontend) tests
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API (backend) tests
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with HTML report
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (13 tests — 4 E2E + 9 API)
- Fixtures scaffolded in `e2e/fixtures/base.fixture.ts`
- API helper scaffolded in `e2e/helpers/api.helper.ts`
- Mock requirements documented (none needed — real infrastructure tests)
- `data-testid` requirements listed (`app-root`)
- Implementation checklist created and mapped to each test

**Verification:**

- All tests fail with connection-refused or timeout errors (servers not yet running)
- Failure messages are clear (connection refused on port 5173/5000)
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with highest priority: `should have the backend API server running on port 5000`)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Suggested order:**
1. Backend server startup → AC2 tests
2. Scalar registration → AC2 tests
3. Remove WeatherForecast → AC2 test
4. CORS policy → AC3 tests
5. ExceptionHandlingMiddleware → AC2/AC5 test
6. CA solution build → AC5 test
7. Frontend Vite initialization → AC1 tests
8. TypeScript strict config → AC4 tests
9. `data-testid="app-root"` → AC1 component mount test

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 13 tests pass (green phase complete)
2. Review `Program.cs` for correct middleware ordering
3. Verify no `UseSwagger()` call exists anywhere
4. Ensure `tsconfig.app.json` has all three strict flags
5. Run `dotnet build SiesaAgents.sln` once more to confirm zero warnings
6. Run `pnpm --filter frontend tsc --noEmit` to confirm zero TS errors

---

## Next Steps

1. Share this checklist with the DEV workflow (auto-consumed by `sa-dev-story`)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using implementation checklist as guide (suggested order above)
4. Work one test at a time (red → green for each)
5. When all 13 tests pass, refactor for quality
6. When refactoring complete, update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Network-first intercept pattern applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 tests
- **test-quality.md** — Given-When-Then structure with clear comments; one assertion per test; deterministic tests (infrastructure state only)
- **fixture-architecture.md** — `test.extend()` pattern used in `base.fixture.ts` with auto-cleanup via Playwright's page context disposal
- **test-levels-framework.md** — Story 1.1 has no UI components → zero component tests; infrastructure tests split between E2E (browser-visible behavior) and API (backend contracts)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`

**Expected Results:**

```
Error: connect ECONNREFUSED 127.0.0.1:5173   (frontend not running)
Error: connect ECONNREFUSED 127.0.0.1:5000   (backend not running)
```

**Summary:**

- Total tests: 13
- Passing: 0 (expected — RED phase)
- Failing: 13 (expected — RED phase)
- Status: RED phase — implementation not yet complete

**Expected Failure Messages:**

- E2E tests: `net::ERR_CONNECTION_REFUSED` — Vite dev server not started
- API tests: `connect ECONNREFUSED 127.0.0.1:5000` — .NET backend not started
- `[data-testid="app-root"]` locator: `Locator.toBeVisible: Timeout 30000ms exceeded` — element does not exist in DOM

---

## Notes

- Story 1.1 is purely infrastructure — there are no domain entities, no UI routes beyond `__root.tsx`, and no business logic to test.
- The `data-testid="app-root"` attribute is the only UI-level requirement introduced by these tests.
- AC5 (solution build) is verified indirectly: if the backend server starts and serves responses, the solution must have compiled successfully.
- The `e2e/helpers/api.helper.ts` file scaffolds helper methods for Stories 1.2+ (clientes/contactos CRUD) — it is not used by Story 1.1 tests directly.
- Backend port is configurable via `API_BASE_URL` environment variable (defaults to `http://localhost:5000`).

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-14
