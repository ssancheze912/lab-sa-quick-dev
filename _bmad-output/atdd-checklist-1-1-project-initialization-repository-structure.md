# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** E2E (with API-level backend verification)

---

## Story Summary

Initializes the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects with all required dependencies so the team has a working local development environment with both servers running, TypeScript strict mode active, CORS configured, and a compiling four-project Clean Architecture solution.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, when the developer runs the frontend initialization commands, then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).
2. **AC2** — Given the backend project has been created, when the developer runs `dotnet run` in `src/SiesaAgents.API`, then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).
4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- ✅ **Test:** `AC1 — should serve the frontend app on port 5173 without errors`
  - **Status:** RED - no dev server running on port 5173 (frontend project not yet created); `page.goto('/')` will fail to connect
  - **Verifies:** AC1 — Vite dev server responds with HTTP 200 on the base URL
- ✅ **Test:** `AC1 — should render the root HTML document with a valid React mount point`
  - **Status:** RED - no server / no `[data-testid="app-root"]` element exists yet
  - **Verifies:** AC1 — React app renders to a discoverable root element
- ✅ **Test:** `AC1 — should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - no server to connect to (connection refused)
  - **Verifies:** AC4 (cross-checked under AC1 group) — no TS compile errors surfaced in console
- ✅ **Test:** `AC1 — should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - no server to connect to
  - **Verifies:** AC1 — clean initial render with no runtime exceptions
- ✅ **Test:** `AC3 — should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED - neither frontend nor backend servers exist yet
  - **Verifies:** AC3 — no CORS console errors when frontend calls backend
- ✅ **Test:** `AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED - backend not running, `request.get` will fail/refuse connection
  - **Verifies:** AC3 — backend responds to cross-origin calls without being blocked
- ✅ **Test:** `AC4 — should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED - no server running; no overlay assertion reachable
  - **Verifies:** AC4 — TypeScript strict mode compiles without emitting the Vite error overlay

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- ✅ **Test:** `AC2 — should have the backend API server running on port 5000`
  - **Status:** RED - backend solution not created; connection refused on port 5000
  - **Verifies:** AC2 — backend server is reachable
- ✅ **Test:** `AC2 — should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - `/scalar` endpoint does not exist yet (Scalar.AspNetCore not wired)
  - **Verifies:** AC2 — Scalar docs page loads with HTTP 200
- ✅ **Test:** `AC2 — should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - endpoint unreachable
  - **Verifies:** AC2 — Scalar responds with `text/html` content type
- ✅ **Test:** `AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - no backend running to validate absence of `/swagger`
  - **Verifies:** AC2 — architecture constraint that Swashbuckle/Swagger is never used
- ✅ **Test:** `AC2 — should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - no backend running
  - **Verifies:** AC2 — default template scaffolding (WeatherForecast) has been removed
- ✅ **Test:** `AC2 — should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - CORS policy not yet configured; no server running
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present for the frontend origin
- ✅ **Test:** `AC2 — should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - CORS middleware not registered yet
  - **Verifies:** AC3 — preflight OPTIONS request succeeds (200/204)
- ✅ **Test:** `AC5 — should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED - solution not built/running; proves build success indirectly once green
  - **Verifies:** AC5 — `dotnet build SiesaAgents.sln` succeeds (proxied via server responding)
- ✅ **Test:** `AC5 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - `ExceptionHandlingMiddleware` not implemented/registered yet; no server running
  - **Verifies:** AC5 (build) + forward-looking check for Story 1.3's middleware contract

### Component Tests (0 tests)

Not applicable — Story 1.1 has no UI components to mount in isolation; only project scaffolding, dev servers, and solution structure are in scope.

---

## Data Factories Created

None required for this story. Story 1.1 covers infrastructure/scaffolding only (dev servers, CORS, solution structure) — there are no domain entities to generate test data for. Existing factories in `e2e/helpers/data.helper.ts` (`buildCliente`, `buildContacto`) belong to later stories (Epic 2/3) and are reused as-is.

---

## Fixtures Created

None required for this story. `e2e/fixtures/base.fixture.ts` already exists in the repo (created for later Clientes/Contactos stories) and is not extended here since Story 1.1 tests hit the root `/`, `/scalar`, and error-probe endpoints directly via the default `page` and `request` Playwright fixtures.

---

## Mock Requirements

No external services require mocking for this story. All tests exercise the real local dev servers (Vite on `:5173`, .NET Minimal API on `:5000`) — there is no third-party dependency to stub.

---

## Required data-testid Attributes

### Frontend Root Shell

- `app-root` - Root mount element for the React app (must be added to the element the app renders into, e.g. in `App.tsx` or `index.html`'s `#root` wrapper) so tests can assert the app mounted successfully.

**Implementation Example:**

```tsx
<div id="root" data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test Group: AC1 — Frontend Vite server initialization

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root render container
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript/runtime console errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts -g "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: AC3 — CORS between frontend and backend

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] In backend `Program.cs`, register CORS policy `DevCors` allowing origin `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings
- [ ] Confirm `Access-Control-Allow-Origin` header is present on `/scalar` responses
- [ ] Confirm OPTIONS preflight returns 200/204
- [ ] Run test: `npx playwright test -g "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group: AC2 — Backend startup + Scalar docs + Clean Architecture solution

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`, `SiesaAgents.UnitTests` projects
- [ ] Add all projects to solution and wire project references (API → Application → Domain; API → Infrastructure → Domain)
- [ ] Add `Scalar.AspNetCore` package to API; register `app.MapScalarApiReference()` — never `app.UseSwagger()`
- [ ] Remove default `WeatherForecast` endpoints/models from the generated API project
- [ ] Verify `/swagger` and `/weatherforecast` do not resolve (404/405)
- [ ] Run test: `npx playwright test -g "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: AC5 — Backend solution builds cleanly + exception middleware contract

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors/warnings across all four projects
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details (RFC 7807) JSON
- [ ] Register `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing in `Program.cs`
- [ ] Confirm unknown routes return 404/400 with a JSON (not HTML) content type
- [ ] Run test: `npx playwright test -g "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC4 — TypeScript strict mode compiles cleanly

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `tsconfig.app.json` has `strict`, `noImplicitAny`, `strictNullChecks` all `true`
- [ ] Ensure `pnpm run dev` produces no Vite error overlay (`vite-error-overlay` element absent)
- [ ] Run test: `npx playwright test -g "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run specific test file
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run only one AC group
npx playwright test -g "AC2"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 16 tests written across 2 files, covering all 5 acceptance criteria
- ✅ No factories/fixtures needed (infra-only story); existing ones reused as-is
- ✅ No external mock requirements
- ✅ `data-testid` requirement (`app-root`) documented
- ✅ Implementation checklist created, mapped to AC groups

**Verification:**

- No `package.json` / `node_modules` / frontend / backend directories exist yet at this point in the repo — dependencies (`@playwright/test`, frontend, backend) are not installed, so every test fails at the connection level (`ECONNREFUSED` / navigation timeout), which is the expected RED state for a project-initialization story where Task 1 and Task 2 have not yet been executed.
- Once `pnpm install` is run and the frontend/backend scaffolding from Tasks 1–5 exists, re-run the suite to confirm tests transition from connection-refused failures to real assertion-level failures, then to green as each task completes.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Execute Task 1 (frontend init) and Task 2 (backend init) from the story file
2. Pick one failing test group from the implementation checklist above (start with AC2 — backend must exist before most tests can even connect)
3. Implement minimal code to make that group pass
4. Run the test group to verify green
5. Move to next group, repeat until all 16 tests pass

**Key Principles:**

- One AC group at a time
- Minimal implementation (don't over-engineer)
- Run tests frequently
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 16 tests pass (green phase complete)
2. Review code for quality (readability, maintainability)
3. Ensure tests still pass after each refactor
4. Ready for code review and story approval

---

## Next Steps

1. Share this checklist and the two failing test files with the dev workflow (manual handoff)
2. Run `pnpm install` (once a root/frontend `package.json` exists) and confirm RED phase with real Playwright output
3. Begin implementation using the Implementation Checklist above, working one AC group at a time
4. When all tests pass, refactor code for quality
5. Update `sprint-status.yaml` entry `1-1-project-initialization-repository-structure` to `done` when complete

---

## Knowledge Base References Applied

- **network-first.md** - Route/response interception registered before navigation (`page.waitForResponse` before `page.goto`)
- **selector-resilience.md** - `data-testid="app-root"` selector hierarchy (no CSS selectors used)
- **test-quality.md** - Given-When-Then structure, deterministic assertions, no hard waits
- **timing-debugging.md** - `waitForLoadState('networkidle')` / `waitForResponse` instead of arbitrary sleeps
- **test-levels-framework.md** - E2E used for full frontend-boot / cross-origin browser behavior; API level used for backend-only contract checks (Scalar, CORS headers, Problem Details)

---

## Notes

- This story is infrastructure/scaffolding-only; there are no domain entities, so no data factories were needed.
- Tests were originally authored in a prior ATDD pass (commit `dad949b`) and were verified against the current story file; no changes to the ACs were found, so all 16 existing tests remain valid and this checklist formalizes the RED-phase deliverable that was missing.
- `AC2`'s "four Clean Architecture projects referenced correctly in `SiesaAgents.sln`" is validated indirectly (server only starts if the solution builds) rather than via `dotnet sln list` parsing, since Playwright cannot shell out to `dotnet` — DEV should additionally self-verify with `dotnet sln SiesaAgents.sln list` during implementation.

---

## Contact

- Refer to `_bmad/bmm/testarch/tea-index.csv` for the full knowledge fragment index
- Story source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`

---

**Generated by BMad TEA Agent** - 2026-07-06
