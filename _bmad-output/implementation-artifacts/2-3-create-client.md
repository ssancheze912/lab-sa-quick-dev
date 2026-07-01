# Story 2.3: Create Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form (`ClienteForm`) opens with fields: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` (all required per FR1) (Story 2.3 AC).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created and appears in the client list immediately, no manual refresh, no full page reload (FR27). **And** a toast de éxito muestra exactamente "Cliente creado correctamente" (TC-E2-P0-06, TC-E2-P2-05).

3. **Given** the user submits the form with one or more required fields empty (or whitespace-only), **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR8) via Zod (frontend). **And** the form is NOT submitted to the backend (AC-E2.4).

4. **Given** the backend independently validates the request (defense in depth, TC-E2-P0-05), **When** a `POST /api/v1/clientes` is made with empty/whitespace-only required fields (bypassing frontend), **Then** the backend returns `400 Bad Request` with FluentValidation field-level error details (`errors: { nombre: [...], nit: [...] }`) and no record is persisted.

5. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a `409 Conflict`, **Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6, TC-E2-P0-01, TC-E2-P0-02). **And** the form remains open with the entered data intact (no data loss).

## Tasks / Subtasks

- [ ] Task 1 — Backend: `ClienteEntity` mutation behavior + uniqueness constraint enforcement (AC: #4, #5)
  - [ ] Add a static `Create(string nombre, string nit, string telefono, string ciudad)` factory method to the existing `ClienteEntity` (`backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`, created in Story 2.1) if not already present in that exact shape — private constructor pattern per company standard. Sets `CreatedAt`/`UpdatedAt` to `DateTimeOffset.UtcNow`. Do NOT alter existing fields/behavior used by Stories 2.1/2.2.
  - [ ] Add `Task AddAsync(ClienteEntity cliente, CancellationToken ct)` to `IClienteRepository` (`backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs`) — extends the interface established in Story 2.1 (`GetAllAsync`) and extended in Story 2.2 (`GetByIdAsync`). Do not remove/alter those.
  - [ ] Implement `AddAsync` in `ClienteRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`) — `Add` + `SaveChangesAsync` via `AppDbContext`. Let a Postgres unique-constraint violation on `uk_clientes_nit` (created in Story 2.1's migration) propagate as a `DbUpdateException`/`Npgsql` unique-violation — do not pre-check existence with a separate query (race-condition-safe: rely on the DB constraint as source of truth).

- [ ] Task 2 — Backend: `CreateClienteCommand` + Handler + Validator + 409 mapping (AC: #2, #4, #5)
  - [ ] Create `CreateClienteCommand.cs` (`backend/src/SiesaAgents.Application/Clientes/Commands/`, or `Application/Commands/Clientes/` matching whichever exact sibling path Stories 2.1/2.2 established for `Queries/Clientes/` — mirror it for `Commands/Clientes/`) — properties `Nombre`, `Nit`, `Telefono`, `Ciudad` (CQRS command, company standard).
  - [ ] Create `CreateClienteCommandHandler.cs` in the same folder — calls `ClienteEntity.Create(...)`, then `IClienteRepository.AddAsync`, maps the persisted entity to the existing `ClienteDto` (reuse as-is from Story 2.1, no new DTO shape), returns it.
  - [ ] Create `CreateClienteRequestValidator.cs` (FluentValidation, `Application/Clientes/Validators/` or the established validators path) — `Nombre`, `Nit`, `Telefono`, `Ciudad` all `NotEmpty()` (rejects null, empty, and whitespace-only per `NotEmpty()`'s built-in trim-aware check — satisfies AC #4's whitespace-only case). Wire into the Minimal API endpoint's validation pipeline (or invoke explicitly in the handler before persisting — follow whichever validation-invocation pattern is idiomatic for this Minimal API + FluentValidation setup; no controllers, no `[ApiController]` auto-validation available).
  - [ ] In `ClienteEndpoints.cs` (or the global `ExceptionHandlingMiddleware`, whichever layer Story 1.3/2.2 established for translating persistence exceptions), catch the unique-constraint violation from Task 1 and map it to `409 Conflict` with a Problem Details body whose `detail` reads "El NIT/RUC ya está registrado" (Spanish, user-facing, no DB/stack trace text — NFR6). FluentValidation failures map to `400 Bad Request` with `errors: { field: [...] }` shape (standard ASP.NET Minimal API validation-failure Problem Details extension).

- [ ] Task 3 — Backend: `POST /api/v1/clientes` endpoint (AC: #2, #4, #5)
  - [ ] Add `app.MapPost("/api/v1/clientes", ...)` to `ClienteEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`) — Minimal API, accepts a request body (`CreateClienteRequest` DTO or the command directly, matching the established request-shape convention), dispatches `CreateClienteCommand`. Returns `201 Created` with the created `ClienteDto` on success (include `Location` header pointing to `GET /api/v1/clientes/{id}` per REST convention, consistent with `POST` semantics). Tag `.WithTags("Clientes")` per existing convention (Stories 2.1/2.2).
  - [ ] Do not modify the existing `GET /api/v1/clientes` (list) or `GET /api/v1/clientes/{id}` endpoints — purely additive.

- [ ] Task 4 — Frontend: Zod schema + `useCreateCliente` mutation hook (AC: #1, #2, #3, #5)
  - [ ] Create `clienteSchema.ts` in `frontend/src/modules/crm/clientes/application/` (per architecture's documented file path) — Zod object schema with `nombre`, `nit`, `telefono`, `ciudad` all `z.string().trim().min(1, { message: '...' })` (Spanish error messages, e.g. "Este campo es obligatorio"). Export the inferred TS type for reuse by `ClienteForm`.
  - [ ] Add `create(data: { nombre: string; nit: string; telefono: string; ciudad: string }): Promise<Cliente>` to `IClienteRepository.ts` (`frontend/src/modules/crm/clientes/domain/repositories/`) — extends the interface from Stories 2.1/2.2 (`getAll`, `getById`). Do not alter those signatures.
  - [ ] Implement `create` in `clienteApiRepository.ts` (`frontend/src/modules/crm/clientes/infrastructure/repositories/`) — `POST /api/v1/clientes` via the existing Axios instance. Let a `409`/`400` response propagate as a rejected promise (do not swallow it), matching the `getById`/404 precedent from Story 2.2, so the mutation's `onError` can branch on status.
  - [ ] Create `useCreateCliente.ts` in `frontend/src/modules/crm/clientes/application/hooks/` — TanStack Query `useMutation`, `mutationFn: clienteApiRepository.create`. `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['clientes'] })` (mandatory invalidation pattern) + `toast.success('Cliente creado correctamente')` (exact copy, TC-E2-P2-05). `onError`: if the error is a `409` (`isAxiosError` + `status === 409` check, mirroring Story 2.2's typed-check precedent for 404), surface "El NIT/RUC ya está registrado" as the form-level error (NOT a generic toast — AC #5 requires the form to stay open with data intact, so this must be handled where the form can render it, e.g. returned from the hook or handled in `ClienteForm`'s submit handler) rather than a raw toast; for any other error, `toast.error('No se pudo guardar. Intenta de nuevo.')` per architecture's standard mutation error pattern.

- [ ] Task 5 — Frontend: `ClienteForm` component + "Nuevo cliente" trigger (AC: #1, #2, #3, #5)
  - [ ] Create `ClienteForm.tsx` in `frontend/src/modules/crm/clientes/presentation/components/` (per architecture's documented path — this is the first story to create it; it is explicitly designed for reuse by Story 2.4's edit flow, so accept an optional `initialValues`/`mode: 'create' | 'edit'`-shaped prop surface now to avoid a rewrite in 2.4, but implement ONLY the create path's behavior in this story).
    - React Hook Form + `zodResolver(clienteSchema)` (company standard: React Hook Form + Zod).
    - Fields: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` — use `siesa-ui-kit` `Input`/form primitives per the UI mandate below; inline error text under each field bound to RHF's `formState.errors` (AC #3).
    - Submit calls `useCreateCliente().mutateAsync(data)`; on the typed 409 case (from Task 4), set a form-level/field-level error via RHF's `setError` (or render a dedicated inline banner) reading "El NIT/RUC ya está registrado" and do NOT close/reset the form (AC #5 — data must remain intact).
    - On success, close the form (whatever container renders it — see next bullet — is responsible for closing on the mutation's `onSuccess`).
  - [ ] Host `ClienteForm` behind a "Nuevo cliente" trigger. Check `siesa-ui-kit` first per company component-selection rule (`MasterCrud`/Dialog primitives) — if no direct `siesa-ui-kit` modal/dialog equivalent is confirmed available, fall back to `shadcn/ui Dialog` per the architecture's documented UI kit fallback order (`siesa-ui-kit (P0) → shadcn/ui Dialog → custom`). Add the "Nuevo cliente" `Button` (siesa-ui-kit) to `ClienteListView.tsx` (`frontend/src/modules/crm/clientes/presentation/components/`, established in Story 2.1) — do not restructure the existing list/search rendering, only add the trigger + dialog composition (compose, don't rewrite, per Stories 2.1/2.2 precedent).
  - [ ] All user-facing text (labels, placeholders, inline errors, dialog title, button label "Nuevo cliente") MUST be in Spanish; code identifiers MUST be in English (company standard).

- [ ] Task 6 — Tests (AC: all)
  - [ ] Backend xUnit: `ClienteRepositoryTests` — add case for `AddAsync` persisting a valid client, and a case asserting a `DbUpdateException`/unique-violation is thrown when `Nit` duplicates an existing row (uses the `uk_clientes_nit` index from Story 2.1's migration).
  - [ ] Backend xUnit integration (`WebApplicationFactory<Program>`): `ClienteEndpointsTests` —
    - `POST /api/v1/clientes` with valid data → `201 Created` + correct `ClienteDto` body (TC-E2-P0-06 backend leg).
    - `POST /api/v1/clientes` twice with the same `nit`, different `nombre` → first `201`, second `409 Conflict` with Problem Details `detail` mentioning NIT/RUC already registered, no stack trace/DB text (TC-E2-P0-01).
    - `POST /api/v1/clientes` with `nombre: ""` and `nit` omitted → `400 Bad Request` with `errors: { nombre: [...], nit: [...] }`; and a second case with all fields whitespace-only → also `400` (TC-E2-P0-05). Verify via a subsequent `GET` that no record was persisted in either case.
  - [ ] Frontend Vitest + RTL: `ClienteForm.test.tsx` —
    - Renders all four fields; submitting with empty required fields shows inline Zod errors and does not call the mutation (AC #3).
    - Successful submit (MSW `201`) calls `toast.success('Cliente creado correctamente')` with the exact string (TC-E2-P2-05) and triggers `['clientes']` cache invalidation (assert via a spy/mocked `queryClient` or an integration-style render asserting the list re-fetches).
    - MSW mocked `409` Problem Details on submit → "El NIT/RUC ya está registrado" is displayed, no raw Problem Details JSON/technical text, form remains open with the previously entered values still populated (TC-E2-P0-02).
  - [ ] MSW handlers: add `POST /api/v1/clientes` success (201), 409, and 400 cases to the shared MSW handler file (`frontend/src/test/msw/handlers.ts`, established in Story 2.1).
  - [ ] E2E (Playwright) — `e2e/tests/clientes/create-client.spec.ts`: TC-E2-P0-06 (navigate to `/clientes`, click "Nuevo cliente", fill all fields with valid values, submit, assert the client appears in the list immediately with no reload, assert toast "Cliente creado correctamente", select the new client and assert its detail matches submitted values).

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the create-client form + `POST` flow. It does **not** implement:
- Edit client (Story 2.4) — `ClienteForm` is built with reuse in mind (optional `mode`/`initialValues` prop surface) but this story implements and tests only the create path.
- Delete client (Story 2.5).
- Sort controls (Story 2.6).

`IClienteRepository` (backend and frontend) is extended in this story with `AddAsync`/`create` — the existing `GetAllAsync`/`getAll` (Story 2.1) and `GetByIdAsync`/`getById` (Story 2.2) must remain unmodified. `ClienteDto` (backend) and `Cliente` (frontend entity interface) are reused as-is; no new DTO/entity shape is introduced for the response — only the new request/command input shape (`Nombre`, `Nit`, `Telefono`, `Ciudad`) is new.

### Previous Story Intelligence (Stories 2.1, 2.2)

- `ClienteEntity` (`backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`) already exists with `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt`/`UpdatedAt` and a private-constructor pattern per Story 2.1 — confirm/extend its static factory rather than redefining the entity or its EF configuration/migration from scratch.
- `uk_clientes_nit` unique index already exists (Story 2.1's `AddClienteEntity` migration) — Task 1/2 rely on this existing constraint; no new migration is expected for this story unless the entity gains new columns (it does not).
- `IClienteRepository`/`ClienteRepository` currently expose `GetAllAsync` (2.1) and `GetByIdAsync` (2.2) — this story is the third to extend that interface (`AddAsync`), following the same additive-only discipline both prior stories established.
- `GetClientesQuery`/`GetClientesQueryHandler` (2.1) and `GetClienteByIdQuery`/`GetClienteByIdQueryHandler` (2.2) live in `Application/Queries/Clientes/` (or the sibling path actually used on disk — verify exact casing/location before creating `Commands/Clientes/`, mirror it exactly) — this is the first Command in the `Clientes` domain; establish `Commands/Clientes/` as its sibling.
- `ExceptionHandlingMiddleware` (hardened in 1.3, exercised by 2.2's 404 path) already returns Problem Details RFC 7807 for unhandled exceptions — confirm whether it already generically handles `DbUpdateException`/unique-violation → 409, or whether this story must add that specific mapping (based on 2.1/2.2 Dev Notes, only 404 mapping was confirmed previously — treat the 409 mapping as new work for this story unless verified otherwise on disk).
- Frontend `modules/crm/clientes/{domain,application,infrastructure,presentation}` already exists (scaffolded 2.1, extended 2.2) — this story adds files into it, does not recreate the module skeleton.
- `ClienteListView.tsx` (2.1) currently renders the search input + filtered list; 2.2 added navigation wiring on `ClientListItem`'s `onClick`. This story adds the "Nuevo cliente" trigger to the same component — compose, don't rewrite, per both prior stories' explicit precedent.
- The global `queryClient` has `retry: false` on default query options (set during Story 2.1's ATDD correction) — mutations are unaffected by query retry config, but be aware of this when writing tests that assert `isError` state timing.
- `useCliente` (2.2) established the `isAxiosError` + `status` check pattern for distinguishing a specific HTTP status from a generic error — replicate this exact pattern for the `409` check in `useCreateCliente` (Task 4) rather than inventing a new error-discrimination approach.
- Backend response bodies use camelCase (ASP.NET Core Minimal API default) — confirmed by Story 2.1's manual `curl` verification; the frontend `Cliente`/request shapes must match field-for-field (`nombre`, `nit`, `telefono`, `ciudad`).
- `pnpm` is the package manager; `siesa-ui-kit` (`^1.0.250`), `@heroicons/react`, and React Hook Form + Zod (per architecture's documented stack) are expected to already be installed or are the first story to require `react-hook-form`/`@hookform/resolvers` — verify presence via `package.json` before adding via `pnpm add`.
- E2E: Story 2.1's Dev Notes flagged the Playwright Chromium binary as blocked by the outbound proxy in that sandbox; Story 2.2 confirmed a working local Chromium binary was available in its sandbox and TC-E2-P1-06 explicitly depends on this story's `POST` endpoint existing (it returned `405` before this story). Verify Playwright execution capability in the current environment before relying on E2E as the sole coverage for TC-E2-P0-06 — Vitest/RTL component coverage (Task 6) must independently cover the same success/error paths regardless of E2E availability.

### Architecture References

- REST endpoint: `POST /api/v1/clientes` → `201 Created` + created `ClienteDto` — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- CQRS Command pattern: `CreateClienteCommand.cs` + `CreateClienteCommandHandler.cs` in `Application/Clientes/Commands/`; `CreateClienteRequestValidator.cs` (FluentValidation) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Frontend files: `useCreateCliente.ts` (mutation hook), `clienteSchema.ts` (Zod), `ClienteForm.tsx` (React Hook Form + Zod, crear/editar) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Query key convention: mutation invalidates `['clientes']` after create — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, TanStack Query mutations]
- Mandatory mutation pattern: `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente creado correctamente') }` — exact toast copy is architecturally mandated — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Error handling: Problem Details RFC 7807 for 400 (validation)/409 (conflict); frontend must not render raw `error.message` — Toast for mutation failures per architecture, but AC #5 requires the 409 case specifically to render inline on the form (not a toast) so the user can correct the NIT/RUC without losing entered data — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, Error handling — frontend/backend]
- Response shape: `POST → 201 Created + created object`, JSON camelCase — [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- UI kit fallback order for the "Nuevo cliente" trigger/dialog: `siesa-ui-kit (P0) → shadcn/ui Dialog → custom` — [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack Table]
- Data model: `clientes` table `uk_clientes_nit` unique index (already created in Story 2.1's migration, this story is the first to trigger a violation against it) — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, FluentValidation + Zod dual validation, TanStack Query/Router, React Hook Form + Zod for forms, `pnpm`, Spanish UI text, Problem Details RFC 7807): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (module/entity/repository state after 2.1/2.2, 409 mapping likely new, `isAxiosError` status-check precedent, camelCase JSON): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md], [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements (form `Input`s, "Nuevo cliente" `Button`, submit/cancel buttons) before building custom components.
- **Constraint**: Check the `siesa-ui-kit` catalog first for the "Nuevo cliente" modal/dialog host. Per the architecture's explicit fallback order (`siesa-ui-kit (P0) → shadcn/ui Dialog → custom`), only fall back to `shadcn/ui Dialog` if no `siesa-ui-kit` dialog/modal primitive is confirmed available — do not default straight to `shadcn/ui` without checking first. Do not build a fully custom modal from scratch when either tier already covers it.
- This story does **not** use `MasterCrud` — Epic 2's client screens are explicitly a custom split-panel list/detail composition (Stories 2.1/2.2 precedent, `ClienteListView`/`ClienteDetailView`/`ClientListItem`), not a `MasterCrud`-orchestrated table+form screen. `ClienteForm` is a standalone React Hook Form + Zod component, not a `MasterCrud` `renderForm`. Do not introduce `MasterCrud` into this module — it would conflict with the already-established list/detail architecture.
- Icons: Heroicons primary (already installed), consistent with Stories 2.1/2.2.
- All user-facing text (field labels, inline validation errors, dialog title, "Nuevo cliente" button label, toast copy, 409 error message) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (201/400/409 paths); repository test may use EF Core InMemory for the happy-path `AddAsync`, but the unique-constraint-violation test MUST run against a real/TestContainers PostgreSQL (InMemory does not enforce unique indexes) — same constraint class as Story 2.5's future delete-orphaning test.
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 2 test plan): TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-05, TC-E2-P0-06, TC-E2-P2-05 — [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Cases by Priority]
- R1 (Test Design risk): duplicate NIT/RUC handling — both the backend `409` contract (TC-E2-P0-01) and the frontend friendly-error rendering (TC-E2-P0-02) are P0, must pass before this story is closed.
- R3 (Test Design risk): backend validation must be independently correct, not solely reliant on frontend Zod (TC-E2-P0-05) — the xUnit test in Task 6 must submit directly to the endpoint, bypassing the UI entirely.
- R11 (Test Design risk): toast copy exactness — "Cliente creado correctamente" must match verbatim (TC-E2-P2-05), no paraphrasing.
- R6 (Test Design risk): the full create→appears-in-list→detail-matches journey is the P0 E2E scenario (TC-E2-P0-06) — this is also the test that unblocks Story 2.2's previously-deferred `TC-E2-P1-06` (which needs a `POST` endpoint to seed data).

### Project Structure Notes

- Third story to touch `frontend/src/modules/crm/clientes/` — adds to the existing module (domain/application/infrastructure/presentation), does not create it.
- First story to introduce a Command (write-path) into the backend `Clientes` domain — establishes `Application/Clientes/Commands/` (or the exact sibling path used by `Queries/Clientes/`) as the pattern Stories 2.4/2.5 will replicate for `UpdateClienteCommand`/`DeleteClienteCommand`.
- First story to introduce `ClienteForm.tsx`, `clienteSchema.ts`, and `useCreateCliente.ts` — Story 2.4 (Edit Client) will reuse `ClienteForm` and `clienteSchema`, and add a sibling `useUpdateCliente.ts`; do not design `ClienteForm` in a way that hard-codes create-only behavior if it can be reasonably avoided (e.g. avoid hard-coding the mutation call inside deeply nested JSX in a way that can't be swapped later), but do not over-engineer a generic abstraction beyond a simple prop surface — Story 2.4 will do the actual edit-mode wiring.
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and CQRS conventions.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
