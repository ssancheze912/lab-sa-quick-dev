---
epic: 4
title: "Client-Contact Association & Data Quality"
mode: epic-level
phase: 4
createdAt: "2026-06-28"
stories:
  - "4.1 — View Associated Contacts in Client Detail"
  - "4.2 — Associate & Disassociate Contacts from Client"
  - "4.3 — Navigate from Client Detail to Contact Detail"
  - "4.4 — View Associated Client from Contact Detail"
  - "4.5 — Orphan Contacts Filter"
  - "4.6 — Reassign Contact to Different Client"
status: draft
---

# Test Design — Epic 4: Client-Contact Association & Data Quality

**Date:** 2026-06-28
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 4 — Client-Contact Association & Data Quality

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (≥6): 4
- Critical categories: DATA, BUS, TECH, PERF

**Coverage Summary:**

- P0 scenarios: 8 (16 hours)
- P1 scenarios: 22 (22 hours)
- P2 scenarios: 16 (8 hours)
- P3 scenarios: 4 (1 hour)
- **Total effort**: ~47 hours (~6 developer-days)

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 4 is the relational core of the Siesa-Agents application: it wires the `ClienteContactServiceAdapter` to the `ContactManager` siesa-ui-kit component inside `ClienteDetailView`, exposes bidirectional navigation (client → contact, contact → client), introduces the orphan contacts filter (`sinCliente=true` query param on `GET /api/v1/contactos`), and enables contact reassignment via a single `PUT /api/v1/contactos/{id}/cliente` endpoint. All mutations must trigger TanStack Query `invalidateQueries` for the affected `['contactos']` and `['contactos', { clienteId }]` query keys, achieving FR27 (changes immediately visible to all users). The epic covers FR17–FR27, NFR7–NFR9, and AC-E4.1–AC-E4.7.

This epic uniquely involves:
1. The **`ClienteContactServiceAdapter`** — the project-specific class implementing `IContactServiceAdapter` from siesa-ui-kit, which acts as the integration seam between the UI kit and the REST API.
2. **Multi-query-key invalidation** — mutations that must invalidate multiple keys simultaneously (`['contactos']`, `['contactos', { clienteId: oldId }]`, `['contactos', { clienteId: newId }]`), which is more complex than previous epics.
3. **Bidirectional navigation** — two directional flows (client → contact, contact → client) that must be validated end-to-end with ≤2-click constraints (NFR8).
4. **Backend filter endpoint** — `GET /api/v1/contactos?sinCliente=true` and `GET /api/v1/contactos?clienteId=:id` must both be correctly implemented and tested.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 4.1 | View Associated Contacts in Client Detail | `ContactManager` renders contacts for `clienteId`, EmptyState for no contacts, ErrorPanel + retry on fetch failure, `ClienteContactServiceAdapter` wiring |
| 4.2 | Associate & Disassociate Contacts from Client | `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: uuid }` / `{ clienteId: null }`, multi-key invalidation, disassociated contact still accessible at `/contactos` |
| 4.3 | Navigate from Client Detail to Contact Detail | Navigation from ContactManager item to `/contactos/:contactoId` in ≤2 clicks (NFR8), back-navigation to client detail |
| 4.4 | View Associated Client from Contact Detail | Client name visible in contact detail without extra navigation (NFR9), link navigates to `/clientes/:clienteId`, "Sin cliente asignado" for orphan contacts |
| 4.5 | Orphan Contacts Filter | `?sinCliente=true` filter shows only contacts with `clienteId = null`, count displayed, toggling filter restores full list, EmptyState when all contacts are assigned |
| 4.6 | Reassign Contact to Different Client | Client selector from contact detail, `PUT /api/v1/contactos/{id}/cliente` with new `clienteId`, triple-key invalidation, toast "Contacto reasignado correctamente", cancel leaves unchanged |

### Out of Scope for This Epic

- Authentication / authorization (deferred MVP)
- Server-side pagination (NFR11 deferred)
- Creating contacts standalone (Epic 3)
- Multi-contact batch assignment
- Real-time WebSocket updates (REST + TanStack Query invalidation is sufficient per FR27 and architecture decision)

---

## 2. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Multi-key TanStack Query invalidation incomplete — `PUT /api/v1/contactos/{id}/cliente` mutations invalidate only `['contactos']` but miss `['contactos', { clienteId }]` variants, causing stale ContactManager data in client detail views after reassignment | 3 | 3 | 9 | Code review: verify `useAssociateContacto`, `useDisassociateContacto`, and `useReassignContacto` hooks call `invalidateQueries` for ALL three required query keys; Component test: associate contact, assert ContactManager re-renders; reassign, assert old client's ContactManager no longer shows the contact | DEV | Before Story 4.2 |
| R-002 | TECH | `ClienteContactServiceAdapter` wiring incorrect — adapter not instantiated per-clienteId, or clienteId prop not passed correctly, causing ContactManager to fetch all contacts instead of filtered set or to crash on mount | 2 | 3 | 6 | Component test: render `ClienteDetailView` with a seeded client (MSW), assert `GET /api/v1/contactos?clienteId=:id` is the exact request made (not `/api/v1/contactos`); assert another client's contacts are NOT shown | DEV | Story 4.1 |
| R-003 | DATA | Disassociation deletes the contact record — `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: null }` is implemented as DELETE instead of an update, violating AC-E4.4 and FR20 | 1 | 3 | 3 | API integration test: POST contact, associate to client, then PUT with `{ clienteId: null }`, then GET contact by ID — assert 200 (record exists) and `clienteId` is null | DEV | Story 4.2 |
| R-004 | BUS | Orphan filter (`?sinCliente=true`) not forwarded to backend — frontend builds the query param but the backend endpoint ignores it, returning all contacts instead of orphans only | 2 | 3 | 6 | API integration test: seed 3 assigned + 2 orphan contacts, GET `/api/v1/contactos?sinCliente=true` → assert exactly 2 records returned; Component test: activate "Sin cliente" filter, assert MSW captures request with `?sinCliente=true` | DEV | Story 4.5 |
| R-005 | BUS | NFR8 violated — navigation from a client's ContactManager to a contact's detail requires >2 clicks due to missing click handler on ContactManager items or intermediate confirmation step | 2 | 2 | 4 | E2E test: open client detail, click contact item in ContactManager — assert user lands on `/contactos/:contactoId` in exactly 1 click (≤2 total from client record per NFR8) | QA | Story 4.3 |
| R-006 | BUS | NFR9 violated — associated client name not visible in contact detail without extra navigation (field missing from `ContactoDetailView`, or `clienteId` not included in GET response DTO) | 2 | 2 | 4 | API integration test: GET `/api/v1/contactos/:id` response body includes `clienteId` and `clienteNombre` (or navigation is done via a separate GET clientes/:id call); Component test: render `ContactoDetailView` with MSW-backed contact that has a `clienteId`, assert client name visible on first render | DEV | Story 4.4 |
| R-007 | BUS | "Sin cliente asignado" text absent or in English — violates company standard (Spanish mandatory) and breaks AC-E4.4 | 1 | 2 | 2 | Component test: render ContactoDetailView with `clienteId: null`, assert element with text "Sin cliente asignado" is present | DEV | Story 4.4 |
| R-008 | DATA | Reassignment race condition — user reassigns contact while another user (simulated via concurrent mutation) assigns the same contact; second PUT succeeds but first client's ContactManager still shows the contact | 1 | 2 | 2 | Note: No real-time push in architecture (no WebSockets). Race resolved by TanStack Query invalidation on next interaction. Document as known behavior; no test required beyond standard invalidation tests (R-001) | — | — |
| R-009 | BUS | Cancel on reassignment selector mutates state — selecting a different client in the selector updates local state; cancel then shows the new client name transiently before reverting | 1 | 2 | 2 | Component test: open client selector, select a different client, click "Cancelar", assert contact's client display still shows original client name and PUT not called | DEV | Story 4.6 |
| R-010 | PERF | `GET /api/v1/contactos?clienteId=:id` lacks database index — query performs full table scan on `contactos` as client contact counts grow (ix_contactos_cliente_id was defined in architecture but must be verified in migration) | 2 | 2 | 4 | API integration test: assert `ix_contactos_cliente_id` index exists in the `contactos` table (query `pg_indexes`); optional: measure query time with 1,000 contacts under 500ms | DEV | Story 4.1 |
| R-011 | BUS | Toast text absent or wrong — "Contacto reasignado correctamente" missing or in English, breaking company standard and AC-E4.6 | 1 | 1 | 1 | Component test: complete reassignment, assert toast "Contacto reasignado correctamente" appears | QA | Story 4.6 |

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Score |
|---------|----------|-------------|-------|
| R-001 | DATA | Multi-key TanStack Query invalidation incomplete after association/disassociation/reassignment — ContactManager and contact lists show stale data | 9 |
| R-002 | TECH | `ClienteContactServiceAdapter` wiring incorrect — ContactManager fetches wrong data or crashes on mount | 6 |
| R-004 | BUS | Orphan filter query param not forwarded to backend — "Sin cliente" filter returns all contacts | 6 |

### Top 3 Risk Areas for Epic 4

1. **Multi-key TanStack Query invalidation** (R-001, score 9) — This is the highest-risk item in the epic. The reassignment mutation must invalidate THREE query keys simultaneously: `['contactos']`, `['contactos', { clienteId: oldId }]`, and `['contactos', { clienteId: newId }]`. Any miss causes stale data visible to all users (FR27 violation). This must be explicitly tested at component level for each of the three mutation hooks.
2. **`ClienteContactServiceAdapter` integration** (R-002) — The adapter is the architectural seam between siesa-ui-kit's `ContactManager` and the REST API. If the `clienteId` is not correctly injected at instantiation time, all contact list operations for a client will be wrong. This must be tested with a real network assertion (MSW capturing the exact URL).
3. **Orphan filter backend implementation** (R-004) — The `?sinCliente=true` query parameter requires a backend implementation change in `GetContactosQueryHandler.cs` to apply a `WHERE cliente_id IS NULL` predicate. If the handler ignores the parameter, the filter silently returns all contacts.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 4 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌▌          7 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  18 tests
  Component (Vitest+RTL+MSW) ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  20 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌             5 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                          50 tests
```

### Rationale

- **E2E is expanded vs Epic 3** — Epic 4 introduces bidirectional navigation flows (NFR8, NFR9) that require real browser routing assertions. The 2-click constraint from client to contact cannot be verified at component level alone because it spans two routes.
- **API integration tests are the primary validation layer** for the `PUT /api/v1/contactos/{id}/cliente` endpoint and the `?sinCliente=true` / `?clienteId=:id` query parameters — these are pure HTTP contract validations.
- **Component tests validate the adapter wiring** — MSW allows asserting that `ClienteContactServiceAdapter` builds the correct URL with the client-specific query param, and that the ContactManager re-renders on mutation.
- **Unit tests** cover the adapter's URL construction logic and the backend query handler's filter predicate logic in isolation.
- **No duplication rule applied**: NFR8 (2-click navigation) tested at E2E only; query param construction tested at Unit + Component, not repeated at E2E; invalidation pattern tested at Component, not E2E.

### Test Level Assignments

| Test Level | Scope | Tools |
|------------|-------|-------|
| Unit | `ClienteContactServiceAdapter` URL builder methods; `GetContactosQueryHandler` filter predicate (sinCliente, clienteId) | Vitest, xUnit |
| Component | `ClienteDetailView` with ContactManager (MSW), ContactoDetailView client name display, orphan filter toggle, reassignment selector + cancel, error/empty states | Vitest + React Testing Library + MSW |
| API Integration | `PUT /api/v1/contactos/{id}/cliente` (assign, unassign, reassign), `GET /api/v1/contactos?clienteId=:id`, `GET /api/v1/contactos?sinCliente=true`, contact persistence after disassociation | xUnit + WebApplicationFactory + Testcontainers |
| E2E | Full user journeys: view client contacts, associate contact, navigate client→contact (2-click), navigate contact→client, orphan filter toggle, reassign flow | Playwright |

---

## 4. Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core user journey + High risk (≥6) + No workaround

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E4.1 + R-002: Adapter fetches contacts for specific client | Component: render `ClienteDetailView` (MSW), assert `GET /api/v1/contactos?clienteId=:id` is the exact request (not `/api/v1/contactos`); assert another client's contacts are absent | Component | R-002 | 2 | DEV |
| R-001: Associate contact — all query keys invalidated | Component: trigger associate mutation (MSW), assert `queryClient.invalidateQueries` called for `['contactos']` and `['contactos', { clienteId }]` (spy); assert ContactManager re-renders with new contact | Component | R-001 | 1 | DEV |
| R-001: Reassign — triple-key invalidation | Component: reassign contact from clienteA to clienteB (MSW), assert ContactManager for clienteA no longer shows contact and ContactManager for clienteB shows it | Component | R-001 | 1 | DEV |
| AC-E4.4 + R-004: `PUT /api/v1/contactos/{id}/cliente` assign | API: POST contact, then PUT `{ clienteId: validUuid }` → 200 + body with updated `clienteId` | API | R-001 | 1 | DEV |
| AC-E4.4 + FR20: Disassociation keeps contact record | API: PUT `{ clienteId: null }`, then GET contact by ID → 200 with `clienteId: null` (record exists) | API | R-003 | 1 | DEV |
| R-004: `?sinCliente=true` returns only orphans | API: seed 3 assigned + 2 orphan contacts, GET `/api/v1/contactos?sinCliente=true` → assert exactly 2 records | API | R-004 | 1 | DEV |
| AC-E4.7 + R-001: FR27 — create contact in ContactManager, visible immediately | E2E: open client detail, add existing contact via ContactManager, assert contact appears in ContactManager list without page reload | E2E | R-001 | 1 | QA |

**Total P0**: 8 tests, ~16 hours

### P1 (High) — Run on PR to main

**Criteria**: Important features + Medium risk (3–4) + Common workflows

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E4.2: ContactManager shows all associated contacts | Component: render ClienteDetailView (MSW seeded with 3 contacts for clienteId), assert all 3 contact names rendered in ContactManager | Component | R-002 | 1 | DEV |
| AC-E4.2: ContactManager EmptyState for client with no contacts | Component: render ClienteDetailView (MSW returns empty array for clienteId), assert EmptyState displayed | Component | — | 1 | DEV |
| AC-E4.2: ContactManager ErrorPanel on fetch failure | Component: MSW returns 500 for `GET /api/v1/contactos?clienteId=:id`, assert ErrorPanel + retry option visible | Component | — | 1 | DEV |
| AC-E4.3 + NFR8: Navigate from client to contact in ≤2 clicks | E2E: from `/clientes/:clienteId`, click contact in ContactManager (1 click) → assert URL changes to `/contactos/:contactoId` (total ≤2 clicks from client record) | E2E | R-005 | 1 | QA |
| AC-E4.3: Back-navigation from contact to client | E2E: navigate to contact from client detail, click browser back / "Volver" link → assert return to `/clientes/:clienteId` | E2E | — | 1 | QA |
| AC-E4.4 + NFR9: Client name visible in contact detail without extra navigation | Component: render ContactoDetailView (MSW contact with `clienteId`), assert client name displayed on first render (no additional interaction required) | Component | R-006 | 1 | DEV |
| AC-E4.4: Client name link navigates to client detail | E2E: from contact detail view, click client name → assert navigation to `/clientes/:clienteId` | E2E | R-006 | 1 | QA |
| AC-E4.4: "Sin cliente asignado" for orphan contact | Component: render ContactoDetailView (MSW contact with `clienteId: null`), assert text "Sin cliente asignado" present | Component | R-007 | 1 | DEV |
| AC-E4.5: "Sin cliente" filter shows orphan contacts | Component: render ContactosView with filter toggle (MSW captures `?sinCliente=true`), activate filter, assert only orphan contacts shown + count displayed | Component | R-004 | 1 | DEV |
| AC-E4.5: Deactivate "Sin cliente" filter restores full list | Component: activate then deactivate filter, assert all contacts returned (MSW captures request without `?sinCliente=true`) | Component | — | 1 | DEV |
| AC-E4.5: EmptyState when all contacts are assigned | Component: activate "Sin cliente" filter (MSW returns empty array for `?sinCliente=true`), assert EmptyState shown | Component | — | 1 | DEV |
| AC-E4.6: Reassign — new client selected, PUT called with new clienteId | Component: open reassignment selector, select different client, confirm, assert PUT called with new `{ clienteId: newUuid }` (MSW) | Component | R-001 | 1 | DEV |
| AC-E4.6: Reassign cancel — contact unchanged | Component: open reassignment selector, select different client, cancel → assert PUT not called, original client name still displayed | Component | R-009 | 1 | DEV |
| AC-E4.6: Toast "Contacto reasignado correctamente" | Component: complete reassignment, assert toast with exact text "Contacto reasignado correctamente" | Component | R-011 | 1 | QA |
| AC-E4.6: Full reassign E2E journey | E2E: from contact detail, reassign to different client, confirm → assert contact appears in new client's ContactManager, absent from original client's ContactManager | E2E | R-001 | 1 | QA |
| API: `GET /api/v1/contactos?clienteId=:id` returns filtered contacts | API: seed 5 contacts (3 for clienteA, 2 for clienteB), GET `?clienteId=clienteA` → assert exactly 3 records | API | R-002 | 1 | DEV |
| API: `PUT /api/v1/contactos/{id}/cliente` with invalid clienteId | API: PUT with non-existent clienteId UUID → assert 404 Problem Details | API | — | 1 | DEV |
| API: `PUT /api/v1/contactos/{id}/cliente` with invalid UUID format | API: PUT with malformed UUID string → assert 400 Problem Details | API | — | 1 | DEV |
| API: `PUT` on non-existent contacto | API: PUT `{ clienteId: uuid }` on non-existent contactoId → assert 404 Problem Details | API | — | 1 | DEV |
| R-010: `ix_contactos_cliente_id` index exists | API: query `pg_indexes WHERE tablename='contactos' AND indexname='ix_contactos_cliente_id'` → assert 1 row returned | API | R-010 | 1 | DEV |
| AC-E4.1 + AC-E4.2: Full view flow E2E | E2E: navigate to `/clientes/:clienteId`, assert ContactManager panel rendered with contacts from seed data | E2E | — | 1 | QA |

**Total P1**: 22 tests, ~22 hours

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1–2) + Edge cases

| Requirement | Test Scenario | Test Level | Risk Link | Count | Owner |
|-------------|---------------|------------|-----------|-------|-------|
| AC-E4.6: Client selector shows all available clients | Component: open reassignment selector, assert all clients from `GET /api/v1/clientes` appear as options (MSW) | Component | — | 1 | DEV |
| R-003: Disassociated contact accessible from `/contactos` | E2E: disassociate contact from client, navigate to `/contactos`, assert contact still listed | E2E | R-003 | 1 | QA |
| API: Idempotent reassignment (PUT same clienteId twice) | API: PUT contact with clienteId, PUT same clienteId again → assert 200 both times, single association | API | — | 1 | DEV |
| API: Disassociation idempotency (PUT null when already null) | API: PUT `{ clienteId: null }` on already-orphan contact → assert 200, contact still orphan | API | — | 1 | DEV |
| API: `GET /api/v1/contactos` (no filter) includes `clienteId` field | API: GET all contacts, assert response items include `clienteId` field (null or uuid) | API | — | 1 | DEV |
| API: `GET /api/v1/contactos?sinCliente=true` with zero orphans | API: seed 2 contacts all assigned, GET `?sinCliente=true` → assert empty array | API | R-004 | 1 | DEV |
| NFR9: Client association visible without extra search | Component: render ContactoDetailView, assert client name present without user needing to click/search (first render assertion) | Component | R-006 | 1 | DEV |
| Toast: Associate toast text | Component: associate contact → assert toast "Contacto asociado correctamente" (if present per AC) or suppress if UI kit handles internally | Component | — | 1 | QA |
| Toast: Disassociate toast text | Component: disassociate contact → assert toast "Contacto desasociado correctamente" or verify UI kit feedback | Component | — | 1 | QA |
| Unit: `ClienteContactServiceAdapter` URL construction — with clienteId | Unit: instantiate adapter with `clienteId=abc`, call `getContactos()`, assert URL includes `?clienteId=abc` | Unit | R-002 | 1 | DEV |
| Unit: `ClienteContactServiceAdapter` URL — associate payload | Unit: call `associateContact(contactoId)`, assert PUT body is `{ clienteId: adapterClienteId }` | Unit | R-001 | 1 | DEV |
| Unit: backend `GetContactosQueryHandler` — sinCliente predicate | Unit (xUnit): pass `SinCliente=true` to handler, assert EF Core query includes `WHERE cliente_id IS NULL` | Unit | R-004 | 1 | DEV |
| Unit: backend `GetContactosQueryHandler` — clienteId predicate | Unit (xUnit): pass `ClienteId=guid` to handler, assert EF Core query includes `WHERE cliente_id = :id` | Unit | R-002 | 1 | DEV |
| NFR2: Associate mutation visible in < 2s | Component: trigger associate mutation (MSW 0ms delay), measure until ContactManager re-renders ≤ 2s | Component | — | 1 | DEV |
| API: Problem Details shape on 404 (no stackTrace) | API: request non-existent contacto, assert response contains `type`, `title`, `status`, `detail` and NO `stackTrace` key | API | — | 1 | DEV |
| Orphan filter count badge | Component: activate "Sin cliente" filter (MSW returns 3 orphans), assert count "3" is visible in the filter UI | Component | — | 1 | DEV |

**Total P2**: 16 tests, ~8 hours

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Scenario | Test Level | Count | Owner |
|-------------|---------------|------------|-------|-------|
| Responsive layout — client detail with ContactManager | E2E (mobile 375px viewport): navigate to `/clientes/:id`, assert ContactManager panel renders without horizontal overflow | E2E | 1 | QA |
| API: `ix_contactos_cliente_id` query performance | API: seed 1,000 contacts (500 assigned), GET `?clienteId=:id` → assert response time ≤500ms | API | 1 | DEV |
| ContactManager renders with 50+ contacts | Component: MSW returns 50 contacts for clienteId, assert all 50 rendered in ContactManager list (no truncation) | Component | 1 | DEV |
| Orphan filter + search combined | Component: activate "Sin cliente" filter AND type in search field, assert only orphan contacts matching search term are shown | Component | 1 | DEV |

**Total P3**: 4 tests, ~1 hour

---

## 5. Execution Order

### Smoke Tests (<5 min)

Purpose: Fast feedback — catch build-breaking issues before full suite

- [ ] GET `/api/v1/contactos?clienteId=:id` returns 200 and JSON array (API) — 10s
- [ ] PUT `/api/v1/contactos/:id/cliente` with `{ clienteId: uuid }` returns 200 (API) — 15s
- [ ] Navigate to `/clientes/:id` — ContactManager panel renders without crash (E2E) — 40s

**Total smoke**: 3 scenarios, ~1 min

### P0 Tests (<10 min)

Purpose: Critical path validation — all must pass before any PR merge

- [ ] Component: ClienteDetailView adapter fetches `GET /api/v1/contactos?clienteId=:id` (not all contactos)
- [ ] Component: another client's contacts are absent from ContactManager
- [ ] Component: associate mutation invalidates `['contactos']` and `['contactos', { clienteId }]`
- [ ] Component: reassign mutation — old ContactManager loses contact, new ContactManager gains it
- [ ] API: PUT `{ clienteId: validUuid }` → 200 + updated clienteId
- [ ] API: PUT `{ clienteId: null }` + GET contact → 200, record exists with null clienteId
- [ ] API: GET `?sinCliente=true` returns only orphans (3 assigned + 2 orphan seeded)
- [ ] E2E: associate contact via ContactManager, appears in list without page reload

**Total P0**: 8 scenarios, ~9 min

### P1 Tests (<30 min)

Purpose: Important feature coverage

- [ ] Component: ContactManager shows all 3 seeded contacts for clienteId
- [ ] Component: EmptyState when no contacts for clienteId
- [ ] Component: ErrorPanel + retry on 500 for contactos?clienteId
- [ ] E2E: navigate from client detail to contact detail in ≤2 clicks (NFR8)
- [ ] E2E: back navigation from contact to client
- [ ] Component: ContactoDetailView shows client name on first render (NFR9)
- [ ] E2E: click client name link from contact detail → navigate to `/clientes/:id`
- [ ] Component: "Sin cliente asignado" text for orphan contact
- [ ] Component: "Sin cliente" filter activates — MSW captures `?sinCliente=true`
- [ ] Component: deactivate filter — full list restored
- [ ] Component: EmptyState when all contacts assigned and filter active
- [ ] Component: reassignment — PUT called with new `{ clienteId: newUuid }`
- [ ] Component: cancel reassignment — PUT not called, original client displayed
- [ ] Component: toast "Contacto reasignado correctamente"
- [ ] E2E: full reassign journey — contact in new client, absent from old client
- [ ] API: GET `?clienteId=clienteA` returns exactly 3 of 5 seeded contacts
- [ ] API: PUT with non-existent clienteId → 404 Problem Details
- [ ] API: PUT with malformed UUID → 400 Problem Details
- [ ] API: PUT on non-existent contacto → 404 Problem Details
- [ ] API: `ix_contactos_cliente_id` index exists in pg_indexes
- [ ] E2E: navigate to `/clientes/:id`, ContactManager renders with seeded contacts

**Total P1**: 22 scenarios, ~25 min

### P2/P3 Tests (<60 min)

Purpose: Full regression coverage

- [ ] Component: client selector in reassignment shows all clients
- [ ] E2E: disassociated contact still listed at `/contactos`
- [ ] API: idempotent PUT same clienteId twice → 200 both times
- [ ] API: idempotent PUT null when already null → 200
- [ ] API: GET all contactos response includes `clienteId` field
- [ ] API: GET `?sinCliente=true` with 0 orphans → empty array
- [ ] Component: client name visible without extra interaction (NFR9 unit check)
- [ ] Component: associate/disassociate toast text assertions
- [ ] Unit: adapter URL construction with clienteId
- [ ] Unit: adapter associate payload = `{ clienteId: adapterClienteId }`
- [ ] Unit (xUnit): sinCliente predicate in GetContactosQueryHandler
- [ ] Unit (xUnit): clienteId predicate in GetContactosQueryHandler
- [ ] Component: associate mutation latency ≤2s
- [ ] API: Problem Details shape — no stackTrace
- [ ] Component: orphan count badge shows "3"
- [ ] E2E (mobile 375px): client detail with ContactManager no overflow
- [ ] API: 1,000-contact GET `?clienteId=:id` ≤500ms
- [ ] Component: ContactManager with 50+ contacts, all rendered
- [ ] Component: combined orphan filter + search

**Total P2/P3**: 20 scenarios, ~30 min

---

## 6. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16h | MSW setup for adapter URL assertions, Testcontainers for FK constraint tests, TanStack Query spy setup |
| P1 | 22 | 1.0 | 22h | Standard component tests, API integration, E2E navigation flows |
| P2 | 16 | 0.5 | 8h | Simpler assertions, reuse existing fixtures |
| P3 | 4 | 0.25 | 1h | Performance benchmarks, exploratory |
| **Total** | **50** | — | **~47h** | **~6 developer-days** |

### Prerequisites

**Test Data:**

- `clienteFactory` — Faker-based builder for `CreateClienteRequest` (reused from Epic 2)
- `contactoFactory` — Faker-based builder for `CreateContactoRequest` (reused from Epic 3); extend with optional `clienteId` parameter
- `associationFixture` — Vitest fixture that seeds 1 client + 3 contacts (2 assigned, 1 orphan) via MSW handlers; auto-cleanup after each test
- `multiClientFixture` — Fixture with 2 clients + 3 contacts for reassignment tests

**Tooling:**

- Vitest + React Testing Library + MSW 2.x — component tests (already installed)
- xUnit + `Microsoft.AspNetCore.Mvc.Testing` WebApplicationFactory — backend API tests
- Testcontainers for PostgreSQL — confirms `ix_contactos_cliente_id` index and FK `ON DELETE SET NULL` behavior
- Playwright — E2E tests (already configured)
- TanStack Query `QueryClient` test utilities — for asserting `invalidateQueries` calls (spy via `vi.spyOn`)

**Environment:**

- Local PostgreSQL 18 (or Testcontainers ephemeral) for API integration tests
- MSW handlers extended in `src/app/providers/` with contacto association handlers (PUT `/api/v1/contactos/:id/cliente`, GET `?clienteId=:id`, GET `?sinCliente=true`)
- Playwright base URL: `http://localhost:5173` with backend at `http://localhost:5000`
- Both Epic 2 (`clientes`) and Epic 3 (`contactos`) migrations must be applied before Epic 4 backend tests

---

## 7. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — no exceptions; failing P0 blocks merge
- **P1 pass rate**: ≥95% — at most 1 failure allowed with approved waiver
- **P2/P3 pass rate**: ≥90% — informational; does not block release
- **High-risk mitigations**: R-001, R-002, R-004 must have passing tests before Story 4.2, 4.1, and 4.5 respectively are closed

### Coverage Targets

- **Critical paths** (association/disassociation/reassignment): ≥80% line coverage on `clientes/` and `contactos/` modules for Epic 4 additions
- **`ClienteContactServiceAdapter`**: 100% branch coverage (URL construction, all three mutation methods)
- **Backend `AssignContactoCommand` handler**: 100% branch coverage (assign, unassign, reassign paths)
- **API endpoints** (`PUT /api/v1/contactos/{id}/cliente`): 100% coverage (happy path + at least 2 error paths)

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] R-001: All three query key variants invalidated in `useReassignContacto` hook — confirmed by component test spy
- [ ] R-002: `ClienteContactServiceAdapter` requests `?clienteId=:id` — confirmed by MSW URL assertion
- [ ] R-004: Backend handles `?sinCliente=true` and returns only orphan contacts — confirmed by API integration test
- [ ] NFR8: Navigation from client to contact requires ≤2 clicks — confirmed by E2E click count
- [ ] NFR9: Client name visible in contact detail on first render — confirmed by component test
- [ ] No stack traces exposed in any error response (NFR6)
- [ ] All toast and UI text in Spanish (company standard: "Contacto reasignado correctamente", "Sin cliente asignado")

---

## 8. Mitigation Plans

### R-001: Multi-key TanStack Query invalidation incomplete (Score: 9)

**Mitigation Strategy:** Code review mandate: every mutation hook touching the `PUT /api/v1/contactos/{id}/cliente` endpoint must call `queryClient.invalidateQueries` for all three keys: `['contactos']`, `['contactos', { clienteId: previousClienteId }]`, and `['contactos', { clienteId: newClienteId }]`. The test suite uses `vi.spyOn(queryClient, 'invalidateQueries')` to assert all three calls in the reassignment test. Additionally, E2E test verifies that after reassignment, the old client's ContactManager no longer shows the contact and the new client's does — this tests the visible user-facing effect, not the implementation detail.
**Owner:** DEV
**Timeline:** Before Story 4.2 implementation begins; verified at Story 4.6 completion
**Status:** Planned
**Verification:** Component test spy on `queryClient.invalidateQueries` called with all 3 keys; E2E reassign journey confirms correct ContactManager states

### R-002: `ClienteContactServiceAdapter` wiring incorrect (Score: 6)

**Mitigation Strategy:** Component test using MSW URL interception: render `ClienteDetailView` with `clienteId=test-uuid`, assert MSW captures `GET /api/v1/contactos?clienteId=test-uuid` (not `GET /api/v1/contactos`). Additionally, render two separate ClienteDetailView instances with different clienteIds simultaneously (if possible) and assert each ContactManager only shows its own contacts. Code review: verify adapter is instantiated inside `ClienteDetailView` with `useMemo` or similar to ensure `clienteId` is not stale.
**Owner:** DEV
**Timeline:** Story 4.1 implementation
**Status:** Planned
**Verification:** MSW URL assertion test captures exact request URL with correct `clienteId` query parameter

### R-004: Orphan filter query param ignored by backend (Score: 6)

**Mitigation Strategy:** API integration test with Testcontainers: seed 3 assigned contacts + 2 orphan contacts in a clean DB, then GET `/api/v1/contactos?sinCliente=true` and assert exactly 2 records returned. Also test that GET without the param returns all 5. Backend code review: verify `GetContactosQueryHandler.cs` applies `WHERE cliente_id IS NULL` predicate when `SinCliente = true` is passed in the query object. Frontend: MSW handler asserts the `?sinCliente=true` param is present in the actual HTTP request from the filter component.
**Owner:** DEV
**Timeline:** Story 4.5 implementation
**Status:** Planned
**Verification:** API integration test: 3+2 seeded, GET `?sinCliente=true` → exactly 2 returned

---

## 9. Assumptions and Dependencies

### Assumptions

1. Epics 1–3 are complete: foundation (Epic 1), client CRUD (Epic 2), and contact CRUD (Epic 3) are all implemented and passing their test gates. The `contactos.cliente_id` FK column is present and nullable in the database from Epic 3's migration.
2. `siesa-ui-kit`'s `ContactManager` component implements `IContactServiceAdapter` contract — the adapter's method signatures (`getContactos`, `createContact`, `updateContact`, `deleteContact`, `associateContact`, `disassociateContact`) are stable and match the architecture spec.
3. The `PUT /api/v1/contactos/{id}/cliente` endpoint is a NEW endpoint introduced in Epic 4. It is NOT the same as the general `PUT /api/v1/contactos/{id}` update endpoint from Epic 3.
4. The `GET /api/v1/contactos` endpoint already exists from Epic 3. Epic 4 adds support for the `?clienteId=:id` and `?sinCliente=true` query parameters via changes to `GetContactosQueryHandler.cs`.
5. No authentication is required — all API endpoints remain unauthenticated in MVP.
6. The `ContactManager` siesa-ui-kit component handles its own internal state for the contact list display. The adapter only provides data and actions; layout and item rendering are handled by the kit.
7. TanStack Query's `invalidateQueries` correctly matches partial query keys (e.g., `['contactos', { clienteId: 'abc' }]` invalidates the cached query for that specific clienteId). This is standard TanStack Query v5 behavior and is assumed to work correctly.

### Dependencies

1. Epic 3 EF Core `contactos` migration — must be applied and include the nullable `cliente_id` FK column (`fk_contactos_clientes` constraint with `ON DELETE SET NULL`)
2. `siesa-ui-kit` `IContactServiceAdapter` interface definition — must be available to implement `ClienteContactServiceAdapter`
3. MSW handlers for Epic 4 endpoints — new handlers for `PUT /api/v1/contactos/:id/cliente`, `GET /api/v1/contactos?clienteId=:id`, `GET /api/v1/contactos?sinCliente=true` must be added to `src/app/providers/` before Story 4.1 component tests
4. `contactoFactory` from Epic 3 — must be extended to accept optional `clienteId` for seeding associated contacts
5. All Epic 3 backend tests must be passing before Epic 4 backend tests start (shared test DB schema dependency)

### Risks to Plan

- **Risk**: `siesa-ui-kit` `ContactManager` API changes between Epic 3 and Epic 4 implementation
  - **Impact**: `ClienteContactServiceAdapter` method signatures may not match, requiring adapter rework
  - **Contingency**: Verify current `IContactServiceAdapter` interface contract at Story 4.1 start; freeze UI kit version in `package.json`

- **Risk**: `ix_contactos_cliente_id` index missing from Epic 3 migration (was defined in architecture.md but not yet verified)
  - **Impact**: R-010 materializes — `GET /api/v1/contactos?clienteId=:id` performs full table scans
  - **Contingency**: Add missing index in an Epic 4 migration if not present; P2 test detects this early

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` per story (4.1–4.6) to generate failing P0 tests before implementation (TDD red phase).
- Run `*automate` after each story implementation to expand component/unit coverage.
- Run `*trace` at Epic 4 completion to validate FR17–FR27 + AC-E4.1–AC-E4.7 + NFR7–NFR9 traceability.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam Date: ___
- [ ] Tech Lead: SiesaTeam Date: ___
- [ ] QA Lead: SiesaTeam Date: ___

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (TECH/SEC/PERF/DATA/BUS/OPS)
- `probability-impact.md` — Risk scoring methodology (P × I matrix)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md`
- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 3 Test Design (reference format): `_bmad-output/test-design-epic-3.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
