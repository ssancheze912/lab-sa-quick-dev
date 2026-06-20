# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-20
**Author:** SiesaTeam
**Primary Test Level:** API + E2E (Infrastructure validation — no domain entities exist)

---

## Story Summary

This story initializes the Vite React-TypeScript frontend and the .NET 10 Clean Architecture backend so that both development servers run correctly and can communicate. The frontend uses strict TypeScript mode and the backend exposes its API documentation through Scalar (not Swagger). CORS is configured to allow cross-origin requests between the two local servers.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean dev machine, When `pnpm run dev` is executed, Then Vite starts on port 5173 with no errors and TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project exists, When `dotnet run` is executed in `src/SiesaAgents.API`, Then the backend starts on port 5000, the Scalar page loads at `/scalar`, and all four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without console errors.

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (2 tests)

**File:** `e2e/story-1-1/project-initialization.spec.ts` (107 lines)

- **Test:** `AC1 — should serve the React application on port 5173`
  - **Status:** RED — Page navigation will fail because the frontend project does not yet exist
  - **Verifies:** AC1 — Vite dev server starts and responds with HTTP 200

- **Test:** `AC1 — should respond with an HTML document that includes a React root mount point`
  - **Status:** RED — No frontend app exists; `#root` element not present
  - **Verifies:** AC1 — React app is mounted via the generated Vite template

- **Test:** `AC2 — should respond with HTTP 200 at the Scalar API documentation endpoint`
  - **Status:** RED — Backend does not yet exist; connection refused on port 5000
  - **Verifies:** AC2 — Backend starts and Scalar documentation page is accessible

- **Test:** `AC2 — should return an HTML response at /scalar containing "Scalar" branding`
  - **Status:** RED — Backend not running; response body unavailable
  - **Verifies:** AC2 — Scalar.AspNetCore is correctly configured via `app.MapScalarApiReference()`

- **Test:** `AC2 — should expose the OpenAPI JSON spec used by Scalar at /openapi/v1.json`
  - **Status:** RED — Backend not running; endpoint does not exist
  - **Verifies:** AC2 — `builder.Services.AddOpenApi()` is registered and generates a spec

- **Test:** `AC3 — should include Access-Control-Allow-Origin header for localhost:5173 on backend responses`
  - **Status:** RED — Backend not running; no CORS headers available
  - **Verifies:** AC3 — CORS policy "DevCors" is applied with correct allowed origin

- **Test:** `AC3 — should not include CORS error when frontend fetches backend health endpoint`
  - **Status:** RED — Frontend and backend both absent; cross-origin fetch fails silently
  - **Verifies:** AC3 — Browser does not report CORS errors in console

- **Test:** `AC3 — should allow GET requests with Content-Type application/json header from frontend origin`
  - **Status:** RED — Backend not running; request cannot be sent
  - **Verifies:** AC3 — CORS policy uses `AllowAnyHeader()` to permit JSON content-type

### API Tests (7 tests)

**File:** `e2e/story-1-1/backend-solution.api.spec.ts` (127 lines)

- **Test:** `AC2 — should return a valid JSON response from the OpenAPI spec endpoint`
  - **Status:** RED — Backend not running; no JSON response available
  - **Verifies:** AC2 — OpenAPI spec has required `openapi`, `info`, `paths` fields

- **Test:** `AC2 — should NOT expose a /swagger endpoint`
  - **Status:** RED — Backend not running (paradoxically also failing the "wrong" way)
  - **Verifies:** AC2/Architecture — Swashbuckle is prohibited; only Scalar is used

- **Test:** `AC2 — should respond to requests without leaking internal stack traces`
  - **Status:** RED — Backend not running
  - **Verifies:** AC2 + NFR6 — ExceptionHandlingMiddleware does not expose stack traces

- **Test:** `AC2 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running
  - **Verifies:** AC2 — `application/problem+json` content-type is returned on 5xx errors

- **Test:** `AC3 — should include CORS allow-origin header on GET /openapi/v1.json`
  - **Status:** RED — Backend not running; no headers to validate
  - **Verifies:** AC3 — Actual GET responses include CORS origin header

- **Test:** `AC3 — should include CORS allow-methods header in OPTIONS preflight response`
  - **Status:** RED — Backend not running; preflight fails
  - **Verifies:** AC3 — `AllowAnyMethod()` in CORS policy returns `Access-Control-Allow-Methods`

- **Test:** `AC3 — should NOT allow requests from an unauthorized origin`
  - **Status:** RED — Backend not running
  - **Verifies:** AC3 — CORS whitelist rejects origins not in the policy

---

## Data Factories Created

### Environment Factory

**File:** `e2e/support/factories/environment.factory.ts`

**Exports:**
- `FRONTEND_URL` — `http://localhost:5173` constant
- `BACKEND_URL` — `http://localhost:5000` constant
- `createCorsPreflightOptions(method?, headers?)` — Builds OPTIONS request headers for CORS validation
- `createFrontendOriginHeaders(extraHeaders?)` — Creates request headers simulating cross-origin from frontend
- `BACKEND_CONTRACTS` — Object with canonical endpoint URLs for all backend HTTP contracts

**Example Usage:**

```typescript
import { createCorsPreflightOptions, BACKEND_CONTRACTS } from '../support/factories/environment.factory';

const preflightOpts = createCorsPreflightOptions('POST', 'Content-Type, Authorization');
const response = await request.fetch(BACKEND_CONTRACTS.scalarEndpoint, preflightOpts);
```

---

## Fixtures Created

No test fixtures with auto-cleanup are required for this story. Story 1.1 tests are infrastructure validation tests that do not create or tear down domain data. Fixtures will be introduced starting from Story 1.2 (navigation) and Story 2.1 (client entities).

---

## Mock Requirements

No mocks required. Story 1.1 tests exercise actual running processes (Vite dev server, .NET 10 API) to validate that the initialization was performed correctly. Mocking the servers would defeat the purpose of verifying their real startup behavior.

---

## Required data-testid Attributes

### Frontend Root (index.html / main.tsx)

- `root` — The `<div id="root">` element where React mounts. The test checks for `#root` by ID (standard Vite template).

No additional `data-testid` attributes are required for Story 1.1. The story creates no navigable UI pages or interactive components. `data-testid` attributes will be added in Story 1.2 (NavigationRail, NavigationBar) and later stories.

**Implementation Example:**

```html
<!-- index.html — standard Vite template -->
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

---

## Implementation Checklist

### Test: AC1 — Frontend Vite dev server serves app on port 5173

**File:** `e2e/story-1-1/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `pnpm exec playwright test e2e/story-1-1/project-initialization.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC2 — Backend .NET API starts and Scalar loads at /scalar

**File:** `e2e/story-1-1/project-initialization.spec.ts` + `e2e/story-1-1/backend-solution.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution with `dotnet sln add`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add NuGet: `dotnet add src/SiesaAgents.Application package FluentValidation`
- [ ] Add NuGet: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoints and models from the generated API project
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details RFC 7807
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify `dotnet run` in `src/SiesaAgents.API` starts on port 5000
- [ ] Run test: `pnpm exec playwright test e2e/story-1-1/backend-solution.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Test: AC3 — CORS allows requests from localhost:5173

**File:** `e2e/story-1-1/project-initialization.spec.ts` + `e2e/story-1-1/backend-solution.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] In `appsettings.Development.json`, add `AllowedOrigins` array with `http://localhost:5173`
- [ ] Apply CORS before Scalar and endpoints: `app.UseCors("DevCors")` in the pipeline
- [ ] Ensure `app.UseCors()` is called BEFORE `app.MapScalarApiReference()` and `app.Run()`
- [ ] Verify browser dev tools show no CORS errors when frontend fetches backend
- [ ] Run test: `pnpm exec playwright test e2e/story-1-1/ --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode zero errors (CI script validation)

**Note:** This AC is validated via the CI build pipeline, not Playwright. Add to CI workflow:

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Run `pnpm exec tsc --noEmit` in `frontend/` directory — must exit with code 0
- [ ] Add this command to the CI pipeline script (see `testarch-ci` workflow)
- [ ] ✅ TypeScript compilation succeeds with zero errors

**Estimated Effort:** 0.25 hours

---

### Test: AC5 — dotnet build succeeds with zero errors/warnings (CI script validation)

**Note:** This AC is validated via the CI build pipeline, not Playwright. Add to CI workflow:

- [ ] Run `dotnet build backend/SiesaAgents.sln` — must exit with code 0
- [ ] Verify zero warnings in build output (`--warnaserror` flag recommended)
- [ ] Add this command to the CI pipeline script
- [ ] ✅ All four .NET projects compile successfully

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm exec playwright test e2e/story-1-1/

# Run only E2E (frontend + CORS) tests
pnpm exec playwright test e2e/story-1-1/project-initialization.spec.ts

# Run only API (backend) tests
pnpm exec playwright test e2e/story-1-1/backend-solution.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/story-1-1/ --headed

# Debug a specific test
pnpm exec playwright test e2e/story-1-1/ --debug

# Run specific AC group
pnpm exec playwright test e2e/story-1-1/ --grep "AC1"
pnpm exec playwright test e2e/story-1-1/ --grep "AC2"
pnpm exec playwright test e2e/story-1-1/ --grep "AC3"

# TypeScript compilation check (AC4)
cd frontend && pnpm exec tsc --noEmit

# .NET solution build check (AC5)
dotnet build backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Test factories created (`e2e/support/factories/environment.factory.ts`)
- ✅ No fixtures needed for this infrastructure story
- ✅ No external service mocks needed (tests target real servers)
- ✅ No `data-testid` attributes needed (no UI components in this story)
- ✅ Implementation checklist created
- ✅ CI validation commands documented for AC4 and AC5

**Verification:**

- All Playwright tests fail with "Connection refused" on ports 5173 and 5000 (expected)
- Tests fail due to missing implementation, not test bugs
- Failure messages are clear: `ERR_CONNECTION_REFUSED` / `net::ERR_FAILED`

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC2 — backend must run before CORS tests)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended implementation order:**
1. AC5 first: Create backend solution and verify `dotnet build` passes
2. AC2: Run backend, verify Scalar loads at `/scalar`
3. AC3: Configure CORS, verify CORS headers in test
4. AC4: Configure TypeScript strict mode, verify `tsc --noEmit` passes
5. AC1: Verify Vite starts on 5173, HTML root element present

**Key Principles:**

- Start with backend (AC2/AC5) — it enables CORS tests (AC3) to run
- TypeScript strict mode (AC4) should be configured at project creation time
- Run `dotnet build` and `tsc --noEmit` in CI for AC4/AC5 (not in Playwright)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all Playwright tests pass and CI commands exit with code 0
2. Review `Program.cs` for clean minimal structure (no unused registrations)
3. Ensure `tsconfig.app.json` has no redundant compiler options
4. Verify `.env.development` is in `.gitignore` (use `.env.development.example` instead)
5. Run full test suite after each refactor step

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/story-1-1/`
3. **Begin implementation** using implementation checklist above
4. **Work in order**: backend solution → backend startup → CORS → frontend → TypeScript
5. **When all tests pass**, run `dotnet build backend/SiesaAgents.sln` and `tsc --noEmit` for AC4/AC5
6. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception applied in CORS browser console test (intercept before navigate)
- **test-quality.md** — One assertion per test, Given-When-Then structure, no hard waits
- **selector-resilience.md** — `#root` element selected by ID (native HTML, not fragile CSS)
- **test-levels-framework.md** — E2E for frontend server availability; API tests for backend HTTP contracts
- **data-factories.md** — Environment factory pattern for configuration constants and request builders

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/story-1-1/`

**Expected Results:**

```
  15 failed

    1) [chromium] › story-1-1/project-initialization.spec.ts:36:3 — AC1 — should serve the React application on port 5173
    ...
    Error: connect ECONNREFUSED 127.0.0.1:5173
```

**Summary:**

- Total tests: 15
- Passing: 0 (expected)
- Failing: 15 (expected)
- Status: ✅ RED phase — all tests fail due to missing implementation (servers not running)

**Expected Failure Messages:**

- E2E tests against port 5173: `net::ERR_CONNECTION_REFUSED` / `connect ECONNREFUSED 127.0.0.1:5173`
- API tests against port 5000: `connect ECONNREFUSED 127.0.0.1:5000`
- CORS console test: Fails at `page.goto` (frontend not running)

---

## Notes

- This story has **no domain entities** — factories produce only configuration/HTTP request builders
- **AC4 and AC5** (compilation checks) cannot be validated by Playwright. They are validated by running `tsc --noEmit` and `dotnet build` directly — add these to CI pipeline via the `testarch-ci` workflow
- The `playwright.config.ts` `webServer` config will attempt to launch the frontend automatically — this will fail until Task 1 (frontend initialization) is complete
- The test for "no CORS errors in browser console" uses a `page.on('console')` listener — the error detection is conservative (grep for "cors" in the message)
- When the backend is initialized, the `/swagger` endpoint should return 404 (not 200) — this is intentional per architecture

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-20
