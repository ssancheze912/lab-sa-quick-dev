# Story 2.4: Edit Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form (`ClienteForm` in `mode="edit"`) opens pre-filled with the current values of all four fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6) (TC-E2-P1-08).

2. **Given** the user modifies one or more fields and submits, **When** the form is saved (`PUT /api/v1/clientes/{id}`), **Then** the changes are reflected in the client detail view and list immediately, no manual refresh, no full page reload (FR27, NFR2). **And** a toast de éxito muestra exactamente "Cliente actualizado correctamente" (TC-E2-P1-09, TC-E2-P2-06).

3. **Given** the backend independently validates the request (defense in depth, mirrors Story 2.3's R3), **When** a `PUT /api/v1/clientes/{id}` is made with empty/whitespace-only required fields (bypassing frontend), **Then** the backend returns `400 Bad Request` with FluentValidation field-level error details (`errors: { nombre: [...] }`) and no changes are persisted.

4. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on the empty field (FR8) via Zod (frontend) **and** the form is NOT submitted to the backend (TC-E2-P1-10).

5. **Given** the user submits a NIT/RUC that collides with a DIFFERENT existing client's NIT/RUC, **When** the backend returns a `409 Conflict`, **Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6, mirrors Story 2.3 AC #5). **And** the form remains open with the entered data intact (no data loss).

6. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged in the detail view and list, **and** zero API calls are made (TC-E2-P1-15 / R8).

7. **Given** a client is edited with its OWN unchanged NIT/RUC (no actual collision), **When** the form is saved, **Then** the update succeeds — the uniqueness check must exclude the client's own record from the collision check (self-exclusion).

## Tasks / Subtasks

- [ ] Task 1 — Backend: `ClienteEntity` mutation behavior for update (AC: #2, #3, #7)
  - [ ] Add an `Update(string nombre, string nit, string telefono, string ciudad)` instance method to `ClienteEntity` (`backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`) — reuses the exact same required-field validation as `Create` (throws `ArgumentException` per empty/whitespace field), reassigns all four mutable properties, and sets `UpdatedAt = DateTimeOffset.UtcNow`. Do NOT touch `Id` or `CreatedAt`. Do NOT alter `Create` or the private constructor.
  - [ ] Add `Task<ClienteEntity?> UpdateAsync(ClienteEntity cliente, CancellationToken ct)` to `IClienteRepository` (`backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs`) — additive, alongside existing `GetAllAsync`/`GetByIdAsync`/`AddAsync`. Returns `null` if no entity with `cliente.Id` exists (404 case), else persists and returns the updated entity.
  - [ ] Implement `UpdateAsync` in `ClienteRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`) — load tracked entity by `Id` via `AppDbContext`, if not found return `null`; else call the loaded entity's `Update(...)` (do NOT construct a brand-new `ClienteEntity` — EF Core must track the existing row) and `SaveChangesAsync`. Let a Postgres unique-constraint violation on `uk_clientes_nit` (from a different client sharing the new NIT) propagate as `DbUpdateException`/`Npgsql` unique-violation — same race-condition-safe pattern as Story 2.3's `AddAsync` (AC #5, #7 — the DB constraint is per-value, not per-value-excluding-self, so self-update with an unchanged NIT does not violate it because the row being updated IS the one holding that NIT already).

- [ ] Task 2 — Backend: `UpdateClienteCommand` + Handler + Validator + 404/400/409 mapping (AC: #2, #3, #5, #7)
  - [ ] Create `UpdateClienteCommand.cs` (`backend/src/SiesaAgents.Application/Commands/Clientes/`) — properties `Id` (Guid), `Nombre`, `Nit`, `Telefono`, `Ciudad`. Sibling to `CreateClienteCommand.cs` in the same folder (mirror Story 2.3's exact folder — do NOT create a new `Application/Clientes/Commands/` path; this project uses `Application/Commands/Clientes/`).
  - [ ] Create `UpdateClienteCommandHandler.cs` in the same folder — calls `IClienteRepository.GetByIdAsync(command.Id, ct)`; if `null`, return `null` (endpoint maps to 404); else calls `IClienteRepository.UpdateAsync` with the loaded entity mutated via `.Update(...)`, maps the result to `ClienteDto` (`backend/src/SiesaAgents.Application/DTOs/ClienteDto.cs`, reused as-is — no new DTO shape), returns it.
  - [ ] Create `UpdateClienteRequestValidator.cs` (FluentValidation, `backend/src/SiesaAgents.Application/Validators/`) — `Nombre`, `Nit`, `Telefono`, `Ciudad` all `NotEmpty()`, mirrors `CreateClienteRequestValidator.cs` exactly (do not validate `Id`, it comes from the route). Invoked explicitly in the `PUT` endpoint (Minimal API has no `[ApiController]` auto-validation, same as Story 2.3's `POST`).
  - [ ] In `ClienteEndpoints.cs`, catch the same `DbUpdateException`/`PostgresException.SqlState == "23505"` pattern already established by `IsUniqueViolation` (Story 2.3) and map to `409 Conflict` via `Results.Problem` with `detail` = "El NIT/RUC ya está registrado" (NFR6). FluentValidation failures map to `400 Bad Request` via `Results.ValidationProblem`. Handler returning `null` (client not found) maps to `Results.NotFound()`.

- [ ] Task 3 — Backend: `PUT /api/v1/clientes/{id}` endpoint (AC: #2, #3, #5, #7)
  - [ ] Add `app.MapPut("/api/v1/clientes/{id:guid}", ...)` to `ClienteEndpoints.cs` — Minimal API, binds `Guid id` from the route and `UpdateClienteCommand` from the request body (construct the command with the route `id` overriding any body `id` to prevent mismatch). Returns `200 OK` with the updated `ClienteDto` on success. Tagged `.WithTags("Clientes")`, named `"UpdateCliente"`.
  - [ ] `GET`/`POST /api/v1/clientes` endpoints left unmodified — purely additive change, same discipline as Story 2.3.

- [ ] Task 4 — Frontend: `useUpdateCliente` mutation hook (AC: #2, #5)
  - [ ] Add `update(id, data): Promise<Cliente>` to `IClienteRepository.ts` (`frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts`) — additive; `getAll`/`getById`/`create` signatures unchanged.
  - [ ] Implement `update` in `clienteApiRepository.ts` (`frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts`) — `PUT /api/v1/clientes/${id}` via the existing `apiClient` Axios instance; errors propagate as rejected promises (no swallowing), mirrors `create`'s exact pattern.
  - [ ] Create `useUpdateCliente.ts` (`frontend/src/modules/crm/clientes/application/hooks/`) — TanStack Query `useMutation`. `onSuccess`: invalidates BOTH `['clientes']` (list) AND `['clientes', id]` (detail, per architecture's canonical query keys) + `toast.success('Cliente actualizado correctamente')`. `onError`: 409 (via `isAxiosError` + `status === 409`, same discrimination pattern as `useCreateCliente`) is NOT toasted (left for `ClienteForm` to render inline); any other error triggers `toast.error('No se pudo guardar. Intenta de nuevo.')`. Mirror `useCreateCliente.ts`'s structure exactly, do not invent a different error-handling shape.

- [ ] Task 5 — Frontend: wire `ClienteForm` edit mode + "Editar" trigger in `ClienteDetailView` (AC: #1, #2, #4, #5, #6, #7)
  - [ ] `ClienteForm.tsx` (`frontend/src/modules/crm/clientes/presentation/components/`) already accepts `mode: 'create' | 'edit'` and `initialValues` props from Story 2.3 but currently ALWAYS calls `useCreateCliente` internally regardless of `mode` (the `mode` param is prefixed `_mode`, unused). Wire the branch: when `mode === 'edit'`, call `useUpdateCliente(initialValues's id)` (or pass `id` as a new required prop when `mode === 'edit'`) instead of `useCreateCliente`; keep the `create` path byte-for-byte unchanged. Do not restructure the field-rendering JSX (Input components, error-display logic) — only branch the mutation call.
  - [ ] Add an `onCancel` callback prop to `ClienteForm` (or reuse the existing dialog-close mechanism from `AlertDialog`'s host) so "Cancelar" closes the form without calling any mutation and without mutating any local state that could leak (AC #6) — clicking Cancelar must trigger zero network requests.
  - [ ] Add an "Editar" `Button` (`siesa-ui-kit`) to `ClienteDetailView.tsx` (`frontend/src/modules/crm/clientes/presentation/components/`) rendered alongside the existing `dl` detail block (only when a client is successfully loaded — i.e., in the same branch as the current `cliente-detail-panel` return, not in loading/error/not-found states). Clicking it opens `ClienteForm` in `mode="edit"` with `initialValues` populated from the already-loaded `data` (no extra fetch — the detail view already has the full `Cliente` object in memory), hosted in `siesa-ui-kit`'s `AlertDialog` — same P0 dialog primitive precedent as Story 2.3's "Nuevo cliente" trigger (confirmed: no separate `Dialog` export exists in the kit).
  - [ ] All user-facing text in Spanish ("Editar" button label); code identifiers in English.

- [ ] Task 6 — Tests (AC: all)
  - [ ] Backend xUnit: `ClienteRepositoryTests` — `UpdateAsync` happy path, not-found (`null` return), and duplicate-NIT-from-different-client `DbUpdateException` case; add a case proving self-update with unchanged NIT does NOT throw (AC #7).
  - [ ] Backend xUnit integration (`WebApplicationFactory<Program>`): `ClienteEndpointsTests` — `PUT` 200/400/404/409 contract cases.
  - [ ] Frontend Vitest + RTL: extend `ClienteForm.test.tsx` — edit-mode pre-fill (TC-E2-P1-08), edit-mode empty-field validation blocks submit (TC-E2-P1-10), edit success toast exact copy "Cliente actualizado correctamente" (TC-E2-P2-06), Cancelar makes zero API calls and preserves original values (TC-E2-P1-15).
  - [ ] Frontend Vitest + RTL: `useUpdateCliente.test.tsx` (mirrors `useCreateCliente.test.tsx`) — success invalidates both query keys + toast, 409 does not toast, other errors toast generic message.
  - [ ] MSW handlers (`frontend/src/test/msw/handlers.ts`): add `PUT /api/v1/clientes/:id` handler variants (200, 400, 404, 409) alongside the existing `POST` handlers.
  - [ ] E2E (Playwright, Chromium): `e2e/tests/clientes/edit-client.spec.ts` — full edit journey: open detail → click "Editar" → verify pre-fill → change `Ciudad` → submit → assert detail panel updates immediately + toast exact copy (TC-E2-P1-09). Full `e2e/tests/clientes/` suite must remain green (no regression to Story 2.1/2.2/2.3 scenarios).

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the edit-client `PUT` flow. It does **not** implement:
- Delete client (Story 2.5).
- Sort controls (Story 2.6).

`IClienteRepository` (backend and frontend) is extended with `UpdateAsync`/`update` — the existing `GetAllAsync`/`getAll` (2.1), `GetByIdAsync`/`getById` (2.2), and `AddAsync`/`create` (2.3) must remain unmodified. `ClienteDto` (backend) and `Cliente` (frontend entity interface) are reused as-is; no new DTO/entity response shape — only the new `UpdateClienteCommand` request input shape is new.

### Previous Story Intelligence (Stories 2.1–2.3)

- `ClienteForm.tsx` was explicitly built in Story 2.3 with THIS story in mind: it already accepts `mode: 'create' | 'edit'` and `initialValues?: ClienteFormValues` props, but the `mode` parameter is currently destructured as `_mode` (unused — prefixed to silence lint) and the component unconditionally calls `useCreateCliente()` regardless of mode. **This story's Task 5 is to complete that wiring**, not to redesign the component. [Source: frontend/src/modules/crm/clientes/presentation/components/ClienteForm.tsx]
- `ClienteForm`'s inline-error rendering only shows the error TEXT for the first invalid field (in `Nombre → NIT/RUC → Teléfono → Ciudad` order) at a time — a deliberate Story 2.3 fix for ambiguous `findByText` queries in tests. Every invalid field still gets the red `error` border. Preserve this exact behavior; do not "fix" it as part of this story.
- `ClienteDetailView.tsx` currently has NO edit trigger — it renders a read-only `<dl>` block (`data-testid="cliente-detail-panel"`) inside `useCliente(clienteId)`'s success branch. This story adds the "Editar" button/dialog INTO that existing success branch — compose, don't rewrite the loading/error/not-found branches above it.
- `useCreateCliente.ts` established the exact mutation hook shape to replicate: `useMutation` + `isAxiosError`/`status === 409` discrimination (does NOT toast on 409, leaves it for the form) + generic `toast.error` for all other failures + `toast.success` with an EXACT Spanish string on success. `useUpdateCliente.ts` must follow this pattern, differing only in: (a) calling `clienteApiRepository.update` instead of `.create`, (b) invalidating `['clientes', id]` in addition to `['clientes']` (edit affects a specific detail view the list does not), (c) the success toast text.
- Backend: `CreateClienteCommandHandler` (Story 2.3) established the handler pattern: no `AutoMapper`, manual `new ClienteDto(...)` construction from the entity. `UpdateClienteCommandHandler` should mirror this manually-mapped style, not introduce a mapping library.
- `IsUniqueViolation(DbUpdateException ex)` already exists as a private static helper in `ClienteEndpoints.cs` (Story 2.3) — reuse it as-is for the `PUT` endpoint's 409 mapping; do not duplicate the Postgres SQL-state check.
- The actual on-disk backend folder structure is `Application/Commands/Clientes/` and `Application/Queries/Clientes/` (flat `Application/{Kind}/{Domain}/`) — this differs slightly from the architecture doc's illustrative tree (`Application/Clientes/Commands/`). Follow the ACTUAL on-disk convention (`Commands/Clientes/UpdateClienteCommand.cs`), confirmed via Stories 2.1–2.3.
- `uk_clientes_nit` unique index already exists (Story 2.1's `AddClienteEntity` migration) — no new migration is expected for this story (no new columns).
- Backend response bodies are camelCase (ASP.NET Core Minimal API default), confirmed by Stories 2.1–2.3 — `PUT` response and request bodies must match field-for-field (`nombre`, `nit`, `telefono`, `ciudad`) with the frontend.
- `pnpm` is the package manager; all required libraries (`siesa-ui-kit`, React Hook Form, Zod, TanStack Query) are already installed from Story 2.3 — no new dependencies expected for this story.

### Architecture References

- REST endpoint: `PUT /api/v1/clientes/{id}` → `200 OK` + updated `ClienteDto` — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- CQRS Command pattern: `UpdateClienteCommand.cs` + `UpdateClienteCommandHandler.cs` in `Application/Commands/Clientes/` (actual on-disk path, sibling to `CreateClienteCommand.cs`); `UpdateClienteRequestValidator.cs` (FluentValidation) in `Application/Validators/` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure], confirmed against actual repo structure.
- Frontend files: `useUpdateCliente.ts` (mutation hook, architecture's documented file name) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Query key convention: mutation invalidates BOTH `['clientes']` (list) and `['clientes', id]` (single) after update — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, TanStack Query keys (canonical)]
- Mandatory mutation pattern (adapted for update): `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); queryClient.invalidateQueries({ queryKey: ['clientes', id] }); toast.success('Cliente actualizado correctamente') }` — exact toast copy is architecturally mandated — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Error handling: Problem Details RFC 7807 for 400 (validation)/404 (not found)/409 (conflict); frontend must not render raw `error.message` — AC #5 requires the 409 case to render inline on the form (not a toast), mirroring Story 2.3's exact precedent — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, Error handling — frontend/backend]
- Response shape: `PUT → 200 OK + updated object`, JSON camelCase — [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- UI kit fallback order for the "Editar" trigger/dialog: `siesa-ui-kit (P0) → shadcn/ui Dialog → custom` — same `AlertDialog` primitive already confirmed and in use since Story 2.3 — [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack Table]
- Data model: `clientes` table `uk_clientes_nit` unique index (Story 2.1's migration) — this story's `PUT` is the second flow (after Story 2.3's `POST`) that can trigger this constraint, now from a different client's edit colliding with an existing NIT — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, FluentValidation + Zod dual validation, TanStack Query/Router, React Hook Form + Zod for forms, `pnpm`, Spanish UI text, Problem Details RFC 7807): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (module/entity/repository/form state after 2.1–2.3, `ClienteForm`'s dormant edit-mode prop surface, `isAxiosError` status-check precedent, camelCase JSON, actual on-disk `Commands/Clientes/` path): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md]

### Test Design References (Epic 2 test plan)

- TC-E2-P1-08 (Component): Edit form pre-fills with current values on mount — AC #1. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-08]
- TC-E2-P1-09 (E2E): Edit saves and reflects immediately in detail + list within 2s (NFR2, FR27), exact toast copy — AC #2. Risk covered: R6 (stale cache / query-key mismatch). [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-09]
- TC-E2-P1-10 (Component): Clearing a required field in edit mode blocks submit with inline error — AC #4. Risk covered: R3 (backend validation must be independently correct). [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-10]
- TC-E2-P2-06 (Component): Edit success toast text is EXACTLY "Cliente actualizado correctamente", no paraphrasing — AC #2. Risk covered: R11 (toast copy drift). [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P2-06]
- TC-E2-P1-15 (Component, gap-fill recommended by test-design itself): "Edit Cancel Preserves Original Client Data" — Cancelar makes zero API calls, original values remain displayed — AC #6. Risk covered: R8. [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Coverage Rationale, line ~703]
- R8 risk: Cancel-without-saving must not partially mutate local state or trigger an unintended API call before discarding changes.

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements ("Editar" `Button`, form `Input`s already established by `ClienteForm`, submit/cancel buttons) before building custom components.
- **Constraint**: Reuse the existing `AlertDialog` host pattern established in Story 2.3 for "Nuevo cliente" — do not introduce a second, differently-styled dialog mechanism for edit. Per the architecture's fallback order (`siesa-ui-kit (P0) → shadcn/ui Dialog → custom`), `AlertDialog` is already the confirmed primitive; no new evaluation needed.
- This story does **not** use `MasterCrud` — same rationale as Story 2.3: Epic 2's client screens are a custom split-panel list/detail composition, not a `MasterCrud`-orchestrated screen. Do not introduce `MasterCrud` into this module.
- Icons: Heroicons primary (already installed), consistent with Stories 2.1–2.3.
- All user-facing text ("Editar" button label, inline validation errors, toast copy, 409 error message) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (200/400/404/409 paths); repository test may use EF Core InMemory for happy-path/not-found `UpdateAsync`, but the unique-constraint-violation test MUST run against a real/TestContainers PostgreSQL (InMemory does not enforce unique indexes) — same constraint class as Story 2.3's create-duplicate test.
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards; critical paths (create, edit, delete) targeted at 100% per test-design-epic-2.md.
- R6 (stale cache risk): explicitly verify BOTH `['clientes']` and `['clientes', id]` are invalidated — a query-key mismatch here silently breaks FR27/NFR2 without any test failure unless asserted directly.
- R3 (backend validation independence): the xUnit test in Task 6 must submit directly to the `PUT` endpoint, bypassing the UI entirely, to prove FluentValidation is the true gate (not solely Zod).
- R11 (toast copy exactness): "Cliente actualizado correctamente" must match verbatim (TC-E2-P2-06), no paraphrasing.

### Project Structure Notes

- Fourth story to touch `frontend/src/modules/crm/clientes/` and `backend/src/SiesaAgents.*/` — extends existing files, does not create new module scaffolding.
- Second story to add a Command to the backend `Clientes` domain (`Commands/Clientes/UpdateClienteCommand.cs`, sibling to Story 2.3's `CreateClienteCommand.cs`) — establishes no new pattern, replicates Story 2.3's exact CQRS command structure.
- Completes the `ClienteForm` dual-mode design that Story 2.3 deliberately left half-wired (`mode`/`initialValues` prop surface present but unused for edit) — this is the story that activates it, per Story 2.3's own Dev Notes ("Story 2.4 will do the actual edit-mode wiring").
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and CQRS conventions, adjusted for the confirmed actual on-disk path (`Application/Commands/Clientes/` not `Application/Clientes/Commands/`).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
