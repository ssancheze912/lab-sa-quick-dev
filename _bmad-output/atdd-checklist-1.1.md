# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** API (with E2E for frontend-shell checks)

---

## Story Summary

Initialize the frontend (Vite react-ts, TypeScript strict) and backend (.NET 10 Clean Architecture: API/Application/Domain/Infrastructure) projects so the team has a working local development environment with both servers running, CORS wired, and Scalar API docs available.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **Given** a clean development machine with Node.js and .NET 10 installed, **When** the developer runs the frontend initialization commands, **Then** `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **Given** the backend project has been created, **When** the developer runs `dotnet run` in `src/SiesaAgents.API`, **Then** the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. **Given** both servers are running, **When** the frontend makes any HTTP request to `http://localhost:5000`, **Then** CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).
4. **Given** the frontend project is initialized, **When** the TypeScript compiler runs, **Then** it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **Given** the backend solution is initialized, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- ✅ **Test:** `AC1 — should serve the frontend app on port 5173 without errors`
  - **Status:** RED — connection refused / `net::ERR_CONNECTION_REFUSED` (no `frontend/` project exists, no Vite dev server running)
  - **Verifies:** Vite dev server responds with HTTP 200 on `baseURL http://localhost:5173`
- ✅ **Test:** `AC1 — should render the root HTML document with a valid React mount point`
  - **Status:** RED — page never loads; `[data-testid="app-root"]` locator times out
  - **Verifies:** React app root element is present and visible
- ✅ **Test:** `AC1 — should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — navigation fails before console can be evaluated
  - **Verifies:** No `[TypeScript]`/`TS` console errors on load
- ✅ **Test:** `AC1 — should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — navigation fails before page can render
  - **Verifies:** No uncaught `pageerror` events on initial load
- ✅ **Test:** `AC3 — should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — frontend origin (5173) and backend (5000) both absent; `page.goto('/')` fails
  - **Verifies:** No CORS/cross-origin/access-control console or page errors when frontend calls backend
- ✅ **Test:** `AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — `request.get('http://localhost:5000/scalar')` fails (connection refused, backend not created)
  - **Verifies:** Backend `/scalar` responds 200/301/302 to a direct API request
- ✅ **Test:** `AC4 — should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — navigation fails (no dev server); overlay assertion never reached
  - **Verifies:** No `vite-error-overlay` element present after load

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- ✅ **Test:** `AC2 — should have the backend API server running on port 5000`
  - **Status:** RED — connection refused (`backend/` solution and `SiesaAgents.API` project do not exist yet)
  - **Verifies:** Backend responds to any request with status < 500 (server is up)
- ✅ **Test:** `AC2 — should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — connection refused
  - **Verifies:** `GET /scalar` returns HTTP 200
- ✅ **Test:** `AC2 — should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — connection refused
  - **Verifies:** `/scalar` response `content-type` includes `text/html`
- ✅ **Test:** `AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — connection refused (would also fail post-implementation if Swashbuckle is added by mistake)
  - **Verifies:** `/swagger` never returns HTTP 200
- ✅ **Test:** `AC2 — should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — connection refused
  - **Verifies:** Default template's `/weatherforecast` endpoint returns 404/405 (must be removed)
- ✅ **Test:** `AC2/AC3 — should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — connection refused
  - **Verifies:** `Access-Control-Allow-Origin` header present and equal to `http://localhost:5173` (or `*`)
- ✅ **Test:** `AC2/AC3 — should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — connection refused
  - **Verifies:** CORS preflight `OPTIONS` request returns 200/204, not 403/blocked
- ✅ **Test:** `AC5 — should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — connection refused (solution not created, cannot have built)
  - **Verifies:** Server responds 200 at `/scalar`, proving `dotnet build SiesaAgents.sln` succeeded (a failed build would prevent the server from starting)
- ✅ **Test:** `AC5 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — connection refused
  - **Verifies:** Unknown route returns 404/400 with a JSON (not HTML) content-type, proving `ExceptionHandlingMiddleware` is wired for the Story 1.3 follow-on

### Component Tests (0 tests)

Not applicable for this story — Story 1.1 has no UI components beyond the router root placeholder (`src/routes/__root.tsx`), which has no behavior to unit-test at the component level. Component-level coverage begins with the navigation shell in Story 1.2.

---

## Data Factories Created

None required. Per Epic 1 test design (`_bmad-output/test-design-epic-1.md`): "No domain fixtures needed (Epic 1 has no entities) — only environment/config fixtures." Story 1.1 acceptance criteria are pure infrastructure/build checks (server startup, compiler flags, CORS, Scalar docs) with no domain data to factory.

---

## Fixtures Created

None required for Story 1.1 specifically. The repo already has `e2e/fixtures/base.fixture.ts` (`clientesPage`/`contactosPage` navigation fixtures) reserved for later CRUD epics (2/3) — not used by these foundation tests, which intentionally hit the raw `page`/`request` Playwright fixtures against real local dev servers (no auth, no seeded data at this stage).

---

## Mock Requirements

None. These are infrastructure smoke/contract tests that must run against the **real** local dev servers (`pnpm run dev` on 5173, `dotnet run` on 5000) — mocking the servers under test would defeat the purpose of verifying the environment actually starts. No external third-party services are involved in Story 1.1.

---

## Required data-testid Attributes

### Frontend App Root

- `app-root` — Root mount element for the React app (add to the `<div id="root">` wrapper in `src/main.tsx` / `index.html`, or to the outermost element rendered by `src/routes/__root.tsx`)

**Implementation Example:**

```tsx
// src/main.tsx or src/routes/__root.tsx
<div data-testid="app-root">
  <Outlet />
</div>
```

---

## Implementation Checklist

Mapped directly onto the story's existing Tasks/Subtasks — mirrors `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`.

### Test: AC1 — Frontend Vite server initialization (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- [ ] `pnpm create vite@latest frontend -- --template react-ts`
- [ ] Configure `tsconfig.app.json` with `strict`, `noImplicitAny`, `strictNullChecks`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root mount element
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2/AC5 — Backend server initialization, Scalar docs, Clean Architecture build (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- [ ] `dotnet new sln -n SiesaAgents`
- [ ] Create API/Application/Domain/Infrastructure/UnitTests projects and add to solution
- [ ] Wire project references (API→Application→Domain; API→Infrastructure→Domain)
- [ ] Add `Scalar.AspNetCore` to API; register `app.MapScalarApiReference()` (never `app.UseSwagger()`)
- [ ] Remove default `WeatherForecast` endpoint/model
- [ ] Add `ExceptionHandlingMiddleware` and register before routing
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Verify `http://localhost:5000/scalar` loads after `dotnet run`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC3 — CORS configuration (3 tests, cross-cutting E2E + API)

**Files:** `e2e/tests/foundation/project-initialization.spec.ts`, `e2e/tests/api/backend-initialization.api.spec.ts`

- [ ] Register CORS policy `DevCors` allowing `http://localhost:5173` in `Program.cs`
- [ ] Apply `app.UseCors("DevCors")` before `MapScalarApiReference()` / endpoint mappings
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json`
- [ ] Run both test files and confirm no CORS-related console/page errors and correct `Access-Control-Allow-Origin` header
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run specific test file
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 16 failing tests already exist and cover AC1–AC5 (E2E: 7, API: 9)
- ✅ No fixtures/factories required (confirmed against Epic 1 test design — no domain entities in this story)
- ✅ No mock requirements (tests target real local dev servers by design)
- ✅ `data-testid="app-root"` requirement documented for DEV
- ✅ Implementation checklist created and mapped to existing story tasks

**Verification (environment-limited):** This sandbox has no root `package.json`/`node_modules` and no `frontend/`/`backend/` directories yet, so `npx playwright test` cannot currently execute (no `@playwright/test` installed, no dev servers exist to hit). This is expected and consistent with RED phase: every test targets `http://localhost:5173` or `http://localhost:5000`, and since neither the Vite project nor the .NET solution has been created, every test will fail with connection-refused / timeout errors — i.e., missing implementation, not test defects. DEV must first complete Task 1/Task 2 (project scaffolding) before the suite can even connect, then continue through green phase per test.

---

### GREEN Phase (DEV Team - Next Steps)

1. Pick one failing test from the Implementation Checklist above (start with AC2/AC5 backend scaffolding — it unblocks the CORS tests too)
2. Implement the minimal code/config to make it pass
3. Run the test to verify green
4. Check off the task, move to the next test
5. Repeat until all 16 tests pass

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 16 tests pass
2. Review `Program.cs`, `tsconfig.app.json`, `.csproj` reference graph for quality/architecture compliance (see R-001 in Epic 1 test design)
3. Ensure tests still pass after any refactor
4. Ready for code review (`sa-code-review`)

---

## Next Steps

1. Share this checklist and the two existing failing spec files with the dev workflow (`sa-dev-story`)
2. Implement Task 1 (frontend) and Task 2 (backend) from the story file — these unblock all 16 tests simultaneously since every test currently fails on connection-refused
3. Implement Task 3 (CORS) to turn the CORS-specific tests green
4. Run `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts` to confirm green phase
5. Refactor with confidence once green
6. Update story status once all ACs are verified green

---

## Knowledge Base References Applied

- **test-levels-framework.md** — API vs E2E selection: infra/contract checks (Scalar, CORS headers, build-as-proxy) → API level; server-serves-app + console/runtime error checks → E2E level
- **network-first.md** — `page.waitForResponse(...)` registered before `page.goto('/')` in the AC1 root-load test
- **selector-resilience.md** — `data-testid="app-root"` used instead of CSS/tag selectors
- **test-quality.md** — one behavior per test, Given-When-Then comments, deterministic assertions (status codes, header values, element counts)
- **data-factories.md** / **fixture-architecture.md** — evaluated and correctly deemed not applicable (no domain data in this story)

---

## Notes

- These two spec files were already present in the repository (`e2e/tests/foundation/project-initialization.spec.ts`, `e2e/tests/api/backend-initialization.api.spec.ts`) prior to this workflow run, fully aligned with Story 1.1's 5 acceptance criteria and the Epic 1 test design's P0 scenarios. This ATDD pass reviewed them for completeness against every AC, confirmed no additional E2E/API/component tests were needed, and produced this checklist to formally document the RED phase and hand off to DEV.
- Root-level `package.json`/`pnpm-workspace.yaml` and `@playwright/test` installation do not exist yet in this environment — installing/running the suite is part of Task 1/Task 2 setup, not a gap in test coverage.
- Story 1.3 (`ExceptionHandlingMiddleware` full exception-path coverage) will extend the "Problem Details" test currently stubbed here (AC5, `/api/nonexistent-endpoint-for-atdd`) with a forced-exception integration test — out of scope for Story 1.1.

---

**Generated by BMad TEA Agent** - 2026-07-08
