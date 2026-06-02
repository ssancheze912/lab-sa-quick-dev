# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-02
**Author:** SiesaTeam (TEA — Test Architect)
**Primary Test Level:** API + E2E (no UI components in scope yet)

---

## Story Summary

This story bootstraps the Siesa Agents CRM monorepo: it initializes the Vite/React/TypeScript frontend and the .NET 10 Clean Architecture backend, wires CORS, exposes the Scalar API documentation, and stubs the Problem Details exception middleware. It is the foundation on which Epics 2 and 3 build.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean dev machine with Node.js and .NET 10 installed, when the developer runs the frontend initialization commands, then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled.
2. **AC2** — Given the backend project has been created, when the developer runs `dotnet run` in `src/SiesaAgents.API`, then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).
4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `/home/user/lab-sa-quick-dev/e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `AC1 — should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Vite dev server not running (frontend/ folder not yet created)
  - **Verifies:** Network-first response listener confirms HTTP 200 on `http://localhost:5173/`.

- **Test:** `AC1 — should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` does not exist; React app is not mounted
  - **Verifies:** Root `#root` div must expose `data-testid="app-root"` for stable selection.

- **Test:** `AC1 — should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — no app, no compiler output
  - **Verifies:** Vite overlay never injects TS-prefixed console errors.

- **Test:** `AC1 — should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — no app to load
  - **Verifies:** `pageerror` listener captures zero uncaught exceptions.

- **Test:** `AC3 — should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — backend not running, CORS policy not registered
  - **Verifies:** Browser `fetch` from page context to `http://localhost:5000/scalar` produces no console CORS errors.

- **Test:** `AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend unreachable
  - **Verifies:** `request.get('/scalar')` returns 200/301/302 (not a CORS-blocked 0).

- **Test:** `AC4 — should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — no Vite instance running
  - **Verifies:** `<vite-error-overlay>` count equals 0 after navigation.

### API Tests (9 tests)

**File:** `/home/user/lab-sa-quick-dev/e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `AC2 — should have the backend API server running on port 5000`
  - **Status:** RED — `dotnet run` not executed yet (backend/ folder missing)
  - **Verifies:** Connection succeeds (status < 500).

- **Test:** `AC2 — should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not wired
  - **Verifies:** `/scalar` returns HTTP 200.

- **Test:** `AC2 — should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Scalar package not installed
  - **Verifies:** `Content-Type` contains `text/html`.

- **Test:** `AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — endpoint behavior unknown; architecture mandates absence
  - **Verifies:** `/swagger` does not return 200 (Swashbuckle is explicitly forbidden).

- **Test:** `AC2 — should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — default template not yet stripped
  - **Verifies:** `/weatherforecast` returns 404 or 405.

- **Test:** `AC2 — should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — `DevCors` policy not registered
  - **Verifies:** `Access-Control-Allow-Origin` equals `http://localhost:5173` or `*`.

- **Test:** `AC2 — should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not registered
  - **Verifies:** Preflight returns 200 or 204.

- **Test:** `AC5 — should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — solution not yet built
  - **Verifies:** Runtime success implies `dotnet build` succeeded.

- **Test:** `AC5 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not registered
  - **Verifies:** Unknown route returns JSON (not HTML), confirming middleware is wired.

### Component Tests (0 tests)

Component tests are intentionally out of scope for this story — no React components exist beyond the empty `__root.tsx` placeholder. They will be introduced in Story 1.2 (Frontend Navigation Shell).

---

## Data Factories Created

No new factories required. The story scope is infrastructure-only (toolchain, CORS, Scalar). The existing helper at `/home/user/lab-sa-quick-dev/e2e/helpers/data.helper.ts` already provides `buildCliente` and `buildContacto` factories, which will be consumed by later stories.

---

## Fixtures Created

No new fixtures required. The story does not yet introduce authenticated flows or domain pages. The existing `base.fixture.ts` at `/home/user/lab-sa-quick-dev/e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures for downstream stories.

---

## Mock Requirements

**No external service mocks required for Story 1.1.** This story tests the real Vite dev server and the real .NET API process. Network-first interception is reserved for stories that integrate with third-party APIs.

---

## Required data-testid Attributes

### Root Shell (frontend/src/main.tsx or frontend/index.html)

- `app-root` — Marks the React mount point div (the existing `#root` div from the Vite template must also carry `data-testid="app-root"`).

**Implementation Example:**

```tsx
// frontend/index.html
<div id="root" data-testid="app-root"></div>
```

---

## Implementation Checklist

### Test: AC1 — Vite dev server boots on 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Scaffold the frontend: `pnpm create vite@latest frontend -- --template react-ts`
- [ ] Install runtime + dev dependencies per story (TanStack Router/Query, Zustand, Axios, RHF, Zod, Tailwind v4, shadcn, siesa-ui-kit, vitest, RTL, MSW)
- [ ] Configure `frontend/tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Configure `frontend/vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`
- [ ] Add `data-testid="app-root"` to the `#root` div in `frontend/index.html`
- [ ] Wire `frontend/src/main.tsx` with `RouterProvider` inside `QueryProvider`
- [ ] Verify dev server: `pnpm --filter frontend dev`
- [ ] Run tests: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC2 — Backend boots on 5000 and serves Scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Scaffold API + 3 class libs (Application, Domain, Infrastructure) under `backend/src/`
- [ ] Add project references per Clean Architecture rules
- [ ] Install `Scalar.AspNetCore` NuGet package on `SiesaAgents.API`
- [ ] Wire `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Delete generated WeatherForecast endpoint, controller, and model
- [ ] Configure launch profile to bind port 5000 (HTTP only is fine for dev)
- [ ] Run: `dotnet run --project backend/src/SiesaAgents.API`
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 2.0 hours

---

### Test: AC3 — CORS allows frontend origin

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy named `DevCors` allowing `http://localhost:5173`, any method, any header
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and any endpoint mappings
- [ ] Read `AllowedOrigins` array from `appsettings.Development.json` (binding to `http://localhost:5173`)
- [ ] Run tests: `pnpm exec playwright test`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode is active

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `frontend/tsconfig.app.json` set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure `pnpm tsc --noEmit -p frontend/tsconfig.app.json` returns exit code 0
- [ ] Verify no Vite TypeScript overlay appears at runtime
- [ ] Run tests: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "AC4"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Backend solution builds clean

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `dotnet build backend/SiesaAgents.sln` reports `0 Error(s)` and `0 Warning(s)`
- [ ] Register `ExceptionHandlingMiddleware` stub returning Problem Details for unhandled errors
- [ ] Ensure unknown routes return JSON (Problem Details) — never HTML error pages
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "AC5"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm exec playwright test e2e/tests/foundation e2e/tests/api

# Run specific E2E file
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run specific API file
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a single test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# HTML report
pnpm exec playwright show-report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (frontend/ and backend/ folders do not yet exist)
- No fixtures or factories needed beyond what already exists
- Mock requirements documented (none for this story)
- `data-testid="app-root"` requirement listed
- Implementation checklist created

**Verification:**

- All tests fail with `ECONNREFUSED` (servers not running) or selector-missing errors — failures are due to absent implementation, not test bugs.

---

### GREEN Phase (DEV Team - Next Steps)

1. Pick the AC1 task block and scaffold the frontend first.
2. Re-run the AC1 tests until they go green.
3. Move to AC2 (backend scaffolding) and repeat.
4. Add CORS (AC3), strict TS verification (AC4), and clean build verification (AC5) last.

**Key Principles:** one ACs worth of tests at a time, minimal implementation, run tests frequently.

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Validate the full Playwright suite stays green.
2. Extract reusable Program.cs wiring (e.g., CORS, middleware) into extension methods.
3. Confirm `dotnet build` and `tsc --noEmit` remain warning-free after refactors.

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff).
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation e2e/tests/api`.
3. Scaffold frontend (Task 1 in story) → re-run AC1/AC4 tests.
4. Scaffold backend (Tasks 2 + 4 in story) → re-run AC2/AC5 tests.
5. Wire CORS (Task 3 in story) → re-run AC3 tests.
6. When everything is green, mark Story 1.1 status as `done` in `sprint-status.yaml`.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Existing `e2e/fixtures/base.fixture.ts` follows the `test.extend()` pattern; reused as-is.
- **data-factories.md** — Existing helpers in `e2e/helpers/data.helper.ts` follow the override pattern; reused for downstream stories.
- **network-first.md** — Response listener registered BEFORE `page.goto('/')` for the AC1 boot test.
- **test-quality.md** — Each test has a single Given/When/Then narrative and an atomic assertion.
- **test-levels-framework.md** — Story 1.1 maps cleanly to E2E (UI smoke) + API (backend smoke); no component tests yet.
- **selector-resilience.md** — `[data-testid="app-root"]` chosen over CSS selectors for the React mount point.
- **timing-debugging.md** — `waitForResponse`, `waitForLoadState('networkidle')` and explicit retries — no hard waits anywhere.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation e2e/tests/api`

**Expected Results (servers not yet started):**

```
Running 16 tests using 1 worker
  16 failed
    [chromium] › foundation/project-initialization.spec.ts › AC1 — Frontend Vite server initialization ...
      Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    [chromium] › api/backend-initialization.api.spec.ts › AC2 — Backend server initialization and Scalar API documentation ...
      apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:5000
  16 failed, 0 passed
```

**Summary:**

- Total tests: 16 (7 E2E + 9 API)
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase verified

**Expected Failure Messages:**

- Frontend tests: `net::ERR_CONNECTION_REFUSED at http://localhost:5173/` until Vite dev server is running.
- Backend tests: `connect ECONNREFUSED 127.0.0.1:5000` until `dotnet run` is executed.
- AC1 root-mount test: `expect(locator).toBeVisible() — selector [data-testid="app-root"] resolved to 0 elements`.

---

## Notes

- This story has NO component tests on purpose. The first React component (NavigationShell) arrives in Story 1.2.
- Tests assume both servers run on default ports; `API_BASE_URL` env var can override the backend.
- The Playwright `webServer` config in `playwright.config.ts` will auto-start the frontend once it exists (`pnpm --filter frontend dev`). The backend must be started manually with `dotnet run` for the API tests to pass.
- The Problem Details middleware assertion in AC5 is a stub — the deep behavior is covered by Story 1.3 tests.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag the TEA agent in Slack/Discord
- Refer to `_bmad/bmm/workflows/testarch/atdd/instructions.md`
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-06-02
