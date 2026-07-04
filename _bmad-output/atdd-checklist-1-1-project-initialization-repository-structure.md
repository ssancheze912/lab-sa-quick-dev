# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-04
**Author:** SiesaTeam
**Primary Test Level:** API / File-Structure (Playwright) — with E2E (browser) for frontend-facing criteria

---

## Story Summary

This story initializes the two-project skeleton (Vite/React/TypeScript frontend + .NET 10 Clean Architecture backend) that every future story in Siesa Agents builds on. No domain logic exists yet — the acceptance criteria are entirely about toolchain, compiler configuration, CORS, and Clean Architecture project wiring.

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

---

## Acceptance Criteria

1. **Given** a clean development machine with Node.js and .NET 10 installed, **When** the developer runs the frontend initialization commands, **Then** `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled.
2. **Given** the backend project has been created, **When** the developer runs `dotnet run` in `src/SiesaAgents.API`, **Then** the backend starts on port 5000, the Scalar API documentation page loads at `/scalar`, and the four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.
3. **Given** both servers are running, **When** the frontend makes any HTTP request to `http://localhost:5000`, **Then** CORS allows requests from `http://localhost:5173` without errors.
4. **Given** the frontend project is initialized, **When** the TypeScript compiler runs, **Then** it emits zero errors with `strict`, `noImplicitAny`, and `strictNullChecks` active.
5. **Given** the backend solution is initialized, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- ✅ **Test:** `AC1 › should serve the frontend app on port 5173 without errors`
  - **Status:** RED - `frontend/` project does not exist; `pnpm --filter frontend dev` (webServer) cannot start → connection refused
  - **Verifies:** AC1 — Vite dev server responds 200 on `http://localhost:5173/`
- ✅ **Test:** `AC1 › should render the root HTML document with a valid React mount point`
  - **Status:** RED - no app to serve, no `data-testid="app-root"` element exists
  - **Verifies:** AC1 — React app mounts successfully
- ✅ **Test:** `AC1 › should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - navigation fails because no server is up
  - **Verifies:** AC4 — no TS compile errors surfaced at runtime
- ✅ **Test:** `AC1 › should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - navigation fails because no server is up
  - **Verifies:** AC1 — clean initial render
- ✅ **Test:** `AC3 › should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED - neither frontend nor backend exist yet
  - **Verifies:** AC3 — no CORS console errors when calling the backend from the browser
- ✅ **Test:** `AC3 › should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED - `http://localhost:5000` not listening → connection refused
  - **Verifies:** AC3 — backend responds to a direct API request
- ✅ **Test:** `AC4 › should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED - navigation fails because no server is up
  - **Verifies:** AC4 — `strict`/`noImplicitAny`/`strictNullChecks` produce zero compile errors

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- ✅ **Test:** `AC2 › should have the backend API server running on port 5000`
  - **Status:** RED - `backend/` solution does not exist; nothing listens on port 5000 → `ECONNREFUSED`
  - **Verifies:** AC2 — backend process is up
- ✅ **Test:** `AC2 › should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - no server, no Scalar registration
  - **Verifies:** AC2 — `/scalar` returns 200
- ✅ **Test:** `AC2 › should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - no server
  - **Verifies:** AC2 — Scalar UI content-type is `text/html`
- ✅ **Test:** `AC2 › should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - no server to assert against (fails for the right future reason once server exists: it must return non-200)
  - **Verifies:** AC2 — corporate standard "Scalar only, never Swashbuckle"
- ✅ **Test:** `AC2 › should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - no server
  - **Verifies:** Task 2 cleanup — default template artifacts removed
- ✅ **Test:** `AC2 › should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - no server, no CORS policy
  - **Verifies:** AC3 (backend side) — `Access-Control-Allow-Origin` present
- ✅ **Test:** `AC2 › should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - no server
  - **Verifies:** AC3 — preflight succeeds with 200/204
- ✅ **Test:** `AC5 › should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED - no server (build cannot have happened, since the solution doesn't exist)
  - **Verifies:** AC5 — runtime proxy for "solution builds and DI graph resolves"
- ✅ **Test:** `AC5 › should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - no server
  - **Verifies:** AC5 / Task 4 prep — `ExceptionHandlingMiddleware` wired and returns JSON, not HTML

### Structure Tests (10 tests) — new in this run

**File:** `e2e/tests/foundation/backend-solution-structure.spec.ts` (155 lines)

These complement the runtime API tests above: they verify the **static** `.sln`/`.csproj` project-reference graph without requiring a running server, directly proving the "referenced correctly in SiesaAgents.sln" clause of AC2 and the Clean Architecture dependency rules that AC5's build success depends on.

- ✅ **Test:** `AC2 › should list SiesaAgents.API as a project entry in SiesaAgents.sln`
  - **Status:** RED (verified locally) - `backend/SiesaAgents.sln` does not exist → `expect(slnContent).not.toBeNull()` fails
- ✅ **Test:** `AC2 › should list SiesaAgents.Application as a project entry in SiesaAgents.sln`
  - **Status:** RED (verified locally) - same cause
- ✅ **Test:** `AC2 › should list SiesaAgents.Domain as a project entry in SiesaAgents.sln`
  - **Status:** RED (verified locally) - same cause
- ✅ **Test:** `AC2 › should list SiesaAgents.Infrastructure as a project entry in SiesaAgents.sln`
  - **Status:** RED (verified locally) - same cause
- ✅ **Test:** `AC2 › should list the SiesaAgents.UnitTests project in SiesaAgents.sln`
  - **Status:** RED (verified locally) - same cause
- ✅ **Test:** `AC5 › should have SiesaAgents.API reference SiesaAgents.Application`
  - **Status:** RED (verified locally) - `SiesaAgents.API.csproj` does not exist
- ✅ **Test:** `AC5 › should have SiesaAgents.API reference SiesaAgents.Infrastructure`
  - **Status:** RED (verified locally) - same cause
- ✅ **Test:** `AC5 › should have SiesaAgents.Application reference SiesaAgents.Domain`
  - **Status:** RED (verified locally) - `SiesaAgents.Application.csproj` does not exist
- ✅ **Test:** `AC5 › should have SiesaAgents.Infrastructure reference SiesaAgents.Domain`
  - **Status:** RED (verified locally) - `SiesaAgents.Infrastructure.csproj` does not exist
- ✅ **Test:** `AC5 › should NOT have SiesaAgents.Domain reference any other project (dependency inversion)`
  - **Status:** RED (verified locally) - `SiesaAgents.Domain.csproj` does not exist

**Total failing tests: 26** (7 E2E + 9 API + 10 structure)

---

## Data Factories Created

None. This story has no domain entities — no CRUD, no user-generated data. Existing factories (`e2e/helpers/data.helper.ts` — `buildCliente`, `buildContacto`) belong to Epics 2/3 and are not applicable here.

---

## Fixtures Created

None new. The existing `e2e/fixtures/base.fixture.ts` (`clientesPage`, `contactosPage`) is scoped to Epics 2/3 routes that don't exist yet and is intentionally not used by Story 1.1 tests, which use plain `@playwright/test` `page`/`request` fixtures directly (no auth, no created-entity cleanup needed for infrastructure checks).

---

## Mock Requirements

None. This story validates real dev-server infrastructure (frontend dev server, backend Minimal API, CORS, Scalar) — there are no external services to mock at this stage.

---

## Required data-testid Attributes

### Frontend App Shell

- `app-root` - React mount point on the app's root element (e.g. `#root` div or its immediate child), required so `project-initialization.spec.ts` can assert the app rendered.

**Implementation Example:**

```tsx
// src/main.tsx or src/routes/__root.tsx
<div id="root" data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

No other `data-testid` attributes are required for this story — there is no interactive UI yet beyond the shell placeholder.

---

## Implementation Checklist

### Test group: AC1 — Frontend Vite server initialization

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Add `data-testid="app-root"` to the root mount element
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts -g "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test group: AC2 / AC5 — Backend server, Scalar docs, Clean Architecture wiring

**Files:** `e2e/tests/api/backend-initialization.api.spec.ts`, `e2e/tests/foundation/backend-solution-structure.spec.ts`

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API, Application, Domain, Infrastructure, and UnitTests projects per Dev Notes structure
- [ ] `dotnet sln add` all five projects (API, Application, Domain, Infrastructure, UnitTests)
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
- [ ] Add `Scalar.AspNetCore` to API; configure `app.MapScalarApiReference()` (never `app.UseSwagger()`)
- [ ] Remove default `WeatherForecast` endpoint/model from the generated API project
- [ ] Add required data-testid attributes: none (backend has no UI)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts e2e/tests/foundation/backend-solution-structure.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test group: AC3 — CORS configuration

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (`AC3` describe block), `e2e/tests/api/backend-initialization.api.spec.ts` (CORS-header tests)

- [ ] In `Program.cs`, register CORS policy `DevCors` allowing origin `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings
- [ ] Run test: `npx playwright test -g "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test group: AC4 — TypeScript strict mode

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (`AC4` describe block)

- [ ] Confirm `tsconfig.app.json` has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any implicit-`any` or null-safety violations surfaced by `tsc --noEmit`
- [ ] Run test: `npx playwright test -g "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/foundation/backend-solution-structure.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run specific test file
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run only the static structure checks (no servers required)
npx playwright test e2e/tests/foundation/backend-solution-structure.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 26 tests written across E2E, API, and static-structure levels — all fail for the correct reason (backend/frontend projects don't exist yet)
- ✅ `backend-solution-structure.spec.ts` locally executed and confirmed 10/10 failing (`ECONNREFUSED`/`ENOENT`-equivalent: `.sln`/`.csproj` files not found)
- ✅ Mock requirements documented (none needed)
- ✅ data-testid requirements listed (`app-root`)
- ✅ Implementation checklist created, mapped to the 4 test groups above

**Verification:**

- `backend-solution-structure.spec.ts` was executed against this repository state (no `backend/` directory) using a temporary, unstaged Playwright installation — all 10 assertions failed with `expect(received).not.toBeNull()` / `Received: null`, confirming missing-implementation failures, not test bugs.
- `project-initialization.spec.ts` and `backend-initialization.api.spec.ts` could not be executed in this sandbox (no Node/`.NET` dev servers available), but will fail identically with connection-refused errors against ports 5173/5000 until the frontend/backend projects exist and are running — this is the expected and required RED state.

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test group from the Implementation Checklist above (recommended order: AC2/AC5 backend structure → AC1 frontend → AC3 CORS → AC4 strict mode, matching the Task order in the story)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test group pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to the next test group and repeat

**Key Principles:**

- One test group at a time
- Minimal implementation — no domain logic belongs in this story
- Run tests frequently for immediate feedback

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 26 tests pass (green phase complete)
2. Review `Program.cs` middleware ordering (`ExceptionHandlingMiddleware` → `UseCors` → `MapScalarApiReference`)
3. Confirm no `app.UseSwagger()` / Swashbuckle references anywhere
4. Ensure tests still pass after each refactor
5. Update story status in `sprint-status.yaml`

---

## Next Steps

1. Share this checklist and the three failing test files with the dev workflow (manual handoff — `sa-dev-story` sub-agent)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using the Implementation Checklist as the guide (Task 1 → Task 5 order from the story file)
4. Work one AC group at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring is complete, update story status to `dev-complete` / `ready-for-review` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — route/response interception registered before `page.goto()` in `project-initialization.spec.ts` (`page.waitForResponse` registered before navigation)
- **selector-resilience.md** — `data-testid="app-root"` selector hierarchy (data-testid > CSS)
- **test-quality.md** — one assertion per test, deterministic checks, no hard waits
- **test-levels-framework.md** — E2E reserved for browser-observable behavior (AC1/AC3/AC4); API level for backend contract (AC2/AC5 runtime); new static/file level added for AC2/AC5 build-time guarantees that neither E2E nor API-over-HTTP can prove without a running server
- **data-factories.md** / **fixture-architecture.md** — evaluated and intentionally not applied; no domain data exists in this story

See `_bmad/bmm/testarch/tea-index.csv` for the complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test --config=<temporary-no-webServer-config> e2e/tests/foundation/backend-solution-structure.spec.ts`

**Results:**

```
10 failed
  AC2 — SiesaAgents.sln references all four Clean Architecture projects
    ✘ should list SiesaAgents.API as a project entry in SiesaAgents.sln
    ✘ should list SiesaAgents.Application as a project entry in SiesaAgents.sln
    ✘ should list SiesaAgents.Domain as a project entry in SiesaAgents.sln
    ✘ should list SiesaAgents.Infrastructure as a project entry in SiesaAgents.sln
    ✘ should list the SiesaAgents.UnitTests project in SiesaAgents.sln
  AC5 — Clean Architecture project references form a valid dependency graph
    ✘ should have SiesaAgents.API reference SiesaAgents.Application
    ✘ should have SiesaAgents.API reference SiesaAgents.Infrastructure
    ✘ should have SiesaAgents.Application reference SiesaAgents.Domain
    ✘ should have SiesaAgents.Infrastructure reference SiesaAgents.Domain
    ✘ should NOT have SiesaAgents.Domain reference any other project (dependency inversion)
```

**Summary:**

- Total tests executed in this sandbox: 10 (structure level)
- Passing: 0 (expected)
- Failing: 10 (expected)
- Status: ✅ RED phase verified
- `project-initialization.spec.ts` (7 tests) and `backend-initialization.api.spec.ts` (9 tests) were not executable in this sandbox (no dev servers/.NET SDK available) but are logically confirmed RED: any request to `http://localhost:5173` or `http://localhost:5000` will receive `ECONNREFUSED` until the respective projects are created and running.

**Expected Failure Messages:**

- Structure tests: `expect(received).not.toBeNull()` / `Received: null` (file not found)
- E2E/API tests: `Error: page.goto: net::ERR_CONNECTION_REFUSED` or `Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:5000/5173`

---

## Notes

- This story is infrastructure-only; per `test-design-epic-1.md`, Epic 1's test pyramid deliberately favors API/build-level checks over E2E because there is no business logic yet.
- The three test files together are the complete ATDD suite for Story 1.1 — no additional Component or Unit level tests are needed at this stage (Vitest/xUnit unit-test scaffolding is created by the story itself, per Task 2, but exercised starting in later stories).
- Tests intentionally avoid asserting on `dotnet build` exit codes directly (CI-level concern, out of scope for Playwright ATDD) — AC5's build-success guarantee is covered indirectly via the project-reference graph (`backend-solution-structure.spec.ts`) and via the runtime proxy (`backend-initialization.api.spec.ts`, "all four layers responding").

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/testarch/tea-index.csv` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-07-04
