# ATDD Checklist — Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-20
**Author:** SiesaTeam
**Primary Test Level:** API (Integration via Playwright APIRequestContext) + E2E

---

## Story Summary

Story 1.1 establishes the full-stack development scaffold: a Vite React-TS frontend and a .NET 10 Clean Architecture backend, both initialized with required dependencies and running locally.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC 1** — Given a clean development machine with Node.js installed, When the developer runs the frontend initialization commands, Then `npm run dev` starts the Vite server on port 5173 with no errors and the app compiles with TypeScript strict mode enabled.
2. **AC 2** — Given the backend project has been created, When the developer runs `dotnet run` in `SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`.
3. **AC 3** — Given the backend solution has been created, When the developer inspects the `.sln` file, Then the four Clean Architecture projects (`SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`) are all referenced and build without errors (`dotnet build` exits 0).
4. **AC 4** — Given both projects are running, When the frontend makes any HTTP request to the backend, Then CORS allows requests from `localhost:5173` without errors.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- RED **Test:** E2E-INIT-01 — Frontend Vite carga en localhost:5173 sin errores
  - **Status:** RED — fails until the frontend Vite project is initialized and `npm run dev` starts
  - **Verifies:** AC 1 — frontend reachable at port 5173, no console compilation errors, `#root` element attached

- RED **Test:** E2E-INIT-02 — Frontend puede comunicarse con backend sin error CORS
  - **Status:** RED — fails until both frontend and backend are running and CORS is configured
  - **Verifies:** AC 4 — `fetch()` from browser origin `localhost:5173` to `localhost:5000` completes without CORS block

- RED **Test:** E2E-INIT-03 — App React tiene estructura HTML válida y título definido
  - **Status:** RED — fails until the React app is initialized and renders something into `#root`
  - **Verifies:** AC 1 — React hydration point present, page title defined, at least one child rendered

- RED **Test:** E2E-INIT-04 — Servidor Vite responde en puerto 5173 (TypeScript compiló correctamente)
  - **Status:** RED — fails until Vite dev server starts (TypeScript strict mode errors would prevent startup)
  - **Verifies:** AC 1 — HTTP response from port 5173 with status < 400 (proxy for TypeScript strict mode compile pass)

### API Tests (5 tests)

**File:** `e2e/tests/foundation/backend-health.spec.ts`

- RED **Test:** API-F-01 — GET /scalar retorna HTTP 200
  - **Status:** RED — fails until `dotnet run` starts the backend with Scalar registered via `app.MapScalarApiReference()`
  - **Verifies:** AC 2 — Scalar API documentation page loads at `/scalar` with HTTP 200

- RED **Test:** API-F-02 — Preflight OPTIONS incluye cabecera CORS correcta
  - **Status:** RED — fails until CORS policy is registered in `Program.cs` with `WithOrigins("http://localhost:5173")`
  - **Verifies:** AC 4 — `Access-Control-Allow-Origin: http://localhost:5173` header present on OPTIONS preflight

- RED **Test:** API-F-03 — Ruta inexistente devuelve Problem Details sin stackTrace
  - **Status:** RED — fails until Problem Details middleware is registered (Story 1.3 scope, included here as pre-condition smoke)
  - **Verifies:** NFR6 — response uses `application/problem+json`, has `status` + `title`, no `stackTrace`/`exception` fields

**File:** `e2e/tests/foundation/solution-structure.spec.ts`

- RED **Test:** API-S-01 — Backend arranca con los 4 proyectos Clean Architecture ensamblados
  - **Status:** RED — fails until all 4 projects are added to the .sln, referenced correctly, and the DI wiring in `Program.cs` starts successfully
  - **Verifies:** AC 3 — OpenAPI spec available at `/openapi/v1.json`, confirming all 4 layers built and DI is wired

- RED **Test:** API-S-02 — Servidor .NET responde en puerto 5000 (dotnet build salió en 0)
  - **Status:** RED — fails until the backend solution compiles and starts on port 5000
  - **Verifies:** AC 3 — any HTTP response from port 5000 proves the solution compiled (`dotnet build` exit 0)

---

## Data Factories Created

No domain data factories are needed for Story 1.1. This story creates only the scaffolding — no domain entities, no API endpoints with business data. The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` for future stories.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts` (existing — reused)

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page positioned at `/clientes`
  - **Cleanup:** None (navigation state only)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page positioned at `/contactos`
  - **Cleanup:** None (navigation state only)

Story 1.1 tests use `@playwright/test` directly (no custom fixtures needed) since they only verify server availability and CORS, not page navigation state.

---

## Mock Requirements

No external service mocks are needed for Story 1.1. Tests target real running servers:

- **Frontend**: Playwright `webServer` config in `playwright.config.ts` starts `pnpm --filter frontend dev`
- **Backend**: Must be started separately via `dotnet run` in `backend/src/SiesaAgents.API/` before running API tests

**Backend startup requirement for DEV team:**
```bash
# Start backend before running API tests (API-F-01, API-F-02, API-F-03, API-S-01, API-S-02)
cd backend
dotnet run --project src/SiesaAgents.API
# Verify: curl http://localhost:5000/scalar → HTTP 200
```

---

## Required data-testid Attributes

Story 1.1 creates scaffolding only — no UI components with interactive elements. The following `data-testid` attributes are required by E2E tests that verify the React app renders:

### Root App Shell (index.html / main.tsx)

- `#root` — (standard Vite React template `id`, not a `data-testid`) — React mounting point
  - Already defined by Vite template: `<div id="root"></div>` in `index.html`
  - Tests use `page.locator('#root')` — no custom `data-testid` needed here

No additional `data-testid` attributes are required for Story 1.1 tests. They verify structural/network behavior only.

---

## Implementation Checklist

### Test: E2E-INIT-01 — Frontend Vite carga en localhost:5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `npm create vite@latest frontend -- --template react-ts` in project root
- [ ] Verify `index.html` contains `<div id="root"></div>`
- [ ] Enable TypeScript strict mode: `"strict": true` in `frontend/tsconfig.app.json`
- [ ] Verify `npm run dev` (or `pnpm --filter frontend dev`) starts without TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "E2E-INIT-01"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: E2E-INIT-02 — Frontend puede comunicarse con backend sin error CORS

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Initialize the .NET backend (Task 2 in story)
- [ ] Add CORS policy in `Program.cs`: `policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Apply CORS middleware: `app.UseCors()` before routing
- [ ] Configure backend on port 5000 via `launchSettings.json`
- [ ] Verify: `fetch("http://localhost:5000/scalar")` from browser at `localhost:5173` returns without CORS error
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "E2E-INIT-02"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: E2E-INIT-03 — App React tiene estructura HTML válida y título definido

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Frontend Vite project initialized (same as E2E-INIT-01)
- [ ] `index.html` has a `<title>` tag with non-empty content
- [ ] `main.tsx` renders at least one element inside `#root` (Vite default `<App />` is sufficient)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "E2E-INIT-03"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours (covered by Task 1)

---

### Test: E2E-INIT-04 — Servidor Vite responde en puerto 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `vite.config.ts` with `server: { port: 5173 }`
- [ ] Verify `npm run dev` binds to 5173 (not 5174 or random port)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "E2E-INIT-04"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: API-F-01 — GET /scalar retorna HTTP 200

**File:** `e2e/tests/foundation/backend-health.spec.ts`

**Tasks to make this test pass:**

- [ ] Add Scalar package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Register in `Program.cs`: `builder.Services.AddOpenApi()` and `app.MapOpenApi()`
- [ ] Register: `app.MapScalarApiReference()` (NEVER `app.UseSwagger()`)
- [ ] Wrap in `if (app.Environment.IsDevelopment())` block
- [ ] Start backend: `dotnet run --project src/SiesaAgents.API`
- [ ] Run test: `npx playwright test e2e/tests/foundation/backend-health.spec.ts --grep "API-F-01"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: API-F-02 — Preflight OPTIONS incluye cabecera CORS correcta

**File:** `e2e/tests/foundation/backend-health.spec.ts`

**Tasks to make this test pass:**

- [ ] CORS policy registered (same as E2E-INIT-02 tasks)
- [ ] Verify CORS middleware order: `app.UseCors()` after `app.UseHttpsRedirection()`
- [ ] Confirm `Access-Control-Allow-Origin: http://localhost:5173` is returned on OPTIONS
- [ ] Run test: `npx playwright test e2e/tests/foundation/backend-health.spec.ts --grep "API-F-02"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: API-F-03 — Ruta inexistente devuelve Problem Details sin stackTrace

**File:** `e2e/tests/foundation/backend-health.spec.ts`

**Note:** This test covers Story 1.3 functionality (Problem Details middleware). It is included here as a pre-condition smoke check.

**Tasks to make this test pass:**

- [ ] Register Problem Details middleware (Story 1.3 Task)
- [ ] Ensure Content-Type `application/problem+json` on error responses
- [ ] Ensure no `stackTrace`, `exception`, or `traceId` in response body in non-Development mode
- [ ] Run test: `npx playwright test e2e/tests/foundation/backend-health.spec.ts --grep "API-F-03"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour (Story 1.3 scope)

---

### Test: API-S-01 — Backend arranca con los 4 proyectos Clean Architecture ensamblados

**File:** `e2e/tests/foundation/solution-structure.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all 4 projects to `SiesaAgents.sln` via `dotnet sln add`
- [ ] Add project references: API → Application + Infrastructure; Application → Domain; Infrastructure → Domain + Application
- [ ] Verify `dotnet build` exits 0 (zero errors)
- [ ] Register `builder.Services.AddOpenApi()` so `/openapi/v1.json` is served in Development
- [ ] Run test: `npx playwright test e2e/tests/foundation/solution-structure.spec.ts --grep "API-S-01"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: API-S-02 — Servidor .NET responde en puerto 5000 (dotnet build salió en 0)

**File:** `e2e/tests/foundation/solution-structure.spec.ts`

**Tasks to make this test pass:**

- [ ] Solution compiles (covered by API-S-01 tasks above)
- [ ] Configure `Properties/launchSettings.json` with `applicationUrl: "http://localhost:5000"`
- [ ] Run `dotnet run --project src/SiesaAgents.API` — must bind port 5000
- [ ] Run test: `npx playwright test e2e/tests/foundation/solution-structure.spec.ts --grep "API-S-02"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/

# Run specific spec files
npx playwright test e2e/tests/foundation/project-initialization.spec.ts
npx playwright test e2e/tests/foundation/backend-health.spec.ts
npx playwright test e2e/tests/foundation/solution-structure.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/backend-health.spec.ts --debug

# Run only API tests (no browser launch)
npx playwright test e2e/tests/foundation/backend-health.spec.ts e2e/tests/foundation/solution-structure.spec.ts

# Run with specific reporter
npx playwright test e2e/tests/foundation/ --reporter=list
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (9 tests across 3 files)
- No custom fixtures required beyond existing `base.fixture.ts`
- No data factories required (scaffolding story, no domain data)
- Mock requirements documented (none — real servers required)
- Required `data-testid` attributes documented (`#root` — standard Vite template)
- Implementation checklist created

**Verification:**

- All tests fail because neither frontend nor backend are initialized
- E2E tests fail: `net::ERR_CONNECTION_REFUSED` on port 5173 (no frontend)
- API tests fail: `net::ERR_CONNECTION_REFUSED` on port 5000 (no backend)
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with API-S-02 / API-S-01 — backend foundation)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended implementation order:**

1. **API-S-02** → Initialize backend solution on port 5000 (confirms `dotnet build` works)
2. **API-S-01** → Add all 4 projects to `.sln`, add OpenAPI registration
3. **API-F-01** → Add Scalar package and register `app.MapScalarApiReference()`
4. **API-F-02** → Configure CORS policy with `localhost:5173`
5. **E2E-INIT-01** → Initialize Vite frontend with TypeScript strict mode
6. **E2E-INIT-04** → Configure port 5173 in `vite.config.ts`
7. **E2E-INIT-03** → Confirm React renders into `#root` with title
8. **E2E-INIT-02** → Verify CORS works end-to-end from browser
9. **API-F-03** → Add Problem Details middleware (Story 1.3 dependency)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 9 tests pass
2. Review `Program.cs` for clean DI registration order
3. Ensure `vite.config.ts` plugin order is correct: `TanStackRouterVite()`, `react()`, `tailwindcss()`
4. Verify TypeScript strict mode settings are complete in `tsconfig.app.json`
5. Confirm no `app.UseSwagger()` calls exist (company standard violation)
6. Tests still pass after any cleanup

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/`
3. Implement one test at a time using implementation checklist as guide
4. Recommended starting point: Task 2 (backend solution) → API-S-01, API-S-02
5. When all tests pass, refactor and update story status to `done`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Pure function fixture pattern (reused existing `base.fixture.ts`)
- **network-first.md** — Route interception before navigation (applied in E2E-INIT-01 and E2E-INIT-02 console listeners)
- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic waits
- **selector-resilience.md** — `#root` id selector over CSS class selectors; `data-testid` documented for future stories
- **test-levels-framework.md** — API tests for AC 2, 3, 4 (infrastructure behavior); E2E for AC 1 (user-facing frontend)

---

## Test Execution Evidence

### Expected RED Phase Failures

**When neither frontend nor backend are initialized:**

```
e2e/tests/foundation/project-initialization.spec.ts
  ✗ E2E-INIT-01 — Frontend Vite carga en localhost:5173 sin errores
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

  ✗ E2E-INIT-02 — Frontend puede comunicarse con backend sin error CORS
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

  ✗ E2E-INIT-03 — App React tiene estructura HTML válida y título definido
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

  ✗ E2E-INIT-04 — Servidor Vite responde en puerto 5173 (TypeScript compiló correctamente)
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5173/

e2e/tests/foundation/backend-health.spec.ts
  ✗ API-F-01 — GET /scalar retorna HTTP 200
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5000/scalar

  ✗ API-F-02 — Preflight OPTIONS incluye cabecera CORS correcta
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5000/api/v1/clientes

  ✗ API-F-03 — Ruta inexistente devuelve Problem Details sin stackTrace
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5000/api/v1/ruta-que-no-existe

e2e/tests/foundation/solution-structure.spec.ts
  ✗ API-S-01 — Backend arranca con los 4 proyectos Clean Architecture ensamblados
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5000/openapi/v1.json

  ✗ API-S-02 — Servidor .NET responde en puerto 5000 (dotnet build salió en 0)
    Error: net::ERR_CONNECTION_REFUSED http://localhost:5000/
```

**Summary:**

- Total tests: 9
- Passing: 0 (expected)
- Failing: 9 (expected)
- Status: RED phase — all tests fail due to missing implementation

---

## Notes

- Story 1.1 creates scaffolding only — no domain entities, no EF Core migrations, no API endpoints beyond Scalar and health checks.
- `API-F-03` (Problem Details) is technically Story 1.3 scope but is included in `backend-health.spec.ts` as a pre-condition smoke for the backend error handling foundation.
- Build smoke checks (`dotnet build` exits 0, `pnpm --filter frontend build` exits 0) are not Playwright tests — they should be run as a pre-flight gate in CI before launching Playwright. See `BUILD-F-01` and `BUILD-F-02` in `test-design-epic-1.md`.
- The `playwright.config.ts` `webServer` block uses `pnpm --filter frontend dev` — ensure the frontend project is initialized as `frontend/` under the monorepo root with pnpm workspaces configured.
- AC 3 is validated indirectly at the API level: if the .NET backend starts and serves `/openapi/v1.json`, it proves all 4 layers compiled and DI is wired correctly.

---

**Generated by BMad TEA Agent** — 2026-05-20
