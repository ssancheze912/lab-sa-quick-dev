---
story: "2.1 — Client List & Search"
epic: "2 — Client Management"
phase: RED (tests generated before implementation)
createdAt: "2026-06-06"
status: pending-implementation
---

# ATDD Checklist — Story 2.1: Client List & Search

## Acceptance Criteria Traceability

| AC | Description | Test Level | Test File | Test Name | Status |
|----|-------------|------------|-----------|-----------|--------|
| AC1 | Navigate to /clientes shows 280px left panel with client list (Nombre + NIT/RUC) and search input | Component | ClienteListPanel.test.tsx | renders client list with Nombre and NIT when data is available | RED |
| AC1 | Panel header contains search input with correct placeholder | Component | ClienteListPanel.test.tsx | search input has correct placeholder "Buscar por nombre o NIT..." | RED |
| AC2 | Typing in search field filters list in real time (case-insensitive) | Component | ClienteListPanel.test.tsx | filters list in real time when user types in search field | RED |
| AC2 | Search matches on Nombre OR NIT/RUC | Component | ClienteListPanel.test.tsx | filters by NIT/RUC case-insensitively | RED |
| AC3 | Empty system shows EmptyState variant="no-clients" with "No hay clientes registrados" and "Nuevo cliente" CTA | Component | ClienteListPanel.test.tsx | renders EmptyState variant="no-clients" when data is empty array and searchQuery is empty | RED |
| AC4 | No search results shows EmptyState variant="search-empty" with "No se encontró ningún cliente" | Component | ClienteListPanel.test.tsx | renders EmptyState variant="search-empty" when search has no matches | RED |
| AC5 | Backend unavailable shows ErrorPanel with "Reintentar" button | Component | ClienteListPanel.test.tsx | renders ErrorPanel with Reintentar button on fetch failure | RED |
| AC5 | "Reintentar" button triggers TanStack Query refetch() | Component | ClienteListPanel.test.tsx | clicking Reintentar calls refetch | RED |
| AC6 | Loading state shows skeleton placeholders (react-loading-skeleton) | Component | ClienteListPanel.test.tsx | renders skeleton placeholders while isLoading is true | RED |
| AC6 | Loading container has aria-busy="true" | Component | ClienteListPanel.test.tsx | skeleton container has aria-busy="true" | RED |
| AC7 | Mobile viewport single-column layout (search full-width at top) | Component | ClienteListPanel.test.tsx | search input is rendered in panel (mobile layout) | RED |
| AC1 | ClientListItem renders Nombre (bold) and NIT/RUC | Component | ClientListItem.test.tsx | renders client Nombre and NIT/RUC | RED |
| AC1 | ClientListItem selected state applies border-left + bg styles | Component | ClientListItem.test.tsx | applies selected styles when isSelected is true | RED |
| AC1 | ClientListItem onClick fires on click | Component | ClientListItem.test.tsx | calls onClick when clicked | RED |
| AC1 | ClientListItem keyboard: Enter/Space triggers onClick | Component | ClientListItem.test.tsx | calls onClick on Enter key press | RED |
| AC1 | ClientListItem aria-label and aria-pressed accessibility | Component | ClientListItem.test.tsx | has correct aria-label and aria-pressed attributes | RED |
| AC3 | EmptyState variant="no-clients" renders correct text and CTA | Component | EmptyState.test.tsx | renders "No hay clientes registrados" and "Nuevo cliente" CTA for no-clients variant | RED |
| AC4 | EmptyState variant="search-empty" renders correct text, no CTA | Component | EmptyState.test.tsx | renders "No se encontró ningún cliente" hint text for search-empty variant | RED |
| AC3/4 | EmptyState container has aria-live="polite" | Component | EmptyState.test.tsx | container has aria-live="polite" | RED |
| AC5 | ErrorPanel renders "Reintentar" button | Component | ErrorPanel.test.tsx | renders Reintentar button | RED |
| AC5 | ErrorPanel onRetry called when Reintentar clicked | Component | ErrorPanel.test.tsx | calls onRetry when Reintentar button is clicked | RED |
| AC5 | ErrorPanel does NOT show technical error details | Component | ErrorPanel.test.tsx | does not display error.message or technical details | RED |
| AC1/5/6 | useClientes hook returns Cliente[] on success | Unit | useClientes.test.ts | returns array of clientes on successful fetch | RED |
| AC6 | useClientes hook exposes isLoading=true during fetch | Unit | useClientes.test.ts | isLoading is true while fetching | RED |
| AC5 | useClientes hook exposes isError=true on network failure | Unit | useClientes.test.ts | isError is true on network failure | RED |
| AC5 | useClientes refetch() re-triggers the query | Unit | useClientes.test.ts | refetch re-triggers the query | RED |
| AC1 | Backend GetClientesQueryHandler returns empty IEnumerable when repo returns no entities | Unit | GetClientesQueryHandlerTests.cs | ReturnsEmpty_WhenRepositoryReturnsNoEntities | RED |
| AC1 | Backend GetClientesQueryHandler maps ClienteEntity fields correctly to ClienteDto | Unit | GetClientesQueryHandlerTests.cs | MapsClienteEntityToDto_Correctly | RED |
| AC1 | Backend ClienteEntity.Create() sets all fields | Unit | ClienteEntityTests.cs | Create_SetsAllFieldsCorrectly | RED |
| AC1 | Backend ClienteEntity Id is non-empty Guid | Unit | ClienteEntityTests.cs | Create_IdIsNonEmptyGuid | RED |
| AC1 | Backend CreatedAt and UpdatedAt are DateTimeOffset (not DateTime) | Unit | ClienteEntityTests.cs | Create_CreatedAtAndUpdatedAt_AreDateTimeOffset | RED |

## Test Files Generated

| File | Level | AC Coverage |
|------|-------|-------------|
| `frontend/src/modules/crm/clientes/application/useClientes.test.ts` | Unit (Hook) | AC1, AC5, AC6 |
| `frontend/src/shared/components/ClientListItem.test.tsx` | Component | AC1 |
| `frontend/src/shared/components/EmptyState.test.tsx` | Component | AC3, AC4 |
| `frontend/src/shared/components/ErrorPanel.test.tsx` | Component | AC5 |
| `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` | Component (Integration) | AC1–AC7 |
| `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` | Unit (Backend) | AC1 |
| `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` | Unit (Backend Domain) | AC1 |

## RED State Rationale

All tests are generated BEFORE implementation. They define the expected contracts for:
- Domain types: `Cliente`, `IClienteRepository`
- Application hook: `useClientes` (TanStack Query, key `['clientes']`)
- Infrastructure: `clienteApiRepository.getAll()` → `GET /api/v1/clientes`
- Presentation components: `ClienteListPanel`, `ClientListItem`, `EmptyState`, `ErrorPanel`
- Backend domain: `ClienteEntity.Create()` factory method
- Backend application: `GetClientesQueryHandler` mapping to `ClienteDto`

These tests will fail (RED) until the implementation tasks (Tasks 1–11) are completed.
