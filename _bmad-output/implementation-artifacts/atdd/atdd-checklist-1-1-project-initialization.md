# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-25
**Author:** sa-tea-atdd
**Primary Test Level:** API Integration + E2E + Unit/Build

---

## Story Summary

Story 1.1 establishes the complete development environment for both the frontend (Vite react-ts) and the backend (.NET 10 Clean Architecture). It initializes the repository structure with all required dependencies, configures TypeScript strict mode on the frontend, sets up the Scalar API documentation on the backend, and verifies CORS connectivity between both servers.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend server not yet initialized; connection refused on port 5173
  - **Verifies:** AC1 — Vite dev server starts and returns HTTP 200

- **Test:** `AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist until implementation adds it to index.html or App.tsx
  - **Verifies:** AC1 — React mount point is present and visible

- **Test:** `AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend to load yet; will capture console errors on implementation
  - **Verifies:** AC1/AC4 — No TypeScript compilation errors in console

- **Test:** `AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend to load yet
  - **Verifies:** AC1 — Zero runtime JS exceptions on first render

- **Test:** `AC3 — CORS configuration > should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Neither server is running; CORS errors not applicable yet
  - **Verifies:** AC3 — No CORS-related console errors when frontend requests backend

- **Test:** `AC3 — CORS configuration > should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not yet initialized; connection refused on port 5000
  - **Verifies:** AC3 — Backend responds 200/301/302 (not CORS-blocked)

- **Test:** `AC4 — TypeScript strict mode > should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not initialized; Vite overlay check cannot run
  - **Verifies:** AC4 — No Vite TypeScript error overlay on page load

### API Tests (8 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `AC2 — Backend server initialization > should have the backend API server running on port 5000`
  - **Status:** RED — Backend .NET project not created yet; connection refused
  - **Verifies:** AC2 — Backend responds to any request on port 5000

- **Test:** `AC2 — Backend server initialization > should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; /scalar endpoint does not exist
  - **Verifies:** AC2 — Scalar loads at /scalar with HTTP 200

- **Test:** `AC2 — Backend server initialization > should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running
  - **Verifies:** AC2 — /scalar returns text/html content-type

- **Test:** `AC2 — Backend server initialization > should NOT expose any Swagger/OpenAPI UI endpoint`
  - **Status:** RED — Backend not running; cannot verify Swagger absence yet
  - **Verifies:** AC2/Company Standard — /swagger does NOT return 200 (Swashbuckle forbidden)

- **Test:** `AC2 — Backend server initialization > should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default template endpoints not yet removed
  - **Verifies:** AC2 — /weatherforecast returns 404/405 (default template cleaned)

- **Test:** `AC2 — Backend server initialization > should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS policy not yet configured in Program.cs
  - **Verifies:** AC2/AC3 — Access-Control-Allow-Origin header present for frontend origin

- **Test:** `AC2 — Backend server initialization > should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; CORS middleware not yet applied
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204, not 403

- **Test:** `AC5 — Backend solution builds > should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not built or running
  - **Verifies:** AC5 — Server is running proves dotnet build succeeded (all 4 projects)

- **Test:** `AC5 — Backend solution builds > should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; ExceptionHandlingMiddleware not yet registered
  - **Verifies:** AC5/Middleware — Unknown endpoints return JSON (not HTML), not 500 crash

### Unit / Build Tests (12 tests)

**File:** `frontend/src/__tests__/setup/typescript-config.test.ts` (new — 155 lines)

- **Test:** `AC1/AC4 — TypeScript strict mode > should have tsconfig.app.json present`
  - **Status:** RED — frontend/ directory does not exist yet; tsconfig.app.json absent
  - **Verifies:** AC1/AC4 — tsconfig.app.json is present post-initialization

- **Test:** `AC1/AC4 — TypeScript strict mode > should have "strict" set to true in compilerOptions`
  - **Status:** RED — tsconfig.app.json absent
  - **Verifies:** AC1 — `"strict": true` is configured

- **Test:** `AC1/AC4 — TypeScript strict mode > should have "noImplicitAny" set to true`
  - **Status:** RED — tsconfig.app.json absent
  - **Verifies:** AC4 — `"noImplicitAny": true` is explicitly set

- **Test:** `AC1/AC4 — TypeScript strict mode > should have "strictNullChecks" set to true`
  - **Status:** RED — tsconfig.app.json absent
  - **Verifies:** AC4 — `"strictNullChecks": true` is explicitly set

- **Test:** `AC1/AC4 — TypeScript strict mode > should have "target" set to ES2020 or higher`
  - **Status:** RED — tsconfig.app.json absent
  - **Verifies:** AC1 — Modern ES build target configured

- **Test:** `AC1 — package.json has all required dependencies > should have package.json present`
  - **Status:** RED — frontend/ does not exist
  - **Verifies:** AC1 — Frontend project initialized

- **Test:** `AC1 — package.json has all required dependencies > should list @tanstack/react-router`
  - **Status:** RED — package.json absent
  - **Verifies:** AC1 — TanStack Router installed (company standard)

- **Test:** `AC1 — package.json has all required dependencies > should list @tanstack/react-query`
  - **Status:** RED — package.json absent
  - **Verifies:** AC1 — TanStack Query installed (company standard)

- **Test:** `AC1 — package.json has all required dependencies > should list zustand`
  - **Status:** RED — package.json absent
  - **Verifies:** AC1 — Zustand state management installed

- **Test:** `AC1 — package.json has all required dependencies > should list axios`
  - **Status:** RED — package.json absent
  - **Verifies:** AC1 — Axios HTTP client installed

- **Test:** `AC1 — package.json has all required dependencies > should list vitest`
  - **Status:** RED — package.json absent
  - **Verifies:** AC1 — Vitest test runner present in devDependencies

- **Test:** `AC1 — package.json has all required dependencies > should list tailwindcss`
  - **Status:** RED — package.json absent
  - **Verifies:** AC1 — TailwindCSS v4 installed

- **Test:** `AC1 — vite.config.ts has required plugins > should have vite.config.ts present`
  - **Status:** RED — vite.config.ts absent
  - **Verifies:** AC1 — Vite config created post-initialization

- **Test:** `AC1 — vite.config.ts has required plugins > should register @tailwindcss/vite plugin`
  - **Status:** RED — vite.config.ts absent
  - **Verifies:** AC1 — TailwindCSS Vite plugin registered

- **Test:** `AC1 — vite.config.ts has required plugins > should register @tanstack/router-plugin`
  - **Status:** RED — vite.config.ts absent
  - **Verifies:** AC1 — TanStack Router Vite plugin registered for file-based routing

- **Test:** `AC1 — .env.development > should have .env.development present`
  - **Status:** RED — .env.development absent
  - **Verifies:** AC1 — Environment file created

- **Test:** `AC1 — .env.development > should have VITE_API_URL=http://localhost:5000`
  - **Status:** RED — .env.development absent
  - **Verifies:** AC1 — API base URL points to backend port 5000

---

## Data Factories Created

None required for Story 1.1 — this story has no domain entities or user data. Tests validate infrastructure and toolchain configuration only.

---

## Fixtures Created

No new fixtures created for Story 1.1. The base fixture at `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` for future use (Story 1.2+).

---

## Mock Requirements

### Backend Health Probe (CORS test)

**Endpoint:** `GET http://localhost:5000/scalar`

**Used in:** AC3 E2E tests — the frontend issues a `fetch()` from the browser context to verify CORS headers are present.

**Notes:** No mock needed — the real backend must be running. If backend is unavailable, the CORS E2E tests will fail as expected (RED phase).

---

## Required data-testid Attributes

### Application Root (index.html or App.tsx)

- `app-root` — React mount point. Must be added to `<div id="root">` or the top-level App component.

**Implementation Example:**

```tsx
// Option A: index.html
<div id="root" data-testid="app-root"></div>

// Option B: App.tsx (if index.html is unchanged)
export default function App() {
  return (
    <div data-testid="app-root">
      <RouterProvider router={router} />
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
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Verify `pnpm run dev` starts without error on port 5173
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to `<div id="root">` in `frontend/index.html` OR wrap RouterProvider in a `<div data-testid="app-root">` in `main.tsx`
- [ ] Verify element is visible at `http://localhost:5173`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "app-root"`

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add project to solution: `dotnet sln add src/SiesaAgents.API`
- [ ] Run `dotnet run` in `src/SiesaAgents.API`
- [ ] Verify connection on port 5000

**Estimated Effort:** 0.5 hours

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `Scalar.AspNetCore` NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` to `Program.cs`
- [ ] Add `app.MapScalarApiReference()` to `Program.cs` (NEVER `app.UseSwagger()`)
- [ ] Verify GET `http://localhost:5000/scalar` returns 200 with HTML

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove `WeatherForecast` record and `MapGet("/weatherforecast", ...)` from `Program.cs`
- [ ] Verify GET `/weatherforecast` returns 404 or 405

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()`
- [ ] Verify OPTIONS preflight returns 200/204 with `Access-Control-Allow-Origin: http://localhost:5173`

**Estimated Effort:** 0.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Implement middleware: catch all exceptions, respond with `application/problem+json`, status 500, `ProblemDetails` JSON (no `Detail` = no stack trace)
- [ ] Register in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify unknown endpoints return JSON, not HTML

**Estimated Effort:** 1.0 hours

---

### Test: `should have tsconfig.app.json with "strict": true, "noImplicitAny": true, "strictNullChecks": true`

**File:** `frontend/src/__tests__/setup/typescript-config.test.ts`

**Tasks to make this test pass:**

- [ ] Open `frontend/tsconfig.app.json` generated by Vite template
- [ ] Add/verify `"strict": true` is in `compilerOptions`
- [ ] Add `"noImplicitAny": true` explicitly to `compilerOptions`
- [ ] Add `"strictNullChecks": true` explicitly to `compilerOptions`
- [ ] Run test: `pnpm exec vitest run src/__tests__/setup/typescript-config.test.ts` from `frontend/`

**Estimated Effort:** 0.25 hours

---

### Test: `should have @tailwindcss/vite and @tanstack/router-plugin in vite.config.ts`

**File:** `frontend/src/__tests__/setup/typescript-config.test.ts`

**Tasks to make this test pass:**

- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Install router plugin: `pnpm add -D @tanstack/router-plugin`
- [ ] Update `vite.config.ts` to import and register both plugins
- [ ] Verify `pnpm run dev` still starts after config changes

**Estimated Effort:** 0.5 hours

---

### Test: `should have VITE_API_URL=http://localhost:5000 in .env.development`

**File:** `frontend/src/__tests__/setup/typescript-config.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/.env.development` with content `VITE_API_URL=http://localhost:5000`
- [ ] Add `.env*.local` to `.gitignore` (keep `.env.development` committed — no secrets)

**Estimated Effort:** 0.1 hours

---

## Running Tests

```bash
# Run all E2E + API tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run Playwright tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Run only API tests (no browser needed)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run Vitest unit/build tests (from frontend/ after pnpm install)
pnpm exec vitest run src/__tests__/setup/typescript-config.test.ts

# Run all Vitest tests (frontend/)
pnpm exec vitest run

# Debug a specific Playwright test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with coverage (Vitest)
pnpm exec vitest run --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All tests written and failing (no implementation exists yet)
- CORS, Scalar, TypeScript strict, dependency, and environment tests defined
- data-testid requirements documented (`app-root`)
- Mock requirements documented (none needed — real servers required)
- Implementation checklist maps each failing test to concrete tasks

**Verification:** Run `npx playwright test e2e/tests/foundation/ e2e/tests/api/` — all 14 E2E/API tests will fail with `ERR_CONNECTION_REFUSED` (server not running). Run Vitest in `frontend/` — all 17 unit tests will fail with `ENOENT` (files do not exist).

---

### GREEN Phase (DEV Team — Next Steps)

1. Pick first failing test from implementation checklist (start with `should serve frontend on port 5173`)
2. Read the test to understand expected behavior
3. Run `pnpm create vite@latest frontend -- --template react-ts` and `pnpm install`
4. Run the test to verify it passes
5. Continue one test at a time following the implementation checklist order above

---

### REFACTOR Phase (After All Tests Pass)

1. Verify all 26 tests pass
2. Review `Program.cs` and `tsconfig.app.json` for any duplication or omissions
3. Ensure middleware order in `Program.cs` follows: ExceptionHandling → CORS → Scalar → Endpoints
4. Confirm no `app.UseSwagger()` call exists
5. Mark Story 1.1 as `done` in `sprint-status.yaml`

---

## Acceptance Criteria Coverage Matrix

| AC | Description | Test Files | Test Count | Level |
|----|-------------|------------|------------|-------|
| AC1 | Frontend Vite server on 5173, TypeScript strict | `project-initialization.spec.ts`, `typescript-config.test.ts` | 4 + 17 | E2E + Unit |
| AC2 | Backend on 5000, Scalar at /scalar, 4 CA projects | `backend-initialization.api.spec.ts` | 5 | API |
| AC3 | CORS allows localhost:5173 | `project-initialization.spec.ts`, `backend-initialization.api.spec.ts` | 2 + 2 | E2E + API |
| AC4 | TypeScript strict compilation — zero errors | `project-initialization.spec.ts`, `typescript-config.test.ts` | 1 + 4 | E2E + Unit |
| AC5 | dotnet build zero errors (runtime proxy) | `backend-initialization.api.spec.ts` | 2 | API |

**Total: 26 tests across 3 files**

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using implementation checklist as guide (Task 1 → Task 5 order matches story tasks)
4. Work one test at a time (red → green for each)
5. When all tests pass, run `pnpm exec tsc --noEmit` from `frontend/` to verify AC4 fully
6. When refactoring complete, update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **company-standards.md** — frontend stack (TanStack Router, TanStack Query, Zustand, Axios, TailwindCSS v4, pnpm mandatory)
- **architecture.md** — backend Clean Architecture structure, CORS + Scalar + Problem Details decisions
- **epic-01-foundation.md** — Story 1.1 acceptance criteria
- **1-1-project-initialization-repository-structure.md** — story tasks, dev notes, tsconfig requirements
- **test-design-epic-1.md** — test case definitions TC-E1-P0-01 through TC-E1-P1-06

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-05-25
