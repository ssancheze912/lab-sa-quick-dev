# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-02
**Author:** SiesaTeam
**Primary Test Level:** API + E2E (infrastructure/build validation)

---

## Story Summary

Initialize the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects with all required dependencies, so the team has a working development environment with both servers running, TypeScript strict mode active, and CORS wired between them.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Frontend Vite server starts on port 5173 with no errors, app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **AC2** — Backend starts on port 5000, Scalar API documentation loads at `/scalar`, and the four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — Frontend can make HTTP requests to `http://localhost:5000` from `http://localhost:5173` without CORS errors.
4. **AC4** — TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — `dotnet build SiesaAgents.sln` compiles all four projects successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** should serve the frontend app on port 5173 without errors (AC1)
  - **Status:** RED — Vite server not yet running at `http://localhost:5173`
  - **Verifies:** Frontend Vite server serves the root document on port 5173 with HTTP 200

- **Test:** should render the root HTML document with a valid React mount point (AC1)
  - **Status:** RED — `data-testid="app-root"` attribute does not exist yet
  - **Verifies:** The `#root` React mount point exposes `data-testid="app-root"` for test stability

- **Test:** should load without any TypeScript compilation errors visible in the browser console (AC1/AC4)
  - **Status:** RED — No frontend implementation yet
  - **Verifies:** No `[TypeScript]` or `TS` errors are logged to the browser console after loading `/`

- **Test:** should not have any JavaScript runtime errors on initial load (AC1)
  - **Status:** RED — No frontend implementation yet
  - **Verifies:** No uncaught `pageerror` runtime exceptions during initial render

- **Test:** should allow frontend to reach backend health endpoint without CORS errors (AC3)
  - **Status:** RED — CORS policy not configured in `Program.cs`
  - **Verifies:** No CORS/cross-origin/access-control errors in the console when frontend calls the backend

- **Test:** should receive a valid HTTP response from the backend health probe without CORS blocking (AC3)
  - **Status:** RED — Backend not running / CORS not configured
  - **Verifies:** Backend responds with 200/301/302 when the frontend requests `/scalar` — not blocked

- **Test:** should load the frontend without Vite TypeScript error overlay (AC4)
  - **Status:** RED — Frontend not initialized; strict TS not configured
  - **Verifies:** The `vite-error-overlay` element is NOT present (zero TypeScript compilation errors)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** should have the backend API server running on port 5000 (AC2)
  - **Status:** RED — Backend not initialized yet
  - **Verifies:** Backend responds (status < 500) at `http://localhost:5000/` — no connection refused

- **Test:** should serve the Scalar API documentation page at /scalar (AC2)
  - **Status:** RED — `Scalar.AspNetCore` package not installed; `MapScalarApiReference()` not registered
  - **Verifies:** GET `/scalar` returns HTTP 200

- **Test:** should return HTML content from the Scalar documentation endpoint (AC2)
  - **Status:** RED — Scalar not configured
  - **Verifies:** `/scalar` returns `Content-Type: text/html`

- **Test:** should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden) (AC2)
  - **Status:** RED — Backend not initialized (endpoint absence not verifiable until server runs)
  - **Verifies:** `/swagger` returns anything except 200 — architecture forbids Swashbuckle

- **Test:** should NOT expose WeatherForecast default endpoint (AC2)
  - **Status:** RED — Default template endpoint not yet removed
  - **Verifies:** `/weatherforecast` returns 404 or 405 (removed from generated project)

- **Test:** should return CORS header allowing http://localhost:5173 origin (AC3)
  - **Status:** RED — CORS policy `DevCors` not configured
  - **Verifies:** `Access-Control-Allow-Origin` header equals `http://localhost:5173` or `*`

- **Test:** should respond to OPTIONS preflight from frontend origin without CORS rejection (AC3)
  - **Status:** RED — CORS middleware not registered
  - **Verifies:** OPTIONS preflight returns 200/204 (not 403)

- **Test:** should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI) (AC5)
  - **Status:** RED — Solution and projects not created yet
  - **Verifies:** `/scalar` returns 200 — server up implies all four projects compiled

- **Test:** should return Problem Details RFC 7807 format for unhandled errors (AC5 / prep for Story 1.3)
  - **Status:** RED — `ExceptionHandlingMiddleware` not registered
  - **Verifies:** Unknown endpoint returns JSON (not HTML error page) with status 404 or 400

### Component Tests

**File:** N/A for Story 1.1

This story creates skeleton infrastructure with no domain UI components. Component tests are deferred to Story 1.2 (Frontend Navigation Shell).

---

## Data Factories Created

**None required for Story 1.1.**

This story bootstraps infrastructure — there are no domain entities to fabricate. Factories will be added starting in Story 2.x when `clientes` / `contactos` entities are introduced.

---

## Fixtures Created

Reuses existing shared fixtures at `e2e/fixtures/base.fixture.ts` (route-navigation helpers for `/clientes` and `/contactos`, unused in this story but present for downstream stories).

**No new fixtures required for Story 1.1** — tests use the raw `@playwright/test` `page` / `request` contexts because the story validates bare infrastructure (no auth, no seeded data).

---

## Mock Requirements

**No external service mocks required.**

Story 1.1 validates the raw server processes (Vite + .NET). All requests hit real local dev servers on ports 5173 and 5000. No third-party integrations to stub yet.

---

## Required data-testid Attributes

### Root HTML / App Shell

- `app-root` — Root React mount `<div>` (typically in `index.html` or the root of `App.tsx`). Required by E2E test _"should render the root HTML document with a valid React mount point"_.

**Implementation Example:**

```html
<!-- frontend/index.html -->
<div id="root" data-testid="app-root"></div>
```

or, if the mount point is inside a React component:

```tsx
// frontend/src/App.tsx
export function App() {
  return <div data-testid="app-root">{/* app content */}</div>;
}
```

No other `data-testid` attributes are required for Story 1.1 — this story creates the shell only.

---

## Implementation Checklist

### Test: Frontend serves on port 5173 + React mount point renders (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies (`@tanstack/react-router`, `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-loading-skeleton`, `siesa-ui-kit`)
- [ ] Install dev dependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `@tanstack/router-plugin`, `@tanstack/router-devtools`)
- [ ] Add `data-testid="app-root"` on the root React mount div
- [ ] Verify `pnpm run dev` starts on port 5173
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TypeScript strict mode active with zero compile errors (AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `frontend/tsconfig.app.json` set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure no `any` types exist in initial scaffolding
- [ ] Verify `pnpm exec tsc --noEmit` exits 0
- [ ] Run test: `pnpm exec playwright test -g "vite-error-overlay"`
- [ ] Test passes (green phase — no Vite error overlay renders)

**Estimated Effort:** 0.5 hours

---

### Test: Backend starts on port 5000 and Scalar loads at /scalar (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create four Clean Architecture projects: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`
- [ ] Wire project references (API → Application → Domain; API → Infrastructure → Domain)
- [ ] Add all projects to `SiesaAgents.sln`
- [ ] Install `Scalar.AspNetCore` NuGet package on API project
- [ ] Register `app.MapScalarApiReference()` in `Program.cs` — NEVER `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoint and model from the generated API project
- [ ] Verify server listens on port 5000
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: CORS allows http://localhost:5173 (AC3)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`, `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Register CORS policy `DevCors` in `Program.cs`:
      `builder.Services.AddCors(o => o.AddPolicy("DevCors", p => p.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Ensure OPTIONS preflight is handled (returns 204 with correct headers)
- [ ] Run tests: `pnpm exec playwright test -g "CORS"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Solution builds with zero errors — four CA layers active (AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Ensure `dotnet build SiesaAgents.sln` returns exit code 0 with zero errors AND zero warnings
- [ ] All project references resolve
- [ ] No missing NuGet packages
- [ ] Server starts cleanly on `dotnet run` — Scalar responds 200 (proxy for successful build)
- [ ] Run test: `pnpm exec playwright test -g "all four Clean Architecture layers"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: ExceptionHandlingMiddleware stub returns JSON (AC5 / Story 1.3 prep)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details RFC 7807
- [ ] Register in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before endpoints
- [ ] Ensure unknown routes return JSON (not HTML error pages)
- [ ] Run test: `pnpm exec playwright test -g "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL Story 1.1 ATDD tests (E2E + API)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only frontend E2E acceptance tests
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only backend API acceptance tests
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# HTML report
pnpm exec playwright show-report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 16 tests written and failing (7 E2E + 9 API)
- Given-When-Then structure applied in every test
- Network-first patterns used (route/response listeners registered BEFORE navigation)
- `data-testid` selectors used (no fragile CSS)
- No hard waits (`waitForResponse`, `waitForLoadState('networkidle')` used instead)
- Mock/factory requirements documented (none required for this story)
- data-testid requirements listed (`app-root`)
- Implementation checklist mapped 1:1 to tests

**Verification:**

- All tests fail before any implementation
- Failures are due to missing implementation (no Vite server, no .NET server, no CORS, no Scalar)
- Failure messages are clear (connection refused, missing selector, missing header)

---

### GREEN Phase (DEV Team — Next Steps)

1. Pick one failing test from the implementation checklist above
2. Implement the minimal code to make it pass (initialize frontend → then backend → then CORS → then middleware)
3. Run only that test to confirm green
4. Move to the next test — do not batch
5. Track progress by checking off tasks in this document

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 16 tests pass
2. Extract common Vite/dotnet startup helpers into scripts (`package.json` scripts, `pnpm dev:all`)
3. Confirm no hardcoded ports leak — use `import.meta.env.VITE_API_URL` on frontend
4. Ensure tests still pass after each refactor
5. Move story to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 1 worker

  ✘  should serve the frontend app on port 5173 without errors
  ✘  should render the root HTML document with a valid React mount point
  ✘  should load without any TypeScript compilation errors visible in the browser console
  ✘  should not have any JavaScript runtime errors on initial load
  ✘  should allow frontend to reach backend health endpoint without CORS errors
  ✘  should receive a valid HTTP response from the backend health probe without CORS blocking
  ✘  should load the frontend without Vite TypeScript error overlay
  ✘  should have the backend API server running on port 5000
  ✘  should serve the Scalar API documentation page at /scalar
  ✘  should return HTML content from the Scalar documentation endpoint
  ✘  should NOT expose any Swagger/OpenAPI UI endpoint
  ✘  should NOT expose WeatherForecast default endpoint
  ✘  should return CORS header allowing http://localhost:5173 origin
  ✘  should respond to OPTIONS preflight from frontend origin without CORS rejection
  ✘  should have all four Clean Architecture layers responding
  ✘  should return Problem Details RFC 7807 format for unhandled errors

  16 failed
  0 passed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected — RED phase)
- Failing: 16 (expected — no implementation yet)
- Status: RED phase verified

**Expected Failure Messages:**

- E2E tests: `net::ERR_CONNECTION_REFUSED at http://localhost:5173` (Vite server not running)
- API tests: `apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:5000` (backend not running)
- Once servers exist but implementation is partial: missing `data-testid="app-root"`, missing `Access-Control-Allow-Origin` header, `/swagger` still exposed, etc.

---

## Notes

- Story 1.1 is infrastructure/build-heavy, not domain-heavy. Component-level tests are intentionally deferred to Story 1.2 (Nav Shell) — no UI components exist yet.
- The frontend E2E tests rely on `webServer` in `playwright.config.ts` which runs `pnpm --filter frontend dev`. Once the frontend workspace exists at `frontend/`, Playwright will auto-start it.
- The API tests hit `http://localhost:5000` directly — the developer must run `dotnet run --project src/SiesaAgents.API` in a separate terminal, or add a second `webServer` entry to `playwright.config.ts`.
- The Problem Details test (RFC 7807) only validates JSON content-type of a 404 response — the full stack-trace-leakage validation belongs to Story 1.3 (`ExceptionHandlingMiddleware`).
- Test framework: Playwright 1.40+ configured in `/playwright.config.ts` — no additional framework setup needed.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Reused existing `base.fixture.ts` (no new fixtures needed for Story 1.1)
- **network-first.md** — `page.waitForResponse` registered BEFORE `page.goto` in every E2E test
- **selector-resilience.md** — `data-testid="app-root"` used (no CSS/text selectors)
- **test-quality.md** — Given-When-Then structure, atomic assertions, no hard waits
- **timing-debugging.md** — `waitForLoadState('networkidle')` used instead of `page.waitForTimeout`
- **test-levels-framework.md** — API integration chosen as primary level (infrastructure risk); E2E used only where CORS + strict-mode overlay require a real browser

---

**Generated by BMad TEA Agent** — 2026-07-02
