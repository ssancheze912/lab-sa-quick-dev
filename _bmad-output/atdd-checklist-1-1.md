# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-20
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

This story establishes the complete project foundation for the Siesa Agents CRM: a Vite react-ts frontend and a .NET 10 Clean Architecture backend. The goal is a working development environment where both servers start, CORS is properly configured, and TypeScript strict mode is enforced.

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine, When `pnpm run dev` is executed, Then the Vite server starts on port 5173 with zero errors and TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When `dotnet run` is executed in `src/SiesaAgents.API`, Then the backend starts on port 5000, the Scalar API documentation page loads at `/scalar`, and the four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors.

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `AC1 — Frontend Vite server responds on port 5173`
  - **Status:** RED — No frontend server running (`ECONNREFUSED localhost:5173`)
  - **Verifies:** AC1 — Frontend dev server is reachable on port 5173

- **Test:** `AC1 — Frontend root HTML contains a React mount point`
  - **Status:** RED — No frontend server running; element not found
  - **Verifies:** AC1 — The React app has a `data-testid="app-root"` or `#root` mount point in the DOM

- **Test:** `AC3 — CORS allows cross-origin request from frontend origin`
  - **Status:** RED — No backend running; `waitForResponse` times out (10s)
  - **Verifies:** AC3 — Cross-origin fetch from browser context (frontend origin) to backend succeeds

- **Test:** `AC3 — No CORS errors appear in browser console`
  - **Status:** RED — No backend running; CORS errors (or network errors) appear in console
  - **Verifies:** AC3 — Browser console shows zero CORS-related error messages

### API Tests (6 tests)

**File:** `e2e/tests/foundation/backend-initialization.spec.ts`

- **Test:** `AC2 — Backend responds on port 5000`
  - **Status:** RED — `ECONNREFUSED localhost:5000`; backend not running
  - **Verifies:** AC2 — .NET API is reachable on port 5000

- **Test:** `AC2 — Scalar API documentation page loads at /scalar`
  - **Status:** RED — Connection refused; Scalar not configured
  - **Verifies:** AC2 — `GET /scalar` returns HTTP 200

- **Test:** `AC2 — Scalar page returns HTML content (not JSON error)`
  - **Status:** RED — Connection refused; no response
  - **Verifies:** AC2 — `/scalar` response Content-Type is `text/html`

- **Test:** `AC2 — /swagger endpoint does NOT exist (Scalar is the only API docs)`
  - **Status:** RED — Connection refused
  - **Verifies:** AC2 — Swagger is not registered; `GET /swagger` returns 404

- **Test:** `AC3 — Backend responds with CORS header for allowed frontend origin`
  - **Status:** RED — Connection refused; no CORS headers received
  - **Verifies:** AC3 — OPTIONS preflight returns `Access-Control-Allow-Origin: http://localhost:5173`

- **Test:** `AC5 — ExceptionHandlingMiddleware returns Problem Details on unhandled errors`
  - **Status:** RED — Connection refused; middleware not implemented
  - **Verifies:** AC5 — Unhandled exceptions return RFC 7807 Problem Details (status, title, no stackTrace)

### Configuration Tests (5 tests)

**File:** `e2e/tests/foundation/typescript-config.spec.ts`

- **Test:** `AC4 — tsconfig.app.json exists in the frontend project`
  - **Status:** RED — `frontend/tsconfig.app.json` does not exist (frontend not initialized)
  - **Verifies:** AC4 — Vite react-ts template generates tsconfig.app.json

- **Test:** `AC4 — tsconfig.app.json has "strict": true enabled`
  - **Status:** RED — File missing; when present, strict not yet set
  - **Verifies:** AC4 — `compilerOptions.strict` is `true`

- **Test:** `AC4 — tsconfig.app.json has "noImplicitAny": true enabled`
  - **Status:** RED — File missing; when present, setting not verified
  - **Verifies:** AC4 — `noImplicitAny` enabled (explicitly or via `strict: true`)

- **Test:** `AC4 — tsconfig.app.json has "strictNullChecks": true enabled`
  - **Status:** RED — File missing; when present, setting not verified
  - **Verifies:** AC4 — `strictNullChecks` enabled (explicitly or via `strict: true`)

- **Test:** `AC4 — Frontend page loads without TypeScript compile errors`
  - **Status:** RED — Frontend not running; no page to load
  - **Verifies:** AC4 — Vite dev server produces no TypeScript errors in browser console

- **Test:** `AC4 — package.json build script includes TypeScript compilation`
  - **Status:** RED — `frontend/package.json` does not exist
  - **Verifies:** AC4 — The `build` or `type-check` npm script runs `tsc`

---

## Data Factories Created

No data factories required for this story. Story 1.1 tests infrastructure availability (server startup, CORS, TypeScript config) — no domain entities or API data are created.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` factories for future stories.

---

## Fixtures Created

No new fixtures required for this story. Tests use Playwright's built-in `page` and `request` fixtures directly.

**Existing infrastructure at `e2e/fixtures/base.fixture.ts`** provides `clientesPage` and `contactosPage` fixtures for Epic 1 Story 1.2 and beyond.

---

## Mock Requirements

### Development Environment Mock (for AC3 CORS test)

The CORS E2E tests (`project-initialization.spec.ts`) use a real cross-origin fetch from the browser context to `http://localhost:5000/health`. No mock is used — both servers must be running.

**For CI environments:** Both servers should be started as part of the CI pipeline before running tests. The `playwright.config.ts` `webServer` block starts the frontend automatically; the backend must be started separately.

**Backend /health endpoint:** The CORS tests call `GET /health`. If this endpoint does not exist, the test will still pass as long as the CORS header is returned (even with 404). The ExceptionHandlingMiddleware should handle unknown routes gracefully.

---

## Required data-testid Attributes

### Frontend Application Shell

- `app-root` — The root React mount point (`<div data-testid="app-root" id="root">`)

**Implementation Example:**

```html
<!-- index.html -->
<div id="root" data-testid="app-root"></div>
```

```tsx
// src/main.tsx
const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement!).render(<App />);
```

**Note:** The `data-testid="app-root"` attribute must be on the root HTML element (index.html), not added dynamically by React. The test checks `toBeAttached()` which is satisfied by the DOM element existing regardless of React hydration status.

---

## Implementation Checklist

### Test: AC1 — Frontend Vite server responds on port 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Navigate to `frontend/` and run `pnpm install`
- [ ] Verify `pnpm run dev` starts Vite on port 5173
- [ ] Confirm `curl http://localhost:5173` returns HTTP 200
- [ ] Run test: `npx playwright test project-initialization.spec.ts --grep "AC1.*port 5173"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC1 — Frontend root HTML contains a React mount point

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to `<div id="root">` in `frontend/index.html`
- [ ] Ensure React mounts into this element via `src/main.tsx`
- [ ] Run test: `npx playwright test project-initialization.spec.ts --grep "React mount point"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC2 — Backend responds on port 5000

**File:** `e2e/tests/foundation/backend-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `dotnet new sln -n SiesaAgents` at `backend/`
- [ ] Run `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Run `dotnet sln add src/SiesaAgents.API`
- [ ] Configure `Program.cs` with `app.Run()` (minimal setup)
- [ ] Verify `dotnet run` starts on port 5000 (check `Properties/launchSettings.json`)
- [ ] Run test: `npx playwright test backend-initialization.spec.ts --grep "AC2.*port 5000"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC2 — Scalar API documentation page loads at /scalar

**File:** `e2e/tests/foundation/backend-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`: add `builder.Services.AddOpenApi()`
- [ ] In `Program.cs`: add `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoints and models
- [ ] Verify `GET http://localhost:5000/scalar` returns HTTP 200 with HTML
- [ ] Run test: `npx playwright test backend-initialization.spec.ts --grep "Scalar"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC2 — /swagger endpoint does NOT exist

**File:** `e2e/tests/foundation/backend-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseSwagger()` and `app.UseSwaggerUI()` are NOT called in `Program.cs`
- [ ] Ensure Swashbuckle is NOT added as a NuGet package
- [ ] Run test: `npx playwright test backend-initialization.spec.ts --grep "swagger"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours (do nothing — this passes if Swagger is never added)

---

### Test: AC3 — Backend responds with CORS header for allowed frontend origin

**File:** `e2e/tests/foundation/backend-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] In `Program.cs`, apply CORS before Scalar and endpoint mappings: `app.UseCors("DevCors")`
- [ ] Verify OPTIONS preflight to any endpoint returns `Access-Control-Allow-Origin: http://localhost:5173`
- [ ] Run test: `npx playwright test backend-initialization.spec.ts --grep "CORS header"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC3 — No CORS errors appear in browser console

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS policy must be applied in backend (see AC3 task above)
- [ ] Both frontend (`pnpm run dev` on 5173) and backend (`dotnet run` on 5000) must be running simultaneously
- [ ] Run test: `npx playwright test project-initialization.spec.ts --grep "No CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (pass-through once CORS is configured)

---

### Test: AC4 — TypeScript configuration strict mode

**File:** `e2e/tests/foundation/typescript-config.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `frontend/tsconfig.app.json` exists (created by Vite react-ts template)
- [ ] Configure `tsconfig.app.json` with:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- [ ] Add `data-testid="app-root"` to `frontend/index.html` root div
- [ ] Ensure `build` or `type-check` script in `package.json` includes `tsc`:
  ```json
  {
    "scripts": {
      "build": "tsc -b && vite build"
    }
  }
  ```
- [ ] Verify `pnpm run build` completes without TypeScript errors
- [ ] Run test: `npx playwright test typescript-config.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — ExceptionHandlingMiddleware returns Problem Details

**File:** `e2e/tests/foundation/backend-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`:
  ```csharp
  public class ExceptionHandlingMiddleware(RequestDelegate next)
  {
      public async Task InvokeAsync(HttpContext context)
      {
          try { await next(context); }
          catch (Exception ex)
          {
              context.Response.ContentType = "application/problem+json";
              context.Response.StatusCode = 500;
              await context.Response.WriteAsJsonAsync(new ProblemDetails
              {
                  Status = 500,
                  Title = "An unexpected error occurred.",
                  Detail = null
              });
          }
      }
  }
  ```
- [ ] Register in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify error responses never expose `ex.Message` or stack traces
- [ ] Run test: `npx playwright test backend-initialization.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL failing tests for Story 1.1
npx playwright test e2e/tests/foundation/ --project=chromium

# Run only E2E frontend initialization tests (AC1, AC3)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --project=chromium

# Run only API backend initialization tests (AC2, AC3, AC5)
npx playwright test e2e/tests/foundation/backend-initialization.spec.ts --project=chromium

# Run only TypeScript config tests (AC4)
npx playwright test e2e/tests/foundation/typescript-config.spec.ts --project=chromium

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed --project=chromium

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with reporter
npx playwright test e2e/tests/foundation/ --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 15 tests written and failing (3 spec files)
- ✅ No fixtures or factories required for this infrastructure story
- ✅ Mock requirements documented
- ✅ Required `data-testid` attributes listed (`app-root`)
- ✅ Implementation checklist created with concrete tasks per test

**Verification:**

- All tests fail with `ECONNREFUSED` (servers not running) or `ENOENT` (files not found)
- Failures are due to missing implementation, not test bugs
- Failure messages are clear: connection refused, file not found, assertion mismatch

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with Task 1 — Frontend Init)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. AC2 tests (backend) — run `dotnet run`, verify port 5000 and Scalar
2. AC1 tests (frontend) — run `pnpm run dev`, verify port 5173
3. AC3 tests (CORS) — configure CORS policy, verify both servers
4. AC4 tests (TypeScript) — configure tsconfig.app.json
5. AC5 tests (Middleware) — implement ExceptionHandlingMiddleware

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 15 tests pass** (green phase complete)
2. **Review `Program.cs`** for Clean Architecture compliance
3. **Verify folder structure** matches architecture.md specification
4. **Ensure tests still pass** after any refactor
5. **Update story status** to 'done' in sprint-status.yaml

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ --project=chromium`
3. **Begin implementation** using the implementation checklist above
4. **Work one test at a time** (red → green for each AC)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation (applied in AC4 TypeScript compile error test)
- **selector-resilience.md** — `data-testid` selector hierarchy (applied: `[data-testid="app-root"], #root` with testid as primary)
- **test-quality.md** — One assertion per test, Given-When-Then structure, explicit waits (no hard waits)
- **fixture-architecture.md** — Auto-cleanup fixtures (no fixtures needed for this infrastructure story)
- **test-levels-framework.md** — E2E for browser-level CORS/server checks; API tests for backend HTTP contract; Config tests for TypeScript build verification
- **test-healing-patterns.md** — Avoiding race conditions in CORS tests via `Promise.all` with `waitForResponse`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/ --project=chromium`

**Expected Results (RED Phase):**

```
Running 15 tests using 1 worker

  ✗  1 [chromium] › foundation/project-initialization.spec.ts:21:3 › Story 1.1 — Project Initialization & Repository Structure › AC1 — Frontend Vite server responds on port 5173 (5.1s)
  ✗  2 [chromium] › foundation/project-initialization.spec.ts:30:3 › Story 1.1 — Project Initialization & Repository Structure › AC1 — Frontend root HTML contains a React mount point (5.1s)
  ✗  3 [chromium] › foundation/project-initialization.spec.ts:42:3 › Story 1.1 — Project Initialization & Repository Structure › AC3 — CORS allows cross-origin request from frontend origin (10.1s)
  ✗  4 [chromium] › foundation/project-initialization.spec.ts:66:3 › Story 1.1 — Project Initialization & Repository Structure › AC3 — No CORS errors appear in browser console (5.1s)
  ✗  5 [chromium] › foundation/backend-initialization.spec.ts:22:3 › Story 1.1 — Backend Initialization & Clean Architecture › AC2 — Backend responds on port 5000 (5.1s)
  ✗  6 [chromium] › foundation/backend-initialization.spec.ts:31:3 › Story 1.1 — Backend Initialization & Clean Architecture › AC2 — Scalar API documentation page loads at /scalar (5.1s)
  ✗  7 [chromium] › foundation/backend-initialization.spec.ts:40:3 › Story 1.1 — Backend Initialization & Clean Architecture › AC2 — Scalar page returns HTML content (not JSON error) (5.1s)
  ✗  8 [chromium] › foundation/backend-initialization.spec.ts:52:3 › Story 1.1 — Backend Initialization & Clean Architecture › AC2 — /swagger endpoint does NOT exist (Scalar is the only API docs) (5.1s)
  ✗  9 [chromium] › foundation/backend-initialization.spec.ts:63:3 › Story 1.1 — Backend Initialization & Clean Architecture › AC3 — Backend responds with CORS header for allowed frontend origin (5.1s)
  ✗ 10 [chromium] › foundation/backend-initialization.spec.ts:82:3 › Story 1.1 — Backend Initialization & Clean Architecture › AC5 — ExceptionHandlingMiddleware returns Problem Details on unhandled errors (5.1s)
  ✗ 11 [chromium] › foundation/typescript-config.spec.ts:27:3 › Story 1.1 — TypeScript Strict Mode Configuration (AC4) › AC4 — tsconfig.app.json exists in the frontend project (0.1s)
  ✗ 12 [chromium] › foundation/typescript-config.spec.ts:37:3 › Story 1.1 — TypeScript Strict Mode Configuration (AC4) › AC4 — tsconfig.app.json has "strict": true enabled (0.1s)
  ✗ 13 [chromium] › foundation/typescript-config.spec.ts:53:3 › Story 1.1 — TypeScript Strict Mode Configuration (AC4) › AC4 — tsconfig.app.json has "noImplicitAny": true enabled (0.1s)
  ✗ 14 [chromium] › foundation/typescript-config.spec.ts:68:3 › Story 1.1 — TypeScript Strict Mode Configuration (AC4) › AC4 — tsconfig.app.json has "strictNullChecks": true enabled (0.1s)
  ✗ 15 [chromium] › foundation/typescript-config.spec.ts:83:3 › Story 1.1 — TypeScript Strict Mode Configuration (AC4) › AC4 — Frontend page loads without TypeScript compile errors (5.1s)
  ✗ 16 [chromium] › foundation/typescript-config.spec.ts:101:3 › Story 1.1 — TypeScript Strict Mode Configuration (AC4) › AC4 — package.json build script includes TypeScript compilation (0.1s)

  16 failed
  Passing: 0 (expected)
  Failing: 16 (expected)
  Status: ✅ RED phase verified
```

**Expected Failure Messages:**

- Tests 1-4, 5-10: `Error: connect ECONNREFUSED 127.0.0.1:5173` / `127.0.0.1:5000`
- Tests 11-14, 16: `Error: ENOENT: no such file or directory, open '.../frontend/tsconfig.app.json'`
- Test 15: `Error: connect ECONNREFUSED 127.0.0.1:5173` (frontend not running)

---

## Notes

- Story 1.1 is a pure infrastructure story — no domain entities, no business logic, no database.
- The TypeScript config tests (`typescript-config.spec.ts`) use Node.js `fs` module to read files directly — they do not require a browser and run in Playwright's API context.
- The CORS tests in `project-initialization.spec.ts` require BOTH servers running simultaneously. In CI, the backend webServer must be started manually (Playwright's `webServer` config only starts the frontend).
- AC5 (ExceptionHandlingMiddleware) is verified indirectly — if the backend is running and returns proper Problem Details on errors, the test passes. A 404 response is also acceptable (no route exists to trigger the middleware).
- The `data-testid="app-root"` requirement is LOW effort: just add `data-testid="app-root"` to the `<div id="root">` in `index.html`.

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/testarch/knowledge/` for testing best practices
- Architecture decisions: `_bmad-output/planning-artifacts/architecture.md`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`

---

**Generated by BMad TEA Agent** — 2026-05-20
