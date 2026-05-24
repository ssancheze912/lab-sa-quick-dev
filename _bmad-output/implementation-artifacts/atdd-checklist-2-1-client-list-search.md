---
story: 2-1-client-list-search
storyTitle: "Client List & Search"
epic: 2
phase: ATDD
status: red
createdAt: "2026-05-24"
---

# ATDD Checklist — Story 2.1: Client List & Search

## Status: RED (tests generated, implementation pending)

---

## Acceptance Criteria Coverage

| AC | Description | Test Case(s) | Level | Status |
|----|-------------|-------------|-------|--------|
| AC1 | Left panel (280px) shows scrollable list with Nombre and NIT/RUC per item | TC-E2-P1-07 (component), AC1 E2E smoke | Component + E2E | RED |
| AC2 | Real-time filter by Nombre or NIT/RUC (< 1s, 500 records, case-insensitive) | TC-E2-P1-07, TC-E2-P2-06 | Component + E2E | RED |
| AC3 | EmptyState when API returns `[]` | TC-E2-P1-08 | Component + E2E smoke | RED |
| AC4 | ErrorPanel + "Reintentar" on fetch failure; clicking triggers new fetch | TC-E2-P1-09 | Component | RED |
| AC5 | Each item shows Nombre and NIT; keyboard-accessible, WCAG 2.1 AA | ClientListItem tests | Component | RED |
| AC6 | All items reachable via scroll without page reload | AC6 E2E smoke | E2E | RED |

---

## Generated Test Files

### Backend — Unit Tests

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs` | 6 | ClienteEntity.Create(), Id uniqueness, DateTimeOffset timestamps |
| `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` | 6 | TC-E2-P1-01 handler layer, mapping, repository delegation |

### Frontend — Component Tests (Vitest + RTL + MSW)

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `frontend/src/modules/crm/clientes/application/useClientes.test.ts` | 5 | Hook shape, query key, refetch exposure, empty array |
| `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` | 14 | TC-E2-P1-07 (5 tests), TC-E2-P1-08 (3 tests), TC-E2-P1-09 (4 tests), AC1 panel (2 tests) |
| `frontend/src/shared/components/__tests__/EmptyState.test.tsx` | 5 | Default message, custom message, accessibility |
| `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` | 6 | Render, retry click (1x and 2x), accessibility |
| `frontend/src/shared/components/__tests__/ClientListItem.test.tsx` | 8 | Nombre+NIT display, isSelected, click, Enter, Space, tabIndex, role |

### E2E — Playwright

| File | Test Count | Test Case(s) |
|------|-----------|-------------|
| `e2e/tests/clientes/client-list-search.spec.ts` | 7 | TC-E2-P2-06 (1 test), AC1 smoke (1), AC2 smoke (2), AC3 smoke (1), AC6 scroll (1), + beforeAll/afterAll |

### Support Files

| File | Purpose |
|------|---------|
| `frontend/src/tests/handlers/clienteHandlers.ts` | MSW handler builders and fixtures (5 clientes, error, empty) |
| `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` | Added `Moq 4.*` dependency for mock IClienteRepository |

---

## Test Summary

| Level | Count | Status |
|-------|-------|--------|
| Backend Unit (xUnit) | 12 | RED |
| Frontend Component (Vitest+RTL+MSW) | 38 | RED |
| E2E (Playwright) | 7 | RED |
| **Total** | **57** | **RED** |

---

## Execution Order

```
Phase 1 — Backend Unit Tests (no DB required)
  ClienteEntityTests (6)
  GetClientesQueryHandlerTests (6)

Phase 2 — Frontend Component Tests (MSW, no backend)
  useClientes.test.ts (5)
  EmptyState.test.tsx (5)
  ErrorPanel.test.tsx (6)
  ClientListItem.test.tsx (8)
  ClienteListView.test.tsx (14)

Phase 3 — E2E (full stack: backend + frontend + PostgreSQL)
  client-list-search.spec.ts (7)
```

---

## RED Phase Failures Expected

The following implementations do NOT exist yet and will cause test failures:

- `SiesaAgents.Domain.Clientes.Entities.ClienteEntity` (namespace + class)
- `SiesaAgents.Domain.Clientes.Interfaces.IClienteRepository`
- `SiesaAgents.Application.Clientes.DTOs.ClienteDto`
- `SiesaAgents.Application.Clientes.Queries.GetClientesQuery`
- `SiesaAgents.Application.Clientes.Queries.GetClientesQueryHandler`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`

---

## GREEN Phase — Implementation Checklist

- [ ] `ClienteEntity.Create()` factory method with Guid ID and DateTimeOffset timestamps
- [ ] `IClienteRepository.GetAllAsync()` interface method
- [ ] `ClienteDto` with all 7 fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
- [ ] `GetClientesQueryHandler.HandleAsync()` maps entities to DTOs
- [ ] `useClientes` hook with `queryKey: ['clientes']`, exposes `refetch`
- [ ] `ClienteListView` with `useMemo` filter, skeleton loading, EmptyState, ErrorPanel
- [ ] `EmptyState` with `data-testid="empty-state"` and default Spanish message
- [ ] `ErrorPanel` with `data-testid="error-panel"` and `data-testid="retry-button"`
- [ ] `ClientListItem` with `data-testid="client-item-{id}"`, keyboard events, isSelected
- [ ] `GET /api/v1/clientes` endpoint returning direct array per architecture spec

---

## Key Constraints Enforced by Tests

1. **No additional API calls during search** — TC-E2-P1-07 asserts API called exactly once on mount
2. **Search is case-insensitive** — "alpha" matches "Empresa Alpha SA"
3. **Search is client-side** — `useMemo` over cached TanStack Query data (no debounce required)
4. **DateTimeOffset** — NOT `DateTime` (asserted in ClienteEntityTests)
5. **Query key `['clientes']`** — verified in useClientes tests
6. **data-testid pattern** — `client-item-{id}`, `empty-state`, `error-panel`, `retry-button`
7. **WCAG 2.1 AA** — keyboard accessibility for ClientListItem (Enter + Space + tabIndex)
8. **NFR1 < 1s** — TC-E2-P2-06 asserts filtered results within 1000ms on 500 records
