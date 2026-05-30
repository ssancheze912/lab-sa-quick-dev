# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-30
**Author:** SiesaTeam / TEA Agent
**Status:** RED Phase Complete
**Primary Test Levels:** API Integration, Component, Unit

---

## Story Summary

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

---

## Acceptance Criteria

1. **AC#1** — Given clients in system, When navigating to `/clientes`, Then left panel (280px) shows scrollable list with Nombre and NIT/RUC visible per item.
2. **AC#2** — Given list loaded, When typing in search, Then list filters in real-time (case-insensitive, Unicode-normalized) matching Nombre or NIT/RUC; results < 1s with up to 500 records (NFR1).
3. **AC#3** — Given no clients in system, When navigating to `/clientes`, Then `EmptyState` component displays with Spanish guidance message.
4. **AC#4** — Given backend unavailable on load, When fetch fails, Then `ErrorPanel` shows with "Reintentar" button; clicking it calls `refetch()`.
5. **AC#5** — Given list loaded, When `GET /api/v1/clientes` called, Then returns direct JSON array (not wrapped), each item has: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

---

## Failing Tests Created (RED Phase)

### API Integration Tests — 6 tests

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs`

**Tests fail because:** `ClienteEntity`, `IClienteRepository`, `ClienteRepository`, `GetClientesQueryHandler`, and `ClienteEndpoints` do not exist yet. The `GET /api/v1/clientes` endpoint is not registered in `Program.cs`.

| Test | AC | Status | Fails Until |
|------|----|--------|------------|
| `GivenThreeClientsSeeded_WhenGetClientes_ThenReturns200WithArrayOfThree` | AC#5 | RED | `GET /api/v1/clientes` endpoint registered |
| `GivenThreeClientsSeeded_WhenGetClientes_ThenEachItemContainsAllRequiredFields` | AC#5 | RED | Response includes all 7 fields per item |
| `GivenThreeClientsSeeded_WhenGetClientes_ThenIdIsValidNonEmptyUuid` | AC#5 | RED | `ClienteEntity.Id` is non-empty UUID |
| `GivenThreeClientsSeeded_WhenGetClientes_ThenCreatedAtIsIso8601WithTimezone` | AC#5 | RED | `DateTimeOffset` serialized as ISO 8601 |
| `GivenThreeClientsSeeded_WhenGetClientes_ThenUpdatedAtIsIso8601WithTimezone` | AC#5 | RED | `DateTimeOffset` serialized as ISO 8601 |
| `GivenNoClientsInDatabase_WhenGetClientes_ThenReturns200WithEmptyArray` | AC#5 | RED | Endpoint returns `[]` when table is empty |
| `GivenGetClientes_WhenResponseReceived_ThenResponseIsDirectArrayNotWrappedObject` | AC#5 | RED | Direct array response — NOT `{ data: [], meta: {} }` |

### Frontend Component Tests — 8 tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

**Tests fail because:** `ClienteListView`, `EmptyState`, and `ErrorPanel` components do not exist. `useClientes` hook does not exist. `clienteApiRepository` does not exist.

| Test ID | Test Name | AC | Status | Fails Until |
|---------|-----------|-----|--------|------------|
| TC-E2-P1-07a | `GivenTwoClients_WhenTypingAna_ThenOnlyAnaGarciaVisible` | AC#2 | RED | `ClienteListView` + filter logic implemented |
| TC-E2-P1-07b | `GivenTwoClients_WhenTypingAna_ThenNoAdditionalApiCallMade` | AC#2 | RED | Filter is client-side only |
| TC-E2-P1-08a | `GivenTwoClients_WhenTypingPartialNitOfFirst_ThenOnlyFirstVisible` | AC#2 | RED | NIT filtering implemented |
| TC-E2-P1-08b | `GivenTwoClients_WhenTypingPartialNitOfSecond_ThenOnlySecondVisible` | AC#2 | RED | NIT filtering implemented |
| TC-E2-P1-08c | `GivenClients_WhenTypingNitSearch_ThenNoApiCallTriggered` | AC#2 | RED | Filter is client-side only |
| TC-E2-P1-09a | `GivenEmptyArray_WhenListLoads_ThenEmptyStateRendered` | AC#3 | RED | `EmptyState` component created |
| TC-E2-P1-09b | `GivenEmptyList_WhenEmptyStateRenders_ThenSpanishGuidanceVisible` | AC#3 | RED | `EmptyState` Spanish message |
| TC-E2-P1-10a | `GivenBackendUnavailable_WhenPageLoads_ThenErrorPanelWithReintentarButton` | AC#4 | RED | `ErrorPanel` component created |
| TC-E2-P1-10b | `GivenErrorPanel_WhenClickingReintentar_ThenNewFetchTriggered` | AC#4 | RED | `refetch()` wired to "Reintentar" |
| TC-E2-P1-10c | `GivenFetchFails_WhenErrorPanelRenders_ThenNoClientItemsVisible` | AC#4 | RED | Mutually exclusive states |
| Loading | `GivenFetchInProgress_WhenComponentRenders_ThenSkeletonShown` | AC#1 | RED | `react-loading-skeleton` used |

### Frontend Unit Tests — 9 tests

**File:** `frontend/src/modules/crm/clientes/application/clienteFilter.test.ts`

**Tests fail because:** `filterClientes` function does not exist (module `clienteFilter.ts` not created yet).

| Test ID | Test Name | AC | Status | Fails Until |
|---------|-----------|-----|--------|------------|
| TC-E2-P1-17a | `GivenGarciaLopez_WhenSearchingGarcia_ThenMatches` | AC#2 | RED | `filterClientes` with Unicode normalization |
| TC-E2-P1-17b | `GivenGarciaLopez_WhenSearchingGARCIA_ThenMatches` | AC#2 | RED | `filterClientes` case-insensitive |
| TC-E2-P1-17c | `GivenGarciaLopez_WhenSearchingGarciaWithAccent_ThenMatches` | AC#2 | RED | `filterClientes` accent normalization |
| TC-E2-P1-17d | `GivenNit900_WhenSearching900_ThenMatches` | AC#2 | RED | `filterClientes` NIT matching |
| TC-E2-P1-17e | `GivenClient_WhenSearchingXyz_ThenNoMatch` | AC#2 | RED | `filterClientes` non-match case |
| TC-E2-P1-17f | `GivenEmptyList_WhenFilterApplied_ThenEmptyResult` | AC#2 | RED | `filterClientes` empty list |
| TC-E2-P1-17g | `GivenList_WhenQueryIsEmpty_ThenAllReturned` | AC#2 | RED | `filterClientes` empty query passthrough |
| TC-E2-P1-17h | `GivenList_WhenQueryIsWhitespace_ThenAllReturned` | AC#2 | RED | `filterClientes` whitespace handling |
| TC-E2-P1-17i | `GivenTwoClients_WhenQueryMatchesOnlyOne_ThenOnlyMatchedReturned` | AC#2 | RED | `filterClientes` selectivity |
| TC-E2-P1-16 | `Given500MockClients_WhenFilteringByA_ThenUnder50ms` | AC#2 / NFR1 | RED | `filterClientes` performance |

---

## MSW Handlers Created

**File:** `frontend/src/__mocks__/handlers/clientes.ts`

- `clientesHandlers` — default: returns `[Ana García, Pedro Pérez]`
- `clientesEmptyHandlers` — returns `[]` (for AC#3 empty state tests)
- `clientesErrorHandlers` — returns `HttpResponse.error()` (for AC#4 error panel tests)

---

## data-testid Attributes Required

The following `data-testid` attributes must be added to components for tests to pass:

| Component | data-testid | Description |
|-----------|------------|-------------|
| `ClienteListView` search input | `role="searchbox"` with `aria-label="Buscar clientes"` | Search field |
| `ClientListItem` | `cliente-list-item-{cliente.id}` | Each client row in list |
| `EmptyState` | `empty-state` | Empty state container |
| `ErrorPanel` | `error-panel` | Error panel container |
| Loading skeleton | `cliente-list-skeleton` | Skeleton placeholder during load |
| "Reintentar" button | `role="button"` with `name=/reintentar/i` | Retry button in ErrorPanel |

---

## Implementation Checklist

### To make unit tests pass (TC-E2-P1-16, TC-E2-P1-17)

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteFilter.ts`
- [ ] Export `filterClientes(clientes: Cliente[], query: string): Cliente[]`
- [ ] Implement Unicode normalization: `str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()`
- [ ] Match against both `nombre` and `nit` fields
- [ ] Return all clients when `query.trim() === ''`
- [ ] Run: `pnpm --prefix frontend test src/modules/crm/clientes/application/clienteFilter.test.ts`

### To make component tests pass (TC-E2-P1-07 to TC-E2-P1-10)

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` (interface)
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` using TanStack Query `['clientes']`
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` with `data-testid="cliente-list-item-{cliente.id}"`
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` with `data-testid="empty-state"`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` with `data-testid="error-panel"` and button `aria-label="Reintentar carga"`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` with `data-testid="cliente-list-skeleton"` on skeleton
- [ ] Add search input with `role="searchbox"` and `aria-label="Buscar clientes"`
- [ ] Wire `refetch()` from TanStack Query to `ErrorPanel.onRetry`
- [ ] Use `react-loading-skeleton` (NOT a spinner) for loading state
- [ ] Run: `pnpm --prefix frontend test src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

### To make API integration tests pass (TC-E2-P1-01)

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Create migration: `dotnet ef migrations add AddClienteEntity ...`
- [ ] Apply migration: `dotnet ef database update ...`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with `GET /api/v1/clientes` → direct JSON array
- [ ] Register `IClienteRepository`, `GetClientesQueryHandler`, map endpoints in `Program.cs`
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "ClienteEndpointsTests"`

---

## Running Tests

```bash
# Frontend unit tests (filter function)
pnpm --prefix /home/user/lab-sa-quick-dev/frontend test src/modules/crm/clientes/application/clienteFilter.test.ts

# Frontend component tests
pnpm --prefix /home/user/lab-sa-quick-dev/frontend test src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# Frontend all tests
pnpm --prefix /home/user/lab-sa-quick-dev/frontend test

# Backend integration tests
dotnet test /home/user/lab-sa-quick-dev/backend/tests/SiesaAgents.IntegrationTests --filter "ClienteEndpointsTests"

# All backend tests
dotnet test /home/user/lab-sa-quick-dev/backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- Unit tests written and failing: `clienteFilter.test.ts` (10 tests)
- Component tests written and failing: `ClienteListView.test.tsx` (11 tests)
- API integration tests written and failing: `ClienteEndpointsTests.cs` (6 tests + 1 response format)
- MSW handlers created: `__mocks__/handlers/clientes.ts`
- `data-testid` attribute contracts documented
- Implementation checklist created for DEV agent

**Verification:** All tests fail because modules/components they import do not exist.

### GREEN Phase (DEV Agent — Next Steps)

Follow the Implementation Checklist above. Recommended order:
1. Unit tests first (fastest feedback): `clienteFilter.ts`
2. API integration tests next: backend implementation (Tasks 1–9)
3. Component tests last: frontend components (Tasks 12–21)

### REFACTOR Phase (DEV Agent — After All Tests Pass)

1. Confirm no `any` types in TypeScript (strict mode enforced)
2. Confirm no `DateTime` in C# (must be `DateTimeOffset`)
3. Confirm no hardcoded connection strings
4. Confirm `react-loading-skeleton` used, not a spinner
5. All tests still pass after cleanup

---

## Test Execution Evidence (Expected — RED Phase)

```
Frontend unit tests (clienteFilter.test.ts):
  Total: 10 | Passed: 0 | Failed: 10
  Failure: Cannot find module './clienteFilter' or its exports

Frontend component tests (ClienteListView.test.tsx):
  Total: 11 | Passed: 0 | Failed: 11
  Failure: Cannot find module './ClienteListView' or its exports

Backend integration tests (ClienteEndpointsTests.cs):
  Total: 6 | Passed: 0 | Failed: 6
  Failure: Route '/api/v1/clientes' not found (404)
           OR compilation error: SiesaAgents.Domain.Clientes.Entities not found
```

---

## Knowledge Base References Applied

- `filterClientes` Unicode normalization: `_bmad-output/implementation-artifacts/test-design-epic-2.md#Notes for Story Implementation Agents, point 7`
- Direct JSON array response format: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`
- `data-testid` selector strategy: `sa-tea-atdd.md#Reglas Críticas`
- Given-When-Then pattern: `sa-tea-atdd.md#Reglas Críticas`
- Network-first MSW intercepts: `sa-tea-atdd.md#Reglas Críticas`
- `react-loading-skeleton` (not spinner): `.claude/agent-memory/sa-quick-dev/company-standards.md#Loading States`
- Test cases specification: `_bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-01, TC-E2-P1-07 through TC-E2-P1-10, TC-E2-P1-16, TC-E2-P1-17`

---

**Generated by BMad TEA Agent** — 2026-05-30
