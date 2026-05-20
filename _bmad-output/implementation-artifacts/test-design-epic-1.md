---
epic: 1
title: "Project Foundation & Application Shell"
phase: 4
mode: epic-level
date: 2026-05-20
stories:
  - "1.1: Project Initialization & Repository Structure"
  - "1.2: Frontend Navigation Shell"
  - "1.3: Backend Database Foundation"
status: complete
---

# Test Design — Epic 1: Project Foundation & Application Shell

## 1. Epic Overview

Epic 1 establishes the runnable skeleton of Siesa Agents CRM. It covers three stories:

| Story | Scope |
|---|---|
| 1.1 | Vite + React frontend initialized; .NET 10 Clean Architecture backend initialized; CORS configured |
| 1.2 | NavigationRail (desktop) + NavigationBar (mobile) from siesa-ui-kit; SPA routing via TanStack Router; 404 handling |
| 1.3 | PostgreSQL connection; EF Core DbContext + ApplySnakeCaseNaming(); initial empty migration; Problem Details middleware |

**Acceptance Criteria (epic-level, from epic-01-foundation.md):**

| AC | Description |
|---|---|
| AC-E1.1 | App loads and shows accessible navigation structure on desktop and mobile browser |
| AC-E1.2 | User can navigate between Clientes and Contactos without full page reloads |
| AC-E1.3 | Direct URL access to `/clientes` and `/contactos` renders the correct views (deep linking) |

**FRs covered:** FR28, FR29, FR30
**NFRs relevant:** NFR4 (HTTPS non-local), NFR6 (no stack traces — Problem Details RFC 7807), NFR11 (no hardcoded limits — UUID PKs, snake_case schema)

---

## 2. Risk Assessment

### Risk Matrix

| ID | Risk | Probability | Impact | Priority | Mitigation |
|---|---|---|---|---|---|
| R1 | NavigationRail/NavigationBar siesa-ui-kit components not rendered correctly (wrong breakpoint, wrong component variant) | High | High | P0 | Explicit viewport-based assertions in E2E for both desktop and mobile; verify siesa-ui-kit version in package.json |
| R2 | TanStack Router deep linking returns blank screen or redirects to home on direct URL access | High | High | P0 | Direct navigation tests to `/clientes` and `/contactos` as isolated test cases |
| R3 | CORS misconfiguration blocks frontend → backend communication | Medium | High | P0 | API health check test via Playwright APIRequestContext from browser origin |
| R4 | EF Core migration fails or ApplySnakeCaseNaming() not applied, causing column name mismatches | Medium | High | P1 | Backend integration test verifying DB connection and snake_case column resolution |
| R5 | Problem Details middleware not intercepting unhandled exceptions (stack traces exposed) | Low | High | P1 | Unit test for ExceptionHandlingMiddleware; API integration test with forced error path |
| R6 | Mobile viewport rendering — NavigationRail shown on mobile instead of NavigationBar | Medium | Medium | P1 | Playwright mobile-chrome project (Pixel 5) explicit component visibility assertions |
| R7 | Frontend TypeScript strict mode compile errors — project not buildable | Low | High | P1 | Build smoke test (npm run build exits 0) as pre-test gate |
| R8 | SPA navigation causes full page reload — FR28 violated | Low | High | P1 | Playwright navigation event listener (no 'load' event during in-app routing) |
| R9 | Backend Scalar documentation page not reachable (misconfigured DI) | Low | Low | P3 | Simple HTTP check to `/scalar` endpoint |

**Top 3 critical risk areas:**
1. Navigation shell rendering correctness across breakpoints (R1, R6) — foundation for all future UI testing
2. TanStack Router deep linking and SPA-mode navigation (R2, R8) — AC-E1.2 and AC-E1.3 depend entirely on this
3. CORS + backend foundation (R3, R4) — any misconfig blocks all subsequent epics from day one

---

## 3. Test Strategy by Level

### Level Distribution

| Level | Tool | Volume | Focus |
|---|---|---|---|
| E2E (UI) | Playwright | 8 tests | Navigation shell, deep linking, responsive layout, SPA routing |
| API / Integration | Playwright APIRequestContext + .NET integration test | 5 tests | Backend health, CORS, Problem Details, database connection |
| Component / Unit | Vitest + RTL (frontend), xUnit (backend) | 6 tests | Route configuration, ExceptionHandlingMiddleware, DB context |
| Smoke / Build | CLI (npm run build, dotnet build) | 2 checks | TypeScript strict compile, .NET solution build |

**Total: 21 test cases**

### Playwright Projects Applicable

| Project | Rationale |
|---|---|
| chromium (Desktop Chrome) | Primary browser — all E2E tests |
| mobile-chrome (Pixel 5) | Mobile layout verification — R1, R6 |
| firefox | Secondary coverage for navigation tests |
| edge | Tertiary coverage — smoke only |

---

## 4. Test Cases

### 4.1 E2E Tests (Playwright)

#### File: `e2e/tests/foundation/navigation-shell.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-F-01 | P0 | 1.2 | AC-E1.1 | Desktop: NavigationRail is visible on left side with Clientes and Contactos entries |
| E2E-F-02 | P0 | 1.2 | AC-E1.2 | Desktop: Clicking "Clientes" navigates to `/clientes` without full page reload |
| E2E-F-03 | P0 | 1.2 | AC-E1.2 | Desktop: Clicking "Contactos" navigates to `/contactos` without full page reload |
| E2E-F-04 | P0 | 1.2 | AC-E1.3 | Deep link: Direct URL `/clientes` renders Clientes view (not redirect) |
| E2E-F-05 | P0 | 1.2 | AC-E1.3 | Deep link: Direct URL `/contactos` renders Contactos view (not redirect) |
| E2E-F-06 | P1 | 1.2 | AC-E1.1 | Mobile (Pixel 5): NavigationBar is visible (not NavigationRail) |
| E2E-F-07 | P1 | 1.2 | AC-E1.1 | Mobile (Pixel 5): Navigation items Clientes and Contactos are tappable |
| E2E-F-08 | P2 | 1.2 | — | Unknown route displays 404 / not-found view gracefully |

**Implementation notes:**
- E2E-F-02 and E2E-F-03: Use `page.on('load', ...)` listener to assert no full-page reload occurs during in-app navigation.
- E2E-F-04 and E2E-F-05: Use `page.goto('/clientes')` directly (no prior app state). Assert route-specific heading or page container is visible.
- E2E-F-06: Run under `{ use: { ...devices['Pixel 5'] } }` project or set viewport in test.

**Fixture usage:** Use `base.fixture.ts` for navigation. No API data setup needed for Epic 1 shell tests.

---

### 4.2 API / Integration Tests

#### Backend Health & CORS (Playwright APIRequestContext)
##### File: `e2e/tests/foundation/backend-health.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| API-F-01 | P0 | 1.1 | — | Backend health: GET `http://localhost:5000/scalar` returns 200 |
| API-F-02 | P0 | 1.1 | — | CORS: Preflight OPTIONS to `/api/v1/clientes` from origin `http://localhost:5173` returns CORS headers |
| API-F-03 | P1 | 1.3 | — | Problem Details: Hitting non-existent route returns JSON with `status`, `title` fields (no stack trace) |

**Implementation notes:**
- API-F-02: Use `request.fetch` with method `OPTIONS` and `Origin: http://localhost:5173` header. Assert `Access-Control-Allow-Origin` in response headers.
- API-F-03: Assert response Content-Type is `application/problem+json`. Assert body has no `stackTrace` or `exception` key.

#### Backend Database Integration (xUnit)
##### File: `backend/tests/SiesaAgents.IntegrationTests/DatabaseFoundationTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| INT-F-01 | P1 | 1.3 | AppDbContext can connect to `siesa_agents_db` and `CanConnectAsync()` returns true |
| INT-F-02 | P1 | 1.3 | Initial migration applied: `__EFMigrationsHistory` table exists and has one entry |

**Notes:** These tests require a running PostgreSQL instance (local dev or testcontainers). Use `WebApplicationFactory` or direct `AppDbContext` with test connection string.

---

### 4.3 Component / Unit Tests

#### Frontend Unit Tests (Vitest)
##### File: `frontend/src/routes/__tests__/routing.test.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-F-01 | P1 | 1.2 | TanStack Router: route `/clientes` is registered in the route tree |
| UNIT-F-02 | P1 | 1.2 | TanStack Router: route `/contactos` is registered in the route tree |
| UNIT-F-03 | P2 | 1.2 | Root layout renders NavigationRail component (desktop viewport) |

#### Backend Unit Tests (xUnit)
##### File: `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-F-04 | P1 | 1.3 | ExceptionHandlingMiddleware: unhandled exception returns Problem Details RFC 7807 (status + title + detail) |
| UNIT-F-05 | P1 | 1.3 | ExceptionHandlingMiddleware: response does not contain `stackTrace` or exception type in body |
| UNIT-F-06 | P2 | 1.3 | AppDbContext.OnModelCreating: ApplySnakeCaseNaming is called (verified by checking `__EFMigrationsHistory` naming) |

---

### 4.4 Build Smoke Checks

| Check ID | Priority | Story | Command | Expected |
|---|---|---|---|---|
| BUILD-F-01 | P0 | 1.1 | `pnpm --filter frontend build` | Exit code 0, no TypeScript strict errors |
| BUILD-F-02 | P0 | 1.1 | `dotnet build SiesaAgents.sln` | Exit code 0, zero errors |

**These must pass before any other tests run. Treat as pre-flight gate.**

---

## 5. Test Execution Order & Priority

### P0 — Blocking (must pass before any Epic 2 work)

1. BUILD-F-01 — Frontend compiles without errors
2. BUILD-F-02 — Backend compiles without errors
3. E2E-F-01 — NavigationRail visible desktop
4. E2E-F-02 — SPA navigation Clientes (no full reload)
5. E2E-F-03 — SPA navigation Contactos (no full reload)
6. E2E-F-04 — Deep link `/clientes`
7. E2E-F-05 — Deep link `/contactos`
8. API-F-01 — Backend health (Scalar loads)
9. API-F-02 — CORS configured correctly

### P1 — High (should pass before Epic 2 stories begin)

- E2E-F-06, E2E-F-07 — Mobile navigation
- API-F-03 — Problem Details (no stack trace)
- INT-F-01, INT-F-02 — Database connected and migrated
- UNIT-F-04, UNIT-F-05 — Exception middleware correct
- BUILD-F-01, BUILD-F-02 already covered under P0

### P2 — Medium (complete within sprint)

- E2E-F-08 — 404 route
- UNIT-F-01, UNIT-F-02, UNIT-F-03 — Route registration and root layout
- UNIT-F-06 — Snake case naming

### P3 — Low (nice to have)

- API-F-01 with Scalar page rendering assertion (visual check beyond HTTP 200)
- Cross-browser smoke (firefox, edge) for E2E-F-04 and E2E-F-05

---

## 6. Test File Structure

```
e2e/
  tests/
    foundation/
      navigation-shell.spec.ts      # E2E-F-01 through E2E-F-08
      backend-health.spec.ts        # API-F-01, API-F-02, API-F-03
  pages/
    navigation.page.ts              # New: NavigationShellPage POM
  fixtures/
    base.fixture.ts                 # Existing — reuse as-is

frontend/src/routes/__tests__/
  routing.test.ts                   # UNIT-F-01, UNIT-F-02, UNIT-F-03

backend/tests/
  SiesaAgents.UnitTests/
    Middleware/
      ExceptionHandlingMiddlewareTests.cs   # UNIT-F-04, UNIT-F-05
    Infrastructure/
      AppDbContextTests.cs                  # UNIT-F-06
  SiesaAgents.IntegrationTests/
    DatabaseFoundationTests.cs             # INT-F-01, INT-F-02
```

---

## 7. Page Object — NavigationShellPage (to create)

```typescript
// e2e/pages/navigation.page.ts
export class NavigationShellPage {
  readonly navigationRail: Locator;   // siesa-ui-kit NavigationRail root
  readonly navigationBar: Locator;    // siesa-ui-kit NavigationBar root (mobile)
  readonly clientesLink: Locator;
  readonly contactosLink: Locator;

  constructor(private readonly page: Page) {
    this.navigationRail   = page.getByRole('navigation', { name: /rail/i });
    this.navigationBar    = page.getByRole('navigation', { name: /bar/i });
    this.clientesLink     = page.getByRole('link', { name: /clientes/i });
    this.contactosLink    = page.getByRole('link', { name: /contactos/i });
  }

  async goto() {
    await this.page.goto('/');
  }
}
```

**Note:** Locator selectors should be adjusted to match actual siesa-ui-kit rendered HTML. ARIA roles are assumed — validate against component catalog.

---

## 8. Coverage Matrix — Epic 1

| Requirement | Test IDs | Level | Status |
|---|---|---|---|
| AC-E1.1 (accessible navigation desktop + mobile) | E2E-F-01, E2E-F-06, E2E-F-07 | E2E | Designed |
| AC-E1.2 (navigate without full reload) | E2E-F-02, E2E-F-03 | E2E | Designed |
| AC-E1.3 (deep linking /clientes, /contactos) | E2E-F-04, E2E-F-05 | E2E | Designed |
| FR28 (SPA routing, no reload) | E2E-F-02, E2E-F-03 | E2E | Designed |
| FR29 (mobile access) | E2E-F-06, E2E-F-07 | E2E | Designed |
| FR30 (deep linking) | E2E-F-04, E2E-F-05 | E2E | Designed |
| NFR6 (no stack traces) | API-F-03, UNIT-F-04, UNIT-F-05 | API + Unit | Designed |
| Story 1.1 (frontend compiles, TS strict) | BUILD-F-01 | Smoke | Designed |
| Story 1.1 (backend compiles, 4 projects) | BUILD-F-02 | Smoke | Designed |
| Story 1.1 (CORS configured) | API-F-02 | API | Designed |
| Story 1.3 (DB connected + migrated) | INT-F-01, INT-F-02 | Integration | Designed |
| Story 1.3 (snake_case naming) | UNIT-F-06 | Unit | Designed |
| Story 1.3 (Scalar docs) | API-F-01 | API | Designed |
| Story 1.2 (routes registered) | UNIT-F-01, UNIT-F-02 | Unit | Designed |
| Story 1.2 (404 handling) | E2E-F-08 | E2E | Designed |

**Coverage: 15/15 requirements addressed — 100%**

---

## 9. Definition of Done (Epic 1 Testing)

- [ ] All P0 tests pass (10 test cases / build checks)
- [ ] All P1 tests pass (9 additional test cases)
- [ ] NavigationShellPage POM created in `e2e/pages/navigation.page.ts`
- [ ] `e2e/tests/foundation/` directory and spec files created
- [ ] Backend unit tests for ExceptionHandlingMiddleware created and passing
- [ ] Integration test confirms `siesa_agents_db` accessible and migration applied
- [ ] No Playwright test uses English UI text assertions — all label matchers use Spanish (`/clientes/i`, `/contactos/i`)
- [ ] Mobile test runs confirmed on `mobile-chrome` project (Pixel 5)
