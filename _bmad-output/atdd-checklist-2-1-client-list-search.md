# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-02
**Author:** SiesaTeam (TEA agent)
**Primary Test Level:** Component (Vitest + RTL + MSW) — with supporting API integration (xUnit) and E2E (Playwright) coverage

---

## Story Summary

Story 2.1 introduces the `/clientes` split-panel route: a 280 px left list with a real-time client-side search filter (Nombre OR NIT, case- and diacritic-insensitive) and a right-side detail placeholder. The story is full-stack: a new backend `GET /api/v1/clientes` Minimal API endpoint, a `ClienteEntity` + EF Core mapping + `AddClientesTable` migration, a TanStack Query hook (`useClientes`) wired to the canonical `['clientes']` queryKey, and three new shared UI components (`EmptyState`, `ErrorPanel`, `ClientListItem`).

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for without leaving the `/clientes` view

---

## Acceptance Criteria

1. **AC-2.1.a** — Split-panel layout (280 px left list at lg viewport) with title, search input, scrollable list, and right placeholder.
2. **AC-2.1.b** — Real-time dual search (Nombre OR NIT), case- and diacritic-insensitive, p95 < 200 ms @ 500 records, NO additional fetches during typing.
3. **AC-2.1.c** — `EmptyState` (NEW shared) rendered when `GET /api/v1/clientes` returns `[]`.
4. **AC-2.1.d** — `ErrorPanel` (NEW shared) with `Reintentar` on fetch failure; NFR6 forbids leaking `error.message` / Problem Details `detail` / stack traces.
5. **AC-2.1.e** — Backend `GET /api/v1/clientes` returns `Cliente[]` (camelCase, ISO-8601, snake_case columns).
6. **AC-2.1.f** — `ClienteEntity` + EF Core configuration + `AddClientesTable` migration with `uk_clientes_nit` unique index.
7. **AC-2.1.g** — TanStack Query hook + Axios repository wired to canonical `['clientes']` queryKey.
8. **AC-2.1.h** — Presentation composition: `ClienteListView` orchestrates loading/error/empty/list states; `ClientListItem` shared component.
9. **AC-2.1.i** — WCAG 2.1 AA accessibility (keyboard reach, Spanish aria-labels, focus rings) + responsive (full-width on `< lg`).
10. **AC-2.1.j** — All required P0/P1 tests pass.

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

- **Test:** AC-2.1.a — list panel renders 280 px wide on lg viewport
  - **Status:** RED — `data-testid="empty-state"` / aside `aria-label="Lista de clientes"` not yet rendered (route still shows `ClientesPlaceholderView`).
- **Test:** AC-2.1.a — detail placeholder appears on lg viewport
  - **Status:** RED — `data-testid="cliente-detail-placeholder"` does not exist yet.
- **Test:** AC-2.1.c — EmptyState renders when API returns `[]`
  - **Status:** RED — EmptyState component not yet created.
- **Test:** AC-2.1.d — ErrorPanel renders on 500 + NFR6 leak guard
  - **Status:** RED — ErrorPanel not yet created.
- **Test:** AC-2.1.b — typing does NOT fire additional API requests
  - **Status:** RED — search input not yet rendered.
- **Test:** AC-2.1.i — search input keyboard-reachable + Spanish aria-label
  - **Status:** RED — searchbox not yet rendered.

### API Tests (4 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

- **Test:** `GetClientes_ReturnsOk` → 200 OK on `/api/v1/clientes`
  - **Status:** RED — route not mounted (currently returns 404).
- **Test:** `GetClientes_ContentTypeIsJson` → `application/json`
  - **Status:** RED — route does not exist.
- **Test:** `GetClientes_ReturnsJsonArray_WhenEmpty` → body is `[]`
  - **Status:** RED — route does not exist.
- **Test:** `GetClientes_DoesNotExpose_SwaggerOrUnrelatedRoutes` → `?q=` silently ignored
  - **Status:** RED — route does not exist.

### Component Tests (45 tests)

**File:** `frontend/src/modules/crm/clientes/application/filterClientes.test.ts` (6 tests — unit/pure)

- Returns full list on empty/whitespace query
- Case-insensitive nombre match (`ACM` → Acme)
- Case-insensitive NIT match (`900` → Acme)
- Diacritic-insensitive match (`jose` → José Pérez)
- Empty array when no match
- **Status:** RED — module `./filterClientes` does not yet exist.

**File:** `frontend/src/shared/components/EmptyState.test.tsx` (8 tests)

- Default `data-testid="empty-state"`
- `role="status"` + `aria-live="polite"`
- Renders title / description
- CTA rendered iff `ctaLabel` provided; `onCtaClick` fires once
- Custom `data-testid` override
- **Status:** RED — module `./EmptyState` does not yet exist.

**File:** `frontend/src/shared/components/ErrorPanel.test.tsx` (10 tests)

- Default `data-testid="error-panel"`
- `role="alert"` + `aria-live="assertive"`
- Default Spanish copy (title + description)
- "Reintentar" CTA fires `onRetry`
- `isRetrying=true` → disabled + "Reintentando..."
- **NFR6** — never renders any sensitive backend string
- Custom title/description/data-testid overrides
- **Status:** RED — module `./ErrorPanel` does not yet exist.

**File:** `frontend/src/shared/components/ClientListItem.test.tsx` (8 tests)

- Renders nombre + nit as visible text
- Renders as `<button>` (keyboard-accessible)
- Spanish `aria-label="{nombre} — NIT {nit}"`
- `aria-current="true"` when selected, absent otherwise
- `onClick` fires exactly once
- Focus-visible ring tokens present
- **Status:** RED — module `./ClientListItem` does not yet exist.

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (10 tests)

- **TC-E2-P1-01** — panel root has `w-[280px]` + items show nombre + nit
- **TC-E2-P1-02** — dual search (Nombre, NIT, diacritic-insensitive)
- **TC-E2-P1-03** — EmptyState renders on `[]` response
- **TC-E2-P1-04** — ErrorPanel renders on 500; NFR6 no leak; Reintentar refetches
- **Status:** RED — module `./ClienteListView` does not yet exist.

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx` (1 test, 10 iterations)

- **TC-E2-P0-06** — p95 keystroke-render < 200 ms @ 500 records AND zero network requests during typing
- **Status:** RED — module `./ClienteListView` does not yet exist.

### Backend Unit Tests (17 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` (8 tests)

- `Create` assigns non-empty `Guid` Id, Nombre, Nit, Telefono, Ciudad
- `CreatedAt`/`UpdatedAt` close to `UtcNow` (DateTimeOffset, never DateTime)
- Public properties have NO public setters (private-setter + factory contract)
- **Status:** RED — `SiesaAgents.Domain.Clientes.Entities.ClienteEntity` does not yet exist.

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs` (9 tests)

- `ClienteEntity` is registered in `AppDbContext.Model`
- Table name is snake_case `clientes`
- `Nit` column has unique index named `uk_clientes_nit`
- `Nombre` required + maxLength 200
- `Nit` required + maxLength 50
- `Telefono` required + maxLength 50
- `Ciudad` required + maxLength 100
- `Id` column is snake_case `id`
- `CreatedAt` column is snake_case `created_at`
- **Status:** RED — `SiesaAgents.Infrastructure.Data.Configurations.ClienteConfiguration` does not yet exist + `AppDbContext.Clientes` DbSet missing.

---

## Data Factories Created

### Cliente Factory (deterministic — no faker dependency)

**File:** `frontend/src/modules/crm/clientes/application/__fixtures__/clientes.fixtures.ts`

**Exports:**

- `makeClientes(count: number, seed: number): Cliente[]` — Mulberry32 PRNG, same seed always returns the same array. Used by the perf test (TC-E2-P0-06) for the 500-record dataset.
- `THREE_CLIENTES: Cliente[]` — canonical 3-fixture dataset (Acme, Beta, José Pérez) covering Nombre/NIT search + diacritic case.

**Example Usage:**

```typescript
import { makeClientes, THREE_CLIENTES } from '@/modules/crm/clientes/application/__fixtures__/clientes.fixtures'

const fivehundred = makeClientes(500, 20260601) // deterministic
queryClient.setQueryData(['clientes'], THREE_CLIENTES) // happy-path
```

---

## Fixtures Created

### MSW Handlers

**File:** `frontend/src/test/handlers/clientes.handlers.ts`

- `clientesSuccessEmpty` — returns `200 + []` (EmptyState trigger)
- `clientesSuccessThree(data)` — returns `200 + data` (happy-path)
- `clientesError500` — returns `500 + application/problem+json` with a sensitive `detail` marker (NFR6 leak assertion bait)
- `clientesErrorThenSuccess(data)` — first call 500, subsequent calls succeed (Reintentar flow)

**Setup:** `frontend/src/test/setup.ts` was updated to start/stop a shared MSW `setupServer` per Vitest run. Per-test handlers are registered with `server.use(...)`.

### TanStack Query Helper

**File:** `frontend/src/test/utils/renderWithQuery.tsx`

- `renderWithQuery(ui, { queryClient? })` — wraps `ui` in a fresh `QueryClientProvider` with `retry: false`. Returns the standard RTL result plus the `queryClient` instance so tests can pre-warm the cache (`queryClient.setQueryData(['clientes'], fixtures)`).

### Backend WebApplicationFactory Pattern

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

- Overrides `AddDbContext<AppDbContext>` registration to use EF Core InMemory (`Microsoft.EntityFrameworkCore.InMemory` added to `SiesaAgents.IntegrationTests.csproj`). No Postgres / Docker required.

---

## Mock Requirements

### `GET /api/v1/clientes` (backend)

**Endpoint:** `GET /api/v1/clientes`

**Success Response (200 OK):**

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "nombre": "Acme S.A.",
    "nit": "900123456-1",
    "telefono": "+57 1 2223333",
    "ciudad": "Bogota",
    "createdAt": "2026-05-30T10:00:00.000Z",
    "updatedAt": "2026-05-30T10:00:00.000Z"
  }
]
```

**Empty Response (200 OK):**

```json
[]
```

**Failure Response (500 Internal Server Error):**

```json
{
  "type": "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "INTERNAL_DB_LEAK_SENSITIVE_STACK_TRACE",
  "instance": "/api/v1/clientes"
}
```

**Notes:**
- Body is a **direct JSON array** (NO wrapper object).
- Keys are **camelCase** (`createdAt`, NOT `created_at`).
- Search must NOT accept `?q=` query parameter (architecture mandates client-side filtering).
- On 500, the frontend **MUST** ignore the `detail` field (NFR6) — `ErrorPanel` shows canned Spanish copy only.

---

## Required `data-testid` Attributes

### `ClienteListView` (`src/modules/crm/clientes/presentation/ClienteListView.tsx`)

- `cliente-search-input` — search input field (`<Input type="search">` from siesa-ui-kit)

### Route `/clientes` (`src/routes/clientes.tsx`)

- `cliente-detail-placeholder` — the right-side detail placeholder section

### `EmptyState` (`src/shared/components/EmptyState.tsx`)

- `empty-state` (default; overridable via prop)

### `ErrorPanel` (`src/shared/components/ErrorPanel.tsx`)

- `error-panel` (default; overridable via prop)

### `ClientListItem` (`src/shared/components/ClientListItem.tsx`)

- (No explicit `data-testid` required — tests use `getByRole('button', { name: 'Acme S.A. — NIT 900123456-1' })` against the Spanish `aria-label`)

**Implementation Example:**

```tsx
<aside role="complementary" aria-label="Lista de clientes" className="w-full lg:w-[280px] ...">
  <Input
    type="search"
    placeholder="Buscar cliente por nombre o NIT/RUC..."
    aria-label="Buscar cliente"
    data-testid="cliente-search-input"
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
  />
  {/* ... */}
</aside>
<section data-testid="cliente-detail-placeholder" className="hidden lg:flex ...">
  Selecciona un cliente para ver el detalle
</section>
```

---

## Implementation Checklist

### Test: filterClientes (TC-E2-P1-02 unit)

**File:** `frontend/src/modules/crm/clientes/application/filterClientes.test.ts`

- [ ] Create `domain/Cliente.ts` (interface)
- [ ] Create `application/normalizeText.ts` (NFD + diacritic strip + `toLocaleLowerCase`)
- [ ] Create `application/filterClientes.ts` (pure function: trim, normalize, `.includes()` against `nombre + nit`)
- [ ] Run: `pnpm --filter frontend test filterClientes`
- [ ] ✅ Green

### Test: EmptyState component

**File:** `frontend/src/shared/components/EmptyState.test.tsx`

- [ ] Create `EmptyState.tsx` with props `{ icon, title, description?, ctaLabel?, onCtaClick?, 'data-testid'? }`
- [ ] Default `data-testid="empty-state"`, `role="status"`, `aria-live="polite"`
- [ ] Only render `<Button>` when `ctaLabel` is provided
- [ ] Run: `pnpm --filter frontend test EmptyState`
- [ ] ✅ Green

### Test: ErrorPanel component

**File:** `frontend/src/shared/components/ErrorPanel.test.tsx`

- [ ] Create `ErrorPanel.tsx` with props `{ title?, description?, onRetry, isRetrying?, 'data-testid'? }` — **NO `error` prop** (NFR6 structural guarantee)
- [ ] Default title: `No se pudo cargar la lista de clientes`
- [ ] Default description: `Verifica tu conexión e intenta de nuevo.`
- [ ] CTA label: `Reintentar` (or `Reintentando...` when `isRetrying`); button disabled while `isRetrying`
- [ ] `role="alert"`, `aria-live="assertive"`, default `data-testid="error-panel"`
- [ ] Run: `pnpm --filter frontend test ErrorPanel`
- [ ] ✅ Green

### Test: ClientListItem component

**File:** `frontend/src/shared/components/ClientListItem.test.tsx`

- [ ] Create `ClientListItem.tsx` with props `{ cliente, isSelected, onClick }`
- [ ] Render as `<button type="button">` with Spanish `aria-label="{nombre} — NIT {nit}"`
- [ ] Set `aria-current="true"` ONLY when `isSelected`
- [ ] Tailwind: `min-height: 56px`, hover bg, selected `bg-primary-50 border-l-2 border-l-primary-600`
- [ ] Include `focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none`
- [ ] Run: `pnpm --filter frontend test ClientListItem`
- [ ] ✅ Green

### Test: ClienteListView (TC-E2-P1-01/02/03/04)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Create `domain/IClienteRepository.ts`
- [ ] Create `infrastructure/clienteApiRepository.ts` (Axios `apiClient.get<Cliente[]>('/api/v1/clientes', { signal })`)
- [ ] Create `application/useClientes.ts` (`useQuery({ queryKey: ['clientes'] as const, queryFn })`)
- [ ] Create `presentation/ClienteListView.tsx` orchestrating loading / error / empty / list with `useMemo`-cached `filterClientes`
- [ ] Root `<aside role="complementary" aria-label="Lista de clientes" className="w-full lg:w-[280px] ...">`
- [ ] Search `<Input type="search" aria-label="Buscar cliente" data-testid="cliente-search-input">` from siesa-ui-kit
- [ ] Run: `pnpm --filter frontend test ClienteListView`
- [ ] ✅ Green

### Test: ClienteListView performance (TC-E2-P0-06 / NFR1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`

- [ ] `useMemo` over `(data, searchQuery)` so re-renders during typing do NOT re-compute when input hasn't changed
- [ ] DO NOT add `useEffect` that triggers `queryClient.invalidateQueries(['clientes'])` on every keystroke (would break the zero-network-during-typing contract)
- [ ] Verify with `pnpm --filter frontend test perf`
- [ ] ✅ Green (p95 < 200 ms, 0 MSW hits during typing)

### Test: Route wiring (AC-2.1.a/h)

- [ ] Replace `ClientesPlaceholderView` body in `src/routes/clientes.tsx` with `<ClienteListView ...>` + `<section data-testid="cliente-detail-placeholder" className="hidden lg:flex ...">`
- [ ] `const [searchQuery, setSearchQuery] = useState('')` in the route component
- [ ] Delete `ClientesPlaceholderView.tsx` and its `.test.tsx`
- [ ] Run: `pnpm --filter frontend test`
- [ ] ✅ Green (including the new E2E specs once `pnpm dev` + backend are up)

### Test: Backend domain entity (8 unit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` per AC-2.1.f
- [ ] Public static `Create(string nombre, string nit, string telefono, string ciudad)` factory
- [ ] `Guid Id { get; private set; } = Guid.NewGuid();`
- [ ] All timestamps are `DateTimeOffset` (NEVER `DateTime`)
- [ ] Run: `dotnet test backend/SiesaAgents.slnx --filter "FullyQualifiedName~ClienteEntityTests"`
- [ ] ✅ Green

### Test: Backend EF Core configuration (9 unit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs`

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` per AC-2.1.f
- [ ] `builder.ToTable("clientes")`, `HasKey(c => c.Id)`, `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")`
- [ ] Update `AppDbContext.cs`: add `DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();` AND call `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);` BEFORE `ApplySnakeCaseNaming()`
- [ ] Run: `dotnet test backend/SiesaAgents.slnx --filter "FullyQualifiedName~ClienteConfigurationTests"`
- [ ] ✅ Green

### Test: Backend API integration (4 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (`AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct)`)
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (Minimal API extension method)
- [ ] In `Program.cs`: register `IClienteRepository` + call `app.MapClienteEndpoints()`
- [ ] Create the `AddClientesTable` migration
- [ ] Run: `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"`
- [ ] ✅ Green

### Test: E2E Playwright suite (6 tests)

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

- [ ] All of the above must be GREEN first
- [ ] Run `pnpm --filter frontend dev` + backend `dotnet run --project backend/src/SiesaAgents.API`
- [ ] Run: `npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts`
- [ ] ✅ Green

**Estimated total effort:** 8–12 hours (DEV pair).

---

## Running Tests

```bash
# ── Frontend (Vitest + RTL + MSW) ─────────────────────────────────────────
# Run all failing tests for this story:
pnpm --filter frontend test

# Run only one suite:
pnpm --filter frontend test ClienteListView
pnpm --filter frontend test filterClientes
pnpm --filter frontend test ErrorPanel

# Watch mode (TDD inner loop):
pnpm --filter frontend test:watch

# ── Backend (xUnit) ──────────────────────────────────────────────────────
# Build first:
dotnet build backend/SiesaAgents.slnx

# Run all non-DB tests (excludes the QA-owned Postgres TestContainers tests):
dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"

# Run only the Story 2.1 new tests:
dotnet test backend/SiesaAgents.slnx --filter "FullyQualifiedName~ClienteEntityTests|FullyQualifiedName~ClienteConfigurationTests|FullyQualifiedName~ClienteEndpointsTests"

# ── E2E (Playwright) ─────────────────────────────────────────────────────
# Headed:
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --headed

# Single browser:
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --project=chromium

# Debug:
npx playwright test e2e/tests/clientes/clientes-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase ✅ (Complete — verified)

- ✅ 6 frontend Vitest test files written and failing (`pnpm --filter frontend test` → 6 failed / 9 passed test files, 56 tests passing from previous stories, ATDD files failing on import).
- ✅ 3 backend xUnit test files written and failing (`dotnet build backend/SiesaAgents.slnx` → 3 CS0234 errors pointing to missing `SiesaAgents.Domain.Clientes.Entities.ClienteEntity` and `SiesaAgents.Infrastructure.Data.Configurations.ClienteConfiguration`).
- ✅ 1 Playwright spec written (will fail at runtime once `pnpm dev` is running — current `/clientes` route renders `ClientesPlaceholderView` without any of the new data-testids).
- ✅ MSW handlers created for empty / success / error / retry scenarios.
- ✅ `renderWithQuery` helper created for fresh QueryClient per test.
- ✅ Deterministic Mulberry32 fixture factory created (no faker dependency).
- ✅ `Microsoft.EntityFrameworkCore.InMemory` added to `SiesaAgents.IntegrationTests.csproj` (test-only).

**Verification:**

- All failures are "missing implementation module" — NOT test bugs.
- All assertions use Given-When-Then phrasing.
- All selectors are `data-testid` / `role` based (no fragile CSS).
- All network mocks installed BEFORE navigation (network-first).

### GREEN Phase (DEV team — next steps)

1. Pick the highest-value failing test (suggest start with `ClienteEntityTests` — pure domain, no DI).
2. Read the test to understand the contract.
3. Implement the minimum code to satisfy ONE assertion at a time.
4. Run the test; verify green.
5. Move to the next test. Repeat.

### REFACTOR Phase (DEV team — after all green)

1. Extract `useMemo`-cached filter inside `ClienteListView` to a `useFilteredClientes(data, query)` hook if it grows.
2. DRY any duplicated Tailwind class strings via `clsx`/`cn` helper.
3. Verify all tests still pass after each refactor.

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff).
2. DEV opens `_bmad-output/implementation-artifacts/2-1-client-list-search.md` for the full implementation contract and starts at **Task 1 (backend domain entity)**.
3. Run `pnpm --filter frontend test` and `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` after each task completes; expected progression is RED → mixed → GREEN.
4. When all listed tests are green, mark story status `done` in `sprint-status.yaml`.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `renderWithQuery` helper as a composable test utility; MSW `setupServer` lifecycle in `setup.ts`.
- **data-factories.md** — Deterministic `makeClientes` factory + canonical `THREE_CLIENTES` fixture set (faker substituted by Mulberry32 per story Task 8 constraint).
- **component-tdd.md** — Red-green-refactor on shared components (`EmptyState`, `ErrorPanel`, `ClientListItem`) before the orchestrating view.
- **network-first.md** — All Playwright `page.route(...)` interceptors installed BEFORE `page.goto('/clientes')`; MSW `server.use(...)` installed BEFORE `renderWithQuery`.
- **test-quality.md** — Given-When-Then comments, one logical assertion per test, deterministic data, auto-cleanup via `afterEach`.
- **selector-resilience.md** — `data-testid` first, `role` + accessible-name second, NEVER class-name matching (the perf test deliberately measures via `performance.now()`, not by querying CSS).
- **timing-debugging.md** — Perf test wraps each keystroke in `act()` + measures around it; no `setTimeout`/hard waits anywhere.
- **test-levels-framework.md** — Component (Vitest+RTL+MSW) chosen as **primary level** for AC #1/#2/#3/#4 (fast, deterministic, no Postgres). API integration (xUnit) covers AC #5. Pure unit covers `filterClientes`. E2E (Playwright) reserved for layout/keyboard contracts that can ONLY be validated in a real browser.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend test`

**Frontend Results:**

```
 Test Files  6 failed | 9 passed (15)
      Tests  56 passed (56)

 FAIL  src/shared/components/ClientListItem.test.tsx
 FAIL  src/shared/components/EmptyState.test.tsx
 FAIL  src/shared/components/ErrorPanel.test.tsx
 FAIL  src/modules/crm/clientes/application/filterClientes.test.ts
 FAIL  src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx
 FAIL  src/modules/crm/clientes/presentation/ClienteListView.test.tsx
```

Each failure: `Error: Failed to resolve import "./{Module}" from "...test.tsx". Does the file exist?` — the expected RED signal (missing implementation, not a test bug).

**Command:** `dotnet build backend/SiesaAgents.slnx`

**Backend Results:**

```
backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs(2,19):
    error CS0234: The type or namespace name 'Domain' does not exist
    in the namespace 'SiesaAgents'

backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs(4,19):
    error CS0234: ... namespace 'Domain' does not exist ...

backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs(6,39):
    error CS0234: ... namespace 'Configurations' does not exist ...

Build FAILED.   0 Warning(s)   3 Error(s)
```

Each CS0234 points to a type DEV must create per AC-2.1.f. No spurious / unrelated errors.

**Summary:**

- Total NEW ATDD test files: **10** (6 frontend Vitest + 3 backend xUnit + 1 Playwright spec)
- Total NEW failing tests (when modules exist they'll execute):
  - Component (Vitest+RTL): **45** tests across `EmptyState` (8) + `ErrorPanel` (10) + `ClientListItem` (8) + `ClienteListView` (10) + `filterClientes` unit (6) + perf (1 × 10 iterations) + `ClienteListView.perf` (1)
  - API Integration (xUnit): **4** tests in `ClienteEndpointsTests`
  - Domain Unit (xUnit): **8** tests in `ClienteEntityTests`
  - Infrastructure Unit (xUnit): **9** tests in `ClienteConfigurationTests`
  - E2E (Playwright): **6** tests in `clientes-list-search.spec.ts`
- **Grand total**: 72 new tests across 4 levels (Unit, Component, API Integration, E2E)
- Status: ✅ RED phase verified — all failures are due to missing implementation modules, never to test bugs.

---

## Notes

- **MSW `onUnhandledRequest: 'bypass'`** (not `'error'`) is used in `setup.ts` so existing Story 1.x tests that incidentally don't hit the network still pass. Story 2.1 component tests register their own handlers via `server.use(...)`; uncovered URLs simply pass through.
- **Perf test seed** (`20260601`) is intentionally chosen as a fixed integer date so the 500-record dataset is reproducible across CI runs. The same seed must be used in the implementation if a Storybook story or screenshot fixture later relies on it.
- **NFR6 structural guarantee** — `ErrorPanel` deliberately does NOT accept an `error` prop. A code reviewer can `grep -r "error.message" frontend/src/modules/crm/clientes` and `frontend/src/shared/components` and find zero matches. The test asserts the sensitive marker is absent from `document.body.textContent`.
- **TestContainers DB tests** (TC-E2-P2-03) are explicitly **out of scope** for this checklist — they are QA-owned (`[Trait("Category", "Db")]`) and run only in the DB-trait CI lane.
- **No `@testing-library/user-event` dependency** added — `fireEvent.change(input, { target: { value: ... } })` is sufficient for the typing simulation (matches the existing Story 1.x test style).

---

**Generated by BMad TEA Agent** — 2026-06-02
