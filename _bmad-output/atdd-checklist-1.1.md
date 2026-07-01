# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** E2E + API (mixed — infrastructure/foundation story)

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. `pnpm run dev` starts the Vite server on port 5173 with no errors, TypeScript strict mode enabled (`tsconfig.app.json`).
2. `dotnet run` in `src/SiesaAgents.API` starts the backend on port 5000, Scalar loads at `/scalar`, four Clean Architecture projects referenced in `SiesaAgents.sln`.
3. CORS allows requests from `http://localhost:5173` to `http://localhost:5000` with no console errors.
4. TypeScript compiler emits zero errors with `strict`, `noImplicitAny`, `strictNullChecks` active.
5. `dotnet build SiesaAgents.sln` compiles all four projects with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (9 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (207 lines)

- **AC1 — Frontend Vite server initialization**
  - `should serve the frontend app on port 5173 without errors` — RED: `frontend/` project does not exist yet
  - `should render the root HTML document with a valid React mount point` — RED: no `data-testid="app-root"` element exists
  - `should load without any TypeScript compilation errors visible in the browser console` — RED: no app to load
  - `should not have any JavaScript runtime errors on initial load` — RED: no app to load
- **AC3 — CORS configuration between frontend and backend**
  - `should allow frontend to reach backend health endpoint without CORS errors` — RED: neither server exists
  - `should receive a valid HTTP response from the backend health probe without CORS blocking` — RED: backend not running
- **AC4 — TypeScript strict mode active on frontend**
  - `should load the frontend without Vite TypeScript error overlay` — RED: no app to load
  - `should have strict TypeScript flags enabled in tsconfig.app.json` (NEW) — RED: `frontend/tsconfig.app.json` does not exist
  - `should compile with zero TypeScript errors via tsc --noEmit` (NEW) — RED: `frontend/` project does not exist, `tsc` invocation fails

### API Tests (11 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (195 lines)

- **AC2 — Backend server initialization and Scalar API documentation**
  - `should have the backend API server running on port 5000` — RED: backend not running (connection refused)
  - `should serve the Scalar API documentation page at /scalar` — RED: no server
  - `should return HTML content from the Scalar documentation endpoint` — RED: no server
  - `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)` — RED: no server
  - `should NOT expose WeatherForecast default endpoint` — RED: no server
  - `should return CORS header allowing http://localhost:5173 origin` — RED: no server
  - `should respond to OPTIONS preflight from frontend origin without CORS rejection` — RED: no server
  - `should have SiesaAgents.sln referencing the four Clean Architecture projects` (NEW) — RED: `backend/SiesaAgents.sln` does not exist
- **AC5 — Backend solution builds and runs successfully**
  - `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)` — RED: no server
  - `should return Problem Details RFC 7807 format for unhandled errors` — RED: no server
  - `should build SiesaAgents.sln with zero errors and zero warnings via dotnet build CLI` (NEW) — RED: `backend/SiesaAgents.sln` does not exist, `dotnet build` fails with "file not found"

### Component Tests (0 tests)

Not applicable — Story 1.1 is infrastructure/scaffolding only, no UI components beyond the root shell placeholder exist yet (component behavior is covered starting Story 1.2).

---

## Gap Analysis vs. Previous ATDD Run

The previous execution already covered AC1, AC2 (partially), AC3, and AC4 (partially) via runtime/browser-level checks. This run added **3 new tests** to close remaining gaps:

1. `should have strict TypeScript flags enabled in tsconfig.app.json` — directly asserts the required compiler flags in the config file (AC1/AC4), instead of only inferring strictness from the absence of a Vite error overlay.
2. `should compile with zero TypeScript errors via tsc --noEmit` — directly invokes the TypeScript compiler (AC4), rather than relying solely on browser console/overlay signals which can miss errors not surfaced by Vite's dev-time transform.
3. `should have SiesaAgents.sln referencing the four Clean Architecture projects` — reads the `.sln` file directly (AC2) instead of only inferring project wiring from a passing runtime response.
4. `should build SiesaAgents.sln with zero errors and zero warnings via dotnet build CLI` — directly invokes `dotnet build` (AC5), rather than treating a running server as a build-success proxy.

No duplicate files were created; both existing spec files were extended in place.

---

## Mock Requirements

None. This story has no external service dependencies. Both new backend/frontend CLI-invocation tests run real toolchain commands (`dotnet build`, `tsc --noEmit`) against the actual `backend/` and `frontend/` directories once they exist — no mocking applicable for a foundation/scaffolding story.

---

## Required data-testid Attributes

### Frontend Root Shell

- `app-root` — Root mount element (on `#root` div in `index.html` or the root App component), used to verify the React app has mounted successfully.

**Implementation Example:**

```tsx
<div id="root" data-testid="app-root"></div>
```

---

## Implementation Checklist

### Test: Frontend Vite server initialization (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts`
- [ ] Add `data-testid="app-root"` to the root mount element
- [ ] Verify `pnpm run dev` starts cleanly on port 5173
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts -g "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: CORS configuration (2 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

- [ ] Register `DevCors` policy in `Program.cs` allowing `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before endpoint mapping
- [ ] Run test: `npx playwright test -g "AC3|CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TypeScript strict mode (3 tests, incl. 2 new)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- [ ] Set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` in `frontend/tsconfig.app.json`
- [ ] Ensure all initial scaffold source files type-check cleanly
- [ ] Run test: `npx playwright test -g "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Backend server + Scalar + solution wiring (8 tests, incl. 1 new)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- [ ] Create `SiesaAgents.sln` and the four projects (API, Application, Domain, Infrastructure) plus `SiesaAgents.UnitTests`
- [ ] Add all projects to the solution via `dotnet sln add`
- [ ] Add `Scalar.AspNetCore` to API project; call `app.MapScalarApiReference()` — never `UseSwagger()`
- [ ] Remove default `WeatherForecast` endpoint/model
- [ ] Run test: `npx playwright test -g "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Backend build zero errors/warnings (2 tests, incl. 1 new)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- [ ] Ensure `dotnet build SiesaAgents.sln` succeeds with 0 errors and 0 warnings
- [ ] Register `ExceptionHandlingMiddleware` returning Problem Details RFC 7807 format
- [ ] Run test: `npx playwright test -g "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run specific test file
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run only the new build-verification tests
npx playwright test -g "dotnet build|tsc --noEmit|tsconfig.app.json|SiesaAgents.sln referencing"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 20 tests total (9 E2E + 11 API) written and failing — `frontend/` and `backend/` do not exist yet
- ✅ No new fixtures/factories required (infrastructure story, no domain data)
- ✅ No mock requirements (real toolchain invocation: `dotnet build`, `tsc --noEmit`)
- ✅ `data-testid="app-root"` requirement documented
- ✅ Implementation checklist created, mapped 1:1 to Tasks 1–3 in the story file

### GREEN Phase (DEV Team — Next Steps)

1. Pick one failing test group from the implementation checklist (start with Task 1 — frontend init)
2. Read the test to understand expected behavior
3. Implement minimal code/scaffolding to make it pass
4. Run the test to verify green
5. Move to next group (Task 2 — backend init, Task 3 — CORS)

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 20 tests pass
2. Review scaffold code against `Dev Notes` conventions (Guid PKs, DateTimeOffset, Scalar-only docs)
3. Ensure tests still pass after any cleanup

---

## Next Steps

1. Share this checklist and the two updated spec files with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using Tasks 1–5 in the story file as the execution order
4. Work one test group at a time (red → green)
5. When all tests pass, refactor and mark story ready for review

---

## Knowledge Base References Applied

- **network-first.md** — Route/response interception registered before `page.goto()` in AC1/AC3 tests
- **selector-resilience.md** — `data-testid="app-root"` used instead of CSS selectors
- **test-quality.md** — Given-When-Then structure, explicit waits, no hard sleeps
- **test-levels-framework.md** — E2E for frontend runtime/browser behavior, API for backend contract + build/toolchain verification

---

## Notes

- This story predates the existence of `frontend/` and `backend/` directories — all 20 tests are expected to fail with "connection refused", "file not found", or "module not found" errors, which is the correct RED-phase signal for a scaffolding story.
- The two new CLI-invocation tests (`dotnet build`, `tsc --noEmit`) directly exercise AC4 and AC5 as literally specified in the story ("the TypeScript compiler runs... zero errors", "`dotnet build SiesaAgents.sln` is executed... zero errors or warnings") rather than relying only on indirect runtime signals.
- No test file duplication: both `e2e/tests/foundation/project-initialization.spec.ts` and `e2e/tests/api/backend-initialization.api.spec.ts` from the previous ATDD run were extended in place.

---

**Generated by BMad TEA Agent** - 2026-07-01
