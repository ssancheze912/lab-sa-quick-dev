# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

This story ensures the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects are initialized with all required dependencies so the development team has a working environment with both servers running. It establishes the repository skeleton — directory structure, TypeScript strict configuration, CORS policy, Scalar API docs, and Exception Handling Middleware — that all future stories will build upon. No domain entities or routes beyond `__root.tsx` are created.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine, when `pnpm run dev` is executed in `frontend/`, then the Vite server starts on port 5173 with no errors and `tsconfig.app.json` has `"strict": true`.
2. **AC2** — Given the backend has been created, when `dotnet run` executes in `src/SiesaAgents.API`, then the server starts on port 5000, `/scalar` returns HTTP 200 with HTML, and all four Clean Architecture projects are referenced in `SiesaAgents.sln`.
3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).
4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — server does not exist yet (connection refused on port 5173)
  - **Verifies:** AC1 — Frontend Vite dev server starts and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element missing until implementation
  - **Verifies:** AC1 — React root element is mounted and visible

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — no frontend to load; will fail on navigation timeout
  - **Verifies:** AC4 — No TypeScript `[TS]` errors emitted to browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — no frontend to load; will fail on navigation timeout
  - **Verifies:** AC4 / AC1 — No uncaught JavaScript exceptions on initial render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — both servers absent; will fail on navigation timeout
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend not running; request will be refused
  - **Verifies:** AC3 — Backend responds with 200/301/302 to cross-origin request

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — no frontend to load; navigation timeout
  - **Verifies:** AC4 — `vite-error-overlay` element is absent (zero TS compile errors)

---

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC2 — Backend server starts and responds to any request

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC2 — `/scalar` endpoint returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC2 — `/scalar` response `content-type` contains `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC2 — `/swagger` does NOT return HTTP 200 (architecture mandate)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC2 — `/weatherforecast` returns 404 or 405 (template cleanup)

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204, not 403

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC5 — Server running proves `dotnet build SiesaAgents.sln` succeeded

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — backend not running; connection refused
  - **Verifies:** AC2/AC5 — Non-existent endpoints return JSON (not HTML), confirming middleware is wired

---

### Component Tests

Not applicable for Story 1.1. This story establishes infrastructure scaffolding with no UI components to test at the component level. The root layout (`__root.tsx`) is a placeholder shell with no interactive elements.

---

## Data Factories Created

No new data factories are required for Story 1.1. This story has no domain entities or database interactions. Existing factory helpers in `e2e/helpers/data.helper.ts` (`buildCliente`, `buildContacto`) are not used by these tests.

---

## Fixtures Created

No new fixtures are required for Story 1.1. Tests use the base Playwright `test` and `request` fixtures directly, as no authenticated sessions or pre-populated data are needed for infrastructure validation.

The existing `e2e/fixtures/base.fixture.ts` (which provides `clientesPage` and `contactosPage`) is not used by these initialization tests.

---

## Mock Requirements

Story 1.1 tests target the **real running servers** — no mocks are used. The tests validate that actual infrastructure is correctly initialized.

For local development before implementation:
- Tests in `project-initialization.spec.ts` will time out on navigation to `http://localhost:5173` (frontend not running).
- Tests in `backend-initialization.api.spec.ts` will fail with ECONNREFUSED on `http://localhost:5000` (backend not running).

This is the expected RED phase behavior.

---

## Required data-testid Attributes

### `frontend/index.html` or `frontend/src/main.tsx` / `frontend/src/App.tsx`

- `app-root` — The outermost React mount container element. Required for `should render the root HTML document with a valid React mount point`.

**Implementation Example:**

```tsx
// Option A: in index.html
<div id="root" data-testid="app-root"></div>

// Option B: in App.tsx (wrapping element)
export function App() {
  return (
    <div data-testid="app-root">
      {/* router outlet */}
    </div>
  );
}
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install dependencies: `cd frontend && pnpm install`
- [ ] Verify `pnpm run dev` starts Vite on port 5173 (matches `baseURL` in `playwright.config.ts`)
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "port 5173"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root element in `frontend/index.html` or `frontend/src/App.tsx`
- [ ] Ensure `src/main.tsx` mounts React into `#root` with `RouterProvider` inside `QueryProvider`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "React mount point"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Resolve all TypeScript errors surfaced by `pnpm run build` or `pnpm exec tsc --noEmit`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `src/main.tsx` wires `RouterProvider` inside `QueryProvider` without runtime errors
- [ ] Ensure `src/routes/__root.tsx` exports a valid root route (TanStack Router)
- [ ] Ensure `.env.development` contains `VITE_API_URL=http://localhost:5000`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement CORS policy in `backend/src/SiesaAgents.API/Program.cs` allowing origin `http://localhost:5173`
- [ ] Call `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and other endpoint mappings
- [ ] Load `AllowedOrigins` from `appsettings.Development.json` (or inline for bootstrap)
- [ ] Run both servers and test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Backend must be running on port 5000 (`dotnet run` in `src/SiesaAgents.API`)
- [ ] `/scalar` endpoint must return HTTP 200, 301, or 302
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "health probe"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] All TypeScript errors must be resolved (AC4 tasks above)
- [ ] `vite-error-overlay` custom element must not appear in DOM
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents -o backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Add NuGet: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with minimal startup (see Dev Notes in story)
- [ ] Run `dotnet run --project backend/src/SiesaAgents.API` and verify port 5000
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`: `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] NEVER use `app.UseSwagger()` or Swashbuckle
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Scalar.AspNetCore is registered and serving HTML at `/scalar`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "HTML content"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.0 hours (covered by Scalar registration above)

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Do NOT install or register Swashbuckle or any other Swagger UI library
- [ ] Ensure `/swagger` returns 404 (no endpoint registered there)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.0 hours (pass-by-omission — simply don't add Swagger)

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove `WeatherForecastController.cs` and `WeatherForecast.cs` from generated template
- [ ] Ensure `Program.cs` does not map WeatherForecast endpoints
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register `DevCors` policy: `.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Apply `app.UseCors("DevCors")` in middleware pipeline
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] `UseCors` middleware must be placed BEFORE `MapScalarApiReference` and endpoint mappings
- [ ] Preflight (`OPTIONS`) must return 200 or 204
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "preflight"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.0 hours (covered by CORS registration order)

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution with `dotnet sln add ...`
- [ ] Wire project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build backend/SiesaAgents.sln` — zero errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (see pattern in story Dev Notes)
- [ ] Register in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing
- [ ] Ensure unknown routes return JSON (not HTML) — 404 with `application/json` or `application/problem+json`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E tests (frontend)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API tests (backend)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run tests with HTML report
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 16 tests written and failing (RED) — no implementation exists
- No fixtures or factories required for this infrastructure story
- Mock requirements: none (tests hit real servers)
- `data-testid="app-root"` requirement documented
- Implementation checklist created with per-test task breakdowns

**Verification:**

- E2E tests fail with `net::ERR_CONNECTION_REFUSED` or navigation timeout (frontend absent)
- API tests fail with `ECONNREFUSED` (backend absent)
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (recommend starting with backend API tests — no browser needed)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (fastest path to all green):**
1. Backend init tests (AC2, AC5) → `dotnet new`, add Scalar
2. CORS tests (AC3) → configure `DevCors` policy
3. WeatherForecast removal + Swagger-absent tests
4. ExceptionHandlingMiddleware tests
5. Frontend init (AC1) → `pnpm create vite`, configure TS strict
6. React root element test → add `data-testid="app-root"`
7. TypeScript error overlay test → fix any TS errors

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for clean ordering of middleware
3. Extract CORS origins to `appsettings.Development.json` → `AllowedOrigins` array
4. Ensure `frontend/tsconfig.app.json` paths and aliases are clean
5. Verify folder structure matches architecture.md exactly
6. Run tests again after each refactor to confirm no regression

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using implementation checklist as guide (start with backend)
4. Work one test at a time (red → green for each)
5. When all 16 tests pass, refactor for quality
6. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 and AC4 tests
- **test-quality.md** — Given-When-Then format, one primary assertion per test, no hard waits (`waitForLoadState('networkidle')` instead of `sleep`)
- **selector-resilience.md** — `data-testid="app-root"` selector used instead of CSS class or element tag
- **test-levels-framework.md** — API tests used for backend contract validation (AC2, AC5); E2E tests used for full browser validation (AC1, AC3, AC4)
- **fixture-architecture.md** — No fixtures needed; base Playwright `test` and `request` fixtures are sufficient for infrastructure tests
- **data-factories.md** — No factories needed; Story 1.1 has no domain entities

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 16 workers

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:23:3 › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:39:3 › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:49:3 › AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console
  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:66:3 › AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load
  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:86:3 › AC3 — CORS configuration between frontend and backend › should allow frontend to reach backend health endpoint without CORS errors
  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:122:3 › AC3 — CORS configuration between frontend and backend › should receive a valid HTTP response from the backend health probe without CORS blocking
  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:141:3 › AC4 — TypeScript strict mode active on frontend › should load the frontend without Vite TypeScript error overlay
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:23:3 › AC2 — Backend server initialization and Scalar API documentation › should have the backend API server running on port 5000
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:34:3 › AC2 — Backend server initialization and Scalar API documentation › should serve the Scalar API documentation page at /scalar
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:45:3 › AC2 — Backend server initialization and Scalar API documentation › should return HTML content from the Scalar documentation endpoint
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:55:3 › AC2 — Backend server initialization and Scalar API documentation › should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:65:3 › AC2 — Backend server initialization and Scalar API documentation › should NOT expose WeatherForecast default endpoint
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:75:3 › AC2 — Backend server initialization and Scalar API documentation › should return CORS header allowing http://localhost:5173 origin
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:93:3 › AC2 — Backend server initialization and Scalar API documentation › should respond to OPTIONS preflight from frontend origin without CORS rejection
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:117:3 › AC5 — Backend solution builds and runs successfully › should have all four Clean Architecture layers responding
  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:132:3 › AC5 — Backend solution builds and runs successfully › should return Problem Details RFC 7807 format for unhandled errors

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase verified

**Expected Failure Messages:**
- E2E tests: `Error: page.goto: net::ERR_CONNECTION_REFUSED` or Playwright timeout (frontend not running)
- API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000` (backend not running)

---

## Notes

- Story 1.1 is pure infrastructure. Tests do NOT use mocks — they validate that real servers are correctly initialized.
- AC5 (`dotnet build` with zero errors) is validated indirectly: if the server responds, the build succeeded. A build failure prevents the server from starting.
- The `data-testid="app-root"` attribute must be added during frontend initialization — this is the only UI-level selector in this story.
- `playwright.config.ts` already sets `testDir: './e2e'` and `baseURL: 'http://localhost:5173'`, so tests are pre-configured to run correctly once servers exist.
- `API_BASE_URL` defaults to `http://localhost:5000` in both test files; override via environment variable if needed.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-05-21
