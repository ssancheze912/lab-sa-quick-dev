# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-03
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** API (Playwright `request` fixture) + E2E (Playwright `page` fixture)

---

## Story Summary

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

This story creates the project skeleton only — no domain entities, no database migrations, no routes beyond `__root.tsx`. All acceptance criteria are infrastructure/toolchain checks (dev server startup, TypeScript strict mode, Scalar docs, CORS, solution build).

---

## Acceptance Criteria

1. `pnpm run dev` starts the Vite server on port 5173 with no errors; app compiles with TypeScript strict mode (`"strict": true` in `tsconfig.app.json`).
2. `dotnet run` in `src/SiesaAgents.API` starts the backend on port 5000; Scalar API docs load at `/scalar`; the four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. CORS allows requests from `http://localhost:5173` to `http://localhost:5000` with no console errors.
4. TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`.
5. `dotnet build SiesaAgents.sln` compiles all four projects successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

> **Note:** These test files already exist in the repository (commit `dad949b`, branch history predates this ATDD run). This checklist formalizes and completes the ATDD deliverable that was missing for Story 1.1 — the tests themselves were reviewed against all 5 acceptance criteria and found to provide complete coverage. No additional test files were created; none were needed.

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- ✅ **Test:** `AC1 › should serve the frontend app on port 5173 without errors`
  - **Status:** RED — connection refused / webServer command fails (`frontend/` package does not exist yet, `pnpm --filter frontend dev` cannot resolve the workspace)
  - **Verifies:** AC1 — Vite dev server responds 200 at `http://localhost:5173/`
- ✅ **Test:** `AC1 › should render the root HTML document with a valid React mount point`
  - **Status:** RED — no frontend project exists, `[data-testid="app-root"]` cannot be located
  - **Verifies:** AC1 — root React mount point renders
- ✅ **Test:** `AC1 › should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — page never loads (no server), console never emits expected clean state
  - **Verifies:** AC1/AC4 — no `[TypeScript]`/`TS` console errors
- ✅ **Test:** `AC1 › should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — page never loads
  - **Verifies:** AC1 — no uncaught runtime exceptions
- ✅ **Test:** `AC3 › should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — both frontend and backend absent; `fetch` call to backend fails outright
  - **Verifies:** AC3 — no CORS-related console/page errors when calling backend from browser context
- ✅ **Test:** `AC3 › should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — `ECONNREFUSED` against `http://localhost:5000/scalar` (backend not created)
  - **Verifies:** AC3 — backend reachable cross-origin without being blocked
- ✅ **Test:** `AC4 › should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — page never loads
  - **Verifies:** AC4 — no `vite-error-overlay` element present (strict-mode compile succeeds)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- ✅ **Test:** `AC2 › should have the backend API server running on port 5000`
  - **Status:** RED — `ECONNREFUSED` (backend solution not created)
  - **Verifies:** AC2 — server accepts connections on port 5000
- ✅ **Test:** `AC2 › should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC2 — `/scalar` returns HTTP 200
- ✅ **Test:** `AC2 › should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC2 — `Content-Type: text/html` on `/scalar`
- ✅ **Test:** `AC2 › should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC2 — corporate standard: Scalar only, never `app.UseSwagger()`
- ✅ **Test:** `AC2 › should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC2 — default template scaffolding removed
- ✅ **Test:** `AC2 › should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present for `/scalar`
- ✅ **Test:** `AC2 › should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC3 — preflight OPTIONS returns 200/204, not 403
- ✅ **Test:** `AC5 › should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC5 — solution builds successfully (server startup is proof of a clean build across all 4 projects)
- ✅ **Test:** `AC5 › should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ECONNREFUSED`
  - **Verifies:** AC5/pre-req for Story 1.3 — `ExceptionHandlingMiddleware` wired, JSON error responses (not HTML)

### Component Tests

Not applicable to Story 1.1. No UI components exist yet beyond the placeholder root route (`src/routes/__root.tsx`); component-level testing begins in Story 1.2 (Navigation Shell).

---

## Data Factories Created

None required. Story 1.1 has no domain entities in scope (no `clientes`/`contactos`). Existing factories (`e2e/helpers/data.helper.ts` — `buildCliente`, `buildContacto`) are reserved for Epics 2–3 and are not exercised by these tests.

---

## Fixtures Created

None new. The existing `e2e/fixtures/base.fixture.ts` (`clientesPage`, `contactosPage`) is unrelated to Story 1.1's scope and reserved for Epic 2/3 navigation tests. Story 1.1 tests use Playwright's built-in `page` and `request` fixtures directly — no custom setup/teardown is needed since no data is created.

---

## Mock Requirements

None. All tests hit the real dev servers directly (`http://localhost:5173`, `http://localhost:5000`) per the story's intent of validating actual toolchain startup — mocking would defeat the purpose of these infra smoke tests.

---

## Required data-testid Attributes

### Frontend Root (`src/main.tsx` / `index.html`)

- `app-root` — Root mount element for the React application (used to assert successful React hydration)

**Implementation Example:**

```tsx
// index.html
<div id="root" data-testid="app-root"></div>
```

---

## Implementation Checklist

### Test Group: AC1 — Frontend Vite server initialization

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts`
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Add `data-testid="app-root"` to the root mount element in `index.html`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors and no console/runtime errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.0 hours

---

### Test Group: AC3 — CORS configuration between frontend and backend

**File:** `e2e/tests/foundation/project-initialization.spec.ts`, `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] In backend `Program.cs`, register CORS policy `"DevCors"` allowing origin `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings
- [ ] Ensure `AllowedOrigins` is read from `appsettings.Development.json`
- [ ] Run test: `pnpm exec playwright test -g "AC3|CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group: AC4 — TypeScript strict mode active on frontend

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Confirm `tsconfig.app.json` strict flags active (see AC1 tasks — shared configuration)
- [ ] Ensure Vite compiles with zero TS errors so no `vite-error-overlay` renders
- [ ] Run test: `pnpm exec playwright test -g "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC2 — Backend server initialization and Scalar API documentation

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application/Domain/Infrastructure class libraries and add all to `SiesaAgents.sln`
- [ ] Add `Scalar.AspNetCore` NuGet package to API project; register `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Remove default `WeatherForecast` endpoints/models from the generated API project
- [ ] Verify `dotnet run` starts backend on port 5000 and `/scalar` returns HTML 200
- [ ] Run test: `pnpm exec playwright test -g "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.0 hours

---

### Test Group: AC5 — Backend solution builds and runs successfully

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors/warnings across all four projects
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (Problem Details RFC 7807) and register it before routing
- [ ] Run test: `pnpm exec playwright test -g "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run specific test file
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests filtered by acceptance criterion tag
pnpm exec playwright test -g "AC2"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests already exist and are written in Given-When-Then format with network-first patterns (response/route listeners registered before navigation, `request` fixture used directly for API-level checks)
- ✅ No new fixtures/factories required — verified Story 1.1 has no domain-entity scope
- ✅ Mock requirements documented (none — tests hit real dev servers by design)
- ✅ `data-testid="app-root"` requirement documented for DEV team
- ✅ Implementation checklist created mapping each test group to its concrete implementation tasks

**Verification:**

- `node_modules`/`pnpm install` are not present in this environment session, so tests could not be executed live here.
- RED status is structurally guaranteed: `frontend/` and `backend/` directories do not exist yet (confirmed via repo listing), so:
  - Playwright's configured `webServer` command (`pnpm --filter frontend dev`) cannot resolve the `frontend` workspace → all `page`-based tests fail before they can run.
  - All `request`-based tests against `http://localhost:5000` will fail with `ECONNREFUSED` since no backend process exists.
- **Action for DEV team:** run `pnpm install && pnpm exec playwright test` locally once dependencies are restored, to capture and archive the actual RED-phase failure log before starting Task 1.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test group** from the implementation checklist above (recommended order: AC1 → AC2 → AC5 → AC3 → AC4, matching Story 1.1 Tasks 1–3)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that test group pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in the implementation checklist
6. **Move to next test group** and repeat

**Key Principles:**

- One test group at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 16 tests pass (green phase complete)
2. Review code for quality (readability, maintainability)
3. Ensure `Program.cs` middleware ordering matches Dev Notes exactly (`UseMiddleware<ExceptionHandlingMiddleware>` → `UseCors` → `MapScalarApiReference`)
4. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and the two existing failing test files with the dev workflow (manual handoff)
2. Run `pnpm install` at repo root, then `pnpm exec playwright test` to confirm RED phase and capture the failure log
3. Begin implementation using the implementation checklist above (Story 1.1 Tasks 1–5)
4. Work one test group at a time (red → green for each)
5. When all 16 tests pass, refactor code for quality
6. Update story status to `in-progress` / `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml` per team process

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, deterministic tests, explicit assertions
- **network-first.md** — response/route listeners registered before `page.goto()` navigation
- **selector-resilience.md** — `data-testid` selector hierarchy (`app-root`)
- **test-levels-framework.md** — E2E vs API test level selection (API-heavy distribution matches Epic 1 test-design pyramid: infra/build validation over business-logic testing)
- **timing-debugging.md** — explicit `waitForResponse`/`waitForLoadState` waits, no hard sleeps

Cross-referenced against `_bmad-output/implementation-artifacts/test-design-epic-1.md` — covers P0-01 (TS strict), P0-02 (frontend dev server), P0-03 (Scalar), P0-04 (CORS), and P1-06 (solution build) risk items for Story 1.1.

---

## Notes

- This ATDD checklist formalizes tests that were already committed to the repository (commit `dad949b`) but lacked the accompanying ATDD deliverable document — this workflow run fills that gap without duplicating or modifying existing test code, per the constraint to implement only what covers this story's acceptance criteria.
- No `frontend/` or `backend/` directories exist yet in the repository — this confirms the project is genuinely pre-implementation and the RED phase is valid.
- Session environment has no `node_modules` installed, so live test execution to capture failure logs was not performed here; the DEV team must run this verification locally before starting Task 1.

---

**Generated by BMad TEA Agent** - 2026-07-03
