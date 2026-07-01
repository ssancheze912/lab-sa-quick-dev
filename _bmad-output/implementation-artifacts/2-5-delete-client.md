# Story 2.5: Delete Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog (`siesa-ui-kit` `AlertDialog`) appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options (TC-E2-P0-04).

2. **Given** the user confirms the deletion of a client with NO associated contacts, **When** the deletion is processed (`DELETE /api/v1/clientes/{id}`), **Then** the client is removed from the list immediately (no manual refresh, no full page reload) (FR27), **the right panel returns to the empty/default state**, **and** a toast shows exactly "Cliente eliminado correctamente" (TC-E2-P2-07).

3. **Given** the user confirms the deletion of a client that HAS associated contacts, **When** the deletion is processed, **Then** the client record is deleted, **all previously associated contacts remain in the system with their data intact** (NOT cascade-deleted — verified at the database FK level, `ON DELETE SET NULL`, not application-level pre-delete logic) (R2, TC-E2-P0-03), **those contacts' `cliente_id` becomes `NULL`** (so they subsequently appear in a "Sin cliente" / `sinCliente=true` filter, FR25 — filter UI itself is out of scope, delivered in Epic 4), **and** the toast shows exactly "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (TC-E2-P0-04).

4. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged **and** zero `DELETE` API calls are made (TC-E2-P1-11).

5. **Given** the user dismisses the confirmation dialog via Esc key or backdrop click (not an explicit "Cancelar" click), **When** the dialog closes, **Then** the client is NOT deleted and zero `DELETE` API calls are made (R9, TC-E2-P2-03).

6. **Given** a `DELETE /api/v1/clientes/{id}` is made for an `id` that does not exist, **When** the backend processes the request, **Then** it returns `404 Not Found` and the frontend does not show a false-success toast.

## Tasks / Subtasks

- [ ] Task 1 — Backend: `contactos` table + `ContactoEntity` with nullable FK (AC: #3)
  - [ ] Create `ContactoEntity` (`backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`) — properties: `Id` (Guid, base `Entity`), `Nombre` (string), `Cargo` (string), `Telefono` (string), `Email` (string), `ClienteId` (`Guid?`, nullable), `CreatedAt`/`UpdatedAt` (`DateTimeOffset`). Private constructor + static `Create(...)` factory, mirroring `ClienteEntity`'s exact pattern (required-field `ArgumentException` guards for `Nombre`; `ClienteId` is optionally nullable so it is NOT a required-field guard). This is the minimal entity shape needed to prove FK orphaning for this story — full Contacto CRUD (Create/Update/Delete/List) is Epic 3 scope; do NOT build `IContactoRepository`, `ContactoEndpoints`, commands, or any Contacto-facing API/UI beyond what this task and Task 2 require to prove the FK behavior.
  - [ ] Create `ContactoConfiguration.cs` (`backend/src/SiesaAgents.Infrastructure/Data/Configurations/`), mirroring `ClienteConfiguration.cs`'s structure — table `contactos`, PK `id`, and **explicitly configure the FK**: `.HasOne<ClienteEntity>().WithMany().HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.SetNull)`. This is the single most critical line in the story (R2/TC-E2-P0-03) — do NOT rely on EF Core's default convention for nullable FKs, which is not guaranteed to be `SetNull` across EF Core versions/configurations. Register `ContactoConfiguration` in `AppDbContext.OnModelCreating` alongside `ClienteConfiguration`.
  - [ ] Generate EF Core migration `AddContactoEntity` (`dotnet ef migrations add AddContactoEntity`) — verify the generated SQL contains `ON DELETE SET NULL` on the `contactos.cliente_id` FK constraint (`fk_contactos_clientes` per naming convention) before considering this task done. Indexes: `ix_contactos_cliente_id` (per architecture). Apply naming via existing `ApplySnakeCaseNaming()` convention — no manual `[Column]`/`[Table]` attributes.

- [ ] Task 2 — Backend: `DeleteClienteCommand` + Handler + endpoint (AC: #2, #3, #6)
  - [ ] Add `Task<bool> DeleteAsync(Guid id, CancellationToken ct)` to `IClienteRepository` (`backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs`) — additive, alongside `GetAllAsync`/`GetByIdAsync`/`AddAsync`/`UpdateAsync`. Returns `false` if no entity with `id` exists (404 case), else deletes and returns `true`.
  - [ ] Add `Task<int> CountByClienteIdAsync(Guid clienteId, CancellationToken ct)` to `IClienteRepository` (or a lightweight equivalent on a to-be-introduced minimal Contacto read path) used ONLY to decide which of the two success toast variants applies (AC #2 vs #3) — do NOT build this as a heavier Contacto query-stack feature; a direct `AppDbContext.Set<ContactoEntity>().CountAsync(c => c.ClienteId == clienteId, ct)` inside `ClienteRepository` is sufficient and keeps this story's Contacto footprint minimal (Epic 3 will build the real `IContactoRepository`).
  - [ ] Implement `DeleteAsync` in `ClienteRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`) — load tracked entity by `Id`; if not found return `false`; else `Remove` and `SaveChangesAsync`, return `true`. Do NOT manually null out related contacts' `ClienteId` in application code — the FK's `ON DELETE SET NULL` (Task 1) must be the mechanism that orphans contacts (proves R2 is closed at the DB level, not papered over by app logic that could silently regress).
  - [ ] Create `DeleteClienteCommand.cs` (record with `Id` (Guid)) and `DeleteClienteCommandHandler.cs` (`backend/src/SiesaAgents.Application/Commands/Clientes/`), sibling to `UpdateClienteCommand.cs` (actual on-disk path `Application/Commands/Clientes/`, per Stories 2.3/2.4 precedent — do NOT use the architecture doc's illustrative `Application/Clientes/Commands/` path). Handler: calls the contact-count check BEFORE deleting (to know which toast variant the response should signal), then `IClienteRepository.DeleteAsync`; returns a small result indicating `(deleted: bool, hadAssociatedContacts: bool)` so the endpoint can shape its response — no new DTO needed beyond this tuple/record; do not touch `ClienteDto`.
  - [ ] Add `app.MapDelete("/api/v1/clientes/{id:guid}", ...)` to `ClienteEndpoints.cs` — Minimal API, binds `Guid id` from route. Returns `204 No Content` on success (no response body needed — the frontend already knows from its own pre-delete state whether the client had contacts, since `ClienteDetailView`/`ContactManager` context is not yet wired until Epic 4, so for THIS story the frontend determines toast variant from the count of contacts it already may not have — see Task 4 for the pragmatic approach). Returns `404 Not Found` if the handler reports `deleted: false`. Tagged `.WithTags("Clientes")`, named `"DeleteCliente"`. `GET`/`POST`/`PUT /api/v1/clientes` endpoints left unmodified — purely additive change, same discipline as Stories 2.3/2.4.

- [ ] Task 3 — Backend: expose contact count/orphaning signal to the frontend (AC: #3)
  - [ ] Since full Contacto CRUD/query endpoints are Epic 3 scope and not available yet, the `DELETE /api/v1/clientes/{id}` response must itself communicate whether the deleted client had associated contacts, so the frontend can choose the correct toast copy without needing a separate Contacto endpoint. Return `204 No Content` normally, but when `hadAssociatedContacts` is `true`, include a custom response header `X-Had-Associated-Contacts: true` (simplest additive mechanism — avoids introducing a new response body/DTO for a 204, and avoids any premature Contacto API surface). Document this header's contract inline as a code comment in `ClienteEndpoints.cs` referencing this story, since it is a narrow, story-scoped mechanism Epic 3/4 may later replace with a richer contract.
  - [ ] Add an xUnit integration test asserting the header is present and `"true"` when contacts exist, and absent (or `"false"`) when they don't.

- [ ] Task 4 — Frontend: `useDeleteCliente` mutation hook (AC: #2, #3, #6)
  - [ ] Add `remove(id): Promise<{ hadAssociatedContacts: boolean }>` to `IClienteRepository.ts` (`frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts`) — additive; `getAll`/`getById`/`create`/`update` signatures unchanged.
  - [ ] Implement `remove` in `clienteApiRepository.ts` (`frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts`) — `DELETE /api/v1/clientes/${id}` via the existing `apiClient` Axios instance; reads the `X-Had-Associated-Contacts` response header (Task 3) to build the returned `{ hadAssociatedContacts }` value; errors propagate as rejected promises (no swallowing), mirrors `create`/`update`'s exact pattern.
  - [ ] Create `useDeleteCliente.ts` (`frontend/src/modules/crm/clientes/application/hooks/`) — TanStack Query `useMutation`. `onSuccess`: invalidates `['clientes']` (list) + conditionally shows one of the two exact toast strings based on `hadAssociatedContacts`: `toast.success('Cliente eliminado correctamente')` (no contacts) or `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')` (had contacts). Does NOT invalidate `['clientes', id]` — the detail query for a deleted client should not be refetched (would 404); instead the calling component clears its own selected-client state (Task 5). `onError`: 404 (via `isAxiosError` + `status === 404`) triggers `toast.error('El cliente ya no existe.')`; any other error triggers the same generic `toast.error('No se pudo eliminar. Intenta de nuevo.')` pattern used by `useCreateCliente`/`useUpdateCliente`. Mirror those hooks' structure exactly, do not invent a different error-handling shape.

- [ ] Task 5 — Frontend: "Eliminar" trigger + confirmation dialog in `ClienteDetailView` (AC: #1, #2, #3, #4, #5)
  - [ ] Add an "Eliminar" `Button` (`siesa-ui-kit`, e.g. `type="outline"` or a destructive-styled variant if the kit exposes one — check `siesa-ui-kit`'s `Button` prop surface before falling back to plain default styling; do not hand-roll custom destructive CSS) to `ClienteDetailView.tsx`, alongside the existing "Editar" button in the same `cliente-detail-panel` success branch (only rendered when a client is successfully loaded).
  - [ ] Clicking "Eliminar" opens a second `siesa-ui-kit` `AlertDialog` instance (separate from the existing edit-mode `AlertDialog`) with `title="¿Eliminar este cliente?"`, an explicit `actions` pair wired to "Confirmar" (calls `useDeleteCliente().mutate(clienteId)`) and "Cancelar" (closes the dialog, zero mutation calls — AC #4). Confirm the `AlertDialog`'s underlying primitive (Radix `AlertDialog` per prior stories' precedent) treats Esc/backdrop dismissal as equivalent to "Cancelar" (no mutation fires) — if the kit's default backdrop/Esc behavior is a no-op close, no extra wiring is needed; if it silently confirms, an explicit `onCancel`/`onOpenChange` handler must intercept and route Esc/backdrop dismissal to the same no-op close path (AC #5, R9).
  - [ ] On successful deletion, clear the currently-selected client so the right panel returns to its empty/default state (`cliente-detail-empty`, the existing "Selecciona un cliente para ver el detalle." block) — this requires the parent split-panel view (`clientes.tsx`/`clientes.$clienteId.tsx` route, wherever selected-client state or the route param lives) to react to deletion (e.g., navigate back to `/clientes` on success, or clear local selection state, whichever mechanism the existing routing already uses for "no client selected"). Follow the existing pattern already established for `cliente-not-found` navigation/state, do not introduce a new competing state store.
  - [ ] All user-facing text in Spanish ("Eliminar" button label, "¿Eliminar este cliente?", "Confirmar", "Cancelar", both toast variants exactly as specified); code identifiers in English.

- [ ] Task 6 — Tests (AC: all)
  - [ ] Backend xUnit: `ClienteRepositoryTests` — `DeleteAsync` happy path (client with zero contacts), happy path with contacts (assert contacts survive with `ClienteId == null` post-delete — **must run against real/TestContainers PostgreSQL, not EF Core InMemory**, since InMemory does not enforce FK `ON DELETE` behavior — R2/TC-E2-P0-03 is explicitly called out as the single most important test in the epic), and not-found (`false` return).
  - [ ] Backend xUnit integration (`WebApplicationFactory<Program>`): `ClienteEndpointsTests` — `DELETE` 204/404 contract cases, plus the `X-Had-Associated-Contacts` header presence/value assertion from Task 3.
  - [ ] Frontend Vitest + RTL: extend `ClienteDetailView.test.tsx` — "Eliminar" opens confirmation dialog (AC #1), confirming with no associated contacts shows "Cliente eliminado correctamente" and returns to empty state (AC #2, TC-E2-P2-07), confirming with associated contacts shows the exact orphaning-toast copy (AC #3), "Cancelar" makes zero `DELETE` calls and leaves the client detail unchanged (AC #4, TC-E2-P1-11), Esc/backdrop dismissal makes zero `DELETE` calls (AC #5, TC-E2-P2-03).
  - [ ] Frontend Vitest + RTL: `useDeleteCliente.test.tsx` (mirrors `useUpdateCliente.test.tsx`) — success (no contacts) invalidates `['clientes']` + correct toast, success (with contacts) shows the orphaning toast variant, 404 shows the not-found toast, other errors show the generic error toast.
  - [ ] MSW handlers (`frontend/src/test/msw/handlers.ts`): add `DELETE /api/v1/clientes/:id` handler variants (204 with and without `X-Had-Associated-Contacts` header, 404).
  - [ ] E2E (Playwright, Chromium): `e2e/tests/clientes/delete-client.spec.ts` — two full journeys: (a) delete a client with zero contacts → assert list update + "Cliente eliminado correctamente" + empty right panel (TC-E2-P2-07); (b) delete a client seeded with ≥1 associated contact (via a minimal test-only contact seed, e.g. direct DB insert or a test helper — Contacto has no CRUD API yet) → assert exact orphaning toast copy (TC-E2-P0-04). Plus a Cancelar-preserves-client scenario (TC-E2-P1-11). Full `e2e/tests/clientes/` suite must remain green (no regression to Stories 2.1–2.4 scenarios).
  - [ ] Backend xUnit integration: R2/TC-E2-P0-03 as its own explicit standalone test — create client, create 2 contacts (direct `AppDbContext` seeding, not via a nonexistent Contacto API) with `ClienteId` set, `DELETE` the client, assert both contacts still exist in the DB with `ClienteId == null` (query directly via `AppDbContext`, since `GET /api/v1/contactos/{id}` does not exist yet — that endpoint is Epic 3 scope).

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the delete-client flow and the minimal `ContactoEntity`/FK/migration needed to prove the orphaning behavior (R2) at the database level. It does **not** implement:
- Sort controls (Story 2.6).
- Any Contacto CRUD API, `IContactoRepository`, `ContactoEndpoints`, Contacto commands/queries/DTOs, or Contacto frontend module (`useContactos*`, `ContactoListView`, etc.) — all of that is Epic 3 scope. This story creates `ContactoEntity` + its EF configuration + migration ONLY because the FK's `ON DELETE SET NULL` behavior cannot be proven without a real `contactos` table existing in the schema; Epic 3 will build the full feature set on top of this same entity/table without needing to re-migrate it.
- The "Sin cliente" filter UI itself (FR25's user-facing filter control) — that is Epic 4 (Story 4.5). This story only guarantees the DATA STATE that makes that future filter meaningful (contacts end up with `cliente_id = NULL` and are therefore filterable later).
- Any change to `GetClientesQuery`/`GetClienteByIdQuery`/`CreateClienteCommand`/`UpdateClienteCommand` or their handlers — purely additive `DeleteClienteCommand`.

`IClienteRepository` (backend and frontend) is extended with `DeleteAsync`/`remove` — the existing `GetAllAsync`/`getAll` (2.1), `GetByIdAsync`/`getById` (2.2), `AddAsync`/`create` (2.3), and `UpdateAsync`/`update` (2.4) must remain unmodified.

### Previous Story Intelligence (Stories 2.1–2.4)

- `ClienteDetailView.tsx` currently renders "Editar" as the only action button in the `cliente-detail-panel` success branch, opening a `siesa-ui-kit` `AlertDialog` hosting `ClienteForm` in `mode="edit"` (Story 2.4). This story adds a SECOND button ("Eliminar") and a SECOND, independent `AlertDialog` instance for the delete confirmation — do not repurpose or nest inside the edit dialog. [Source: frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.tsx]
- `ClienteDetailView` already has three empty/error/not-found branches (`cliente-detail-empty`, `cliente-not-found` ×2) that render BEFORE the success (`cliente-detail-panel`) branch — after a successful delete, the view must transition back to the `cliente-detail-empty` branch (no `clienteId` selected), which is the existing "Selecciona un cliente para ver el detalle." state. Reuse it, do not create a new empty-state variant.
- `useCreateCliente.ts`/`useUpdateCliente.ts` (Stories 2.3/2.4) established the exact mutation hook shape to replicate for `useDeleteCliente.ts`: `useMutation` + `isAxiosError`/`status` discrimination for a specific status code (409 for those, 404 here) + generic `toast.error` fallback + `toast.success` with EXACT Spanish string(s) on success. This story's twist: TWO possible success toast strings depending on response data (contacts present or not), decided from the `X-Had-Associated-Contacts` header (Task 3) rather than a status-code branch.
- `useUpdateCliente.ts` invalidates BOTH `['clientes']` and `['clientes', id]`. `useDeleteCliente.ts` deliberately invalidates ONLY `['clientes']` — invalidating `['clientes', id]` for a now-deleted client would trigger a refetch that 404s, which is unnecessary noise; the detail view instead clears its own selection (Task 5).
- Backend: `UpdateClienteCommandHandler` (Story 2.4) established the handler pattern: no `AutoMapper`, manual mapping. `DeleteClienteCommandHandler` follows the same manual style, returning a small result tuple/record (not `ClienteDto`, since there is nothing to return after a delete beyond the orphaning signal).
- The actual on-disk backend folder structure is `Application/Commands/Clientes/` and `Application/Queries/Clientes/` (flat `Application/{Kind}/{Domain}/`), confirmed across Stories 2.1–2.4 — this differs from the architecture doc's illustrative tree (`Application/Clientes/Commands/`). Follow the ACTUAL on-disk convention: `Commands/Clientes/DeleteClienteCommand.cs`.
- `ClienteRepository.UpdateAsync` was code-review-hardened in Story 2.4 to explicitly manage EF Core entity state (`Modified`) rather than rely on identity-map side effects. Apply the same discipline to `DeleteAsync`: load the tracked entity explicitly via `GetByIdAsync`-equivalent, `Remove` it explicitly, do not attempt any implicit/attached-by-convention shortcuts.
- Backend response bodies are camelCase (ASP.NET Core Minimal API default) — not directly relevant to a `204 No Content` response, but the new `X-Had-Associated-Contacts` header name and `"true"`/`"false"` string values must be treated as the sole extra contract surface introduced by this story.
- `pnpm` is the package manager; all required libraries (`siesa-ui-kit`, TanStack Query, Axios) are already installed — no new dependencies expected for this story.

### Architecture References

- REST endpoint: `DELETE /api/v1/clientes/{id}` → `204 No Content` (or `404` if not found) — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Data model: `contactos` table `cliente_id UUID NULL REFERENCES clientes(id) ON DELETE SET NULL`, index `ix_contactos_cliente_id` — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, "PostgreSQL tables"]
- Domain model: "Disassociation = set ClienteID = NULL (no record deletion)" — the exact behavior this story's delete-client flow must trigger as a side effect via the DB FK, not application code — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, "Domain Model"]
- CQRS Command pattern: `DeleteClienteCommand.cs` + `DeleteClienteCommandHandler.cs` in `Application/Commands/Clientes/` (actual on-disk path, sibling to `UpdateClienteCommand.cs`) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure], confirmed against actual repo structure.
- Frontend files: `useDeleteCliente.ts` (mutation hook, architecture's documented file name) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Query key convention: mutation invalidates `['clientes']` (list) after delete; does not target `['clientes', id]` since that resource no longer exists — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, TanStack Query keys (canonical)]
- Naming conventions: FK constraint `fk_contactos_clientes`, index `ix_contactos_cliente_id`, table `contactos` (plural snake_case), column `cliente_id` — [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, FluentValidation + Zod dual validation where applicable, TanStack Query/Router, `pnpm`, Spanish UI text, Problem Details RFC 7807, EF Core `ApplySnakeCaseNaming()`): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (module/entity/repository structure after 2.1–2.4, actual on-disk `Commands/Clientes/` path, `AlertDialog` P0 dialog primitive precedent, `isAxiosError` status-check pattern, manual DTO mapping, explicit EF Core entity-state management post-2.4 code review): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md]

### Test Design References (Epic 2 test plan)

- TC-E2-P0-03 (API Integration, P0, **single most important test in the epic**): Delete client sets associated contacts' `cliente_id` to `NULL`, not cascade delete — AC #3. Risk covered: R2. Must run against real/TestContainers Postgres, not InMemory. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P0-03]
- TC-E2-P0-04 (E2E): Delete confirmation flow shows correct toast and orphaning message — AC #1, #3. Risk covered: R2, R11. Verify the plain "Cliente eliminado correctamente" variant is NOT shown when contacts exist (i.e., the two toast variants must never cross). [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P0-04]
- TC-E2-P1-11 (Component): Delete confirmation dialog — Cancel preserves client, no DELETE API call made — AC #4. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-11]
- TC-E2-P2-03 (Component): Delete dialog dismissal via Esc/backdrop does not delete, no DELETE API call made — AC #5. Risk covered: R9. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P2-03]
- TC-E2-P2-07 (Component/E2E): Delete without associated contacts shows the simple toast variant ("Cliente eliminado correctamente") — AC #2. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P2-07]
- R2 risk (highest-impact hidden risk in the epic): FK `cliente_id` on `contactos` misconfigured as `ON DELETE CASCADE`/`NO ACTION` instead of `ON DELETE SET NULL`, silently destroying contact records — must be verified at the database/migration level via a real Postgres integration test, not inferred from UI behavior. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#R2]
- R9 risk: clicking outside the dialog or pressing Esc deletes the client instead of cancelling. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#R9]
- Epic 2 "Notes for Story Implementation Agents" #1 and #6 (verbatim toast copy for both delete variants, explicit EF Core FK configuration, not relying on defaults): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#10. Notes for Story Implementation Agents]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements ("Eliminar" `Button`, the confirmation `AlertDialog` and its "Confirmar"/"Cancelar" actions) before building custom components.
- **Constraint**: Reuse the existing `AlertDialog` host pattern established in Stories 2.3/2.4 — this story adds a SECOND, independent `AlertDialog` instance (delete confirmation) alongside the existing edit-mode one, not a new dialog mechanism. Per the architecture's fallback order (`siesa-ui-kit (P0) → shadcn/ui Dialog → custom`), `AlertDialog` is already the confirmed primitive; no new evaluation needed.
- This story does **not** use `MasterCrud` — same rationale as Stories 2.3/2.4: Epic 2's client screens are a custom split-panel list/detail composition, not a `MasterCrud`-orchestrated screen. Do not introduce `MasterCrud` into this module.
- Icons: Heroicons primary (already installed), consistent with Stories 2.1–2.4.
- All user-facing text ("Eliminar" button label, "¿Eliminar este cliente?", "Confirmar", "Cancelar", both exact toast strings) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (204/404 paths + header contract); the FK-orphaning test (R2/TC-E2-P0-03) MUST run against a real/TestContainers PostgreSQL (InMemory does not enforce FK constraints) — same constraint class as Story 2.4's unique-violation test.
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards; delete is a critical path targeted at 100% per test-design-epic-2.md.
- R2 (FK orphaning, highest-impact risk in the epic): the standalone DB-level integration test (Task 6, last bullet) is non-negotiable — do not consider this story done without it passing against real Postgres.
- R9 (accidental delete via Esc/backdrop): explicitly test dismissal paths beyond the "Cancelar" button click.
- R11 (toast copy exactness): both toast variants must match verbatim, no paraphrasing, and must never be swapped (contacts-present must never show the simple variant and vice versa).

### Project Structure Notes

- Fifth story to touch `frontend/src/modules/crm/clientes/` and `backend/src/SiesaAgents.*/` — extends existing files, does not create new Cliente module scaffolding.
- First story to introduce `ContactoEntity`/`contactos` table — a deliberately minimal slice (entity + EF configuration + migration only) to unblock this story's FK-orphaning requirement; Epic 3 owns the full Contacto feature (repository, commands, queries, endpoints, frontend module) and will build on top of this same table without re-migrating.
- Third story to add a Command to the backend `Clientes` domain (`Commands/Clientes/DeleteClienteCommand.cs`, sibling to Stories 2.3/2.4's Create/Update commands) — establishes no new pattern, replicates the exact CQRS command structure.
- The `X-Had-Associated-Contacts` response header (Task 3) is a narrow, story-scoped contract addition needed only because Contacto's read API does not exist yet; flag in the PR/commit that Epic 3/4 may supersede this mechanism once a proper Contacto query surface exists — this is an accepted, documented variance, not an oversight.
- No other variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and CQRS conventions, adjusted for the confirmed actual on-disk path (`Application/Commands/Clientes/` not `Application/Clientes/Commands/`).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
