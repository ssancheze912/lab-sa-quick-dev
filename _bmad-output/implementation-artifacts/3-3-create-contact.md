# Story 3.3: Create Contact

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new contact by filling in a form,
so that the contact is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/contactos` view, **When** the user clicks "Nuevo contacto", **Then** a form (`ContactoForm`) opens with fields: `Nombre`, `Cargo`, `Teléfono`, `Email` (all required per FR9) (Story 3.3 AC).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the contact is created and appears in the contact list immediately, no manual refresh, no full page reload (FR27). **And** a toast de éxito muestra exactamente "Contacto creado correctamente" (TC-E3-P0-04, TC-E3-P2-06).

3. **Given** the user submits the form with one or more required fields empty (or whitespace-only), **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR16) via Zod (frontend). **And** the form is NOT submitted to the backend (AC-E3.4).

4. **Given** the backend independently validates the request (defense in depth, TC-E3-P0-03), **When** a `POST /api/v1/contactos` is made with empty/whitespace-only required fields (bypassing frontend), **Then** the backend returns `400 Bad Request` with FluentValidation field-level error details (`errors: { nombre: [...], cargo: [...], telefono: [...], email: [...] }`) and no record is persisted.

5. **Given** the backend returns a validation error (`400`), **When** the error is received by the frontend, **Then** the error message is displayed clearly without exposing technical details, raw Problem Details JSON, or stack traces (NFR6, TC-E3-P0-05). **And** the form remains open with the entered data intact (no data loss).

## Tasks / Subtasks

- [x] Task 1 — Backend: `IContactoRepository.AddAsync` (AC: #2, #4)
  - [x] Add `Task AddAsync(ContactoEntity contacto, CancellationToken ct)` to `IContactoRepository` (`backend/src/SiesaAgents.Domain/Repositories/IContactoRepository.cs`) — extends the existing interface (currently `GetAllAsync` from Story 3.1, `GetByIdAsync` from Story 3.2). Do not remove/alter either.
  - [x] Implement `AddAsync` in `ContactoRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`) — `Add` + `SaveChangesAsync` via `AppDbContext`, mirroring `ClienteRepository.AddAsync`'s exact shape (Story 2.3). `ContactoEntity` has no unique business key (unlike `ClienteEntity`'s `nit`), so there is no unique-constraint-violation path to handle here — a simple happy-path insert.
  - [x] `ContactoEntity.Create(string nombre, string cargo, string telefono, string email, Guid? clienteId)` already exists (introduced by Story 2.5) in the exact required shape — no entity change needed. This story passes `clienteId: null` (no client-association UI in this story — that is Epic 4 scope).

- [x] Task 2 — Backend: `CreateContactoCommand` + Handler + Validator (AC: #2, #4)
  - [x] Create `CreateContactoCommand.cs` (`backend/src/SiesaAgents.Application/Commands/Contactos/`) — properties `Nombre`, `Cargo`, `Telefono`, `Email` (CQRS command, no `clienteId` in the request shape for this story — association is Epic 4 scope).
  - [x] Create `CreateContactoCommandHandler.cs` in the same folder — calls `ContactoEntity.Create(nombre, cargo, telefono, email, clienteId: null)`, then `IContactoRepository.AddAsync`, maps the persisted entity to the existing `ContactoDto` (reuse as-is, no new DTO), returns it.
  - [x] Create `CreateContactoRequestValidator.cs` (FluentValidation, `backend/src/SiesaAgents.Application/Validators/`) — `Nombre`, `Cargo`, `Telefono`, `Email` all `NotEmpty()`. No format/regex rule on `Email` (no AC mandates it — TC-E3-P3-01 explicitly documents this as out of scope). Invoked explicitly in the `POST` endpoint before dispatching to the handler (Minimal API has no `[ApiController]` auto-validation, per company standard and Story 2.3 precedent).
  - [x] FluentValidation failures map to `400 Bad Request` via `Results.ValidationProblem` (`errors: { field: [...] }` shape) in the endpoint — no new exception-mapping needed since `ContactoEntity` has no unique constraint to violate (unlike `ClienteEntity`'s 409 path in Story 2.3).

- [x] Task 3 — Backend: `POST /api/v1/contactos` endpoint (AC: #2, #4)
  - [x] Add `app.MapPost("/api/v1/contactos", ...)` to `ContactoEndpoints.cs` — Minimal API, binds `CreateContactoCommand` directly from the request body, runs `CreateContactoRequestValidator` explicitly, returns `400` via `Results.ValidationProblem` on failure, otherwise dispatches to `CreateContactoCommandHandler`. Returns `201 Created` with the created `ContactoDto` and a `Location` header pointing to `GET /api/v1/contactos/{id}`. Tagged `.WithTags("Contactos")`, named `"CreateContacto"`, matching the existing `GetContactos`/`GetContactoById` naming convention.
  - [x] `GET /api/v1/contactos` and `GET /api/v1/contactos/{id}` (Stories 3.1/3.2) left unmodified — purely additive change.
  - [x] Register `CreateContactoCommandHandler` and `CreateContactoRequestValidator` in DI (`Program.cs`), alongside the existing `GetContactosQueryHandler`/`GetContactoByIdQueryHandler` registrations.
  - [x] **Schema-reuse safety gate (TC-E3-P0-01, epic-wide constraint):** do NOT generate a new EF Core migration for the `contactos` table. `ContactoEntity`, `ContactoConfiguration` (including `fk_contactos_clientes` with `OnDelete(DeleteBehavior.SetNull)`), and the migration `20260701084227_AddContactoEntity` already exist from Story 2.5 — this story only adds repository/command/endpoint code on top of them. Do not modify `ContactoConfiguration.cs`'s FK definition.

- [x] Task 4 — Frontend: Zod schema + `useCreateContacto` mutation hook (AC: #1, #2, #3, #5)
  - [x] Create `contactoSchema.ts` in `frontend/src/modules/crm/contactos/application/` — Zod object schema, all four fields `z.string().trim().min(1, { message: 'Este campo es obligatorio' })` (`nombre`, `cargo`, `telefono`, `email`; no email-format regex — mirrors the backend validator's "required only" scope). Exports `ContactoFormValues` inferred type.
  - [x] Add `create(data): Promise<Contacto>` to `IContactoRepository.ts` (`frontend/src/modules/crm/contactos/domain/repositories/IContactoRepository.ts`) — additive; `getAll`/`getById` signatures (Stories 3.1/3.2) unchanged.
  - [x] Implement `create` in `contactoApiRepository.ts` — `POST /api/v1/contactos` via the existing `apiClient` Axios instance; errors propagate as rejected promises (no swallowing), mirroring `clienteApiRepository.create`.
  - [x] Create `useCreateContacto.ts` in `frontend/src/modules/crm/contactos/application/hooks/` — TanStack Query `useMutation`. `onSuccess`: invalidates `['contactos']` (canonical query key per architecture — must match `useContactos`'/`useContacto`'s existing key exactly, TC-E3 note #7 / R4) + `toast.success('Contacto creado correctamente')`. `onError`: `400` (via `isAxiosError` + `status === 400`, mirroring `useCliente`'s/`useCreateCliente`'s established discrimination pattern) is NOT toasted (left for `ContactoForm` to render inline per AC #5); any other error triggers `toast.error('No se pudo guardar. Intenta de nuevo.')`.

- [x] Task 5 — Frontend: `ContactoForm` component + "Nuevo contacto" trigger (AC: #1, #2, #3, #5)
  - [x] Create `ContactoForm.tsx` in `frontend/src/modules/crm/contactos/presentation/components/` — React Hook Form + `zodResolver(contactoSchema)`, `mode: 'create' | 'edit'` + optional `initialValues` prop surface for Story 3.4 reuse (only the create path is implemented/tested here, exactly mirroring `ClienteForm`'s Story 2.3/2.4 precedent). Fields use `siesa-ui-kit` `Input` (label + error/errorMessage props); only the first invalid field (form order: `Nombre → Cargo → Teléfono → Email`) renders its error text at a time so a single inline message is visible (every invalid field still gets the red `error` border) — same rationale/precedent as `ClienteForm` (ambiguous `findByText` queries on duplicate identical messages). On a `400` validation error from the backend, surface the field-level messages returned in `errors{}` via `setError(field, { message })` per field — form stays open, values intact (AC #5). On success, calls `onSuccess` so the host can close the dialog.
  - [x] Host `ContactoForm` inside `siesa-ui-kit`'s `AlertDialog` (confirmed P0 dialog/modal primitive, no separate `Dialog` export exists in the kit — Story 2.3 precedent) passed via its `description` prop (renders `children`-shaped content there, not via React `children`). Add the "Nuevo contacto" `Button` to `ContactoListView.tsx` — purely additive, existing search/list rendering (Story 3.1) and selection/navigation wiring (Story 3.2) untouched.
  - [x] All user-facing text in Spanish; code identifiers in English.
  - [x] Verify the infra fixes Story 2.3 already applied globally are still effective for this second `AlertDialog` usage (no new fixes anticipated, but confirm, do not silently assume): `@source '../node_modules/siesa-ui-kit/dist'` in `frontend/src/index.css` (Tailwind v4 class purging), the `[role='dialog'][id^='headlessui-dialog-']` min-height CSS rule (Playwright visibility), and `ToastProvider` mounted globally in `frontend/src/main.tsx`. These are app-wide fixes from Story 2.3 — do not duplicate them, only confirm `toast.success`/`AlertDialog` render correctly for `ContactoForm` too.

- [x] Task 6 — Tests (AC: all)
  - [x] Backend xUnit: `ContactoRepositoryTests` — `AddAsync` happy path (EF Core InMemory is sufficient here; unlike Story 2.3's `ClienteRepository.AddAsync` test, there is no unique constraint to verify against real Postgres).
  - [x] Backend xUnit integration (`WebApplicationFactory<Program>`): `ContactoEndpointsTests` — `POST /api/v1/contactos` 201/400 contract cases (pre-existing RED tests from the ATDD phase, now GREEN). Include TC-E3-P0-03's exact scenarios (empty `nombre` alone, all-four-whitespace-only).
  - [x] Backend xUnit: `CreateContactoRequestValidator` unit tests (TC-E3-P2-02) — missing/empty Nombre, Cargo, Telefono, Email; valid payload passes.
  - [x] Backend xUnit integration: `TC-E3-P0-02` regression check — create client, create contacts via the new `POST /api/v1/contactos` with `clienteId` set (via direct entity/repository seeding if the command doesn't expose `clienteId` — see Dev Notes), delete the client, confirm contacts survive with `clienteId = null`. Must run against real/TestContainers PostgreSQL (FK behavior not enforced by EF InMemory).
  - [x] Frontend Vitest: `contactoSchema.test.ts` (TC-E3-P2-01) — `safeParse` rejects empty/whitespace for each of the four fields individually and combined; valid payload passes.
  - [x] Frontend Vitest + RTL: `ContactoForm.test.tsx` — required-field inline errors (AC #3), successful submit + success toast (AC #2), 400-error inline rendering without data loss (AC #5, TC-E3-P0-05), toast exact copy "Contacto creado correctamente" (TC-E3-P2-06).
  - [x] MSW handlers: add `POST /api/v1/contactos` success (201) + validation-error (400) handlers to `frontend/src/test/msw/handlers.ts` if not already present from the ATDD RED setup.
  - [x] E2E (Playwright, Chromium): `e2e/tests/contactos/create-contact.spec.ts` — TC-E3-P0-04 full journey (navigate → "Nuevo contacto" → fill → submit → appears in list → toast → detail matches submitted values). This story's `POST` endpoint also unblocks the two previously-RED scenarios in Story 3.2's `contact-detail-view.spec.ts` (`TC-E3-P1-06`, AC #1 click-navigates) that depended on `apiHelper.createContacto` — re-run that spec file and confirm 6/6 now pass.

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the create-contact form + `POST` flow. It does **not** implement:
- Edit contact (Story 3.4) — `ContactoForm` is built with reuse in mind (optional `mode`/`initialValues` prop surface) but this story implements and tests only the create path.
- Delete contact (Story 3.5).
- Client↔Contact association (assigning a `clienteId` from the UI, "Sin cliente" filter, `PUT /api/v1/contactos/{id}/cliente`) — Epic 4 scope (FR17–FR26). The create form does NOT include a client-selection field; `ContactoEntity.Create` is called with `clienteId: null`.

`IContactoRepository` (backend and frontend) is extended in this story with `AddAsync`/`create` — the existing `GetAllAsync`/`getAll` (Story 3.1) and `GetByIdAsync`/`getById` (Story 3.2) must remain unmodified. `ContactoDto` (backend) and `Contacto` (frontend entity interface) are reused as-is; no new DTO/entity shape is introduced for the response — only the new request/command input shape (`Nombre`, `Cargo`, `Telefono`, `Email`) is new.

### Previous Story Intelligence (Stories 3.1, 3.2, 2.3)

- `ContactoEntity` (`backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`) already exists with `Id`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (nullable), `CreatedAt`/`UpdatedAt`, private-constructor pattern, and a `Create(string nombre, string cargo, string telefono, string email, Guid? clienteId)` static factory that already throws `ArgumentException` on empty/whitespace required fields (defense-in-depth beneath the FluentValidation layer) — confirmed on disk, introduced by Story 2.5 solely to prove the FK-orphaning behavior. No entity change needed for this story.
- **Epic-wide constraint (TC-E3-P0-01/02, Epic 3 Test Design §10.1/§10.3):** the `contactos` table, `ContactoConfiguration` (`fk_contactos_clientes`, `OnDelete(DeleteBehavior.SetNull)`), and migration `20260701084227_AddContactoEntity` already exist — this story must NOT generate a new migration or touch the FK configuration.
- `IContactoRepository`/`ContactoRepository` currently expose `GetAllAsync` (3.1) and `GetByIdAsync` (3.2) — this story is the third to extend that interface (`AddAsync`), following the same additive-only discipline both prior stories established.
- `GetContactosQuery`/`GetContactosQueryHandler` and `GetContactoByIdQuery`/`GetContactoByIdQueryHandler` live in the flat `backend/src/SiesaAgents.Application/Queries/Contactos/` convention (confirmed on-disk, not the architecture doc's illustrative nested tree) — this is the first Command in the `Contactos` domain; establish `Application/Commands/Contactos/` as its sibling, mirroring `Application/Commands/Clientes/` from Story 2.3.
- `ContactoDto` (`backend/src/SiesaAgents.Application/DTOs/ContactoDto.cs`) already has `Id`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (nullable), `CreatedAt` — sufficient for the create response, reuse directly.
- **Story 2.3 (Create Client) is the exact structural template for this story** — same problem (create form + `POST` flow), same solution shape (`useCreateCliente`/`ClienteForm`/`clienteSchema`/`AlertDialog` host). Key difference: `ClienteEntity` has a unique `nit` constraint requiring 409-Conflict handling; `ContactoEntity` has NO unique business key, so this story has no 409 path — only 400 (validation) and 201 (success). Do not carry over 409-specific logic/tests from Story 2.3 that don't apply here.
- `ContactoListView.tsx` (3.1) currently renders the search input + filtered list; 3.2 added navigation/selection wiring on `ContactListItem`'s `onClick`/`selected`. This story adds the "Nuevo contacto" trigger to the same component — compose, don't rewrite, per both prior stories' explicit precedent. `ContactoListView.tsx`'s `selected` derivation already uses the scoped regex `^\/contactos\/([^/]+)$` (deliberately not the loose pattern Epic 2 review flagged) — this story's new dialog does not introduce a new sibling route, so no further scoping change is needed here.
- The global `queryClient` has `retry: false` on default query options (Story 2.1) — mutations are unaffected by query retry config, but be aware of this when writing tests that assert `isError` state timing.
- `useContacto` (3.2) established the `isAxiosError` + `status` check pattern for distinguishing a specific HTTP status (`404`) from a generic error — replicate this exact pattern for the `400` check in `useCreateContacto` (Task 4), consistent with `useCreateCliente`'s `409` check in Story 2.3.
- Backend response bodies use camelCase (ASP.NET Core Minimal API default, confirmed by Stories 2.1/3.1) — the frontend `Contacto`/request shapes must match field-for-field (`nombre`, `cargo`, `telefono`, `email`).
- Global infra fixes already applied in Story 2.3 (`@source` Tailwind directive for `siesa-ui-kit`, `AlertDialog` visibility CSS fix, `ToastProvider` mounted in `main.tsx`) are app-wide — this story should NOT need to re-apply them, only confirm they still work for a second `AlertDialog`/toast usage in a different module.
- `pnpm` is the package manager; `siesa-ui-kit` (`^1.0.250`), `@heroicons/react`, `react-hook-form` + `@hookform/resolvers` + `zod` are already installed (introduced by Story 2.3) — no new dependencies anticipated for this story.
- The two previously-RED E2E scenarios in Story 3.2's `contact-detail-view.spec.ts` (`TC-E3-P1-06`, AC #1) depend on this story's `POST /api/v1/contactos` endpoint existing — re-verify that spec file passes 6/6 after this story's implementation, as explicitly flagged in Story 3.2's Dev Notes/Completion Notes.

### Architecture References

- REST endpoint: `POST /api/v1/contactos` → `201 Created` + created `ContactoDto` — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- CQRS Command pattern: `CreateContactoCommand.cs` + `CreateContactoCommandHandler.cs` in `Application/Commands/Contactos/`; `CreateContactoRequestValidator.cs` (FluentValidation) in `Application/Validators/` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure], mirrors Story 2.3's `Commands/Clientes/` sibling.
- Frontend files: `useCreateContacto.ts` (mutation hook), `contactoSchema.ts` (Zod), `ContactoForm.tsx` (React Hook Form + Zod, crear/editar) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Query key convention: mutation invalidates `['contactos']` after create — canonical array-form key, must match `useContactos`/`useContacto`'s existing key exactly — [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture, TanStack Query keys], [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md#10. Notes for Story Implementation Agents, item 7]
- Mandatory mutation pattern: `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); toast.success('Contacto creado correctamente') }` — exact toast copy is architecturally mandated — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Error handling: Problem Details RFC 7807 for `400` (validation); frontend must not render raw `error.message`/JSON — the `400` case renders inline on the form (not a toast) so the user can correct the field without losing entered data (AC #5) — [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns, Error]
- Response shape: `POST → 201 Created + created object`, JSON camelCase — [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- UI kit fallback order for the "Nuevo contacto" trigger/dialog: `siesa-ui-kit (P0) → shadcn/ui Dialog → custom` — same order Story 2.3 confirmed and used (`AlertDialog`) — [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack Table]
- Data model: `contactos` table, no unique business key (unlike `clientes.nit`); `fk_contactos_clientes` FK with `ON DELETE SET NULL` already established (Story 2.5) — must remain unchanged — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, FluentValidation + Zod dual validation, TanStack Query/Router, React Hook Form + Zod for forms, `pnpm`, Spanish UI text, Problem Details RFC 7807): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (module/entity/repository state after 3.1/3.2, `AlertDialog`/`ToastProvider`/Tailwind infra fixes already app-wide from Story 2.3, `isAxiosError` status-check precedent, camelCase JSON): [Source: _bmad-output/implementation-artifacts/3-1-contact-list-search.md], [Source: _bmad-output/implementation-artifacts/3-2-contact-detail-view.md], [Source: _bmad-output/implementation-artifacts/2-3-create-client.md]
- Epic 3 Test Design (schema-reuse safety gate R1/TC-E3-P0-01/02, validation independence R2/TC-E3-P0-03, toast copy exactness R10/TC-E3-P2-06): [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements (form `Input`s, "Nuevo contacto" `Button`, submit/cancel buttons) before building custom components.
- **Constraint**: Reuse `siesa-ui-kit`'s `AlertDialog` (the confirmed P0 dialog/modal primitive, no separate `Dialog` export — Story 2.3 precedent) as the "Nuevo contacto" modal host, passed via its `description` prop. Do not build a fully custom modal from scratch.
- This story does **not** use `MasterCrud` — Epic 3's contact screens are explicitly a custom split-panel list/detail composition (Stories 3.1/3.2 precedent, `ContactoListView`/`ContactoDetailView`/`ContactListItem`), not a `MasterCrud`-orchestrated table+form screen. `ContactoForm` is a standalone React Hook Form + Zod component, not a `MasterCrud` `renderForm`. Do not introduce `MasterCrud` into this module — it would conflict with the already-established list/detail architecture (same reasoning as Story 2.3/3.2's precedent for `clientes`/`contactos`).
- Icons: Heroicons primary (already installed), consistent with Stories 3.1/3.2.
- All user-facing text (field labels, inline validation errors, dialog title, "Nuevo contacto" button label, toast copy, backend-validation error messages) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (201/400 paths — no 409 path, unlike Story 2.3, since `ContactoEntity` has no unique constraint). Repository `AddAsync` happy-path test may use EF Core InMemory. The `TC-E3-P0-02` FK-orphaning regression test MUST run against a real/TestContainers PostgreSQL (InMemory does not enforce FK `ON DELETE SET NULL` behavior).
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 3 test plan): TC-E3-P0-01, TC-E3-P0-02, TC-E3-P0-03, TC-E3-P0-04, TC-E3-P0-05, TC-E3-P2-01, TC-E3-P2-02, TC-E3-P2-06 — [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md#4. Test Cases by Priority]
- R1 (Test Design risk): schema/entity drift — this story must NOT generate a new migration or alter `ContactoConfiguration`'s FK; TC-E3-P0-01/02 are the gating regression checks, must pass before this story is closed.
- R2 (Test Design risk): backend validation must be independently correct, not solely reliant on frontend Zod (TC-E3-P0-03) — the xUnit integration test in Task 6 must submit directly to the endpoint, bypassing the UI entirely.
- R4 (Test Design risk): TanStack Query cache-key consistency (`['contactos']`) — `useCreateContacto`'s invalidation key must exactly match `useContactos`'/`useContacto`'s existing key, or the list won't refresh post-create.
- R10 (Test Design risk): toast copy exactness — "Contacto creado correctamente" must match verbatim (TC-E3-P2-06), no paraphrasing.
- This story's E2E work also unblocks Story 3.2's two previously-deferred scenarios (`TC-E3-P1-06`, AC #1) in `contact-detail-view.spec.ts` — re-run and confirm 6/6 pass as part of this story's verification, not just the new `create-contact.spec.ts`.

### Project Structure Notes

- Third story to touch `frontend/src/modules/crm/contactos/` — adds to the existing module (domain/application/infrastructure/presentation), does not create it.
- First story to introduce a Command (write-path) into the backend `Contactos` domain — establishes `Application/Commands/Contactos/` as the pattern Stories 3.4/3.5 will replicate for `UpdateContactoCommand`/`DeleteContactoCommand`.
- First story to introduce `ContactoForm.tsx`, `contactoSchema.ts`, and `useCreateContacto.ts` — Story 3.4 (Edit Contact) will reuse `ContactoForm` and `contactoSchema`, and add a sibling `useUpdateContacto.ts`; do not design `ContactoForm` in a way that hard-codes create-only behavior if it can be reasonably avoided, but do not over-engineer a generic abstraction beyond a simple prop surface — Story 3.4 will do the actual edit-mode wiring (same balance Story 2.3/2.4 struck for `ClienteForm`).
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and CQRS conventions, and Story 2.3's already-proven implementation of the equivalent feature for `clientes`.

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

### Completion Notes List

- Backend: `IContactoRepository.AddAsync`, `CreateContactoCommand`/`Handler`, `CreateContactoRequestValidator`, `POST /api/v1/contactos` endpoint. No new migration generated; `ContactoConfiguration`'s `fk_contactos_clientes` FK left untouched (TC-E3-P0-01/02 schema-reuse gate passes).
- Frontend: `contactoSchema.ts` (Zod), `useCreateContacto.ts`, `ContactoForm.tsx` (React Hook Form + Zod, create mode, hosted in `siesa-ui-kit`'s `AlertDialog`), "Nuevo contacto" trigger wired into `ContactoListView.tsx`.
- The dev-story sub-agent for this story was interrupted mid-run by an environment restart. On resumption, the orchestrator verified the already-written code directly: `dotnet build` succeeded, backend tests 60/60 (integration) + 19/19 (unit) green, frontend 106/106 green — the implementation itself was complete and correct.
- Two issues surfaced only during manual E2E verification, both fixed directly:
  1. The `.NET` API process still running on port 5000 was a stale build from before this story (predated the new `POST` endpoint, returned 405) — restarted with the current build.
  2. `e2e/pages/contactos.page.ts` used `getByTestId('contacto-row')`, but the actual/established test-id (used by `ContactListItem.tsx` and all pre-existing Vitest suites since Story 3.1) is `contacto-list-item` — fixed the page object to match the established convention.
- Stray contact records left in the local Postgres DB by earlier interrupted/manual test runs (afterEach cleanup didn't get to run) were removed directly so the E2E suite runs against a clean baseline.
- Full `e2e/tests/contactos/` suite (11 tests across `create-contact.spec.ts` and `contact-detail-view.spec.ts`) passes 11/11 after the fixes — this also unblocks the two scenarios in Story 3.2 that depended on this story's `POST` endpoint, as anticipated in its Dev Notes.
- Minor non-blocking note for review: a console warning (`Received 'false' for a non-boolean attribute 'error'`) appears during E2E runs, consistent with the known `siesa-ui-kit` `Input` component forwarding boolean props to the DOM (same class of issue already worked around elsewhere, e.g. Story 2.2's `startIcon` suppression) — not introduced by this story's code, and not covered by an explicit zero-console-error AC here.

### File List

- backend/src/SiesaAgents.Domain/Repositories/IContactoRepository.cs (modified)
- backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs (modified)
- backend/src/SiesaAgents.Application/Commands/Contactos/CreateContactoCommand.cs (new)
- backend/src/SiesaAgents.Application/Commands/Contactos/CreateContactoCommandHandler.cs (new)
- backend/src/SiesaAgents.Application/Validators/CreateContactoRequestValidator.cs (new)
- backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs (modified)
- backend/src/SiesaAgents.API/Program.cs (modified)
- backend/tests/SiesaAgents.UnitTests/Validators/CreateContactoRequestValidatorTests.cs (new)
- backend/tests/SiesaAgents.IntegrationTests/Repositories/ContactoRepositoryTests.cs (modified)
- backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs (modified)
- frontend/src/modules/crm/contactos/application/contactoSchema.ts (new)
- frontend/src/modules/crm/contactos/application/contactoSchema.test.ts (new)
- frontend/src/modules/crm/contactos/application/hooks/useCreateContacto.ts (new)
- frontend/src/modules/crm/contactos/application/hooks/useCreateContacto.test.tsx (new)
- frontend/src/modules/crm/contactos/domain/repositories/IContactoRepository.ts (modified)
- frontend/src/modules/crm/contactos/infrastructure/repositories/contactoApiRepository.ts (modified)
- frontend/src/modules/crm/contactos/presentation/components/ContactoForm.tsx (new)
- frontend/src/modules/crm/contactos/presentation/components/ContactoForm.test.tsx (new)
- frontend/src/modules/crm/contactos/presentation/components/ContactoListView.tsx (modified)
- frontend/src/modules/crm/contactos/presentation/components/ContactoListView.create-trigger.test.tsx (new)
- frontend/src/test/msw/handlers.ts (modified)
- e2e/tests/contactos/create-contact.spec.ts (new)
- e2e/pages/contactos.page.ts (modified — testid fix)
